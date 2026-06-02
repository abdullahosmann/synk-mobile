/**
 * Fitness — RN port of src/screens/main/Fitness.tsx.
 * Top WORKOUT/NUTRITION segmented switcher with an animated underline.
 * WORKOUT renders WorkoutTab (Phase 2.3); NUTRITION lands in Phase 2.4.
 */
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useAppContext } from "../../src/AppContext";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import WorkoutTab from "../../src/screens/WorkoutTab";
import Nutrition from "../../src/screens/Nutrition";

export default function Fitness() {
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  // `/fitness?tab=nutrition` (and the `/nutrition` alias) open straight to the
  // NUTRITION segment; default is WORKOUT.
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"workout" | "nutrition">(
    tabParam === "nutrition" ? "nutrition" : "workout",
  );

  const tab = (key: "workout" | "nutrition", label: string) => {
    const active = activeTab === key;
    return (
      <Pressable key={key} onPress={() => setActiveTab(key)} style={{ flex: 1, height: 44, alignItems: "center", justifyContent: "center" }}>
        <AppText
          style={{
            fontSize: 15,
            fontWeight: "600",
            letterSpacing: 0.5,
            textTransform: isArabic ? "none" : "uppercase",
            color: active ? colors.ink : colors.inkMuted48,
            fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold",
          }}
        >
          {label}
        </AppText>
        {active && (
          <Animated.View
            layout={LinearTransition.springify()}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.ink, borderTopLeftRadius: 9999, borderTopRightRadius: 9999 }}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      <View style={{ paddingTop: insets.top + 8, backgroundColor: colors.canvasParchment }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", width: "100%" }}>
          {tab("workout", isArabic ? "التمرين" : "WORKOUT")}
          {tab("nutrition", isArabic ? "التغذية" : "NUTRITION")}
        </View>
        <View style={{ height: 1, backgroundColor: colors.hairline, width: "100%" }} />
      </View>

      {activeTab === "workout" ? (
        <WorkoutTab />
      ) : (
        <Nutrition />
      )}
    </View>
  );
}
