/**
 * FABRadialMenu — RN port of src/screens/main/FABRadialMenu.tsx.
 *
 * Full-screen dark "quick actions" overlay reached from the centre FAB:
 * Log Meal / Voice Log / New Workout / Coach Chat (filtered by appMode), in a
 * 2-col tile grid, with a close button and a QUICK ACTIONS footer. Tapping the
 * backdrop dismisses.
 *
 * Web→RN: navigate(...) → router.push / router.back; motion entrance → reanimated
 * ZoomIn (close) + FadeInDown (tiles, staggered) / FadeInUp (footer); the dark
 * surface-tile-1 backdrop is a fixed hex (unchanged in dark mode, per tokens).
 */
import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { X, Dumbbell, Utensils, MessageCircle, Mic } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useColors } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";

const BACKDROP = "#272729"; // surface-tile-1 (unchanged in dark)
const INK = "#1d1d1f";

export default function FABRadialMenu() {
  const router = useRouter();
  const { user, appMode } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const actions = [
    {
      id: "meal",
      icon: Utensils,
      label: isArabic ? "تسجيل وجبة" : "Log Meal",
      onPress: () => router.push("/fitness?tab=nutrition&openSearch=1"),
      hidden: appMode === "workout-only",
      accent: false,
    },
    {
      id: "voice",
      icon: Mic,
      label: isArabic ? "تسجيل صوتي" : "Voice Log",
      onPress: () => router.push("/voice-log"),
      hidden: false,
      accent: false,
    },
    {
      id: "workout",
      icon: Dumbbell,
      label: isArabic ? "تمرين جديد" : "New Workout",
      onPress: () => router.push("/fitness"),
      hidden: appMode === "nutrition-only",
      accent: false,
    },
    {
      id: "coach",
      icon: MessageCircle,
      label: isArabic ? "محادثة المدرب" : "Coach Chat",
      onPress: () => router.push("/coach"),
      hidden: false,
      accent: true,
    },
  ].filter((a) => !a.hidden);

  return (
    <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ flex: 1, backgroundColor: BACKDROP, alignItems: "center", justifyContent: "center" }}>
      {/* Close */}
      <Animated.View entering={ZoomIn} style={{ position: "absolute", top: insets.top + 12, right: 24 }}>
        <Pressable
          onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(210,210,215,0.64)", alignItems: "center", justifyContent: "center" }}
        >
          <X size={24} strokeWidth={2.5} color="#fff" />
        </Pressable>
      </Animated.View>

      {/* Action grid (stop backdrop dismiss) */}
      <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", paddingHorizontal: 48 }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", justifyContent: "center", rowGap: 24, columnGap: 24 }}>
          {actions.map((action, i) => {
            const Icon = action.icon;
            const tint = action.accent ? colors.primary : INK;
            return (
              <Animated.View key={action.id} entering={FadeInDown.delay(i * 40)} style={{ width: "40%", alignItems: "center" }}>
                <Pressable onPress={action.onPress} style={{ alignItems: "center", width: 80 }}>
                  <View style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={24} strokeWidth={2} color={tint} />
                  </View>
                  <AppText
                    style={{ fontSize: 13, color: "#fff", marginTop: 8, width: 80, textAlign: "center", lineHeight: 16, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}
                  >
                    {action.label}
                  </AppText>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </Pressable>

      {/* Footer */}
      <Animated.View entering={FadeInUp.delay(400)} style={{ position: "absolute", bottom: insets.bottom + 48, alignItems: "center" }}>
        <AppText style={{ color: colors.primary, fontSize: 17, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
          {isArabic ? "إجراءات سريعة" : "QUICK ACTIONS"}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}
