import { Linking, Platform, ScrollView, Text, View } from "react-native";
import { timeOf, type Job } from "../data";
import { useApp } from "../state";
import { Badge, Button, C, Card, Screen, SectionTitle, TopBar } from "../ui";
import { KIND } from "./Jobs";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", paddingVertical: 6, gap: 12 }}>
      <Text style={{ color: C.muted, width: 92 }}>{label}</Text>
      <Text style={{ color: C.fg, flex: 1, fontWeight: "500" }}>{value}</Text>
    </View>
  );
}

export default function JobDetail({ job, onBack, onStart }: { job: Job; onBack(): void; onStart(): void }) {
  const { submissionFor } = useApp();
  const sub = submissionFor(job.id);
  // Before the recce there are no coordinates: search by address instead.
  const place = encodeURIComponent(`${job.outletName}, ${job.address}, ${job.city}`);
  const mapsUrl = job.lat
    ? Platform.select({ android: `geo:${job.lat},${job.lng}?q=${job.lat},${job.lng}(${encodeURIComponent(job.outletName)})`, default: `https://www.google.com/maps/search/?api=1&query=${job.lat},${job.lng}` })
    : Platform.select({ android: `geo:0,0?q=${place}`, default: `https://www.google.com/maps/search/?api=1&query=${place}` });
  const start = job.kind === "recce" ? "Start recce" : job.kind === "install" ? "Start installation" : "Start repair";

  return (
    <Screen footer={sub ? <Text style={{ textAlign: "center", color: C.ok, fontWeight: "700" }}>✓ {sub.status === "sent" ? "Submitted" : "Saved · sends when there is signal"}</Text> : <Button title={start} onPress={onStart} />}>
      <TopBar title={job.outletName} subtitle={`${job.client} · ${job.outletCode}`} onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 30 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Badge text={KIND[job.kind].label} tone={KIND[job.kind].tone} />
          <Badge text={timeOf(job)} />
        </View>

        {job.issue && (
          <Card style={{ backgroundColor: C.badSoft, borderColor: C.badSoft }}>
            <Text style={{ color: C.bad, fontWeight: "700" }}>Reported problem</Text>
            <Text style={{ color: C.bad, marginTop: 4 }}>{job.issue}</Text>
          </Card>
        )}
        {job.note && (
          <Card style={{ backgroundColor: C.warnSoft, borderColor: C.warnSoft }}>
            <Text style={{ color: C.warn, fontWeight: "700" }}>From the office</Text>
            <Text style={{ color: C.warn, marginTop: 4 }}>{job.note}</Text>
          </Card>
        )}

        <Card>
          <Row label="Address" value={`${job.address}, ${job.city}`} />
          <Row label="Contact" value={job.contactName} />
          <Row label="Phone" value={job.contactPhone} />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title="Navigate" kind="secondary" small onPress={() => void Linking.openURL(mapsUrl!)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Call outlet" kind="secondary" small onPress={() => void Linking.openURL(`tel:${job.contactPhone.replace(/\s/g, "")}`)} />
            </View>
          </View>
        </Card>

        {job.sign && (
          <>
            <SectionTitle>What goes up</SectionTitle>
            <Card>
              <Text style={{ fontSize: 16, fontWeight: "700", color: C.fg }}>
                {job.sign.code} · {job.sign.label}
              </Text>
              <Text style={{ color: C.muted, marginTop: 4 }}>
                {job.sign.widthMm} × {job.sign.heightMm} mm{job.sign.qty > 1 ? ` × ${job.sign.qty}` : ""}
              </Text>
              <View style={{ marginTop: 12, height: 70, borderRadius: 6, backgroundColor: job.client === "Amaron" ? "#0b7a3e" : "#1b1b1b", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: job.client === "Amaron" ? "#fff" : "#d8b86a", fontWeight: "900", fontSize: 24, letterSpacing: 3 }}>{job.client === "Amaron" ? "AMARON" : "DEWAR'S"}</Text>
              </View>
              <Text style={{ color: C.faint, fontSize: 12, marginTop: 6 }}>Approved design · v1</Text>
            </Card>
          </>
        )}

        <SectionTitle>{job.kind === "recce" ? "On site you will" : "Checklist"}</SectionTitle>
        <Card style={{ gap: 6 }}>
          {(job.kind === "recce"
            ? ["Confirm you are at the right shop (GPS)", "Measure the mounting spot, width × height", "Take the required photos and a walk-around video", "Get the owner's agreement to the placement"]
            : job.kind === "install"
              ? ["Before photos", "Fix the sign and run the safety checks", "After photos", "Outlet signs off with a code sent to their phone"]
              : ["Photo of the problem", "Fix and note what was done", "After photo", "Outlet confirms it is resolved"]
          ).map((t, i) => (
            <Text key={t} style={{ color: C.fg }}>
              {i + 1}. {t}
            </Text>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
