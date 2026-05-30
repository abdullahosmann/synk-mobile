/**
 * Fitness — RN port of src/screens/main/Fitness.tsx.
 * Top WORKOUT/NUTRITION segmented switcher with an animated underline.
 * The Workout and Nutrition sub-screens are large (600+ lines each) and land
 * in Phase 2.3 / 2.4; placeholders below preserve the tab shell + design.
 */
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "../../src/AppContext";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText, ScreenTitle } from "../../src/components/ui/Typography";

export default function Fitness() {
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const [activeTab, setActiveTab] = useState<"workout" | "nutrition">("workout");

  const tab = (key: "workout" | "nutrition", label: string) => {
    const active = activeTab === key;
    return (
      <Pressable key={key} onPress={() => setActiveTab(key)} style={{ flex: 1, height: 48, alignItems: "center", justifyContent: "center" }}>
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

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <ScreenTitle style={{ marginBottom: 8 }}>
          {activeTab === "workout" ? (isArabic ? "التمرين" : "Workout") : isArabic ? "التغذية" : "Nutrition"}
        </ScreenTitle>
        <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: "center" }}>
          {activeTab === "workout"
            ? isArabic ? "تُبنى في المرحلة 2.3" : "Workout screen — ported in Phase 2.3"
            : isArabic ? "تُبنى في المرحلة 2.4" : "Nutrition screen — ported in Phase 2.4"}
        </AppText>
      </View>
    </View>
  );
}
