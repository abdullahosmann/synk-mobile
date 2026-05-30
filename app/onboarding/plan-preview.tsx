/**
 * PlanPreview — RN port of src/screens/onboarding/PlanPreview.tsx.
 * Full-screen summary: coach card, workout brief, nutrition brief (computed
 * plan), coach-mode readout, and a fixed "Start my plan" footer that marks
 * onboarding complete.
 */
import React from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Dumbbell, Activity, Shield, Sparkles, ArrowRight } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { COACHES } from "../../src/constants";
import CoachAvatar from "../../src/components/CoachAvatar";
import { GoalV2, TrainingLocationV2, AICoachMode } from "../../src/types";
import { setItem } from "../../src/lib/storage";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";

const GOAL_LABELS: Record<GoalV2, { en: string; ar: string }> = {
  "build-strength": { en: "Build strength", ar: "بناء قوة" },
  "gain-muscle": { en: "Gain muscle", ar: "زيادة عضل" },
  "lose-body-fat": { en: "Lose body fat", ar: "تخفيف دهون" },
  "improve-cardio": { en: "Improve cardio", ar: "تحسين اللياقة" },
  "sport-performance": { en: "Sport performance", ar: "أداء رياضي" },
  "stay-consistent": { en: "Stay consistent", ar: "الاستمرارية" },
};
const LOC_LABELS: Record<TrainingLocationV2, { en: string; ar: string }> = {
  gym: { en: "Gym", ar: "جيم" },
  home: { en: "Home", ar: "بيت" },
  mix: { en: "Mix", ar: "مزيج" },
};
const MODE_LABELS: Record<AICoachMode, { en: string; ar: string }> = {
  "suggest-only": { en: "Suggest only", ar: "اقتراح فقط" },
  "ask-before": { en: "Ask before applying", ar: "اسأل قبل التطبيق" },
  "auto-adjust": { en: "Auto-adjust allowed", ar: "تعديل تلقائي مسموح" },
};
const DIETARY_DICT: Record<string, string> = {
  "No dairy": "بدون ألبان", "Lactose-free": "خالي من اللاكتوز", "No seafood": "بدون مأكولات بحرية",
  "No nuts": "بدون مكسرات", "No eggs": "بدون بيض", "Gluten-free": "خالي من الجلوتين",
  Vegetarian: "نباتي", Vegan: "نباتي صرف", Other: "أخرى",
};

export default function PlanPreview() {
  const router = useRouter();
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const coach = COACHES.find((c) => c.id === user.coach) ?? COACHES[0];

  const handleStart = () => {
    setItem("synk:onboarded", "true");
    router.push("/onboarding/notifications");
  };

  const goalsText =
    user.goals && user.goals.length > 0
      ? user.goals.map((g) => GOAL_LABELS[g]?.[isArabic ? "ar" : "en"] || g).join(" + ")
      : "—";
  const daysText = user.daysPerWeek || 3;
  const lengthText =
    user.sessionLength === "auto"
      ? isArabic ? "المدرب يقرر" : "Coach recommended"
      : isArabic ? `${user.sessionLength || 45} دقيقة` : `${user.sessionLength || 45} min`;
  const locV2 = user.trainingLocationV2 || "gym";
  const trainingText = isArabic
    ? `${daysText} أيام/أسبوع · ${lengthText} · ${LOC_LABELS[locV2].ar}`
    : `${daysText} days/week · ${lengthText} · ${LOC_LABELS[locV2].en}`;
  const modeText = MODE_LABELS[user.aiCoachMode || "ask-before"][isArabic ? "ar" : "en"];

  const eyebrow = (icon: React.ReactNode, text: string) => (
    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
      {icon}
      <AppText
        className="text-ink dark:text-ink-dark-muted-48"
        style={{ fontSize: 13, fontWeight: "600", letterSpacing: isArabic ? 0 : 0.5, textTransform: isArabic ? "none" : "uppercase", color: colors.inkMuted48, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}
      >
        {text}
      </AppText>
    </View>
  );

  const field = (label: string, value: string, top?: boolean) => (
    <View style={{ borderTopWidth: top ? 1 : 0, borderTopColor: "rgba(0,0,0,0.05)", paddingTop: top ? 12 : 0 }}>
      <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 12, marginBottom: 4, textAlign: isArabic ? "right" : "left" }}>
        {label}
      </AppText>
      <AppText variant="body-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left", lineHeight: 21 }}>
        {value}
      </AppText>
    </View>
  );

  const cardStyle = {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    padding: 20,
    marginTop: 16,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment, paddingTop: Math.max(insets.top, 16) }}>
      {/* progress bar */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "rgba(0,0,0,0.1)", zIndex: 60, flexDirection: isArabic ? "row-reverse" : "row" }}>
        <View style={{ width: `${(11 / 15) * 100}%`, height: "100%", backgroundColor: colors.primary }} />
      </View>
      <View style={{ height: 56, justifyContent: "center", alignItems: "center" }}>
        <AppText style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", letterSpacing: 3.25, fontSize: 13 }}>SYNK</AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 160 }}>
        {/* Eyebrow */}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={14} color={colors.primary} />
          </View>
          <AppText style={{ fontSize: 13, fontWeight: "600", letterSpacing: isArabic ? 0 : 0.5, color: colors.primary, textTransform: isArabic ? "none" : "uppercase", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
            {isArabic ? "خطتك جاهزة" : "YOUR STARTING PLAN IS READY"}
          </AppText>
        </View>

        {/* Coach card */}
        <View
          style={{
            backgroundColor: colors.canvas,
            borderWidth: 1,
            borderColor: colors.hairline,
            borderLeftWidth: isArabic ? 1 : 3,
            borderRightWidth: isArabic ? 3 : 1,
            borderLeftColor: isArabic ? colors.hairline : colors.primary,
            borderRightColor: isArabic ? colors.primary : colors.hairline,
            borderRadius: 8,
            padding: 16,
            flexDirection: isArabic ? "row-reverse" : "row",
            gap: 12,
          }}
        >
          <CoachAvatar coachId={coach.id} size={40} verified />
          <View style={{ flex: 1 }}>
            <AppText variant="caption-strong" style={{ color: colors.ink, marginBottom: 4, textAlign: isArabic ? "right" : "left" }}>
              {isArabic ? `${coach.arabicName} يقول:` : `${coach.name} says:`}
            </AppText>
            <AppText variant="body" style={{ color: colors.ink, lineHeight: 21, textAlign: isArabic ? "right" : "left" }}>
              {isArabic
                ? "بنيتها على أهدافك، جدولك، مستواك، وقواعد أكلك. هنعدّلها كل ما تسجّل تمارين ووجبات."
                : "I built this around your goals, schedule, training level, and food rules. We'll adjust it as you log workouts and meals."}
            </AppText>
          </View>
        </View>

        {/* Workout brief */}
        <View style={cardStyle}>
          {eyebrow(<Dumbbell size={18} color={colors.primary} />, isArabic ? "ملخص التدريب" : "Workout Brief")}
          <View style={{ gap: 16 }}>
            {field(isArabic ? "الهدف الأساسي" : "Main Focus", goalsText)}
            {field(isArabic ? "هيكلة الأسبوع" : "Weekly Structure", trainingText, true)}
            {field(
              isArabic ? "نظام التقدم" : "Progression Model",
              isArabic
                ? "المدرب هيزوّد الصعوبة تدريجياً (Progressive Overload) بناءً على تقدمك وقوتك."
                : "Progressive overload applied automatically as your strength and endurance improve.",
              true,
            )}
          </View>
        </View>

        {/* Nutrition brief */}
        <View style={cardStyle}>
          {eyebrow(<Activity size={18} color={colors.primary} />, isArabic ? "ملخص التغذية" : "Nutrition Brief")}
          {user.nutritionPlan ? (
            <View style={{ gap: 16 }}>
              <AppText variant="body" style={{ color: colors.ink, lineHeight: 21, textAlign: isArabic ? "right" : "left" }}>
                {isArabic ? "حدد مدربك هدف يومي بسيط لدعم هدفك." : "Your coach set a simple daily target to support your goal."}
              </AppText>
              <View style={{ gap: 8 }}>
                {[
                  isArabic ? `السعرات: ${user.nutritionPlan.dailyCalories.toLocaleString()} سعر` : `Calories: ${user.nutritionPlan.dailyCalories.toLocaleString()} kcal`,
                  isArabic ? `البروتين: ${user.nutritionPlan.proteinTarget} جم` : `Protein: ${user.nutritionPlan.proteinTarget}g`,
                  isArabic ? `الكربوهيدرات: ${user.nutritionPlan.carbsTarget} جم` : `Carbs: ${user.nutritionPlan.carbsTarget}g`,
                  isArabic ? `الدهون: ${user.nutritionPlan.fatsTarget} جم` : `Fats: ${user.nutritionPlan.fatsTarget}g`,
                  isArabic ? `الهيكل: ${user.nutritionPlan.mealStructure.join(" + ")}` : `Structure: ${user.nutritionPlan.mealStructure.length} meals`,
                ].map((line, i) => (
                  <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
                    <AppText variant="body-strong" style={{ color: colors.ink }}>•</AppText>
                    <AppText variant="body-strong" style={{ color: colors.ink, flex: 1, textAlign: isArabic ? "right" : "left" }}>{line}</AppText>
                  </View>
                ))}
              </View>
              {field(isArabic ? "رسالة المدرب" : "Coach Message", user.nutritionPlan.coachExplanation, true)}
            </View>
          ) : (
            <AppText variant="body" style={{ color: colors.ink, lineHeight: 21, textAlign: isArabic ? "right" : "left" }}>
              {isArabic ? "سيقوم مدربك بتحديد أهداف التغذية الخاصة بك بعد الإعداد." : "Your coach will set your starting nutrition targets after setup."}
            </AppText>
          )}
        </View>

        {/* Coach mode */}
        <View
          style={{
            ...cardStyle,
            padding: 16,
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
            <Shield size={16} color={colors.primary} />
            <AppText variant="caption-strong" style={{ color: colors.ink }}>{isArabic ? "نمط المدرب:" : "Coach Mode:"}</AppText>
          </View>
          <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontWeight: "500" }}>{modeText}</AppText>
        </View>

        <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 16, lineHeight: 21, textAlign: isArabic ? "right" : "left" }}>
          {isArabic ? "مدربك هيعدّل الخطة لما تتمرّن، تاكل، وترتاح." : "Your coach will adjust the plan as you train, eat, and recover."}
        </AppText>
        <AppText
          onPress={() => router.push("/onboarding/ai-rules")}
          variant="caption-strong"
          className="text-primary dark:text-primary-dark"
          style={{ marginTop: 8, textAlign: isArabic ? "right" : "left" }}
        >
          {isArabic ? "عايز تعدّل حاجة؟" : "Tweak something?"}
        </AppText>
      </ScrollView>

      {/* Footer */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <LinearGradient colors={["rgba(245,245,247,0)", colors.canvasParchment]} style={{ height: 24 }} />
        <View style={{ backgroundColor: colors.canvasParchment, paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 20 }}>
          <Btn variant="primary" fullWidth onPress={handleStart}>
            <AppText variant="body-strong" style={{ color: "#fff" }}>{isArabic ? "ابدأ خطتي" : "Start my plan"}</AppText>
            <ArrowRight size={16} strokeWidth={2.5} color="#fff" style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Btn>
          <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 12, textAlign: "center" }}>
            {isArabic ? "تقدر تعدّل ده في أي وقت." : "You can edit this anytime."}
          </AppText>
        </View>
      </View>
    </View>
  );
}
