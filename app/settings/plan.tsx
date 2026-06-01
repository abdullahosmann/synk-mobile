/**
 * PlanSettings — RN port of src/screens/main/PlanSettings.tsx.
 *
 * Grouped plan editor: fitness goal (goal / target weight / timeline), workout
 * parameters (level, restrictions, days, time, duration, location, split,
 * equipment, excluded, cardio), nutrition (diet, meal-prep, meals, water), and
 * workout experience (rest durations, rest timer, form tips), plus cycle
 * tracking for female users. Many fields open option-picker BottomSheets;
 * "dangerous" fields (level/days/duration/location/split) route through a
 * pendingChange confirmation that warns the week will be rebuilt.
 *
 * Web→RN: navigate(...) → router.back/push; checkbox/toggle markup → inline
 * switch; <input type=number> → <TextInput>; option lists → a shared
 * optionPicker sheet helper.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import BottomSheet from "../../src/components/BottomSheet";
import { GoalPacePicker } from "../../src/components/GoalPacePicker";
import { computeGoalEndDate } from "../../src/lib/planUtils";
import { generateNutritionPlan, pushNutritionHistory } from "../../src/lib/nutritionPlan";
import { Toggle } from "../../src/components/ui/Toggle";
import { useColors } from "../../src/theme/ThemeProvider";
import { withAlpha } from "../../src/theme/tint";
import { AppText } from "../../src/components/ui/Typography";

type Opt = { id: string; labelEn: string; labelAr: string; descEn?: string; descAr?: string };

function ff(isArabic: boolean, weight: 400 | 500 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function PlanSettings() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";

  const [goalSheet, setGoalSheet] = useState(false);
  const [targetWeightSheet, setTargetWeightSheet] = useState(false);
  const [paceSheet, setPaceSheet] = useState(false);
  const [fitnessLevelSheet, setFitnessLevelSheet] = useState(false);
  const [restrictionsSheet, setRestrictionsSheet] = useState(false);
  const [daysPerWeekSheet, setDaysPerWeekSheet] = useState(false);
  const [preferredTimeSheet, setPreferredTimeSheet] = useState(false);
  const [workoutDurationSheet, setWorkoutDurationSheet] = useState(false);
  const [trainingLocationSheet, setTrainingLocationSheet] = useState(false);
  const [workoutSplitSheet, setWorkoutSplitSheet] = useState(false);
  const [equipmentSheet, setEquipmentSheet] = useState(false);
  const [cardioSheet, setCardioSheet] = useState(false);
  const [dietStyleSheet, setDietStyleSheet] = useState(false);
  const [mealsPerDaySheet, setMealsPerDaySheet] = useState(false);
  const [waterTargetSheet, setWaterTargetSheet] = useState(false);
  const [restDurationsSheet, setRestDurationsSheet] = useState(false);

  const [pendingChange, setPendingChange] = useState<{ field: string; newValue: any; oldValue: any; labelEn: string; labelAr: string; apply: () => void; kind?: "workout" | "nutrition" } | null>(null);

  const [tempTargetWeight, setTempTargetWeight] = useState(user?.targetWeight || 70);
  const [tempRestDurationSets, setTempRestDurationSets] = useState(user?.restDurationSets || 60);
  const [tempRestDurationExercises, setTempRestDurationExercises] = useState(user?.restDurationExercises || 90);
  const [tempInjuries, setTempInjuries] = useState<string[]>((user?.injuries as any) || []);
  const [customWater, setCustomWater] = useState("");

  const capitalize = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  const endDate = computeGoalEndDate(user?.currentWeight || 0, user?.targetWeight || 0, user?.weeklyGoalRate || 0.5);
  const formattedEndDate = endDate ? endDate.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : isArabic ? "غير محدد" : "Not set";

  const mapped = (val: string | null | undefined, map: Record<string, string>, fallback: string) => (val ? map[val] || capitalize(val) : fallback);

  const getFitnessGoalValue = () => mapped(user?.goal, { "weight-loss": isArabic ? "فقدان الوزن" : "Weight loss", "weight-gain": isArabic ? "زيادة الوزن" : "Weight gain", "muscle-gain": isArabic ? "بناء العضلات" : "Muscle gain", strength: isArabic ? "القوة" : "Strength", maintenance: isArabic ? "الحفاظ على الوزن" : "Maintenance" }, isArabic ? "غير محدد" : "Not set");
  const getFitnessLevelValue = () => mapped(user?.fitnessLevel, { beginner: isArabic ? "مبتدئ" : "Beginner", intermediate: isArabic ? "متوسط" : "Intermediate", advanced: isArabic ? "متقدم" : "Advanced" }, "Beginner");
  const getPreferredTimeValue = () => mapped(user?.preferredTime, { morning: isArabic ? "صباحاً" : "Morning", afternoon: isArabic ? "ظهراً" : "Afternoon", evening: isArabic ? "مساءً" : "Evening", "late-night": isArabic ? "متأخراً" : "Late night", night: isArabic ? "مساءً" : "Evening" }, "Morning");
  const getTrainingLocationValue = () => mapped(user?.trainingLocation, { gym: isArabic ? "جيم كامل" : "Full gym", "home-equipment": isArabic ? "بيت بالمعدات" : "Home with equipment", "home-no-equipment": isArabic ? "بيت بدون معدات" : "Home no equipment", outdoor: isArabic ? "في الخلاء" : "Outdoor" }, isArabic ? "غير محدد" : "Not set");
  const getWorkoutSplitValue = () => mapped(user?.workoutSplit, { auto: isArabic ? "تلقائي (الموصى به)" : "Auto (Recommended)", ppl: "Push Pull Legs", "upper-lower": "Upper Lower", arnold: "Arnold", phul: "PHUL", phat: "PHAT", "bro-split": "Bro Split", "full-body": "Full Body" }, isArabic ? "تلقائي (الموصى به)" : "Auto (Recommended)");
  const getCardioValue = () => (!user?.cardioEnabled ? (isArabic ? "موقف" : "Disabled") : isArabic ? "مفعل" : "Enabled");
  const getDietStyleValue = () => mapped(user?.dietStyle, { balanced: isArabic ? "متوازن" : "Balanced", "high-protein": isArabic ? "عالي البروتين" : "High Protein", keto: isArabic ? "كيتو" : "Keto", mediterranean: isArabic ? "متوسطي" : "Mediterranean", vegetarian: isArabic ? "نباتي" : "Vegetarian", vegan: isArabic ? "نباتي صرف" : "Vegan" }, "Balanced");

  // ---- Options data ----
  const goalOptions: Opt[] = [
    { id: "weight-loss", labelEn: "Weight loss", labelAr: "فقدان الوزن" },
    { id: "weight-gain", labelEn: "Weight gain", labelAr: "زيادة الوزن" },
    { id: "muscle-gain", labelEn: "Muscle gain", labelAr: "بناء العضلات" },
    { id: "strength", labelEn: "Strength", labelAr: "القوة" },
    { id: "maintenance", labelEn: "Maintenance", labelAr: "الحفاظ على الوزن" },
  ];
  const fitnessLevelOptions: Opt[] = [
    { id: "beginner", labelEn: "Beginner", labelAr: "مبتدئ" },
    { id: "intermediate", labelEn: "Intermediate", labelAr: "متوسط" },
    { id: "advanced", labelEn: "Advanced", labelAr: "متقدم" },
  ];
  const restrictionsOptions: Opt[] = [
    { id: "knee", labelEn: "Knee", labelAr: "الركبة" },
    { id: "lower-back", labelEn: "Lower back", labelAr: "أسفل الظهر" },
    { id: "shoulder", labelEn: "Shoulder", labelAr: "الكتف" },
    { id: "wrist", labelEn: "Wrist", labelAr: "المعصم" },
    { id: "ankle", labelEn: "Ankle", labelAr: "الكاحل" },
    { id: "hip", labelEn: "Hip", labelAr: "الورك" },
    { id: "neck", labelEn: "Neck", labelAr: "الرقبة" },
    { id: "elbow", labelEn: "Elbow", labelAr: "الكوع" },
  ];
  const preferredTimeOptions: Opt[] = [
    { id: "morning", labelEn: "Morning", labelAr: "صباحاً" },
    { id: "afternoon", labelEn: "Afternoon", labelAr: "ظهراً" },
    { id: "evening", labelEn: "Evening", labelAr: "مساءً" },
    { id: "late-night", labelEn: "Late night", labelAr: "متأخراً" },
  ];
  const trainingLocationOptions: Opt[] = [
    { id: "gym", labelEn: "Full gym", labelAr: "جيم كامل" },
    { id: "home-equipment", labelEn: "Home with equipment", labelAr: "بيت بالمعدات" },
    { id: "home-no-equipment", labelEn: "Home no equipment", labelAr: "بيت بدون معدات" },
    { id: "outdoor", labelEn: "Outdoor", labelAr: "في الخلاء" },
  ];
  const workoutSplitOptions: Opt[] = [
    { id: "auto", labelEn: "Auto (Recommended)", labelAr: "تلقائي (الموصى به)", descEn: "Coach adapts it automatically", descAr: "الكوتش بيضبطه تلقائي" },
    { id: "ppl", labelEn: "Push Pull Legs", labelAr: "Push Pull Legs", descEn: "3 or 6 days split", descAr: "3 أو 6 أيام في الأسبوع" },
    { id: "upper-lower", labelEn: "Upper Lower", labelAr: "Upper Lower", descEn: "2 or 4 days split", descAr: "2 أو 4 أيام في الأسبوع" },
    { id: "arnold", labelEn: "Arnold", labelAr: "Arnold", descEn: "Chest/Back, Shoulders/Arms, Legs", descAr: "صدر/ظهر، كتف/ذراع، رجل" },
    { id: "phul", labelEn: "PHUL", labelAr: "PHUL", descEn: "Power Hypertrophy Upper Lower", descAr: "قوة وضخامة للجزء العلوي والسفلي" },
    { id: "phat", labelEn: "PHAT", labelAr: "PHAT", descEn: "Power Hypertrophy Adaptive", descAr: "قوة وضخامة متكيف" },
    { id: "bro-split", labelEn: "Bro Split", labelAr: "Bro Split", descEn: "One muscle group per day", descAr: "عضلة واحدة في اليوم" },
    { id: "full-body", labelEn: "Full Body", labelAr: "Full Body", descEn: "2-3 days split", descAr: "2 أو 3 أيام في الأسبوع" },
  ];
  const cardioOptions = [
    { id: "disabled", intensity: null, enabled: false, labelEn: "Disabled", labelAr: "موقف" },
    { id: "light", intensity: "light", enabled: true, labelEn: "Light (10-15 min)", labelAr: "خفيف (10-15 دقيقة)" },
    { id: "moderate", intensity: "moderate", enabled: true, labelEn: "Moderate (20-30 min)", labelAr: "متوسط (20-30 دقيقة)" },
    { id: "heavy", intensity: "heavy", enabled: true, labelEn: "Heavy (30+ min)", labelAr: "شديد (30+ دقيقة)" },
  ];
  const dietStyleOptions: Opt[] = [
    { id: "balanced", labelEn: "Balanced", labelAr: "متوازن" },
    { id: "high-protein", labelEn: "High Protein", labelAr: "عالي البروتين" },
    { id: "keto", labelEn: "Keto", labelAr: "كيتو" },
    { id: "mediterranean", labelEn: "Mediterranean", labelAr: "متوسطي" },
    { id: "vegetarian", labelEn: "Vegetarian", labelAr: "نباتي" },
    { id: "vegan", labelEn: "Vegan", labelAr: "نباتي صرف" },
  ];

  const saved = () => showToast(isArabic ? "تم الحفظ" : "Saved", "success");
  const rebalancing = () => showToast(isArabic ? "الكوتش بيعيد توزيع الأسبوع" : "Your coach is rebalancing the week", "success");

  // F3 — recompute the nutrition plan from the (already-updated) user and record
  // the rebuild in plan history. `patch` carries the changed field so the plan
  // is generated from the new value in the same tick.
  const rebuildNutrition = (patch: Record<string, any>, summaryEn: string, summaryAr: string) => {
    const nextUser = { ...user, ...patch } as any;
    const plan = generateNutritionPlan(nextUser);
    setUser({
      ...nextUser,
      nutritionPlan: plan,
      calorieTarget: plan.dailyCalories,
      proteinTarget: plan.proteinTarget,
      carbsTarget: plan.carbsTarget,
      fatTarget: plan.fatsTarget,
    });
    pushNutritionHistory(summaryEn, summaryAr);
    showToast(isArabic ? "الكوتش بيعيد بناء خطة التغذية" : "Your coach is rebuilding your nutrition plan", "success");
  };

  // ---- Reusable list-row + toggle-row ----
  const Row = ({ label, value, onPress, last }: { label: string; value: React.ReactNode; onPress: () => void; last?: boolean }) => (
    <View>
      <Pressable onPress={onPress} style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
        <AppText style={{ fontSize: 17, color: colors.ink, fontWeight: "500", textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 500) }}>{label}</AppText>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          <AppText style={{ fontSize: 14, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{value}</AppText>
          {isArabic ? <ChevronLeft size={18} color={colors.inkMuted48} /> : <ChevronRight size={18} color={colors.inkMuted48} />}
        </View>
      </Pressable>
      {!last && <View style={{ height: 1, backgroundColor: colors.hairline }} />}
    </View>
  );

  const ToggleRow = ({ label, sub, checked, onChange, last }: { label: string; sub: string; checked: boolean; onChange: () => void; last?: boolean }) => (
    <View>
      <Pressable onPress={onChange} style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
          <AppText style={{ fontSize: 17, color: colors.ink, fontWeight: "500", textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 500) }}>{label}</AppText>
          <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 2, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{sub}</AppText>
        </View>
        <Toggle value={checked} onValueChange={onChange} />
      </Pressable>
      {!last && <View style={{ height: 1, backgroundColor: colors.hairline }} />}
    </View>
  );

  const sectionTitle = (text: string) => (
    <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, paddingHorizontal: 4, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{text}</AppText>
  );

  const card = { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, overflow: "hidden" as const };

  // ---- Shared option-picker sheet ----
  const optionButton = (selected: boolean, onPress: () => void, label: string, desc?: string, key?: string) => (
    <Pressable
      key={key ?? label}
      onPress={onPress}
      style={{ width: "100%", minHeight: 56, paddingVertical: desc ? 14 : 0, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, justifyContent: "center", alignItems: desc ? (isArabic ? "flex-end" : "flex-start") : "stretch", backgroundColor: selected ? withAlpha(colors.primary, 0.2) : colors.canvasParchment, borderColor: selected ? colors.primary : colors.hairline }}
    >
      <View style={{ height: desc ? undefined : 56, justifyContent: "center", alignItems: desc ? undefined : isArabic ? "flex-end" : "flex-start", width: "100%" }}>
        <AppText style={{ fontSize: 15, fontWeight: "600", color: selected ? colors.primary : colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{label}</AppText>
        {desc ? <AppText style={{ fontSize: 12, color: selected ? colors.primary : colors.inkMuted48, marginTop: 4, opacity: 0.8, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{desc}</AppText> : null}
      </View>
    </Pressable>
  );

  const stepperBtn = (sign: "-" | "+", onPress: () => void) => (
    <Pressable onPress={onPress} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
      <AppText style={{ fontSize: 24, color: colors.ink }}>{sign}</AppText>
    </Pressable>
  );

  const saveBtn = (onPress: () => void, label?: string) => (
    <Pressable onPress={onPress} style={{ height: 52, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 8 }}>
      <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: ff(isArabic, 600) }}>{label ?? (isArabic ? "حفظ" : "Save")}</AppText>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 24, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", backgroundColor: colors.canvasParchment, borderBottomWidth: 1, borderBottomColor: colors.hairline, zIndex: 50 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إعدادات الخطة" : "PLAN SETTINGS"}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 80, paddingHorizontal: 24, gap: 32, maxWidth: 448, width: "100%", alignSelf: "center" }}>
        {/* Fitness Goal */}
        <View>
          {sectionTitle(isArabic ? "هدف اللياقة" : "Fitness Goal")}
          <View style={card}>
            <Row label={isArabic ? "الهدف" : "Goal"} value={getFitnessGoalValue()} onPress={() => setGoalSheet(true)} />
            <Row label={isArabic ? "الوزن المستهدف" : "Target weight"} value={`${user?.targetWeight} ${user?.weightUnit === "kg" ? (isArabic ? "كجم" : "kg") : isArabic ? "رطل" : "lb"}`} onPress={() => { setTempTargetWeight(user?.targetWeight || 70); setTargetWeightSheet(true); }} />
            <Row label={isArabic ? "الجدول الزمني للهدف" : "Goal timeline"} value={formattedEndDate} last onPress={() => { if (!user?.targetWeight) { showToast(isArabic ? "حدّد وزنك المستهدف الأول عشان تختار السرعة." : "Set your target weight first to choose a pace.", "info"); setTargetWeightSheet(true); } else setPaceSheet(true); }} />
          </View>
        </View>

        {/* Workout Parameters */}
        <View>
          {sectionTitle(isArabic ? "إعدادات التمرين" : "Workout Parameters")}
          <View style={card}>
            <Row label={isArabic ? "مستوى اللياقة" : "Fitness level"} value={getFitnessLevelValue()} onPress={() => setFitnessLevelSheet(true)} />
            <Row label={isArabic ? "القيود الصحية" : "Health restrictions"} value={!user?.injuries || user.injuries.length === 0 ? (isArabic ? "لا يوجد" : "None") : isArabic ? `${user.injuries.length} ${user.injuries.length === 1 ? "إصابة" : "إصابات"}` : `${user.injuries.length} ${user.injuries.length === 1 ? "item" : "items"}`} onPress={() => { setTempInjuries((user?.injuries as any) || []); setRestrictionsSheet(true); }} />
            <Row label={isArabic ? "أيام التمرين أسبوعياً" : "Days per week"} value={isArabic ? `${user?.daysPerWeek} أيام` : `${user?.daysPerWeek} days`} onPress={() => setDaysPerWeekSheet(true)} />
            <Row label={isArabic ? "الوقت المفضل" : "Preferred time"} value={getPreferredTimeValue()} onPress={() => setPreferredTimeSheet(true)} />
            <Row label={isArabic ? "مدة التمرين" : "Workout duration"} value={isArabic ? `${user?.workoutDuration} دقيقة` : `${user?.workoutDuration} min`} onPress={() => setWorkoutDurationSheet(true)} />
            <Row label={isArabic ? "مكان التمرين" : "Training location"} value={getTrainingLocationValue()} onPress={() => setTrainingLocationSheet(true)} />
            <Row label={isArabic ? "تقسيمة التمرين" : "Workout split"} value={getWorkoutSplitValue()} onPress={() => setWorkoutSplitSheet(true)} />
            <Row label={isArabic ? "المعدات" : "Equipment"} value={(user?.trainingLocation as string) === "home-no-equipment" ? (isArabic ? "بدون معدات" : "No equipment") : isArabic ? "جيم كامل أو مخصص" : "Full gym / Custom"} onPress={() => setEquipmentSheet(true)} />
            <Row label={isArabic ? "تمارين مستبعدة" : "Excluded exercises"} value={user?.excludedExercises?.length ? String(user.excludedExercises.length) : "0"} onPress={() => router.push("/plan-settings/excluded-exercises")} />
            <Row label={isArabic ? "تدريب الكارديو" : "Cardio training"} value={getCardioValue()} last onPress={() => setCardioSheet(true)} />
          </View>
        </View>

        {/* Nutrition */}
        <View>
          {sectionTitle(isArabic ? "التغذية" : "Nutrition")}
          <View style={card}>
            <Row label={isArabic ? "أسلوب الأكل" : "Diet style"} value={getDietStyleValue()} onPress={() => setDietStyleSheet(true)} />
            <ToggleRow label={isArabic ? "تحضير الوجبات مسبقاً" : "Meal prep mode"} sub={isArabic ? "السماح بتكرار الوجبات على مدار الأيام" : "Allow repeating meals across days"} checked={!!user?.mealPrepMode} onChange={() => setUser({ ...user, mealPrepMode: !user?.mealPrepMode } as any)} />
            <Row label={isArabic ? "وجبات في اليوم" : "Meals per day"} value={`${user?.mealsPerDay}`} onPress={() => setMealsPerDaySheet(true)} />
            <Row label={isArabic ? "هدف الماء اليومي" : "Daily water target"} value={`${user?.dailyWaterTarget || 2000} ${isArabic ? "مل" : "ml"}`} last onPress={() => setWaterTargetSheet(true)} />
          </View>
        </View>

        {/* Workout Experience */}
        <View>
          {sectionTitle(isArabic ? "تجربة التمرين" : "Workout Experience")}
          <View style={card}>
            <Row label={isArabic ? "مدة الراحة" : "Rest durations"} value={`${user?.restDurationSets || 60}s / ${user?.restDurationExercises || 90}s`} onPress={() => { setTempRestDurationSets(user?.restDurationSets || 60); setTempRestDurationExercises(user?.restDurationExercises || 90); setRestDurationsSheet(true); }} />
            <ToggleRow label={isArabic ? "تايمر الراحة" : "Rest timer"} sub={isArabic ? "إظهار العد التنازلي بين السيتات" : "Show countdown between sets"} checked={user?.restTimerEnabled ?? true} onChange={() => setUser({ ...user, restTimerEnabled: !(user?.restTimerEnabled ?? true) } as any)} />
            <ToggleRow label={isArabic ? "نصايح الفورم" : "Form tips"} sub={isArabic ? "إظهار نصايح الفورم من الكوتش أثناء التمرين" : "Show coach form cues during workouts"} checked={user?.formTipsEnabled ?? true} onChange={() => setUser({ ...user, formTipsEnabled: !(user?.formTipsEnabled ?? true) } as any)} last />
          </View>
        </View>

        {/* Cycle Tracking (female) */}
        {user?.gender === "female" && (
          <View>
            {sectionTitle(isArabic ? "تتبع الدورة" : "Cycle Tracking")}
            <View style={card}>
              <ToggleRow label={isArabic ? "تتبع مراحل الدورة" : "Cycle phase tracking"} sub={isArabic ? "تكييف التمارين والتغذية مع دورتك" : "Adapt workouts and nutrition to your cycle"} checked={!!user?.cycleTrackingEnabled} onChange={() => setUser({ ...user, cycleTrackingEnabled: !user?.cycleTrackingEnabled } as any)} last />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ===== Sheets ===== */}
      <BottomSheet isOpen={goalSheet} onClose={() => setGoalSheet(false)} title={isArabic ? "اختر هدفك" : "Choose goal"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {goalOptions.map((opt) => optionButton(user?.goal === (opt.id as any), () => { setUser({ ...user, goal: opt.id } as any); setGoalSheet(false); showToast(isArabic ? "تم حفظ الهدف" : "Goal updated", "success"); }, isArabic ? opt.labelAr : opt.labelEn, undefined, opt.id))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={paceSheet} onClose={() => setPaceSheet(false)} title={isArabic ? "الجدول الزمني للهدف" : "Goal Timeline"}>
        <View style={{ gap: 24, paddingVertical: 8 }}>
          <GoalPacePicker currentWeight={user?.currentWeight || 0} targetWeight={user?.targetWeight || 0} selectedRate={user?.weeklyGoalRate || 0.5} onSelect={(rate) => setUser({ ...user!, weeklyGoalRate: rate })} isArabic={isArabic} />
          {saveBtn(() => setPaceSheet(false), isArabic ? "تم" : "Done")}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={targetWeightSheet} onClose={() => setTargetWeightSheet(false)} title={isArabic ? "الوزن المستهدف" : "Target weight"}>
        <View style={{ gap: 24, paddingVertical: 16, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
            {stepperBtn("-", () => setTempTargetWeight((p) => Math.max(30, p - 0.5)))}
            <AppText style={{ fontSize: 36, fontWeight: "600", width: 96, textAlign: "center", color: colors.ink }}>{tempTargetWeight}</AppText>
            {stepperBtn("+", () => setTempTargetWeight((p) => p + 0.5))}
          </View>
          <AppText style={{ fontSize: 12, color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 0.5 }}>{user?.weightUnit === "kg" ? (isArabic ? "كيلوجرام" : "KG") : isArabic ? "رطل" : "LBS"}</AppText>
          <View style={{ width: "100%" }}>{saveBtn(() => { setUser({ ...user, targetWeight: tempTargetWeight } as any); setTargetWeightSheet(false); saved(); })}</View>
        </View>
      </BottomSheet>

      <BottomSheet isOpen={fitnessLevelSheet} onClose={() => setFitnessLevelSheet(false)} title={isArabic ? "مستوى اللياقة" : "Fitness level"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {fitnessLevelOptions.map((opt) => optionButton(user?.fitnessLevel === (opt.id as any), () => { if (opt.id === user?.fitnessLevel) { setFitnessLevelSheet(false); return; } setPendingChange({ field: "fitnessLevel", newValue: opt.id, oldValue: user?.fitnessLevel, labelEn: "Fitness level", labelAr: "مستوى اللياقة", apply: () => { setUser({ ...user, fitnessLevel: opt.id } as any); rebalancing(); setFitnessLevelSheet(false); } }); }, isArabic ? opt.labelAr : opt.labelEn, undefined, opt.id))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={restrictionsSheet} onClose={() => setRestrictionsSheet(false)} title={isArabic ? "القيود الصحية" : "Health restrictions"}>
        <View style={{ gap: 24, paddingVertical: 8 }}>
          <AppText style={{ fontSize: 13, color: colors.inkMuted48, textAlign: "center", paddingHorizontal: 16, fontFamily: ff(isArabic) }}>{isArabic ? "حالات مزمنة فقط — الإصابات الحادة بيتعامل معاها الكوتش وقتها." : "Standing conditions only — acute injuries are handled by the coach in real time."}</AppText>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 12 }}>
            {restrictionsOptions.map((opt) => {
              const selected = tempInjuries.includes(opt.id);
              return (
                <Pressable key={opt.id} onPress={() => setTempInjuries((prev) => (selected ? prev.filter((i) => i !== opt.id) : [...prev, opt.id]))} style={{ height: 44, paddingHorizontal: 20, borderRadius: 9999, alignItems: "center", justifyContent: "center", borderWidth: 1, backgroundColor: selected ? colors.primary : colors.canvasParchment, borderColor: selected ? colors.primary : colors.hairline }}>
                  <AppText style={{ fontSize: 14, fontWeight: "500", color: selected ? "#fff" : colors.ink, fontFamily: ff(isArabic, 500) }}>{isArabic ? opt.labelAr : opt.labelEn}</AppText>
                </Pressable>
              );
            })}
          </View>
          {saveBtn(() => { setUser({ ...user, injuries: tempInjuries } as any); setRestrictionsSheet(false); saved(); })}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={daysPerWeekSheet} onClose={() => setDaysPerWeekSheet(false)} title={isArabic ? "أيام التمرين أسبوعياً" : "Days per week"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {[2, 3, 4, 5, 6, 7].map((days) => optionButton(user?.daysPerWeek === days, () => { if (days === user?.daysPerWeek) { setDaysPerWeekSheet(false); return; } setPendingChange({ field: "daysPerWeek", newValue: days, oldValue: user?.daysPerWeek, labelEn: "Training days per week", labelAr: "أيام التمرين في الأسبوع", apply: () => { setUser({ ...user, daysPerWeek: days } as any); rebalancing(); setDaysPerWeekSheet(false); } }); }, isArabic ? `${days} أيام` : `${days} days`, undefined, String(days)))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={preferredTimeSheet} onClose={() => setPreferredTimeSheet(false)} title={isArabic ? "الوقت المفضل" : "Preferred time"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {preferredTimeOptions.map((opt) => optionButton(user?.preferredTime === (opt.id as any), () => { setUser({ ...user, preferredTime: opt.id } as any); setPreferredTimeSheet(false); saved(); }, isArabic ? opt.labelAr : opt.labelEn, undefined, opt.id))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={workoutDurationSheet} onClose={() => setWorkoutDurationSheet(false)} title={isArabic ? "مدة التمرين" : "Workout duration"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {[30, 45, 60, 75, 90].map((mins) => optionButton(user?.workoutDuration === mins, () => { if (mins === user?.workoutDuration) { setWorkoutDurationSheet(false); return; } setPendingChange({ field: "workoutDuration", newValue: mins, oldValue: user?.workoutDuration, labelEn: "Workout duration", labelAr: "مدة التمرين", apply: () => { setUser({ ...user, workoutDuration: mins } as any); rebalancing(); setWorkoutDurationSheet(false); } }); }, isArabic ? `${mins} دقيقة` : `${mins} min`, undefined, String(mins)))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={trainingLocationSheet} onClose={() => setTrainingLocationSheet(false)} title={isArabic ? "مكان التمرين" : "Training location"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {trainingLocationOptions.map((opt) => optionButton(user?.trainingLocation === (opt.id as any), () => { if (opt.id === user?.trainingLocation) { setTrainingLocationSheet(false); return; } setPendingChange({ field: "trainingLocation", newValue: opt.id, oldValue: user?.trainingLocation, labelEn: "Training location", labelAr: "مكان التمرين", apply: () => { setUser({ ...user, trainingLocation: opt.id } as any); rebalancing(); setTrainingLocationSheet(false); } }); }, isArabic ? opt.labelAr : opt.labelEn, undefined, opt.id))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={workoutSplitSheet} onClose={() => setWorkoutSplitSheet(false)} title={isArabic ? "تقسيمة التمرين" : "Workout split"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {workoutSplitOptions.map((opt) => optionButton(user?.workoutSplit === (opt.id as any), () => { if (opt.id === user?.workoutSplit) { setWorkoutSplitSheet(false); return; } setPendingChange({ field: "workoutSplit", newValue: opt.id, oldValue: user?.workoutSplit, labelEn: "Workout split", labelAr: "تقسيمة التمرين", apply: () => { setUser({ ...user, workoutSplit: opt.id } as any); rebalancing(); setWorkoutSplitSheet(false); } }); }, isArabic ? opt.labelAr : opt.labelEn, isArabic ? opt.descAr : opt.descEn, opt.id))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={equipmentSheet} onClose={() => setEquipmentSheet(false)} title={isArabic ? "المعدات" : "Equipment"}>
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <AppText style={{ textAlign: "center", color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "اختار المعدات المتاحة ليك في شاشة تانية" : "Select available equipment. Stub for editor"}</AppText>
          <View style={{ width: "100%" }}>{saveBtn(() => setEquipmentSheet(false), isArabic ? "حسناً" : "Done")}</View>
        </View>
      </BottomSheet>

      <BottomSheet isOpen={cardioSheet} onClose={() => setCardioSheet(false)} title={isArabic ? "تدريب الكارديو" : "Cardio training"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {cardioOptions.map((opt) => {
            const selected = (!user?.cardioEnabled && !opt.enabled) || (!!user?.cardioEnabled && user?.cardioIntensity === opt.intensity && opt.enabled);
            return optionButton(selected, () => { setUser({ ...user, cardioEnabled: opt.enabled, cardioIntensity: (opt.intensity || "light") } as any); setCardioSheet(false); saved(); }, isArabic ? opt.labelAr : opt.labelEn, undefined, opt.id);
          })}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={dietStyleSheet} onClose={() => setDietStyleSheet(false)} title={isArabic ? "أسلوب الأكل" : "Diet style"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {dietStyleOptions.map((opt) => optionButton(user?.dietStyle === (opt.id as any), () => { if (opt.id === user?.dietStyle) { setDietStyleSheet(false); return; } setDietStyleSheet(false); setTimeout(() => setPendingChange({ field: "dietStyle", newValue: isArabic ? opt.labelAr : opt.labelEn, oldValue: getDietStyleValue(), labelEn: "Diet style", labelAr: "أسلوب الأكل", kind: "nutrition", apply: () => rebuildNutrition({ dietStyle: opt.id }, `Switched diet style to ${opt.labelEn}.`, `تم تغيير أسلوب الأكل إلى ${opt.labelAr}.`) }), 280); }, isArabic ? opt.labelAr : opt.labelEn, undefined, opt.id))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={mealsPerDaySheet} onClose={() => setMealsPerDaySheet(false)} title={isArabic ? "وجبات في اليوم" : "Meals per day"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {[3, 4, 5, 6].map((meals) => optionButton(user?.mealsPerDay === meals, () => { if (meals === user?.mealsPerDay) { setMealsPerDaySheet(false); return; } setMealsPerDaySheet(false); setTimeout(() => setPendingChange({ field: "mealsPerDay", newValue: String(meals), oldValue: String(user?.mealsPerDay ?? ""), labelEn: "Meals per day", labelAr: "وجبات في اليوم", kind: "nutrition", apply: () => rebuildNutrition({ mealsPerDay: meals }, `Set meals per day to ${meals}.`, `تم ضبط عدد الوجبات إلى ${meals}.`) }), 280); }, String(meals), undefined, String(meals)))}
        </View>
      </BottomSheet>

      <BottomSheet isOpen={waterTargetSheet} onClose={() => setWaterTargetSheet(false)} title={isArabic ? "هدف الماء اليومي" : "Daily water target"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {[1500, 2000, 2500, 3000, 3500].map((amount) => optionButton(user?.dailyWaterTarget === amount, () => { setUser({ ...user, dailyWaterTarget: amount } as any); setWaterTargetSheet(false); saved(); }, isArabic ? `${amount} مل` : `${amount} ml`, undefined, String(amount)))}
          <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.hairline, marginTop: 8 }}>
            <TextInput value={customWater} onChangeText={setCustomWater} keyboardType="number-pad" placeholder={isArabic ? "كمية مخصصة (مل)" : "Custom (ml)"} placeholderTextColor={colors.inkMuted48} style={{ height: 52, backgroundColor: colors.canvas, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.hairline, fontSize: 15, color: colors.ink, textAlign: isArabic ? "right" : "left" }} />
            <Pressable disabled={!customWater} onPress={() => { if (customWater && !isNaN(parseInt(customWater))) { setUser({ ...user, dailyWaterTarget: parseInt(customWater) } as any); setWaterTargetSheet(false); saved(); setCustomWater(""); } }} style={{ height: 52, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 16, opacity: customWater ? 1 : 0.5 }}>
              <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ" : "Save"}</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet isOpen={restDurationsSheet} onClose={() => setRestDurationsSheet(false)} title={isArabic ? "مدة الراحة" : "Rest durations"}>
        <View style={{ gap: 32, paddingVertical: 16 }}>
          <View style={{ alignItems: "center" }}>
            <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.inkMuted48, marginBottom: 16, fontFamily: ff(isArabic, 500) }}>{isArabic ? "بين السيتات" : "Between sets"}</AppText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
              {stepperBtn("-", () => setTempRestDurationSets((p) => Math.max(30, p - 15)))}
              <AppText style={{ fontSize: 30, fontWeight: "600", width: 80, textAlign: "center", color: colors.ink }}>{tempRestDurationSets}s</AppText>
              {stepperBtn("+", () => setTempRestDurationSets((p) => Math.min(180, p + 15)))}
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: colors.hairline }} />
          <View style={{ alignItems: "center" }}>
            <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.inkMuted48, marginBottom: 16, fontFamily: ff(isArabic, 500) }}>{isArabic ? "بين التمارين" : "Between exercises"}</AppText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
              {stepperBtn("-", () => setTempRestDurationExercises((p) => Math.max(60, p - 15)))}
              <AppText style={{ fontSize: 30, fontWeight: "600", width: 80, textAlign: "center", color: colors.ink }}>{tempRestDurationExercises}s</AppText>
              {stepperBtn("+", () => setTempRestDurationExercises((p) => Math.min(240, p + 15)))}
            </View>
          </View>
          {saveBtn(() => { setUser({ ...user, restDurationSets: tempRestDurationSets, restDurationExercises: tempRestDurationExercises } as any); setRestDurationsSheet(false); saved(); })}
        </View>
      </BottomSheet>

      {/* Pending change confirmation */}
      <BottomSheet isOpen={!!pendingChange} onClose={() => setPendingChange(null)} title={isArabic ? "تأكيد التغيير" : "Confirm change"}>
        {pendingChange && (
          <View style={{ gap: 16, paddingVertical: 8 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,149,0,0.15)", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={20} color={colors.semanticOrange} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, marginBottom: 4, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? pendingChange.labelAr : pendingChange.labelEn}</AppText>
                <AppText style={{ fontSize: 13, color: colors.inkMuted48, lineHeight: 19, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{pendingChange.kind === "nutrition" ? (isArabic ? "لو غيرت ده، الكوتش هيعيد بناء أهداف التغذية وخطة الوجبات. الوجبات اللي سجلتها مش هتتأثر." : "Changing this will rebuild your nutrition targets and meal plan. Your logged meals won't be affected.") : isArabic ? "لو غيرت ده، الكوتش هيعيد بناء باقي الأسبوع بناءً على الإعدادات الجديدة. التمارين اللي خلصتها مش هتتغير." : "Changing this will rebuild the rest of your week based on the new settings. Your completed workouts won't be affected."}</AppText>
              </View>
            </View>
            <View style={{ backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 12 }}>
              <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, marginBottom: 4, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? "التغيير" : "Change"}</AppText>
              <AppText style={{ fontSize: 13, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{String(pendingChange.oldValue)} → <AppText style={{ fontWeight: "700" }}>{String(pendingChange.newValue)}</AppText></AppText>
            </View>
            <View style={{ gap: 12, paddingTop: 8 }}>
              <Pressable onPress={() => { const apply = pendingChange.apply; setPendingChange(null); apply(); }} style={{ height: 44, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", fontFamily: ff(isArabic, 600) }}>{isArabic ? "كمّل وغيّر" : "Continue & rebuild"}</AppText>
              </Pressable>
              <Pressable onPress={() => setPendingChange(null)} style={{ height: 44, borderRadius: 9999, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ color: colors.ink, fontSize: 15, fontWeight: "600", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
              </Pressable>
            </View>
          </View>
        )}
      </BottomSheet>
    </View>
  );
}
