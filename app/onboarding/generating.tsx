/**
 * GeneratingPlan — RN port of src/screens/onboarding/GeneratingPlan.tsx.
 * Timed checklist that advances every 1.6s (spinner -> check), computes the
 * nutrition plan at the end, saves it, then routes to plan-preview.
 */
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Check } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { COACHES } from "../../src/constants";
import CoachAvatar from "../../src/components/CoachAvatar";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { generateNutritionPlan } from "../../src/lib/nutritionPlan";


function Spinner({ color }: { color: string }) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <Animated.View
      style={[
        { width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: color, borderTopColor: "transparent" },
        style,
      ]}
    />
  );
}

export default function GeneratingPlan() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const [step, setStep] = useState(0);
  const coach = COACHES.find((c) => c.id === user.coach) || COACHES[0];

  const steps = isArabic
    ? [
        { title: "تحليل أهدافك", sub: "بقرأ اللي قلتهولي" },
        { title: "ضبط حجم التدريب", sub: "الأيام والمدة" },
        { title: "مراعاة إصاباتك", sub: "بنحطها في الحسبان" },
        { title: "تجهيز أهداف التغذية", sub: "سعرات وماكروز" },
        { title: "تجهيز اقتراحات المدرب", sub: "قربنا نخلص" },
      ]
    : [
        { title: "Analyzing your goals", sub: "Reading what you told me" },
        { title: "Setting training volume", sub: "Days per week, session length" },
        { title: "Accounting for injuries", sub: "Keeping them in mind" },
        { title: "Creating nutrition targets", sub: "Calories and macro balance" },
        { title: "Preparing coach suggestions", sub: "Almost done" },
      ];

  useEffect(() => {
    if (step < steps.length) {
      const t = setTimeout(() => setStep(step + 1), 1600);
      return () => clearTimeout(t);
    }
    setUser((prev) => {
      if (prev.nutritionPlan) return prev;
      const plan = generateNutritionPlan(prev);
      return {
        ...prev,
        nutritionPlan: plan,
        calorieTarget: plan.dailyCalories,
        proteinTarget: plan.proteinTarget,
        carbsTarget: plan.carbsTarget,
        fatTarget: plan.fatsTarget,
      };
    });
    const t = setTimeout(() => router.replace("/onboarding/plan-preview"), 2000);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.canvasParchment,
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
        alignItems: "center",
      }}
    >
      {/* progress bar */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "rgba(0,0,0,0.1)", flexDirection: isArabic ? "row-reverse" : "row" }}>
        <View style={{ width: `${(10 / 15) * 100}%`, height: "100%", backgroundColor: colors.primary }} />
      </View>

      <View style={{ height: 52, justifyContent: "center", marginBottom: 24 }}>
        <AppText style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", letterSpacing: 3.25, fontSize: 13 }}>
          SYNK
        </AppText>
      </View>

      <View style={{ flex: 1, justifyContent: "center", width: "100%", alignItems: "center" }}>
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View style={{ marginBottom: 32 }}>
            <CoachAvatar coachId={coach.id} size={96} verified />
          </View>
          <Animated.View entering={FadeInDown.delay(200)}>
            <AppText variant="title-2" style={{ textAlign: "center", maxWidth: 320 }}>
              {isArabic ? "بأبني نقطة البداية بتاعتك" : "Building your starting plan"}
            </AppText>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(200)}>
            <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 12, textAlign: "center", maxWidth: 320 }}>
              {isArabic ? "بأجهّز خطة على مقاسك." : "Creating a plan tailored to you."}
            </AppText>
          </Animated.View>
        </View>

        {/* Checklist */}
        <View style={{ width: "100%", maxWidth: 360, gap: 28 }}>
          {steps.map((s, i) => (
            <View
              key={i}
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: 24,
                opacity: i > step ? 0.2 : 1,
              }}
            >
              <View style={{ width: 24, height: 24, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvasParchment }}>
                {i < step ? (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                    <Check size={14} strokeWidth={4} color="#fff" />
                  </View>
                ) : i === step ? (
                  <Spinner color={colors.primary} />
                ) : (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.hairline }} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>
                  {s.title}
                </AppText>
                <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 4, textAlign: isArabic ? "right" : "left" }}>
                  {s.sub}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 48, textAlign: "center", maxWidth: 300, lineHeight: 22 }}>
          {isArabic
            ? "بأبني نقطة بداية واقعية — مش خطة مثالية مش هتقدر تكمّلها."
            : "I'm building a realistic starting point — not a perfect plan you can't follow."}
        </AppText>
      </View>
    </View>
  );
}
