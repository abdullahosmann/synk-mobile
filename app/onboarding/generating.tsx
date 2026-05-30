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
import { UserProfile, CoachNutritionPlan } from "../../src/types";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

function generateNutritionPlan(user: UserProfile): CoachNutritionPlan {
  const isMale = user.gender === "male";
  let bmr = 10 * user.currentWeight + 6.25 * user.height - 5 * user.age;
  bmr += isMale ? 5 : -161;

  let multiplier = 1.2;
  if (user.activityLevel === "moderately-active") multiplier = 1.55;
  if (user.activityLevel === "very-active") multiplier = 1.725;
  if (user.daysPerWeek >= 4) multiplier += 0.1;

  const maintenance = Math.round(bmr * multiplier);
  let targetCals = maintenance;

  const isLoseWeight = user.goals.includes("lose-body-fat") || user.goal === "lose-weight";
  const isGainMuscle =
    user.goals.includes("gain-muscle") ||
    user.goal === "build-muscle" ||
    user.goals.includes("build-strength");

  let coachExplanation =
    user.language === "ar"
      ? "تم إعداد هذه الخطة لتوفير توازن غذائي يدعم تمارينك."
      : "This plan provides balanced nutrition to support your workouts.";

  if (isLoseWeight) {
    targetCals -= 500;
    coachExplanation =
      user.language === "ar"
        ? `لأن هدفك الأساسي هو خسارة الدهون، عملنا عجز معتدل بـ 500 سعرة من مستوى ثباتك (${maintenance} سعرة). ده هيساعد على خسارة الدهون تدريجياً مع الحفاظ على البروتين كفاية عشان نحافظ على العضلات.`
        : `Since your core focus is losing body fat, we've set a moderate caloric deficit of 500 calories from your maintenance (${maintenance} kcal). This allows steady fat loss while keeping protein high enough to preserve muscle.`;
  } else if (isGainMuscle) {
    targetCals += 300;
    coachExplanation =
      user.language === "ar"
        ? `عشان ندعم بناء العضلات وزيادة القوة، ضفنا فائض بسيط في السعرات. هنركز على البروتين ونسبة نشويات كفاية تديك طاقة للتمرين.`
        : `To fuel muscle growth and strength gains, we've set a slight caloric surplus. We focus heavily on protein and enough carbs to keep your training energy high.`;
  } else {
    coachExplanation =
      user.language === "ar"
        ? `سعراتك هنامظبوطة على مستوى الثبات عشان نبني عادات صحية، ونحافظ على التزامك، وندي جسمك طاقة على قد يومك وتمرينك.`
        : `We've set your calories to maintenance to build healthy habits, stay consistent, and fuel your lifestyle around your workouts.`;
  }

  const proteinTarget = Math.round(user.currentWeight * 2);
  const fatsTarget = Math.round(user.currentWeight * 0.9);
  const carbsCals = Math.max(0, targetCals - proteinTarget * 4 - fatsTarget * 9);
  const carbsTarget = Math.round(carbsCals / 4);

  let mealStructure = ["Breakfast", "Lunch", "Dinner", "Snack"];
  if (user.mealsPerDay === 3) mealStructure = ["Breakfast", "Lunch", "Dinner"];
  else if (user.mealsPerDay >= 5)
    mealStructure = ["Breakfast", "Lunch", "Dinner", "Pre-workout Snack", "Evening Snack"];

  const ar = user.language === "ar";
  const dietaryNotes =
    user.dietaryPreferences.length > 0
      ? ar
        ? `معدلة حسب اختياراتك: ${user.dietaryPreferences.join("، ")}.`
        : `Adjusted for ${user.dietaryPreferences.join(", ")} preferences.`
      : ar
        ? "مفيش قيود غذائية رئيسية."
        : "No major dietary restrictions noted.";

  return {
    dailyCalories: targetCals,
    proteinTarget,
    carbsTarget,
    fatsTarget,
    mealStructure,
    suggestedMeals: {
      Breakfast: [{ name: ar ? "شوفان وبروتين" : "Oats & Protein", description: ar ? "شوفان مع واي بروتين وتوت" : "Oatmeal with whey protein and berries.", calories: 400, protein: 30, carbs: 50, fat: 8 }],
      Lunch: [{ name: ar ? "دجاج ورز دايت" : "Chicken & Rice", description: ar ? "صدور فراخ مشوية مع رز بسمتي وبروكلي" : "Grilled chicken breast with basmati rice and broccoli.", calories: 550, protein: 45, carbs: 60, fat: 12 }],
      Dinner: [{ name: ar ? "سلمون وبطاطا" : "Salmon & Sweet Potato", description: ar ? "سلمون مشوي مع بطاطا حلوة وهليون" : "Baked salmon with roasted sweet potatoes and asparagus.", calories: 600, protein: 40, carbs: 45, fat: 25 }],
      Snack: [{ name: ar ? "زبادي يوناني ومكسرات" : "Greek Yogurt & Nuts", description: ar ? "زبادي يوناني سادة مع شوية لوز" : "Plain greek yogurt with a handful of almonds.", calories: 250, protein: 20, carbs: 10, fat: 15 }],
      "Pre-workout Snack": [{ name: ar ? "موز وزبدة فول سوداني" : "Banana & Peanut Butter", description: ar ? "موزة مع معلقة زبدة فول سوداني" : "One banana with 1 tbsp peanut butter.", calories: 200, protein: 5, carbs: 28, fat: 8 }],
      "Evening Snack": [{ name: ar ? "جبنة قريش" : "Cottage Cheese", description: ar ? "جبنة قريش قليلة الدسم" : "Low fat cottage cheese.", calories: 150, protein: 25, carbs: 5, fat: 3 }],
    },
    dietaryNotes,
    coachExplanation,
  };
}

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
        { title: "التعديل للإصابات", sub: "بأشيل الحركات الخطرة" },
        { title: "تجهيز أهداف التغذية", sub: "سعرات وماكروز" },
        { title: "تجهيز اقتراحات المدرب", sub: "قربنا نخلص" },
      ]
    : [
        { title: "Analyzing your goals", sub: "Reading what you told me" },
        { title: "Setting training volume", sub: "Days per week, session length" },
        { title: "Adjusting for injuries", sub: "Filtering risky movements" },
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

      <View style={{ height: 56, justifyContent: "center", marginBottom: 24 }}>
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
