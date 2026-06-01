/**
 * Nutrition-plan generator — shared so it can run both at onboarding
 * (app/onboarding/generating.tsx) and on demand when a plan input changes
 * (app/settings/plan.tsx, app/nutrition-plan.tsx), behind a rebuild
 * confirmation. Mirrors the workout side, where changing a "dangerous" plan
 * input rebuilds the rest of the week.
 *
 * Macros vary by dietStyle. The "balanced" (and undefined) case reproduces the
 * original onboarding formula exactly (protein 2.0 g/kg, fat 0.9 g/kg) so
 * existing onboarding output is unchanged; other styles shift the macro split.
 */
import { UserProfile, CoachNutritionPlan, SuggestedMeal } from "../types";
import { getItem, setItem } from "./storage";

// grams-per-kg of bodyweight for protein and fat, by diet style
const MACRO_PROFILE: Record<string, { protein: number; fat: number }> = {
  balanced: { protein: 2.0, fat: 0.9 },
  "high-protein": { protein: 2.4, fat: 0.8 },
  "low-carb": { protein: 2.2, fat: 1.1 },
  keto: { protein: 2.0, fat: 1.6 },
  mediterranean: { protein: 1.8, fat: 1.0 },
  vegetarian: { protein: 1.8, fat: 0.9 },
  vegan: { protein: 1.8, fat: 0.9 },
};

export function mealStructureFor(mealsPerDay: number): string[] {
  if (mealsPerDay === 3) return ["Breakfast", "Lunch", "Dinner"];
  if (mealsPerDay >= 5) return ["Breakfast", "Lunch", "Dinner", "Pre-workout Snack", "Evening Snack"];
  return ["Breakfast", "Lunch", "Dinner", "Snack"];
}

function suggestedMealsFor(ar: boolean): Record<string, SuggestedMeal[]> {
  return {
    Breakfast: [{ name: ar ? "شوفان وبروتين" : "Oats & Protein", description: ar ? "شوفان مع واي بروتين وتوت" : "Oatmeal with whey protein and berries.", calories: 400, protein: 30, carbs: 50, fat: 8 }],
    Lunch: [{ name: ar ? "دجاج ورز دايت" : "Chicken & Rice", description: ar ? "صدور فراخ مشوية مع رز بسمتي وبروكلي" : "Grilled chicken breast with basmati rice and broccoli.", calories: 550, protein: 45, carbs: 60, fat: 12 }],
    Dinner: [{ name: ar ? "سلمون وبطاطا" : "Salmon & Sweet Potato", description: ar ? "سلمون مشوي مع بطاطا حلوة وهليون" : "Baked salmon with roasted sweet potatoes and asparagus.", calories: 600, protein: 40, carbs: 45, fat: 25 }],
    Snack: [{ name: ar ? "زبادي يوناني ومكسرات" : "Greek Yogurt & Nuts", description: ar ? "زبادي يوناني سادة مع شوية لوز" : "Plain greek yogurt with a handful of almonds.", calories: 250, protein: 20, carbs: 10, fat: 15 }],
    "Pre-workout Snack": [{ name: ar ? "موز وزبدة فول سوداني" : "Banana & Peanut Butter", description: ar ? "موزة مع معلقة زبدة فول سوداني" : "One banana with 1 tbsp peanut butter.", calories: 200, protein: 5, carbs: 28, fat: 8 }],
    "Evening Snack": [{ name: ar ? "جبنة قريش" : "Cottage Cheese", description: ar ? "جبنة قريش قليلة الدسم" : "Low fat cottage cheese.", calories: 150, protein: 25, carbs: 5, fat: 3 }],
  };
}

export function generateNutritionPlan(user: UserProfile): CoachNutritionPlan {
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

  const ar = user.language === "ar";
  let coachExplanation = ar
    ? "تم إعداد هذه الخطة لتوفير توازن غذائي يدعم تمارينك."
    : "This plan provides balanced nutrition to support your workouts.";

  if (isLoseWeight) {
    targetCals -= 500;
    coachExplanation = ar
      ? `لأن هدفك الأساسي هو خسارة الدهون، عملنا عجز معتدل بـ 500 سعرة من مستوى ثباتك (${maintenance} سعرة). ده هيساعد على خسارة الدهون تدريجياً مع الحفاظ على البروتين كفاية عشان نحافظ على العضلات.`
      : `Since your core focus is losing body fat, we've set a moderate caloric deficit of 500 calories from your maintenance (${maintenance} kcal). This allows steady fat loss while keeping protein high enough to preserve muscle.`;
  } else if (isGainMuscle) {
    targetCals += 300;
    coachExplanation = ar
      ? `عشان ندعم بناء العضلات وزيادة القوة، ضفنا فائض بسيط في السعرات. هنركز على البروتين ونسبة نشويات كفاية تديك طاقة للتمرين.`
      : `To fuel muscle growth and strength gains, we've set a slight caloric surplus. We focus heavily on protein and enough carbs to keep your training energy high.`;
  } else {
    coachExplanation = ar
      ? `سعراتك هنامظبوطة على مستوى الثبات عشان نبني عادات صحية، ونحافظ على التزامك، وندي جسمك طاقة على قد يومك وتمرينك.`
      : `We've set your calories to maintenance to build healthy habits, stay consistent, and fuel your lifestyle around your workouts.`;
  }

  const profile = MACRO_PROFILE[user.dietStyle || "balanced"] || MACRO_PROFILE.balanced;
  const proteinTarget = Math.round(user.currentWeight * profile.protein);
  const fatsTarget = Math.round(user.currentWeight * profile.fat);
  const carbsCals = Math.max(0, targetCals - proteinTarget * 4 - fatsTarget * 9);
  const carbsTarget = Math.round(carbsCals / 4);

  const mealStructure = mealStructureFor(user.mealsPerDay);

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
    suggestedMeals: suggestedMealsFor(ar),
    dietaryNotes,
    coachExplanation,
  };
}

export interface NutritionPlanHistoryEntry {
  id: string;
  date: string; // "MMM D" style label
  summary: string;
  summaryAr?: string;
}

const HISTORY_KEY = "synk:nutritionPlanHistory";

export function readNutritionHistory(): NutritionPlanHistoryEntry[] {
  try {
    const raw = getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as NutritionPlanHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Prepend a rebuild entry to the plan history (most recent first, capped at 20). */
export function pushNutritionHistory(summary: string, summaryAr?: string) {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const entry: NutritionPlanHistoryEntry = { id: now.getTime().toString(), date, summary, summaryAr };
  const next = [entry, ...readNutritionHistory()].slice(0, 20);
  try {
    setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
}
