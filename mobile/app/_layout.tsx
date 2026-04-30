import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useAuthStore } from "../stores/useAuthStore";
import { registerForPushNotifications } from "../services/notifications";
import SplashLoader from "../components/SplashLoader";

const SPLASH_MIN_MS = 2200;

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUser();
    const t = setTimeout(() => setSplashDone(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isLoading || !splashDone) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/onboarding");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, splashDone, segments]);

  useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotifications();
  }, [isAuthenticated]);

  if (isLoading || !splashDone) return <SplashLoader />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
