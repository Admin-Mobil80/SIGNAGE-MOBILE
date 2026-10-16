import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { request } from "../api";
import { takePhoto } from "../capture";
import { INSTALL_CHECKS, type Job } from "../data";
import { useApp } from "../state";
import { Button, C, Card, Check, CodeBoxes, Field, PhotoSlot, Screen, SectionTitle, TopBar } from "../ui";

const STEPS = ["Before", "Fix", "After", "Sign-off"] as const;

/**
 * Installation, and repair visits on a live sign. Ends with the outlet signing
 * off: a six-digit code is sent to the outlet's phone and they read it out,
 * which proves the owner saw the finished work without anyone signing paper.
 */
export default function Install({ job, onBack, onDone }: { job: Job; onBack(): void; onDone(): void }) {
  const { submit } = useApp();
  const repair = job.kind === "repair";
  const [step, setStep] = useState(0);
  const [before, setBefore] = useState<Record<string, string>>({});
  const [after, setAfter] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [workDone, setWorkDone] = useState("");
  const [codeSent, setCodeSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [signer, setSigner] = useState(job.contactName);

  const checkList = repair ? ["Problem fixed and tested", "Sign is secure", "Site cleaned"] : INSTALL_CHECKS;
  const allChecked = checkList.every((c) => checks[c]);
  // Sign-off is optional: if the owner is away, the visit goes in unsigned and
  // the outlet signs off from the portal later.
  const signing = Boolean(codeSent) && code.length > 0;
  const canNext = [
    Object.keys(before).length >= 1,
    allChecked && (!repair || workDone.trim().length > 3),
    Object.keys(after).length >= (repair ? 1 : 2),
    repair || !signing || (code.length === 6 && signer.trim().length > 1),
  ][step];

  async function sendCode() {
    setSending(true);
    setCodeError(null);
    try {
      const result = await request<{ sentTo: string }>("/field/signoff-code", { body: { outletId: job.outletId } });
      setCodeSent(result.sentTo);
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : "Could not send the code.");
    } finally {
      setSending(false);
    }
  }

  const shoot = async (set: typeof setBefore, id: string) => {
    const uri = await takePhoto();
    if (uri) set((current) => ({ ...current, [id]: uri }));
  };

  function next() {
    if (step < STEPS.length - 1) return setStep(step + 1);
    const photos = (set: Record<string, string>, field: "beforePhotoKeys" | "afterPhotoKeys" | "photoKeys", kind: "before" | "after" | "ticket") =>
      Object.values(set).map((uri) => ({ field, kind, uri, contentType: "image/jpeg" }));
    submit(
      repair
        ? {
            jobId: job.id,
            outletId: job.outletId,
            outletName: job.outletName,
            summary: `Repaired: ${workDone.trim()}`,
            action: { type: "resolveTicket", ticketId: job.ticketId, resolution: workDone.trim() },
            files: [...photos(before, "photoKeys", "ticket"), ...photos(after, "photoKeys", "ticket")],
          }
        : {
            jobId: job.id,
            outletId: job.outletId,
            outletName: job.outletName,
            summary: signing ? `Installed ${job.sign?.code ?? ""}, signed off by ${signer.trim()}` : `Installed ${job.sign?.code ?? ""}, outlet to sign off`,
            action: { type: "submitInstall", outletId: job.outletId, ...(signing ? { signoffCode: code, signer: signer.trim() } : {}) },
            files: [...photos(before, "beforePhotoKeys", "before"), ...photos(after, "afterPhotoKeys", "after")],
          },
    );
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
            <Button title={step === STEPS.length - 1 ? (repair ? "Close repair" : "Complete installation") : "Next"} onPress={next} disabled={!canNext} kind={step === STEPS.length - 1 ? "ok" : "primary"} />
          </View>
        </View>
      }
    >
      <TopBar title={repair ? "Repair" : "Installation"} subtitle={job.outletName} onBack={onBack} />
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
            {repair && job.issue && (
              <Card style={{ backgroundColor: C.badSoft, borderColor: C.badSoft }}>
                <Text style={{ color: C.bad }}>{job.issue}</Text>
              </Card>
            )}
            <Text style={{ color: C.muted }}>{repair ? "Photograph the problem before touching anything." : "Photograph the spot before you start — shows the site as you found it."}</Text>
            <PhotoSlot label={repair ? "The problem" : "Before — front"} uri={before.front} onCapture={() => void shoot(setBefore, "front")} />
            <PhotoSlot label={repair ? "Close-up" : "Before — mounting spot"} optional uri={before.spot} onCapture={() => void shoot(setBefore, "spot")} />
          </>
        )}

        {step === 1 && (
          <>
            {job.sign && (
              <Card>
                <Text style={{ fontWeight: "700", color: C.fg }}>
                  {job.sign.code} · {job.sign.label}
                </Text>
                <Text style={{ color: C.muted }}>
                  {job.sign.widthMm} × {job.sign.heightMm} mm
                </Text>
              </Card>
            )}
            {repair && <Field label="What did you do?" value={workDone} onChangeText={setWorkDone} multiline placeholder="e.g. Replaced LED driver, tested 10 min" style={{ minHeight: 80, textAlignVertical: "top", borderWidth: 1, borderColor: "#cbd0d8", borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: C.surface }} />}
            <SectionTitle>Checks</SectionTitle>
            <Card style={{ paddingVertical: 4 }}>
              {checkList.map((c) => (
                <Check key={c} label={c} value={!!checks[c]} onChange={(v) => setChecks((cur) => ({ ...cur, [c]: v }))} />
              ))}
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={{ color: C.muted }}>{repair ? "At least one photo of the fixed sign." : `Two photos at least — these are what ${job.client} sees.`}</Text>
            <PhotoSlot label="After — straight on" hint="Whole sign in frame, level" uri={after.front} onCapture={() => void shoot(setAfter, "front")} />
            <PhotoSlot label="After — from the road" hint="Sign with the shop and street" uri={after.wide} onCapture={() => void shoot(setAfter, "wide")} />
            <PhotoSlot label="After — lit (evening)" optional uri={after.lit} onCapture={() => void shoot(setAfter, "lit")} />
          </>
        )}

        {step === 3 && (
          <>
            <Card style={{ gap: 6 }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: C.fg }}>Outlet sign-off</Text>
              <Text style={{ color: C.muted }}>
                {repair
                  ? `Show ${job.contactName.split(" ")[0]} the repair before you leave.`
                  : `Show ${job.contactName.split(" ")[0]} the work. We email them a six-digit code; they read it to you.`}
              </Text>
              {repair ? null : !codeSent ? (
                <Button title={sending ? "Sending…" : "Send code to outlet"} onPress={() => void sendCode()} disabled={sending} />
              ) : (
                <Text style={{ color: C.ok, fontWeight: "600" }}>Code sent to {codeSent}</Text>
              )}
              {codeError && <Text style={{ color: C.bad }}>{codeError}</Text>}
            </Card>
            {codeSent && (
              <>
                <Field label="Signed off by" value={signer} onChangeText={setSigner} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.muted }}>Code from the outlet</Text>
                <CodeBoxes value={code} onChange={setCode} />
                <Text style={{ color: C.faint, fontSize: 13 }}>Leave the code empty if the owner is away — the outlet can sign off later from the portal.</Text>
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
