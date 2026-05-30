/**
 * AIPermissions — RN port of src/screens/main/AIPermissions.tsx.
 *
 * AI coach controls: a 3-option mode radio (suggest-only / ask-before /
 * auto-adjust), two adapt toggles (workouts / nutrition), a quiet-hours toggle
 * with start/end time inputs, and an explainer line.
 *
 * Web→RN: navigate(-1) → router.back(); checkbox → <Toggle>; <input type=time>
 * → <TextInput> (HH:MM).
 */
import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import type { AICoachMode } from "../../src/types";
import { Toggle } from "../../src/components/ui/Toggle";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

const MODES: { id: AICoachMode; en: string; enSub: string; ar: string; arSub: string }[] = [
  { id: "suggest-only", en: "Suggestions only", enSub: "Coach gives tips but won't modify your workout plan.", ar: "اقتراحات فقط", arSub: "المدرب هيديك نصايح بس مش هيعدل التمارين." },
  { id: "ask-before", en: "Ask for approval", enSub: "Coach prepares adjustments but waits for your OK to apply them.", ar: "اسألني الأول", arSub: "المدرب هيجهز التعديلات ويستنى موافقتك عشان يطبقها." },
  { id: "auto-adjust", en: "Auto-adjust", enSub: "Coach automatically adapts reps, weights, and sets based on your performance.", ar: "تعديل تلقائي", arSub: "المدرب هيعدل العدادات والأوزان والراحة تلقائيا بناءً على أدائك." },
];

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function AIPermissions() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const updatePermission = (key: keyof typeof user, value: any) => setUser({ ...user, [key]: value });

  const sectionTitle = (text: string) => (
    <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.inkMuted48, marginBottom: 8, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 0.5, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>
      {text}
    </AppText>
  );

  const toggleRow = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <Pressable onPress={() => onChange(!checked)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
      <AppText style={{ flex: 1, fontSize: 17, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{label}</AppText>
      <Toggle value={checked} onValueChange={() => onChange(!checked)} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 24, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvasParchment, zIndex: 50 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={28} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 0.5, fontFamily: ff(isArabic, 600) }}>{isArabic ? "المدرب الذكي" : "AI COACH"}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ paddingHorizontal: 24, marginTop: 24, maxWidth: 448, width: "100%", alignSelf: "center" }}>
        {/* Mode */}
        <View style={{ marginBottom: 40 }}>
          {sectionTitle(isArabic ? "النمط" : "MODE")}
          <View style={{ gap: 8 }}>
            {MODES.map((mode) => {
              const selected = user.aiCoachMode === mode.id;
              return (
                <Pressable
                  key={mode.id}
                  onPress={() => updatePermission("aiCoachMode", mode.id)}
                  style={{ backgroundColor: colors.canvas, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.primary : colors.hairline, borderRadius: 10, padding: 14, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}
                >
                  <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? mode.ar : mode.en}</AppText>
                    <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 2, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? mode.arSub : mode.enSub}</AppText>
                  </View>
                  <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center", marginLeft: isArabic ? 0 : 12, marginRight: isArabic ? 12 : 0 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selected ? colors.primary : "transparent" }} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Permissions */}
        <View style={{ marginBottom: 40 }}>
          {sectionTitle(isArabic ? "إيه اللي ممكن يعدّله؟" : "WHAT CAN THEY ADAPT?")}
          <View>
            {toggleRow(isArabic ? "التمارين" : "Workouts", user.aiCoachAdaptsWorkouts, (v) => updatePermission("aiCoachAdaptsWorkouts", v))}
            {toggleRow(isArabic ? "التغذية" : "Nutrition", user.aiCoachAdaptsNutrition, (v) => updatePermission("aiCoachAdaptsNutrition", v))}
          </View>
        </View>

        {/* Quiet hours */}
        <View style={{ marginBottom: 24 }}>
          {sectionTitle(isArabic ? "ساعات الهدوء" : "QUIET HOURS")}
          <View>
            {toggleRow(
              isArabic ? "لا ترسل التعديلات أوقات الهدوء" : "Don't send adaptations during quiet hours",
              user.aiQuietHours,
              (v) => updatePermission("aiQuietHours", v),
            )}
            {user.aiQuietHours && (
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
                <TextInput
                  value={user.aiQuietHoursStart}
                  onChangeText={(t) => updatePermission("aiQuietHoursStart", t)}
                  placeholder="22:00"
                  placeholderTextColor={colors.inkMuted48}
                  style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, fontWeight: "500", color: colors.ink, textAlign: "center", minWidth: 80 }}
                />
                <AppText style={{ color: colors.inkMuted48 }}>-</AppText>
                <TextInput
                  value={user.aiQuietHoursEnd}
                  onChangeText={(t) => updatePermission("aiQuietHoursEnd", t)}
                  placeholder="07:00"
                  placeholderTextColor={colors.inkMuted48}
                  style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, fontWeight: "500", color: colors.ink, textAlign: "center", minWidth: 80 }}
                />
              </View>
            )}
          </View>
        </View>

        {/* Explainer */}
        <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 24, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>
          {isArabic ? "التغييرات تطبق على التعديلات القادمة فقط. التعديلات الموجودة في قائمتك مش هتتأثر." : "Changes apply to future adaptations only. Existing adaptations in your queue are not affected."}
        </AppText>
      </View>
    </View>
  );
}
