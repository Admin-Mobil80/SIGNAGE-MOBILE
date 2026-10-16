import { useRef, type ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputInstance, type TextInputProps, type ViewStyle } from "react-native";

export const C = {
  bg: "#f4f5f7",
  surface: "#ffffff",
  fg: "#15181d",
  muted: "#5a6270",
  faint: "#8a919d",
  border: "#e1e4e9",
  accent: "#d9480f",
  accentSoft: "#fff1e8",
  ok: "#18794e",
  okSoft: "#e7f6ee",
  warn: "#9a6200",
  warnSoft: "#fff5db",
  bad: "#c0362c",
  badSoft: "#fdecea",
  info: "#2f5fe0",
  infoSoft: "#eaf0ff",
};

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1 }}>{children}</View>
      {footer && <View style={s.footer}>{footer}</View>}
    </View>
  );
}

export function TopBar({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?(): void; right?: ReactNode }) {
  return (
    <View style={s.topbar}>
      {onBack && (
        <Pressable onPress={onBack} hitSlop={12} style={s.back} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={{ fontSize: 22, color: C.fg }}>‹</Text>
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.topTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={s.topSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?(): void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({ title, onPress, kind = "primary", disabled, small }: { title: string; onPress(): void; kind?: "primary" | "secondary" | "ok"; disabled?: boolean; small?: boolean }) {
  const bg = kind === "primary" ? C.accent : kind === "ok" ? C.ok : C.surface;
  const fg = kind === "secondary" ? C.fg : "#fff";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        s.btn,
        small && { paddingVertical: 8, paddingHorizontal: 12 },
        { backgroundColor: bg, borderColor: kind === "secondary" ? C.border : bg },
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.85 },
      ]}
    >
      <Text style={[s.btnText, { color: fg }, small && { fontSize: 14 }]}>{title}</Text>
    </Pressable>
  );
}

export function Badge({ text, tone = "neutral" }: { text: string; tone?: "neutral" | "ok" | "warn" | "bad" | "info" | "accent" }) {
  const map = {
    neutral: [C.bg, C.muted],
    ok: [C.okSoft, C.ok],
    warn: [C.warnSoft, C.warn],
    bad: [C.badSoft, C.bad],
    info: [C.infoSoft, C.info],
    accent: [C.accentSoft, C.accent],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function Field({ label, hint, ...input }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={C.faint} style={s.input} {...input} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chips<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T | undefined; onChange(value: T): void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={[s.chip, value === o && { backgroundColor: C.accentSoft, borderColor: C.accent }]}>
          <Text style={{ color: value === o ? C.accent : C.fg, fontWeight: "600" }}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Check({ label, value, onChange }: { label: string; value: boolean; onChange(value: boolean): void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={s.check} accessibilityRole="checkbox" accessibilityState={{ checked: value }}>
      <View style={[s.box, value && { backgroundColor: C.ok, borderColor: C.ok }]}>{value && <Text style={{ color: "#fff", fontWeight: "800" }}>✓</Text>}</View>
      <Text style={{ flex: 1, fontSize: 15, color: C.fg }}>{label}</Text>
    </Pressable>
  );
}

/** One required photo: empty slot that opens the camera, or the captured shot. */
export function PhotoSlot({ label, hint, uri, optional, onCapture }: { label: string; hint?: string; uri?: string; optional?: boolean; onCapture(): void }) {
  return (
    <Pressable onPress={onCapture} style={[s.slot, uri && { borderStyle: "solid", borderColor: C.ok }]}>
      {uri ? <Image source={{ uri }} style={s.slotImg} /> : <Text style={{ fontSize: 26, color: C.faint }}>📷</Text>}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", color: C.fg }}>
          {label}
          {optional ? <Text style={{ color: C.faint, fontWeight: "400" }}> · optional</Text> : null}
        </Text>
        {hint ? <Text style={s.hint}>{hint}</Text> : null}
        <Text style={{ color: uri ? C.ok : C.accent, fontWeight: "600", marginTop: 4 }}>{uri ? "✓ Captured · tap to retake" : "Tap to take photo"}</Text>
      </View>
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={s.section}>{children}</Text>;
}

/** Six boxes for a one-time code; one hidden input drives them so paste and autofill work. */
export function CodeBoxes({ value, onChange }: { value: string; onChange(value: string): void }) {
  const ref = useRef<TextInputInstance>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: "row", gap: 8 }}>
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={[s.codeBox, value.length === i && { borderColor: C.accent, borderWidth: 2 }]}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: C.fg }}>{value[i] ?? ""}</Text>
        </View>
      ))}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus
        maxLength={6}
        style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
      />
    </Pressable>
  );
}

export const s = StyleSheet.create({
  topbar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 18, fontWeight: "700", color: C.fg },
  topSub: { fontSize: 13, color: C.muted, marginTop: 1 },
  card: { backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 14 },
  btn: { borderRadius: 10, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center", borderWidth: 1 },
  btnText: { fontSize: 16, fontWeight: "700" },
  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "700", color: C.muted },
  hint: { fontSize: 12.5, color: C.faint, marginTop: 1 },
  input: { borderWidth: 1, borderColor: "#cbd0d8", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: C.fg, backgroundColor: C.surface },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.surface },
  check: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: "#cbd0d8", alignItems: "center", justifyContent: "center" },
  slot: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#cbd0d8", backgroundColor: C.surface },
  slotImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: C.bg },
  section: { fontSize: 13, fontWeight: "800", color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 8 },
  footer: { padding: 16, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  codeBox: { width: 46, height: 56, borderRadius: 10, borderWidth: 1, borderColor: "#cbd0d8", alignItems: "center", justifyContent: "center", backgroundColor: C.surface },
});
