import { UserProfile, GoalV2 } from '../types';

function derivePrimaryGoal(goals: GoalV2[] | undefined): 'cut' | 'bulk' | 'maintain' {
  const g = goals ?? [];
  if (g.includes('lose-body-fat')) return 'cut';
  if (g.includes('gain-muscle') || g.includes('build-strength')) return 'bulk';
  return 'maintain';
}

export function computePlanPreview(user: UserProfile) {
  // Mifflin-St Jeor BMR
  const bmr = 10 * user.currentWeight + 6.25 * user.height - 5 * user.age + (user.gender === 'male' ? 5 : -161);
  // Activity multiplier
  const activityMul = user.activityLevel === 'sedentary' ? 1.2 : user.activityLevel === 'moderately-active' ? 1.55 : 1.725;
  const tdee = bmr * activityMul;
  
  const primary = derivePrimaryGoal(user.goals);

  // Goal adjustment
  const calorieTarget = Math.round(
    primary === 'cut' ? Math.max(1200, tdee - 500) :
    primary === 'bulk' ? Math.min(4500, tdee + 300) :
    tdee
  );
  // Macros
  const proteinPerKg = primary === 'bulk' ? 2.0 : 1.8;
  const protein = Math.round(user.currentWeight * proteinPerKg);
  const fat = Math.round((calorieTarget * 0.25) / 9);
  const carbs = Math.round((calorieTarget - (protein * 4) - (fat * 9)) / 4);
  // Split label by days/week
  const splitLabel = user.daysPerWeek === 3 ? 'Full Body' :
                     user.daysPerWeek === 4 ? 'Upper – Lower' :
                     user.daysPerWeek === 5 ? 'Push – Pull – Legs + Upper – Lower' :
                     user.daysPerWeek === 6 ? 'Push – Pull – Legs ×2' : 'Auto';
  
  const arSplitLabel = user.daysPerWeek === 3 ? 'جسم كامل' :
                       user.daysPerWeek === 4 ? 'علوي – سفلي' :
                       user.daysPerWeek === 5 ? 'دفع – سحب – أرجل + علوي – سفلي' :
                       user.daysPerWeek === 6 ? 'دفع – سحب – أرجل ×٢' : 'تلقائي';

  // Weekly delta
  const weeklyDelta = primary === 'cut' ? -0.5 : primary === 'bulk' ? 0.25 : 0;
  return { calorieTarget, protein, carbs, fat, splitLabel, arSplitLabel, weeklyDelta };
}

export function computeGoalEndDate(
  currentWeight: number,
  targetWeight: number,
  weeklyRate: number
): Date | null {
  const diff = Math.abs(currentWeight - targetWeight);
  if (diff < 0.1 || weeklyRate <= 0) return null;
  const weeks = Math.ceil(diff / weeklyRate);
  const clamped = Math.max(2, Math.min(weeks, 104));
  const end = new Date();
  end.setDate(end.getDate() + clamped * 7);
  return end;
}
