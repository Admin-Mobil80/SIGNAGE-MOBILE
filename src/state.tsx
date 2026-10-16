/**
 * App state for the prototype: who is signed in, their jobs, and the outbox.
 *
 * Field staff often have no signal inside a shop, so nothing is ever "sent"
 * directly: a finished visit goes into the outbox and uploads when the phone
 * is online. The prototype simulates that, with a switch on the profile
 * screen to go offline and watch the queue build up.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PEOPLE, jobsFor, type Job, type Person } from "./data";

export interface Submission {
  readonly jobId: string;
  readonly summary: string;
  readonly photos: number;
  readonly videos: number;
  readonly at: string;
  readonly uploaded: boolean;
}

interface AppState {
  readonly user: Person | null;
  readonly jobs: readonly Job[];
  readonly submissions: ReadonlyMap<string, Submission>;
  readonly online: boolean;
  setOnline(online: boolean): void;
  signIn(email: string): Person;
  signOut(): void;
  submit(submission: Omit<Submission, "uploaded" | "at">): void;
}

const Ctx = createContext<AppState | null>(null);

export class SignInError extends Error {}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Person | null>(null);
  const [submissions, setSubmissions] = useState<Map<string, Submission>>(new Map());
  const [online, setOnline] = useState(true);

  // Upload whatever is queued once there is signal.
  useEffect(() => {
    if (!online) return;
    const queued = [...submissions.values()].some((s) => !s.uploaded);
    if (!queued) return;
    const timer = setTimeout(() => {
      setSubmissions((current) => new Map([...current].map(([id, s]) => [id, { ...s, uploaded: true }])));
    }, 2500);
    return () => clearTimeout(timer);
  }, [online, submissions]);

  const signIn = useCallback((email: string) => {
    const person = PEOPLE.find((p) => p.email === email.trim().toLowerCase());
    if (!person) throw new SignInError("This app is for TheSignCo field staff. No field account uses that email address.");
    setUser(person);
    return person;
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setSubmissions(new Map());
  }, []);

  const submit = useCallback((submission: Omit<Submission, "uploaded" | "at">) => {
    setSubmissions((current) => new Map(current).set(submission.jobId, { ...submission, at: new Date().toISOString(), uploaded: false }));
  }, []);

  const jobs = useMemo(() => (user ? jobsFor(user) : []), [user]);

  const value = useMemo<AppState>(
    () => ({ user, jobs, submissions, online, setOnline, signIn, signOut, submit }),
    [user, jobs, submissions, online, signIn, signOut, submit],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
