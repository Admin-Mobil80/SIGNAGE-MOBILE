import { Alert, ScrollView, Text, View } from "react-native";
import { useApp } from "../state";
import { Button, C, Card, SectionTitle, TopBar } from "../ui";

const STATUS = {
  waiting: ["Waiting for signal", C.info],
  sending: ["Sending…", C.info],
  sent: ["Sent", C.ok],
  failed: ["Refused", C.bad],
} as const;

export default function Profile({ onBack }: { onBack(): void }) {
  const { user, outbox, retry, discard, signOut } = useApp();
  const list = [...outbox].reverse();
  const unsent = outbox.filter((x) => x.status !== "sent").length;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <TopBar title="Profile" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Card style={{ gap: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: C.fg }}>{user!.name}</Text>
          <Text style={{ color: C.muted }}>
            {user!.role === "recce" ? "Recce executive" : "Installation lead"}
            {user!.region ? ` · ${user!.region}` : ""}
          </Text>
          <Text style={{ color: C.muted }}>{user!.email}</Text>
        </Card>

        <SectionTitle>Outbox</SectionTitle>
        <Card style={{ gap: 10 }}>
          <Text style={{ color: C.muted, fontSize: 13 }}>Visits are saved on this phone and sent when there is signal. Photos upload first, then the visit.</Text>
          {list.length === 0 && <Text style={{ color: C.faint }}>Nothing submitted yet.</Text>}
          {list.slice(0, 30).map((x) => {
            const [label, colour] = STATUS[x.status];
            const uploaded = x.files.filter((f) => f.key).length;
            return (
              <View key={x.id} style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, gap: 2 }}>
                <Text style={{ fontWeight: "600", color: C.fg }}>{x.outletName}</Text>
                <Text style={{ color: C.muted, fontSize: 13 }}>
                  {x.summary} · {uploaded}/{x.files.length} files uploaded
                </Text>
                <Text style={{ color: colour, fontSize: 13, fontWeight: "600" }}>
                  {label}
                  {x.error && x.status !== "sent" ? ` — ${x.error}` : ""}
                </Text>
                {x.status === "failed" && (
                  <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
                    <Text style={{ color: C.accent, fontWeight: "700" }} onPress={() => retry(x.id)}>
                      Retry
                    </Text>
                    <Text
                      style={{ color: C.bad, fontWeight: "700" }}
                      onPress={() =>
                        Alert.alert("Discard this visit?", "Its measurements and photos will be deleted from this phone.", [
                          { text: "Keep", style: "cancel" },
                          { text: "Discard", style: "destructive", onPress: () => discard(x.id) },
                        ])
                      }
                    >
                      Discard
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        <Button
          title="Sign out"
          kind="secondary"
          onPress={() => {
            if (!unsent) return void signOut();
            Alert.alert("Visits not sent yet", `${unsent} visit${unsent === 1 ? " is" : "s are"} still on this phone. They will send after you sign in again.`, [
              { text: "Stay signed in", style: "cancel" },
              { text: "Sign out", onPress: () => void signOut() },
            ]);
          }}
        />
        <Text style={{ textAlign: "center", color: C.faint, fontSize: 12 }}>TheSignCo Field 0.2</Text>
      </ScrollView>
    </View>
  );
}
