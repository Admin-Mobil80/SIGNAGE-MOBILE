import { ScrollView, Switch, Text, View } from "react-native";
import { useApp } from "../state";
import { Button, C, Card, SectionTitle, TopBar } from "../ui";

export default function Profile({ onBack }: { onBack(): void }) {
  const { user, jobs, submissions, online, setOnline, signOut } = useApp();
  const list = [...submissions.values()];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar title="Profile" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card style={{ gap: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: C.fg }}>{user!.name}</Text>
          <Text style={{ color: C.muted }}>
            {user!.role === "recce" ? "Recce executive" : "Installation lead"} · {user!.region}
          </Text>
          <Text style={{ color: C.muted }}>{user!.email}</Text>
          <Text style={{ color: C.muted }}>{user!.phone}</Text>
        </Card>

        <SectionTitle>Sync</SectionTitle>
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: C.fg }}>Online</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>Prototype: switch off to see visits queue up without signal.</Text>
            </View>
            <Switch value={online} onValueChange={setOnline} />
          </View>
          {list.length === 0 && <Text style={{ color: C.faint }}>Nothing submitted yet.</Text>}
          {list.map((s) => {
            const job = jobs.find((j) => j.id === s.jobId);
            return (
              <View key={s.jobId} style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 }}>
                <Text style={{ fontWeight: "600", color: C.fg }}>{job?.outletName}</Text>
                <Text style={{ color: C.muted, fontSize: 13 }}>
                  {s.summary} · {s.photos} photos{s.videos ? ` · ${s.videos} video` : ""}
                </Text>
                <Text style={{ color: s.uploaded ? C.ok : C.info, fontSize: 13, fontWeight: "600" }}>{s.uploaded ? "Uploaded" : online ? "Uploading…" : "Waiting for signal"}</Text>
              </View>
            );
          })}
        </Card>

        <Button title="Sign out" kind="secondary" onPress={signOut} />
        <Text style={{ textAlign: "center", color: C.faint, fontSize: 12 }}>TheSignCo Field · prototype 0.1 · sample data</Text>
      </ScrollView>
    </View>
  );
}
