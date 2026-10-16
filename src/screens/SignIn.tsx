import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { PEOPLE } from "../data";
import { SignInError, useApp } from "../state";
import { Button, C, CodeBoxes, Field } from "../ui";

/** Email, then the six-digit code — the same sign-in as every TheSignCo surface. */
export default function SignIn() {
  const { signIn } = useApp();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function sendCode(address = email) {
    setError(null);
    const known = PEOPLE.some((p) => p.email === address.trim().toLowerCase());
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim())) return setError("Enter a valid email address.");
    if (!known) return setError("This app is for TheSignCo field staff. No field account uses that email address.");
    setEmail(address);
    setCode("");
    setStep("code");
  }

  function verify(value = code) {
    if (value.length !== 6) return setError("Enter the six-digit code from the email.");
    try {
      signIn(email);
    } catch (e) {
      setError(e instanceof SignInError ? e.message : "Could not sign in.");
    }
  }

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

        {step === "email" ? (
          <>
            <Text style={{ fontSize: 26, fontWeight: "800", color: C.fg, marginTop: 24 }}>Sign in</Text>
            <Text style={{ color: C.muted, fontSize: 15 }}>Enter your work email. We&rsquo;ll send a six-digit code — no passwords.</Text>
            <Field label="Work email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="name@company.com" onSubmitEditing={() => sendCode()} />
            {error && <Text style={{ color: C.bad }}>{error}</Text>}
            <Button title="Email me a code" onPress={() => sendCode()} />
            <View style={{ marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: C.warnSoft, gap: 8 }}>
              <Text style={{ color: C.warn, fontWeight: "700" }}>Prototype accounts — tap one, then any six digits</Text>
              {PEOPLE.map((p) => (
                <Text key={p.email} onPress={() => sendCode(p.email)} style={{ color: C.warn }}>
                  {p.role === "recce" ? "Recce" : "Installer"} · {p.name} ({p.region}) — {p.email}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 26, fontWeight: "800", color: C.fg, marginTop: 24 }}>Check your email</Text>
            <Text style={{ color: C.muted, fontSize: 15 }}>
              We sent a six-digit code to <Text style={{ fontWeight: "700", color: C.fg }}>{email}</Text>.
            </Text>
            <CodeBoxes
              value={code}
              onChange={(v) => {
                setCode(v);
                if (v.length === 6) verify(v);
              }}
            />
            {error && <Text style={{ color: C.bad }}>{error}</Text>}
            <Button title="Sign in" onPress={() => verify()} disabled={code.length !== 6} />
            <View style={{ flexDirection: "row", gap: 20 }}>
              <Text style={{ color: C.accent, fontWeight: "600" }} onPress={() => sendCode()}>
                Send a new code
              </Text>
              <Text style={{ color: C.accent, fontWeight: "600" }} onPress={() => setStep("email")}>
                Different email
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
