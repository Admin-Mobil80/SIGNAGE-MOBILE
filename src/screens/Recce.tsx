import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { currentPosition, distanceM, recordVideo, takePhoto, type Fix } from "../capture";
import { MOUNTINGS, RECCE_SHOTS, type Job, type Mounting } from "../data";
import { useApp } from "../state";
import { Button, C, Card, Check, Chips, Field, PhotoSlot, Screen, SectionTitle, TopBar } from "../ui";

const STEPS = ["Arrive", "Measure", "Photos", "Owner"] as const;

/**
 * The site survey. Four short steps so it can be done one-handed on a
 * pavement; nothing can be submitted until the measurements and the required
 * shots are in. Saved to the outbox, so no signal inside the shop is fine.
 */
export default function Recce({ job, onBack, onDone }: { job: Job; onBack(): void; onDone(): void }) {
  const { submit } = useApp();
  const [step, setStep] = useState(0);
  const [fix, setFix] = useState<Fix | null>(null);
  const [locating, setLocating] = useState(false);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [qty, setQty] = useState("1");
  const [mounting, setMounting] = useState<Mounting>(job.client === "Dewar's" ? "Glass shelf" : "Shop fascia");
  const [fromGround, setFromGround] = useState("");
  const [remarks, setRemarks] = useState("");
  const [power, setPower] = useState(false);
  const [oldBoard, setOldBoard] = useState(false);
  const [ladder, setLadder] = useState(false);
  const [shots, setShots] = useState<Record<string, string>>({});
  const [video, setVideo] = useState<{ uri: string; seconds: number } | null>(null);
  const [ownerName, setOwnerName] = useState(job.contactName);
  const [agreed, setAgreed] = useState(false);

  const w = Number(width);
  const h = Number(height);
  const measured = w >= 100 && h >= 50;
  const required = RECCE_SHOTS.filter((x) => !("optional" in x));
  const shotsDone = required.every((x) => shots[x.id]);
  const off = fix ? distanceM(fix, job) : undefined;

  async function locate() {
    setLocating(true);
    const position = await currentPosition();
    setLocating(false);
    if (!position) {
      Alert.alert("No location", "Turn on location to confirm you are at the shop. You can carry on; the office will see it is unconfirmed.");
      return;
    }
    setFix(position);
  }

  async function shoot(id: string) {
    const uri = await takePhoto();
    if (uri) setShots((current) => ({ ...current, [id]: uri }));
  }

  const canNext = [true, measured, shotsDone, agreed && ownerName.trim().length > 1][step];

  function next() {
    if (step < STEPS.length - 1) return setStep(step + 1);
    submit({
      jobId: job.id,
      summary: `${w} × ${h} mm × ${qty} · ${mounting}`,
      photos: Object.keys(shots).length,
      videos: video ? 1 : 0,
    });
    onDone();
  }

  return (
    <Screen
      footer={
        <View style={{ flexDirection: "row", gap: 10 }}>
          {step > 0 && (
            <View style={{ flex: 1 }}>
              <Button title="Back" kind="secondary" onPress={() => setStep(step - 1)} />
            </View>
          )}
          <View style={{ flex: 2 }}>
            <Button title={step === STEPS.length - 1 ? "Submit recce" : "Next"} onPress={next} disabled={!canNext} kind={step === STEPS.length - 1 ? "ok" : "primary"} />
          </View>
        </View>
      }
    >
      <TopBar title="Recce" subtitle={job.outletName} onBack={onBack} />
      <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingTop: 12 }}>
        {STEPS.map((label, i) => (
          <View key={label} style={{ flex: 1 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: i < step ? C.ok : i === step ? C.accent : C.border }} />
            <Text style={{ fontSize: 12, marginTop: 4, color: i === step ? C.fg : C.faint, fontWeight: i === step ? "700" : "400" }}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <>
            <Card style={{ gap: 8 }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: C.fg }}>Confirm you&rsquo;re at the shop</Text>
              <Text style={{ color: C.muted }}>
                {job.address}, {job.city}
              </Text>
              {fix ? (
                <Text style={{ color: off !== undefined && off > 200 ? C.warn : C.ok, fontWeight: "600" }}>
                  {off !== undefined && off > 200
                    ? `You are ${(off / 1000).toFixed(1)} km from the outlet's listed location. Carry on if this is the right shop — the office will update it.`
                    : `✓ Location confirmed (±${Math.round(fix.accuracy ?? 10)} m)`}
                </Text>
              ) : (
                <Button title={locating ? "Finding you…" : "Use my location"} kind="secondary" onPress={() => void locate()} disabled={locating} />
              )}
            </Card>
            <PhotoSlot label="Shop front" hint="The first photo — proves the visit" uri={shots.front} onCapture={() => void shoot("front")} />
            <Text style={{ color: C.faint, fontSize: 13 }}>Shop closed or owner away? Go back and tell the office from the job — it will be rebooked.</Text>
          </>
        )}

        {step === 1 && (
          <>
            <SectionTitle>Mounting spot</SectionTitle>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label="Width (mm)" value={width} onChangeText={(t) => setWidth(t.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="e.g. 3650" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Height (mm)" value={height} onChangeText={(t) => setHeight(t.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="e.g. 900" />
              </View>
            </View>
            {measured && (
              <Text style={{ color: C.muted }}>
                ≈ {(w / 304.8).toFixed(1)}′ × {(h / 304.8).toFixed(1)}′
              </Text>
            )}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label="Quantity" value={qty} onChangeText={(t) => setQty(t.replace(/\D/g, "") || "1")} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Height from ground (mm)" value={fromGround} onChangeText={(t) => setFromGround(t.replace(/\D/g, ""))} keyboardType="number-pad" placeholder="optional" />
              </View>
            </View>
            <SectionTitle>Mounting</SectionTitle>
            <Chips<Mounting> options={MOUNTINGS} value={mounting} onChange={setMounting} />
            <SectionTitle>On site</SectionTitle>
            <Card style={{ paddingVertical: 4 }}>
              <Check label="Power point within 2 m (a lit sign is possible)" value={power} onChange={setPower} />
              <Check label="Existing board to be removed" value={oldBoard} onChange={setOldBoard} />
              <Check label="Needs a ladder or scaffolding (over 3 m)" value={ladder} onChange={setLadder} />
            </Card>
            <Field label="Remarks" value={remarks} onChangeText={setRemarks} multiline placeholder={mounting === "Glass shelf" ? "e.g. Double shelf, glass thickness 12 mm" : "e.g. Shutter rolls over the fascia"} style={{ minHeight: 80, textAlignVertical: "top", borderWidth: 1, borderColor: "#cbd0d8", borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: C.surface }} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={{ color: C.muted }}>
              {required.filter((x) => shots[x.id]).length} of {required.length} required photos
            </Text>
            {RECCE_SHOTS.filter((x) => x.id !== "front").map((x) => (
              <PhotoSlot key={x.id} label={x.label} hint={x.hint} optional={"optional" in x} uri={shots[x.id]} onCapture={() => void shoot(x.id)} />
            ))}
            <PhotoSlot label="Shop front" hint="Taken on arrival" uri={shots.front} onCapture={() => void shoot("front")} />
            <SectionTitle>Walk-around video</SectionTitle>
            <Card style={{ gap: 8 }}>
              <Text style={{ color: C.muted }}>30–60 seconds: the frontage, both neighbours and the road. Helps design see the whole picture.</Text>
              {video ? (
                <Text style={{ color: C.ok, fontWeight: "600" }}>✓ Video recorded{video.seconds ? ` (${video.seconds} s)` : ""}</Text>
              ) : null}
              <Button
                title={video ? "Record again" : "Record video"}
                kind="secondary"
                onPress={async () => {
                  const v = await recordVideo();
                  if (v) setVideo(v);
                }}
              />
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <Card style={{ gap: 4 }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: C.fg }}>Summary</Text>
              <Text style={{ color: C.fg }}>
                {w} × {h} mm × {qty} · {mounting}
              </Text>
              <Text style={{ color: C.muted }}>
                {Object.keys(shots).length} photos{video ? " · 1 video" : ""} · {fix ? "location confirmed" : "location not confirmed"}
              </Text>
              {(power || oldBoard || ladder) && (
                <Text style={{ color: C.muted }}>{[power && "power point", oldBoard && "remove old board", ladder && "ladder needed"].filter(Boolean).join(" · ")}</Text>
              )}
            </Card>
            <SectionTitle>Outlet owner</SectionTitle>
            <Field label="Name" value={ownerName} onChangeText={setOwnerName} />
            <Card style={{ paddingVertical: 4 }}>
              <Check label={`${ownerName.split(" ")[0] || "The owner"} agrees to a ${job.client} sign at this spot`} value={agreed} onChange={setAgreed} />
            </Card>
            <Text style={{ color: C.faint, fontSize: 13 }}>
              The owner will be sent the design to confirm before anything is made. Submitting saves to your phone first and uploads when you have signal.
            </Text>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
