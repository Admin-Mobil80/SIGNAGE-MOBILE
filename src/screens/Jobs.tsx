import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { todayIso, type Job } from "../data";
import { useApp } from "../state";
import { Badge, C, Card, TopBar } from "../ui";

export const KIND: Record<Job["kind"], { label: string; tone: "info" | "accent" | "bad" }> = {
  recce: { label: "Recce", tone: "info" },
  install: { label: "Install", tone: "accent" },
  repair: { label: "Repair", tone: "bad" },
};

const sameDay = (a: string, b: string) => a.slice(0, 10) === b.slice(0, 10);
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** Home: the day's route, then what is coming up. */
export default function Jobs({ onOpen, onProfile }: { onOpen(job: Job): void; onProfile(): void }) {
  const { user, jobs, submissions, online } = useApp();
  const [tab, setTab] = useState<"today" | "upcoming">("today");
  const today = jobs.filter((j) => sameDay(j.date, todayIso()));
  const upcoming = jobs.filter((j) => !sameDay(j.date, todayIso()));
  const done = today.filter((j) => submissions.has(j.id)).length;
  const queued = [...submissions.values()].filter((s) => !s.uploaded).length;
  const list = tab === "today" ? today : upcoming;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar
        title={`Hi, ${user!.name.split(" ")[0]}`}
        subtitle={`${user!.role === "recce" ? "Recce" : "Installation"} · ${user!.region} region`}
        right={
          <Pressable onPress={onProfile} hitSlop={10} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.accentSoft, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: C.accent, fontWeight: "800" }}>
              {user!.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>Today</Text>
            <Text style={{ fontSize: 24, fontWeight: "800", color: C.fg }}>
              {done}/{today.length}
            </Text>
            <Text style={{ color: C.faint, fontSize: 12 }}>visits done</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: C.muted, fontSize: 13 }}>Sync</Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: !online ? C.warn : queued ? C.info : C.ok, marginTop: 6 }}>
              {!online ? "Offline" : queued ? "Uploading…" : "All synced"}
            </Text>
            <Text style={{ color: C.faint, fontSize: 12 }}>{queued ? `${queued} visit${queued === 1 ? "" : "s"} waiting` : "nothing waiting"}</Text>
          </Card>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: "#e7e9ed", borderRadius: 10, padding: 3 }}>
          {(["today", "upcoming"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: tab === t ? C.surface : "transparent", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", color: tab === t ? C.fg : C.muted }}>
                {t === "today" ? `Today · ${today.length}` : `Upcoming · ${upcoming.length}`}
              </Text>
            </Pressable>
          ))}
        </View>

        {list.length === 0 && <Text style={{ color: C.muted, textAlign: "center", marginTop: 30 }}>Nothing booked.</Text>}
        {list.map((job, i) => {
          const sub = submissions.get(job.id);
          return (
            <Card key={job.id} onPress={() => onOpen(job)} style={sub && { opacity: 0.7 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {tab === "today" && (
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: sub ? C.ok : C.fg, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>{sub ? "✓" : i + 1}</Text>
                  </View>
                )}
                <Badge text={KIND[job.kind].label} tone={KIND[job.kind].tone} />
                <Badge text={job.client} />
                <View style={{ flex: 1 }} />
                <Text style={{ color: C.muted, fontSize: 13 }}>{tab === "today" ? job.window : dayLabel(job.date)}</Text>
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: C.fg }}>{job.outletName}</Text>
              <Text style={{ color: C.muted, marginTop: 2 }}>{job.address}</Text>
              {sub ? (
                <Text style={{ color: sub.uploaded ? C.ok : C.info, marginTop: 6, fontWeight: "600" }}>{sub.uploaded ? "✓ Submitted and uploaded" : "Submitted · waiting to upload"}</Text>
              ) : job.issue ? (
                <Text style={{ color: C.bad, marginTop: 6 }} numberOfLines={2}>
                  {job.issue}
                </Text>
              ) : job.note ? (
                <Text style={{ color: C.warn, marginTop: 6 }} numberOfLines={2}>
                  Note: {job.note}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}
