/**
 * AICoachRules — RN port of src/screens/onboarding/AICoachRules.tsx.
 * Coach autonomy mode radio list, adaptation-scope toggles (workouts/nutrition),
 * and a trust info card.
 */
import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Info } from "lucide-react-native";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { AICoachMode } from "../../src/types";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";
import { Toggle } from "../../src/components/ui/Toggle";

const MODES: { id: AICoachMode; en: string; enSub: string; ar: string; arSub: string }[] = [
  { id: "suggest-only", en: "Suggestions only", enSub: "Coach gives tips but won't modify your workout plan.", ar: "اقتراحات فقط", arSub: "المدرب هيديك نصايح بس مش هيعدل التمارين." },
  { id: "ask-before", en: "Ask for approval", enSub: "Coach prepares adjustments but waits for your OK to apply them.", ar: "اسألني الأول", arSub: "المدرب هيجهز التعديلات ويستنى موافقتك عشان يطبقها." },
  { id: "auto-adjust", en: "Auto-adjust", enSub: "Coach automatically adapts reps, weights, and sets based on your performance.", ar: "تعديل تلقائي", arSub: "المدرب هيعدل العدادات والأوزان والراحة تلقائيا بناءً على أدائك." },
];

export default function AICoachRules() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";

  const Label = ({ children }: { children: string }) => (
    <AppText
      className="text-ink-muted-48 dark:text-ink-dark-muted-48"
      style={{
        paddingHorizontal: 4,
        marginBottom: 8,
        fontSize: isArabic ? 12 : 11,
        fontWeight: "600",
        letterSpacing: isArabic ? 0 : 0.44,
        textTransform: isArabic ? "none" : "uppercase",
        textAlign: isArabic ? "right" : "left",
        fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold",
      }}
    >
      {children}
    </AppText>
  );

  const scopeRow = (label: string, value: boolean, onToggle: () => void) => (
    <View
      style={{
        backgroundColor: colors.canvas,
        borderWidth: 1,
        borderColor: colors.hairline,
        borderRadius: 8,
        padding: 12,
        flexDirection: isArabic ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <AppText variant="body-strong" style={{ color: colors.ink }}>{label}</AppText>
      <Toggle value={value} onValueChange={onToggle} />
    </View>
  );

  return (
    <OnboardingLayout
      step={8}
      title="Coach rules"
      arabicTitle="قواعد المدرب"
      subtitle="You stay in control. Your coach will always explain what changed and why."
      arabicSubtitle="القرار دايماً بيطابق اختيارك. مدربك هيشرحلك كل تغييرة بتحصل وليه."
      footer={<ContinueButton onPress={() => router.push("/onboarding/generating")} />}
    >
      <View style={{ paddingBottom: 16 }}>
        {/* Mode */}
        <Label>{isArabic ? "النمط" : "MODE"}</Label>
        <View style={{ gap: 8 }}>
          {MODES.map((mode) => {
            const sel = user.aiCoachMode === mode.id;
            return (
              <Pressable
                key={mode.id}
                onPress={() => setUser({ ...user, aiCoachMode: mode.id })}
                style={{
                  flexDirection: isArabic ? "row-reverse" : "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.canvas,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? colors.primary : colors.hairline,
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="body-strong" style={{ color: colors.ink, fontSize: 14, textAlign: isArabic ? "right" : "left" }}>
                    {isArabic ? mode.ar : mode.en}
                  </AppText>
                  <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 2, textAlign: isArabic ? "right" : "left" }}>
                    {isArabic ? mode.arSub : mode.enSub}
                  </AppText>
                </View>
                <View style={{ width: 20, height: 20, borderRadius: 9999, borderWidth: 1, borderColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center", marginLeft: isArabic ? 0 : 12, marginRight: isArabic ? 12 : 0 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: sel ? colors.primary : "transparent" }} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Scope */}
        <View style={{ marginTop: 20 }}>
          <Label>{isArabic ? "إيه اللي ممكن يعدّله؟" : "WHAT CAN THEY ADAPT?"}</Label>
          <View style={{ gap: 8 }}>
            {scopeRow(isArabic ? "التمارين" : "Workouts", user.aiCoachAdaptsWorkouts, () =>
              setUser({ ...user, aiCoachAdaptsWorkouts: !user.aiCoachAdaptsWorkouts }),
            )}
            {scopeRow(isArabic ? "التغذية" : "Nutrition", user.aiCoachAdaptsNutrition, () =>
              setUser({ ...user, aiCoachAdaptsNutrition: !user.aiCoachAdaptsNutrition }),
            )}
          </View>
        </View>

        {/* Trust card */}
        <View style={{ marginTop: 20 }}>
          <View
            style={{
              backgroundColor: colors.canvas,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 8,
              padding: 12,
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <Info size={16} color={colors.primary} style={{ marginTop: 2 }} />
            <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ flex: 1, lineHeight: 19, textAlign: isArabic ? "right" : "left" }}>
              {isArabic
                ? "مفيش تغييرات مفاجئة — مدربك بيوضح دايماً اللي اتعدّل."
                : "No surprise changes — your coach explains every update."}
            </AppText>
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}
