import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { requestCode, SignInError, submitCode, type PendingSignIn } from "../api";
import { useApp } from "../state";
import { Button, C, CodeBoxes, Field } from "../ui";

const DEMO = [
  { email: "suresh@thesignco.demo", label: "Recce · Suresh Gowda (South)" },
  { email: "vikram@thesignco.demo", label: "Recce · Vikram Singh (North)" },
  { email: "imran@thesignco.demo", label: "Installer · Imran Shaikh (South)" },
  { email: "harpreet@thesignco.demo", label: "Installer · Harpreet Singh (North)" },
];

/** Email, then the six-digit code — the same sign-in as every TheSignCo surface. */
export default function SignIn() {
  const { signedIn } = useApp();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<PendingSignIn | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(work: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await work();
    } catch (e) {
      if (e instanceof SignInError) {
        setError(e.message);
        if (e.retryWith) setPending(e.retryWith);
      } else {
        setError(e instanceof Error ? e.message : "Could not sign in.");
      }
    } finally {
      setBusy(false);
    }
  }

  const sendCode = (address = email) =>
    run(async () => {
      setEmail(address);
      setPending(await requestCode(address));
      setCode("");
    });

  const verify = (value = code) =>
    run(async () => {
      if (!pending || value.length !== 6) throw new SignInError("Enter the six-digit code from the email.");
      await submitCode(pending, value);
      await signedIn();
    });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.surface }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.accent, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>T</Text>
          </View>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "800", color: C.fg }}>TheSignCo Field</Text>
            <Text style={{ color: C.muted }}>Recce · Installation · Maintenance</Text>
          </View>
        </View>

        {!pending ? (
          <>
            <Text style={{ fontSize: 26, fontWeight: "800", color: C.fg, marginTop: 24 }}>Sign in</Text>
            <Text style={{ color: C.muted, fontSize: 15 }}>Enter your work email. We&rsquo;ll send a six-digit code — no passwords.</Text>
            <Field label="Work email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="name@company.com" onSubmitEditing={() => void sendCode()} />
            {error && <Text style={{ color: C.bad }}>{error}</Text>}
            <Button title={busy ? "Sending code…" : "Email me a code"} onPress={() => void sendCode()} disabled={busy} />
            <View style={{ marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: C.warnSoft, gap: 8 }}>
              <Text style={{ color: C.warn, fontWeight: "700" }}>Demonstration accounts — tap one; the code is 000000</Text>
              {DEMO.map((d) => (
                <Text key={d.email} onPress={() => void sendCode(d.email)} style={{ color: C.warn }}>
                  {d.label} — {d.email}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 26, fontWeight: "800", color: C.fg, marginTop: 24 }}>{pending.demo ? "Enter the code" : "Check your email"}</Text>
            <Text style={{ color: C.muted, fontSize: 15 }}>
              {pending.demo ? (
                <>
                  <Text style={{ fontWeight: "700", color: C.fg }}>{pending.email}</Text> is a demonstration account: the code is 000000.
                </>
              ) : (
                <>
                  We sent a six-digit code to <Text style={{ fontWeight: "700", color: C.fg }}>{pending.email}</Text>.
                </>
              )}
            </Text>
            <CodeBoxes
              value={code}
              onChange={(v) => {
                setCode(v);
                if (v.length === 6) void verify(v);
              }}
            />
            {error && <Text style={{ color: C.bad }}>{error}</Text>}
            <Button title={busy ? "Signing in…" : "Sign in"} onPress={() => void verify()} disabled={busy || code.length !== 6} />
            <View style={{ flexDirection: "row", gap: 20 }}>
              <Text style={{ color: C.accent, fontWeight: "600" }} onPress={() => void sendCode(pending.email)}>
                Send a new code
              </Text>
              <Text style={{ color: C.accent, fontWeight: "600" }} onPress={() => setPending(null)}>
                Different email
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
