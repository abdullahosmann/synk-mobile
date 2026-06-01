/**
 * NutritionPlanDetails — the nutrition-plan equivalent of app/plan-details.tsx.
 *
 * Read-only overview of the active coach nutrition plan: coach summary, a 2×2
 * metadata grid (daily target / diet style / meals per day / protein), the macro
 * split, the meal structure with its suggested meals, an "Edit targets" sheet
 * (structured editor — calories + macro grams + diet style + meals/day), an
 * "Edit Plan Settings" CTA → /settings/plan, and a plan-history list fed by
 * synk:nutritionPlanHistory. Mirrors the Workout Plan lifecycle.
 *
 * The "Edit targets" save writes the values directly here (F1). F3 layers the
 * generator-driven recompute + rebuild-confirmation onto the same surfaces.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Drumstick,
  Flame,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Utensils,
} from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useToast } from "../src/components/ToastProvider";
import { useColors } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";
import BottomSheet from "../src/components/BottomSheet";
import CoachAvatar from "../src/components/CoachAvatar";
import EmptyState from "../src/components/EmptyState";
import { pushNutritionHistory, readNutritionHistory, computeMacros, estimateMaintenance } from "../src/lib/nutritionPlan";
import type { CoachNutritionPlan, SuggestedMeal } from "../src/types";

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

type NutritionPlanHistoryEntry = { id: string; date: string; summary: string; summaryAr?: string };

const DIET_STYLES: { id: string; en: string; ar: string }[] = [
  { id: "balanced", en: "Balanced", ar: "متوازن" },
  { id: "high-protein", en: "High Protein", ar: "عالي البروتين" },
  { id: "keto", en: "Keto", ar: "كيتو" },
  { id: "mediterranean", en: "Mediterranean", ar: "متوسطي" },
  { id: "vegetarian", en: "Vegetarian", ar: "نباتي" },
  { id: "vegan", en: "Vegan", ar: "نباتي صرف" },
];

const mealStructureFor = (mealsPerDay: number): string[] => {
  if (mealsPerDay === 3) return ["Breakfast", "Lunch", "Dinner"];
  if (mealsPerDay >= 5) return ["Breakfast", "Lunch", "Dinner", "Pre-workout Snack", "Evening Snack"];
  return ["Breakfast", "Lunch", "Dinner", "Snack"];
};

const mealLabelAr: Record<string, string> = {
  Breakfast: "الإفطار",
  Lunch: "الغداء",
  Dinner: "العشاء",
  Snack: "وجبة خفيفة",
  "Pre-workout Snack": "وجبة قبل التمرين",
  "Evening Snack": "وجبة مسائية",
};

const dietStyleLabel = (id: string | undefined, isArabic: boolean): string => {
  const d = DIET_STYLES.find((x) => x.id === id);
  if (!d) return isArabic ? "متوازن" : "Balanced";
  return isArabic ? d.ar : d.en;
};

export default function NutritionPlanDetails() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const plan = user.nutritionPlan as CoachNutritionPlan | undefined;

  const [editOpen, setEditOpen] = useState(false);
  const [calInput, setCalInput] = useState("");
  const [dietInput, setDietInput] = useState<string>(user.dietStyle || "balanced");
  const [mealsInput, setMealsInput] = useState<number>(user.mealsPerDay || 4);

  const history: NutritionPlanHistoryEntry[] = readNutritionHistory();

  // N1 — macros are derived from the calorie target + diet style (auto-balanced),
  // so the editor can never save a calorie/macro combo that contradicts itself.
  const editorMacros = computeMacros(user.currentWeight, dietInput, Math.max(0, Math.round(Number(calInput) || 0)));

  const openEditor = () => {
    setCalInput(String(user.calorieTarget || plan?.dailyCalories || 0));
    setDietInput(user.dietStyle || "balanced");
    setMealsInput(user.mealsPerDay || 4);
    setEditOpen(true);
  };

  const saveTargets = () => {
    const cal = Math.max(0, Math.round(Number(calInput) || 0));
    const m = computeMacros(user.currentWeight, dietInput, cal);
    const ms = mealStructureFor(mealsInput);
    setUser({
      ...user,
      dietStyle: dietInput as any,
      mealsPerDay: mealsInput,
      calorieTarget: cal,
      proteinTarget: m.protein,
      carbsTarget: m.carbs,
      fatTarget: m.fats,
      nutritionPlan: plan
        ? { ...plan, dailyCalories: cal, proteinTarget: m.protein, carbsTarget: m.carbs, fatsTarget: m.fats, mealStructure: ms }
        : plan,
    } as any);
    pushNutritionHistory(`Targets edited manually — ${cal} kcal, ${m.protein}P/${m.carbs}C/${m.fats}F.`, `تعديل يدوي للأهداف — ${cal} سعرة، ${m.protein}ب/${m.carbs}ك/${m.fats}د.`);
    setEditOpen(false);

    // N2 — soft-warn (don't block) when the calorie target contradicts the goal.
    const maint = estimateMaintenance(user);
    const goalLose = user.goals?.includes("lose-body-fat") || user.goal === "lose-weight" || (user.goal as any) === "weight-loss";
    const goalGain = user.goals?.includes("gain-muscle") || user.goals?.includes("build-strength") || user.goal === "build-muscle" || (user.goal as any) === "weight-gain" || (user.goal as any) === "muscle-gain";
    if (goalLose && cal >= maint) {
      showToast(isArabic ? "تنبيه: هدفك خسارة وزن لكن السعرات أعلى من مستوى الثبات." : "Heads up: your goal is fat loss, but this is at/above maintenance.", "info");
    } else if (goalGain && cal <= maint) {
      showToast(isArabic ? "تنبيه: هدفك زيادة لكن السعرات أقل من مستوى الثبات." : "Heads up: your goal is muscle gain, but this is at/below maintenance.", "info");
    } else {
      showToast(isArabic ? "تم تحديث أهداف التغذية" : "Nutrition targets updated", "success");
    }
  };

  const sectionLabel = (text: string) => (
    <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, fontFamily: fontFamily(isArabic, 600) }}>
      {text}
    </AppText>
  );

  const header = (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: isArabic ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.canvasParchment,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
        zIndex: 50,
      }}
    >
      <Pressable
        onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"}
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}
      >
        <ArrowLeft size={20} strokeWidth={2.5} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
      </Pressable>
      <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
        {isArabic ? "خطة التغذية" : "Nutrition Plan"}
      </AppText>
      <View style={{ width: 40 }} />
    </View>
  );

  if (!plan) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
        {header}
        <View style={{ flex: 1, padding: 32, justifyContent: "center" }}>
          <EmptyState icon={<Flame />} title={isArabic ? "لا توجد خطة تغذية بعد." : "No nutrition plan yet."} />
        </View>
      </View>
    );
  }

  const metadata = [
    { icon: Flame, label: isArabic ? "السعرات اليومية" : "Daily target", value: `${(user.calorieTarget || plan.dailyCalories).toLocaleString()} ${isArabic ? "سعرة" : "kcal"}` },
    { icon: Utensils, label: isArabic ? "أسلوب الأكل" : "Diet style", value: dietStyleLabel(user.dietStyle, isArabic) },
    { icon: CalendarDays, label: isArabic ? "وجبات/يوم" : "Meals / day", value: String(user.mealsPerDay || 4) },
    { icon: Drumstick, label: isArabic ? "البروتين" : "Protein", value: `${user.proteinTarget || plan.proteinTarget}g` },
  ];

  const macros = [
    { l: isArabic ? "بروتين" : "Prot", v: user.proteinTarget || plan.proteinTarget },
    { l: isArabic ? "كربوهيدرات" : "Carbs", v: user.carbsTarget || plan.carbsTarget },
    { l: isArabic ? "دهون" : "Fats", v: user.fatTarget || plan.fatsTarget },
  ];

  const inputPill = {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 14,
    backgroundColor: colors.canvasParchment,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
    textAlign: (isArabic ? "right" : "left") as "right" | "left",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {header}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 48, maxWidth: 448, width: "100%", alignSelf: "center" }}
      >
        {/* Coach summary */}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 16, marginBottom: 32, paddingHorizontal: 24 }}>
          <CoachAvatar coachId={user.coach || "khaled"} size={48} verified grayscale={0} />
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "خطة التغذية" : "NUTRITION PLAN"}
            </AppText>
            <AppText style={{ fontSize: 15, color: colors.ink, lineHeight: 21, marginTop: 4, opacity: 0.8, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
              {plan.coachExplanation}
            </AppText>
          </View>
        </View>

        {/* Metadata grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24, paddingHorizontal: 24 }}>
          {metadata.map((item, i) => {
            const Icon = item.icon;
            return (
              <View
                key={i}
                style={{ width: "47.8%", backgroundColor: colors.canvas, padding: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, alignItems: isArabic ? "flex-end" : "flex-start" }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={24} color={colors.primary} />
                </View>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, fontFamily: fontFamily(isArabic, 600) }}>
                  {item.label}
                </AppText>
                <AppText numberOfLines={1} style={{ fontSize: 20, fontWeight: "600", color: colors.ink, marginTop: 2, fontFamily: fontFamily(isArabic, 600) }}>
                  {item.value}
                </AppText>
              </View>
            );
          })}
        </View>

        {/* Macro split */}
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
            {macros.map((m, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: colors.canvas, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, alignItems: "center" }}>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, fontFamily: fontFamily(isArabic, 600) }}>{m.l}</AppText>
                <AppText style={{ fontSize: 18, fontWeight: "600", color: colors.ink, marginTop: 4 }}>{m.v}g</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* CTAs */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40, gap: 12 }}>
          <Pressable
            onPress={openEditor}
            style={{ height: 44, backgroundColor: colors.primary, borderRadius: 9999, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <SlidersHorizontal size={18} color={colors.onPrimary} />
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "تعديل الأهداف" : "Edit targets"}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => router.push("/settings/plan")}
            style={{ height: 44, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, borderRadius: 9999, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Settings size={18} color={colors.primary} />
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "تعديل إعدادات الخطة" : "Edit Plan Settings"}
            </AppText>
          </Pressable>
        </View>

        {/* Meal structure */}
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <View style={{ marginBottom: 16, alignItems: isArabic ? "flex-end" : "flex-start" }}>{sectionLabel(isArabic ? "هيكل الوجبات" : "MEAL STRUCTURE")}</View>
          <View style={{ gap: 12 }}>
            {(plan.mealStructure || []).map((slot, i) => {
              const meals = (plan.suggestedMeals?.[slot] || []) as SuggestedMeal[];
              return (
                <View key={i} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16 }}>
                  <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
                    {isArabic ? mealLabelAr[slot] || slot : slot}
                  </AppText>
                  {meals.length === 0 ? (
                    <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 6, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                      {isArabic ? "لا توجد اقتراحات" : "No suggestions"}
                    </AppText>
                  ) : (
                    meals.map((m, mi) => (
                      <View key={mi} style={{ marginTop: 8, flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                          <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>{m.name}</AppText>
                          <AppText style={{ fontSize: 13, color: colors.inkMuted48, lineHeight: 18, marginTop: 2, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>{m.description}</AppText>
                        </View>
                        <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{Math.round(m.calories)} {isArabic ? "سعرة" : "kcal"}</AppText>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Plan history */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ marginBottom: 16, alignItems: isArabic ? "flex-end" : "flex-start" }}>{sectionLabel(isArabic ? "سجل الخطة" : "PLAN HISTORY")}</View>
          <View style={{ gap: 12 }}>
            {history.length > 0 ? (
              history.map((entry) => (
                <View
                  key={entry.id}
                  style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}
                >
                  <View style={{ minWidth: 50, paddingVertical: 4, backgroundColor: colors.canvasParchment, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: fontFamily(isArabic, 600) }}>
                      {entry.date.split(" ")[0]}
                    </AppText>
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: fontFamily(isArabic, 600) }}>
                      {entry.date.split(" ")[1] || ""}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, gap: 4, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                      <CoachAvatar coachId={user.coach || "khaled"} size={24} grayscale={0} />
                      <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, fontFamily: fontFamily(isArabic, 600) }}>
                        {isArabic ? "تعديل الخطة" : "PLAN REBUILD"}
                      </AppText>
                    </View>
                    <AppText numberOfLines={2} style={{ fontSize: 13, color: colors.ink, lineHeight: 18, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                      {isArabic ? entry.summaryAr || entry.summary : entry.summary}
                    </AppText>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 32 }}>
                <EmptyState icon={<Sparkles />} title={isArabic ? "لا توجد تعديلات بعد — ستتطور خطتك مع تقدمك." : "No changes yet — your plan will evolve as you adjust it."} />
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit targets sheet */}
      <BottomSheet isOpen={editOpen} onClose={() => setEditOpen(false)} title={isArabic ? "تعديل الأهداف" : "Edit targets"}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <View>
            {sectionLabel(isArabic ? "السعرات اليومية" : "DAILY CALORIES")}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", marginTop: 8 }}>
              <TextInput value={calInput} onChangeText={setCalInput} keyboardType="numeric" placeholder="kcal" placeholderTextColor={colors.inkMuted48} style={inputPill} />
            </View>
          </View>

          <View>
            {sectionLabel(isArabic ? "الماكروز (محسوبة تلقائياً)" : "MACROS (AUTO-BALANCED)")}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8, marginTop: 8 }}>
              {[
                { l: isArabic ? "بروتين" : "Prot", v: editorMacros.protein },
                { l: isArabic ? "كارب" : "Carbs", v: editorMacros.carbs },
                { l: isArabic ? "دهون" : "Fats", v: editorMacros.fats },
              ].map((m, i) => (
                <View key={i} style={{ flex: 1, height: 48, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, backgroundColor: colors.canvas, alignItems: "center", justifyContent: "center" }}>
                  <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.ink }}>{m.v}g</AppText>
                  <AppText style={{ fontSize: 10, color: colors.inkMuted48, fontFamily: fontFamily(isArabic) }}>{m.l}</AppText>
                </View>
              ))}
            </View>
            <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 6, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
              {isArabic ? "تتحسب من سعراتك وأسلوب أكلك." : "Derived from your calories and diet style."}
            </AppText>
          </View>

          <View>
            {sectionLabel(isArabic ? "أسلوب الأكل" : "DIET STYLE")}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {DIET_STYLES.map((d) => {
                const sel = dietInput === d.id;
                return (
                  <Pressable key={d.id} onPress={() => setDietInput(d.id)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 9999, borderWidth: 1, borderColor: sel ? colors.primary : colors.hairline, backgroundColor: sel ? colors.primary : colors.canvas }}>
                    <AppText style={{ fontSize: 13, fontWeight: "600", color: sel ? colors.onPrimary : colors.ink, fontFamily: fontFamily(isArabic, 600) }}>{isArabic ? d.ar : d.en}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            {sectionLabel(isArabic ? "وجبات في اليوم" : "MEALS PER DAY")}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8, marginTop: 8 }}>
              {[3, 4, 5, 6].map((n) => {
                const sel = mealsInput === n;
                return (
                  <Pressable key={n} onPress={() => setMealsInput(n)} style={{ flex: 1, height: 44, borderRadius: 14, borderWidth: 1, borderColor: sel ? colors.primary : colors.hairline, backgroundColor: sel ? colors.primary : colors.canvas, alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 15, fontWeight: "600", color: sel ? colors.onPrimary : colors.ink }}>{n}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable onPress={saveTargets} style={{ height: 44, marginTop: 4, backgroundColor: colors.primary, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "حفظ الأهداف" : "Save targets"}
            </AppText>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
