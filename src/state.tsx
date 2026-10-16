/**
 * App state: who is signed in, their jobs, and the outbox.
 *
 * Field staff often have no signal inside a shop, so a finished visit is
 * never sent directly. It goes into the outbox — kept on the phone, so it
 * survives the app being closed — and is sent when there is signal: each
 * photo is uploaded straight to S3, then the visit is submitted with the
 * photos' keys. A failed upload is retried; a visit the server refuses is
 * kept, with the reason, for the user to retry or discard.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { ApiError, hasSession, request, signOut as forgetTokens, uploadFile } from "./api";
import type { Job, Person } from "./data";

type FileField = "photoKeys" | "videoKey" | "beforePhotoKeys" | "afterPhotoKeys";

export interface OutboxFile {
  readonly field: FileField;
  readonly kind: "recce" | "video" | "before" | "after" | "ticket";
  readonly uri: string;
  readonly contentType: string;
  /** Set once uploaded, so a retry does not upload it twice. */
  readonly key?: string;
}

export interface OutboxItem {
  readonly id: string;
  readonly jobId: string;
  readonly outletId: string;
  readonly outletName: string;
  readonly summary: string;
  /** The action to submit, without its file keys. */
  readonly action: Record<string, unknown>;
  readonly files: readonly OutboxFile[];
  readonly status: "waiting" | "sending" | "sent" | "failed";
  readonly error?: string;
  readonly createdAt: string;
}

interface AppValue {
  readonly user: Person | null;
  readonly ready: boolean;
  readonly jobs: readonly Job[];
  readonly jobsError: string | null;
  readonly loadingJobs: boolean;
  readonly outbox: readonly OutboxItem[];
  /** The outbox item for a job, if the visit has been submitted. */
  submissionFor(jobId: string): OutboxItem | undefined;
  signedIn(): Promise<void>;
  signOut(): Promise<void>;
  refreshJobs(): Promise<void>;
  submit(item: Omit<OutboxItem, "id" | "status" | "createdAt">): void;
  retry(id: string): void;
  discard(id: string): void;
}

const OUTBOX_KEY = "thesignco.field.outbox";
const Ctx = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Person | null>(null);
  const [ready, setReady] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const working = useRef(false);
  const outboxRef = useRef<OutboxItem[]>([]);

  const saveOutbox = useCallback((next: OutboxItem[]) => {
    outboxRef.current = next;
    setOutbox(next);
    void AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);
  const patch = useCallback(
    (id: string, change: Partial<OutboxItem>) => saveOutbox(outboxRef.current.map((x) => (x.id === id ? { ...x, ...change } : x))),
    [saveOutbox],
  );

  const refreshJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const { jobs: list } = await request<{ jobs: Job[] }>("/field/jobs");
      setJobs(list);
      setJobsError(null);
    } catch (error) {
      setJobsError(error instanceof ApiError && error.status === 0 ? "Offline — showing the jobs you last loaded." : error instanceof Error ? error.message : "Could not load jobs.");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const me = await request<Person & { role: string }>("/me");
    if (me.role !== "recce" && me.role !== "installer") throw new ApiError("This app is for field staff.", 403);
    setUser(me);
    await AsyncStorage.setItem("thesignco.field.me", JSON.stringify(me));
  }, []);

  // On launch: restore the outbox and, if there is a session, the profile —
  // from the server if reachable, otherwise the copy kept on the phone.
  useEffect(() => {
    void (async () => {
      try {
        const saved = await AsyncStorage.getItem(OUTBOX_KEY);
        if (saved) saveOutbox((JSON.parse(saved) as OutboxItem[]).map((x) => (x.status === "sending" ? { ...x, status: "waiting" } : x)));
        if (await hasSession()) {
          try {
            await loadProfile();
          } catch (error) {
            const cached = await AsyncStorage.getItem("thesignco.field.me");
            if (error instanceof ApiError && error.status === 0 && cached) setUser(JSON.parse(cached) as Person);
            else await forgetTokens();
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, [loadProfile, saveOutbox]);

  useEffect(() => {
    if (user) void refreshJobs();
  }, [user, refreshJobs]);

  /** Sends everything waiting, one visit at a time. */
  const process = useCallback(async () => {
    if (working.current) return;
    working.current = true;
    try {
      for (const item of outboxRef.current.filter((x) => x.status === "waiting")) {
        patch(item.id, { status: "sending", error: undefined });
        try {
          const files = [...item.files];
          for (let i = 0; i < files.length; i++) {
            if (files[i].key) continue;
            const key = await uploadFile(item.outletId, files[i].kind, files[i].uri, files[i].contentType);
            files[i] = { ...files[i], key };
            patch(item.id, { files: [...files] });
          }
          const action: Record<string, unknown> = { ...item.action };
          for (const f of files) {
            if (f.field === "videoKey") action.videoKey = f.key;
            else action[f.field] = [...((action[f.field] as string[] | undefined) ?? []), f.key];
          }
          await request("/actions", { body: { action } });
          patch(item.id, { status: "sent" });
        } catch (error) {
          const offline = error instanceof ApiError && (error.status === 0 || error.status >= 500 || error.status === 401);
          patch(item.id, { status: offline ? "waiting" : "failed", error: error instanceof Error ? error.message : "Could not send." });
          if (offline) break;
        }
      }
    } finally {
      working.current = false;
    }
    if (outboxRef.current.some((x) => x.status === "sent")) void refreshJobs();
  }, [patch, refreshJobs]);

  // Keep trying while anything waits: every 30 seconds, and whenever the app
  // comes back to the foreground.
  useEffect(() => {
    if (!user) return;
    void process();
    const timer = setInterval(() => void process(), 30_000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void process();
        void refreshJobs();
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [user, process, refreshJobs]);

  const submit = useCallback(
    (item: Omit<OutboxItem, "id" | "status" | "createdAt">) => {
      saveOutbox([...outboxRef.current, { ...item, id: `${item.jobId}-${Date.now()}`, status: "waiting", createdAt: new Date().toISOString() }]);
      void process();
    },
    [saveOutbox, process],
  );

  const value = useMemo<AppValue>(
    () => ({
      user,
      ready,
      jobs,
      jobsError,
      loadingJobs,
      outbox,
      submissionFor: (jobId) => [...outbox].reverse().find((x) => x.jobId === jobId && x.status !== "failed"),
      signedIn: loadProfile,
      signOut: async () => {
        await forgetTokens();
        setUser(null);
        setJobs([]);
      },
      refreshJobs,
      submit,
      retry: (id) => {
        patch(id, { status: "waiting", error: undefined });
        void process();
      },
      discard: (id) => saveOutbox(outboxRef.current.filter((x) => x.id !== id)),
    }),
    [user, ready, jobs, jobsError, loadingJobs, outbox, loadProfile, refreshJobs, submit, patch, process, saveOutbox],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
