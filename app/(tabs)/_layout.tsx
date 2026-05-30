import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import BottomNav from "../../src/components/BottomNav";

/**
 * MainLayout port: renders the active tab screen with the custom BottomNav
 * pinned to the bottom (matching src/components/MainLayout.tsx + BottomNav.tsx).
 * We hide the default tab bar and supply our own via the `tabBar` prop.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <BottomNav />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="fitness" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
