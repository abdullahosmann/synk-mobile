import "../global.css";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts as useInter,
} from "@expo-google-fonts/inter";
import {
  Cairo_300Light,
  Cairo_400Regular,
  Cairo_600SemiBold,
} from "@expo-google-fonts/cairo";
import { ThemeProvider, useTheme } from "../src/theme/ThemeProvider";
import { AppProvider } from "../src/AppContext";
import { ToastProvider } from "../src/components/ToastProvider";
import { hydrateStorage } from "../src/lib/storage";

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme === "dark" ? "light" : "dark"} />;
}

export default function RootLayout() {
  const [storageReady, setStorageReady] = useState(false);
  const [fontsLoaded] = useInter({
    Inter_300Light,
    Inter_400Regular,
    Inter_600SemiBold,
    Cairo_300Light,
    Cairo_400Regular,
    Cairo_600SemiBold,
  });

  useEffect(() => {
    hydrateStorage().then(() => setStorageReady(true));
  }, []);

  const ready = storageReady && fontsLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) {
    // Keep native splash up until storage + fonts are ready.
    return <View style={{ flex: 1, backgroundColor: "#ffffff" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <ToastProvider>
              <ThemedStatusBar />
              <Stack screenOptions={{ headerShown: false }} />
            </ToastProvider>
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
