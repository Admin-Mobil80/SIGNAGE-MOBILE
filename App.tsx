import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { BackHandler, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import type { Job } from "./src/data";
import Install from "./src/screens/Install";
import JobDetail from "./src/screens/JobDetail";
import Jobs from "./src/screens/Jobs";
import Profile from "./src/screens/Profile";
import Recce from "./src/screens/Recce";
import SignIn from "./src/screens/SignIn";
import { AppProvider, useApp } from "./src/state";
import { Button, C } from "./src/ui";

type Route = { name: "jobs" } | { name: "job"; job: Job } | { name: "work"; job: Job } | { name: "done"; job: Job } | { name: "profile" };

/** A small stack: few enough screens that a navigation library is not worth its weight. */
function Navigator() {
  const { user, ready } = useApp();
  const [stack, setStack] = useState<Route[]>([{ name: "jobs" }]);
  const route = stack[stack.length - 1];
  const push = (r: Route) => setStack((s) => [...s, r]);
  const pop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const home = () => setStack([{ name: "jobs" }]);

  // Android's back button walks the stack instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 1) {
        pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length]);

  useEffect(() => {
    if (!user) setStack([{ name: "jobs" }]);
  }, [user]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: C.muted }}>Loading…</Text>
      </View>
    );
  }
  if (!user) return <SignIn />;

  switch (route.name) {
    case "jobs":
      return <Jobs onOpen={(job) => push({ name: "job", job })} onProfile={() => push({ name: "profile" })} />;
    case "job":
      return <JobDetail job={route.job} onBack={pop} onStart={() => push({ name: "work", job: route.job })} />;
    case "work":
      return route.job.kind === "recce" ? (
        <Recce job={route.job} onBack={pop} onDone={() => setStack([{ name: "jobs" }, { name: "done", job: route.job }])} />
      ) : (
        <Install job={route.job} onBack={pop} onDone={() => setStack([{ name: "jobs" }, { name: "done", job: route.job }])} />
      );
    case "done":
      return (
        <View style={{ flex: 1, backgroundColor: C.surface, padding: 24, justifyContent: "center", gap: 16 }}>
          <Text style={{ fontSize: 56, textAlign: "center" }}>✅</Text>
          <Text style={{ fontSize: 24, fontWeight: "800", textAlign: "center", color: C.fg }}>
            {route.job.kind === "recce" ? "Recce submitted" : route.job.kind === "install" ? "Installation complete" : "Repair closed"}
          </Text>
          <Text style={{ textAlign: "center", color: C.muted, fontSize: 15 }}>
            {route.job.outletName} is saved on your phone and sends as soon as there is signal. {route.job.kind === "recce" ? "Design takes it from here." : "The office and the client see the photos as soon as it lands."}
          </Text>
          <Button title="Next job" onPress={home} />
        </View>
      );
    case "profile":
      return <Profile onBack={pop} />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }} edges={["top", "bottom"]}>
          <StatusBar style="dark" />
          <Navigator />
        </SafeAreaView>
      </AppProvider>
    </SafeAreaProvider>
  );
}
