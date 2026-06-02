/**
 * Workout selection helper.
 *
 * Returns a mock workout based on user's split and the day of week.
 * This is placeholder data until backend wires real plans.
 *
 * Splits supported:
 * - 'push-pull-legs' (PPL) — 3 or 6 days
 * - 'upper-lower' — 4 days
 * - 'bro-split' — 5 days (Chest / Back / Shoulders / Arms / Legs)
 * - 'full-body' — 3 days
 * - 'arnold' — 6 days
 *
 * Returns a workout with: name, category, image, exercises (5-7).
 */

export interface MockWorkoutExercise {
  id: string;
  name: string;
  arabicName: string;
  sets: number;
  reps: number;
  weight: number;
  muscleGroup: string;
  equipment: string;
}

export interface MockWorkout {
  id: string;
  name: string;
  arabicName: string;
  category: string;        // 'CHEST & SHOULDERS', 'BACK & BICEPS', etc.
  arabicCategory: string;
  image: string;           // CDN URL
  estimatedMinutes: number;
  dayLabel: string;        // 'DAY 3 OF 4'
  arabicDayLabel: string;
  isRestDay: boolean;
  exercises: MockWorkoutExercise[];
}

// ─── Workout library — each entry is a self-contained mock workout ───

const WORKOUTS = {
  push: {
    name: 'Push Day',
    arabicName: 'يوم الدفع',
    category: 'CHEST & SHOULDERS',
    arabicCategory: 'صدر وأكتاف',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    estimatedMinutes: 55,
    exercises: [
      { id: 'bench-press', name: 'Barbell Bench Press', arabicName: 'بنش بريس باربل', sets: 4, reps: 8, weight: 60, muscleGroup: 'chest', equipment: 'barbell' },
      { id: 'incline-db', name: 'Incline DB Press', arabicName: 'دامبل مائل', sets: 3, reps: 10, weight: 22.5, muscleGroup: 'chest', equipment: 'dumbbell' },
      { id: 'ohp', name: 'Overhead Press', arabicName: 'بريس فوق الرأس', sets: 3, reps: 8, weight: 40, muscleGroup: 'shoulders', equipment: 'barbell' },
      { id: 'lateral-raises', name: 'Lateral Raises', arabicName: 'رفرفة جانبية', sets: 3, reps: 12, weight: 8, muscleGroup: 'shoulders', equipment: 'dumbbell' },
      { id: 'tricep-pushdown', name: 'Tricep Pushdown', arabicName: 'بوش داون ترايسيبس', sets: 3, reps: 12, weight: 25, muscleGroup: 'triceps', equipment: 'cable' },
      { id: 'overhead-tri', name: 'Overhead Tricep Ext.', arabicName: 'تمديد ترايسبس فوق', sets: 3, reps: 10, weight: 15, muscleGroup: 'triceps', equipment: 'dumbbell' },
    ],
  },
  pull: {
    name: 'Pull Day',
    arabicName: 'يوم السحب',
    category: 'BACK & BICEPS',
    arabicCategory: 'ظهر وبايسبس',
    image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800',
    estimatedMinutes: 55,
    exercises: [
      { id: 'pullup', name: 'Pull-ups', arabicName: 'عقلة', sets: 4, reps: 8, weight: 0, muscleGroup: 'back', equipment: 'bodyweight' },
      { id: 'barbell-row', name: 'Barbell Row', arabicName: 'تجديف باربل', sets: 4, reps: 10, weight: 60, muscleGroup: 'back', equipment: 'barbell' },
      { id: 'lat-pulldown', name: 'Lat Pulldown', arabicName: 'سحب لات', sets: 3, reps: 12, weight: 50, muscleGroup: 'back', equipment: 'cable' },
      { id: 'face-pulls', name: 'Face Pulls', arabicName: 'فيس بول', sets: 3, reps: 15, weight: 20, muscleGroup: 'rear-delts', equipment: 'cable' },
      { id: 'barbell-curl', name: 'Barbell Curl', arabicName: 'تمرين بايسبس باربل', sets: 3, reps: 10, weight: 25, muscleGroup: 'biceps', equipment: 'barbell' },
      { id: 'hammer-curl', name: 'Hammer Curl', arabicName: 'هامر كيرل', sets: 3, reps: 12, weight: 12, muscleGroup: 'biceps', equipment: 'dumbbell' },
    ],
  },
  legs: {
    name: 'Leg Day',
    arabicName: 'يوم الأرجل',
    category: 'LEGS',
    arabicCategory: 'أرجل',
    image: 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800',
    estimatedMinutes: 60,
    exercises: [
      { id: 'squat', name: 'Back Squat', arabicName: 'سكوات', sets: 4, reps: 6, weight: 80, muscleGroup: 'quads', equipment: 'barbell' },
      { id: 'rdl', name: 'Romanian Deadlift', arabicName: 'ديدليفت روماني', sets: 4, reps: 8, weight: 70, muscleGroup: 'hamstrings', equipment: 'barbell' },
      { id: 'leg-press', name: 'Leg Press', arabicName: 'ليج بريس', sets: 3, reps: 12, weight: 120, muscleGroup: 'quads', equipment: 'machine' },
      { id: 'leg-curl', name: 'Leg Curl', arabicName: 'ليج كيرل', sets: 3, reps: 12, weight: 35, muscleGroup: 'hamstrings', equipment: 'machine' },
      { id: 'calf-raise', name: 'Standing Calf Raise', arabicName: 'رفع سمانة', sets: 4, reps: 15, weight: 60, muscleGroup: 'calves', equipment: 'machine' },
    ],
  },
  upper: {
    name: 'Upper Body',
    arabicName: 'الجزء العلوي',
    category: 'CHEST · BACK · ARMS',
    arabicCategory: 'صدر · ظهر · ذراعين',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
    estimatedMinutes: 55,
    exercises: [
      { id: 'bench-press', name: 'Barbell Bench Press', arabicName: 'بنش بريس باربل', sets: 4, reps: 8, weight: 60, muscleGroup: 'chest', equipment: 'barbell' },
      { id: 'barbell-row', name: 'Barbell Row', arabicName: 'تجديف باربل', sets: 4, reps: 10, weight: 60, muscleGroup: 'back', equipment: 'barbell' },
      { id: 'ohp', name: 'Overhead Press', arabicName: 'بريس فوق الرأس', sets: 3, reps: 8, weight: 40, muscleGroup: 'shoulders', equipment: 'barbell' },
      { id: 'pullup', name: 'Pull-ups', arabicName: 'عقلة', sets: 3, reps: 8, weight: 0, muscleGroup: 'back', equipment: 'bodyweight' },
      { id: 'barbell-curl', name: 'Barbell Curl', arabicName: 'تمرين بايسبس باربل', sets: 3, reps: 10, weight: 25, muscleGroup: 'biceps', equipment: 'barbell' },
      { id: 'tricep-pushdown', name: 'Tricep Pushdown', arabicName: 'بوش داون ترايسيبس', sets: 3, reps: 12, weight: 25, muscleGroup: 'triceps', equipment: 'cable' },
    ],
  },
  lower: {
    name: 'Lower Body',
    arabicName: 'الجزء السفلي',
    category: 'LEGS & GLUTES',
    arabicCategory: 'أرجل ومؤخرة',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800',
    estimatedMinutes: 55,
    exercises: [
      { id: 'squat', name: 'Back Squat', arabicName: 'سكوات', sets: 4, reps: 6, weight: 80, muscleGroup: 'quads', equipment: 'barbell' },
      { id: 'rdl', name: 'Romanian Deadlift', arabicName: 'ديدليفت روماني', sets: 4, reps: 8, weight: 70, muscleGroup: 'hamstrings', equipment: 'barbell' },
      { id: 'lunge', name: 'Walking Lunges', arabicName: 'لانجز', sets: 3, reps: 12, weight: 16, muscleGroup: 'quads', equipment: 'dumbbell' },
      { id: 'hip-thrust', name: 'Hip Thrust', arabicName: 'هيب ثرست', sets: 3, reps: 10, weight: 50, muscleGroup: 'glutes', equipment: 'barbell' },
      { id: 'calf-raise', name: 'Standing Calf Raise', arabicName: 'رفع سمانة', sets: 4, reps: 15, weight: 60, muscleGroup: 'calves', equipment: 'machine' },
    ],
  },
  fullbody: {
    name: 'Full Body',
    arabicName: 'الجسم كامل',
    category: 'FULL BODY',
    arabicCategory: 'الجسم كامل',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    estimatedMinutes: 50,
    exercises: [
      { id: 'squat', name: 'Back Squat', arabicName: 'سكوات', sets: 3, reps: 8, weight: 70, muscleGroup: 'quads', equipment: 'barbell' },
      { id: 'bench-press', name: 'Bench Press', arabicName: 'بنش بريس', sets: 3, reps: 8, weight: 60, muscleGroup: 'chest', equipment: 'barbell' },
      { id: 'barbell-row', name: 'Barbell Row', arabicName: 'تجديف باربل', sets: 3, reps: 10, weight: 55, muscleGroup: 'back', equipment: 'barbell' },
      { id: 'ohp', name: 'Overhead Press', arabicName: 'بريس فوق الرأس', sets: 3, reps: 8, weight: 35, muscleGroup: 'shoulders', equipment: 'barbell' },
      { id: 'plank', name: 'Plank', arabicName: 'بلانك', sets: 3, reps: 45, weight: 0, muscleGroup: 'core', equipment: 'bodyweight' },
    ],
  },
  chest: {
    name: 'Chest Day',
    arabicName: 'يوم الصدر',
    category: 'CHEST',
    arabicCategory: 'صدر',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    estimatedMinutes: 50,
    exercises: [
      { id: 'bench-press', name: 'Barbell Bench Press', arabicName: 'بنش بريس باربل', sets: 5, reps: 5, weight: 65, muscleGroup: 'chest', equipment: 'barbell' },
      { id: 'incline-db', name: 'Incline DB Press', arabicName: 'دامبل مائل', sets: 4, reps: 10, weight: 22.5, muscleGroup: 'chest', equipment: 'dumbbell' },
      { id: 'chest-fly', name: 'Cable Chest Fly', arabicName: 'فلاي كيبل', sets: 3, reps: 12, weight: 12, muscleGroup: 'chest', equipment: 'cable' },
      { id: 'dips', name: 'Chest Dips', arabicName: 'ديبس صدر', sets: 3, reps: 10, weight: 0, muscleGroup: 'chest', equipment: 'bodyweight' },
    ],
  },
  back: {
    name: 'Back Day',
    arabicName: 'يوم الظهر',
    category: 'BACK',
    arabicCategory: 'ظهر',
    image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800',
    estimatedMinutes: 50,
    exercises: [
      { id: 'deadlift', name: 'Conventional Deadlift', arabicName: 'ديدليفت', sets: 4, reps: 5, weight: 100, muscleGroup: 'back', equipment: 'barbell' },
      { id: 'pullup', name: 'Pull-ups', arabicName: 'عقلة', sets: 4, reps: 8, weight: 0, muscleGroup: 'back', equipment: 'bodyweight' },
      { id: 'barbell-row', name: 'Barbell Row', arabicName: 'تجديف باربل', sets: 4, reps: 10, weight: 60, muscleGroup: 'back', equipment: 'barbell' },
      { id: 'lat-pulldown', name: 'Lat Pulldown', arabicName: 'سحب لات', sets: 3, reps: 12, weight: 50, muscleGroup: 'back', equipment: 'cable' },
    ],
  },
  shoulders: {
    name: 'Shoulder Day',
    arabicName: 'يوم الأكتاف',
    category: 'SHOULDERS',
    arabicCategory: 'أكتاف',
    image: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800',
    estimatedMinutes: 45,
    exercises: [
      { id: 'ohp', name: 'Overhead Press', arabicName: 'بريس فوق الرأس', sets: 5, reps: 5, weight: 40, muscleGroup: 'shoulders', equipment: 'barbell' },
      { id: 'lateral-raises', name: 'Lateral Raises', arabicName: 'رفرفة جانبية', sets: 4, reps: 12, weight: 8, muscleGroup: 'shoulders', equipment: 'dumbbell' },
      { id: 'face-pulls', name: 'Face Pulls', arabicName: 'فيس بول', sets: 3, reps: 15, weight: 20, muscleGroup: 'rear-delts', equipment: 'cable' },
      { id: 'shrugs', name: 'Barbell Shrugs', arabicName: 'شراجز', sets: 3, reps: 12, weight: 70, muscleGroup: 'traps', equipment: 'barbell' },
    ],
  },
  arms: {
    name: 'Arm Day',
    arabicName: 'يوم الذراعين',
    category: 'ARMS',
    arabicCategory: 'ذراعين',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800',
    estimatedMinutes: 45,
    exercises: [
      { id: 'barbell-curl', name: 'Barbell Curl', arabicName: 'تمرين بايسبس باربل', sets: 4, reps: 10, weight: 25, muscleGroup: 'biceps', equipment: 'barbell' },
      { id: 'hammer-curl', name: 'Hammer Curl', arabicName: 'هامر كيرل', sets: 3, reps: 12, weight: 12, muscleGroup: 'biceps', equipment: 'dumbbell' },
      { id: 'tricep-pushdown', name: 'Tricep Pushdown', arabicName: 'بوش داون ترايسيبس', sets: 4, reps: 12, weight: 25, muscleGroup: 'triceps', equipment: 'cable' },
      { id: 'overhead-tri', name: 'Overhead Tricep Ext.', arabicName: 'تمديد ترايسبس فوق', sets: 3, reps: 10, weight: 15, muscleGroup: 'triceps', equipment: 'dumbbell' },
      { id: 'concentration', name: 'Concentration Curl', arabicName: 'كيرل تركيز', sets: 3, reps: 12, weight: 10, muscleGroup: 'biceps', equipment: 'dumbbell' },
    ],
  },
};

// ─── Split → day pattern ───
// Each entry is the workout type to do on day index 0..N-1 of the user's training week.
// Rest days are represented as null.

const SPLIT_PATTERNS: Record<string, (keyof typeof WORKOUTS | null)[]> = {
  'push-pull-legs-3': ['push', 'pull', 'legs', null, null, null, null],
  'push-pull-legs-6': ['push', 'pull', 'legs', 'push', 'pull', 'legs', null],
  'upper-lower-4':    ['upper', 'lower', null, 'upper', 'lower', null, null],
  'bro-split-5':      ['chest', 'back', 'shoulders', 'arms', 'legs', null, null],
  'full-body-3':      ['fullbody', null, 'fullbody', null, 'fullbody', null, null],
  'full-body-4':      ['fullbody', null, 'fullbody', null, 'fullbody', null, 'fullbody'],
  'arnold-6':         ['chest', 'back', 'shoulders', 'arms', 'legs', 'fullbody', null],
};

/**
 * Get the workout for a given user and date.
 */
interface SelectionUser {
  split?: string;
  workoutSplit?: string;
  daysPerWeek?: number;
  trainingStartDay?: number;
  fitnessLevel?: string | null;
  workoutDuration?: number;
  excludedExercises?: Array<{ exerciseId: string; exerciseName: string }>;
  weekOverrides?: Record<string, { newWorkoutPreview?: { name: string; duration: number; sets: number } }>;
  planOverride?: { routineId: string; appliesTo: "just-today" | "replace-today"; date: string } | null;
  defaultRoutineId?: string | null;
  customWorkouts?: Array<{
    id: string;
    name: string;
    arabicName?: string;
    exercises: Array<{ id: string; name: string; arabicName?: string; sets: number; reps: number | string; weight: number; muscleGroup?: string; equipment?: string }>;
  }>;
}

// "Use this routine" override (PreSession adapt) or saved default routine, if any
// applies to this date. Returns the CustomRoutine to swap in, else null. (A5)
function resolveRoutineOverride(user: SelectionUser | null | undefined, dateStr: string) {
  const cw = user?.customWorkouts || [];
  if (!cw.length) return null;
  const po = user?.planOverride;
  if (po && po.date === dateStr) {
    const r = cw.find((c) => c.id === po.routineId);
    if (r) return r;
  }
  if (user?.defaultRoutineId) {
    const r = cw.find((c) => c.id === user.defaultRoutineId);
    if (r) return r;
  }
  return null;
}

export function getWorkoutForDate(
  user: SelectionUser | null | undefined,
  date: Date
): MockWorkout {
  const dateStr = date.toISOString().split('T')[0];

  // A6 — map every offered split (incl. arnold/phul/phat) to a real pattern.
  const splitMap: Record<string, string> = {
    'ppl': 'push-pull-legs',
    'upper-lower': 'upper-lower',
    'bro-split': 'bro-split',
    'full-body': 'full-body',
    'auto': 'push-pull-legs',
    'arnold': 'arnold',
    'phul': 'upper-lower',
    'phat': 'push-pull-legs',
  };

  const rawSplit = user?.workoutSplit || user?.split || 'ppl';
  const split = splitMap[rawSplit] || 'push-pull-legs';
  const daysPerWeek = user?.daysPerWeek || 3;

  // A7 — prefer the exact split-days pattern; otherwise the nearest pattern for
  // the same split (by day count) instead of silently dropping to PPL-3.
  let pattern = SPLIT_PATTERNS[`${split}-${daysPerWeek}`];
  if (!pattern) {
    const sameSplit = Object.keys(SPLIT_PATTERNS).filter((k) => k.startsWith(`${split}-`));
    if (sameSplit.length) {
      sameSplit.sort((a, b) => Math.abs(Number(a.split('-').pop()) - daysPerWeek) - Math.abs(Number(b.split('-').pop()) - daysPerWeek));
      pattern = SPLIT_PATTERNS[sameSplit[0]];
    }
  }
  pattern = pattern || SPLIT_PATTERNS['push-pull-legs-3'];

  const dayOfWeek = date.getDay(); // 0–6
  const trainingStart = user?.trainingStartDay ?? 1; // Monday by default
  const dayIndex = (dayOfWeek - trainingStart + 7) % 7;

  const workoutKey = pattern[dayIndex];
  const trainingDaysInPattern = pattern.filter(Boolean).length;
  let trainingDayNumber = 0;
  for (let i = 0; i <= dayIndex; i++) if (pattern[i]) trainingDayNumber++;

  // A4 — a week override can turn a day into rest (duration 0).
  const override = user?.weekOverrides?.[dateStr]?.newWorkoutPreview;
  const routine = resolveRoutineOverride(user, dateStr);

  if ((workoutKey === null && !routine) || (override && override.duration === 0)) {
    return {
      id: `rest-${dateStr}`,
      name: 'Rest Day', arabicName: 'يوم راحة', category: 'REST', arabicCategory: 'راحة',
      image: '', estimatedMinutes: 0, dayLabel: 'REST DAY', arabicDayLabel: 'يوم راحة',
      isRestDay: true, exercises: [],
    };
  }

  // Base workout: the saved/override routine (A5) or the split's mock day.
  const baseKey = (workoutKey || 'fullbody') as keyof typeof WORKOUTS;
  const w = WORKOUTS[baseKey];
  let name = w.name;
  let arabicName = w.arabicName;
  let category = w.category;
  let arabicCategory = w.arabicCategory;
  let exercises: MockWorkoutExercise[] = w.exercises.map((ex) => ({ ...ex }));

  if (routine) {
    name = routine.name;
    arabicName = routine.arabicName || routine.name;
    category = 'CUSTOM ROUTINE';
    arabicCategory = 'روتين مخصص';
    exercises = routine.exercises.map((ex) => ({
      id: ex.id, name: ex.name, arabicName: ex.arabicName || ex.name,
      sets: ex.sets, reps: typeof ex.reps === 'number' ? ex.reps : parseInt(String(ex.reps), 10) || 10,
      weight: ex.weight, muscleGroup: ex.muscleGroup || '', equipment: ex.equipment || '',
    }));
  }

  // A2 — drop the user's excluded exercises (guard: keep at least 2).
  const excludedIds = new Set((user?.excludedExercises || []).map((e) => e.exerciseId));
  const excludedNames = new Set((user?.excludedExercises || []).map((e) => (e.exerciseName || '').toLowerCase()));
  const kept = exercises.filter((ex) => !excludedIds.has(ex.id) && !excludedNames.has(ex.name.toLowerCase()));
  if (kept.length >= 2) exercises = kept;

  // A1 — fitness level shifts the set count; workout duration trims the list.
  const lvl = user?.fitnessLevel;
  if (lvl === 'beginner') exercises = exercises.map((ex) => ({ ...ex, sets: Math.max(2, ex.sets - 1) }));
  else if (lvl === 'advanced') exercises = exercises.map((ex) => ({ ...ex, sets: ex.sets + 1 }));

  const dur = user?.workoutDuration || w.estimatedMinutes;
  const maxEx = dur <= 30 ? 4 : dur <= 45 ? 5 : dur <= 60 ? 6 : exercises.length;
  exercises = exercises.slice(0, Math.max(3, Math.min(exercises.length, maxEx)));

  // A4 — a week override renames/retimes the day (keeps the resolved exercises).
  let estimatedMinutes = dur;
  if (override) {
    name = override.name;
    arabicName = override.name;
    estimatedMinutes = override.duration || estimatedMinutes;
  }

  return {
    id: `workout-${routine ? routine.id : baseKey}-${dateStr}`,
    name, arabicName, category, arabicCategory,
    image: w.image,
    estimatedMinutes,
    dayLabel: `DAY ${trainingDayNumber} OF ${trainingDaysInPattern}`,
    arabicDayLabel: `يوم ${trainingDayNumber} من ${trainingDaysInPattern}`,
    isRestDay: false,
    exercises,
  };
}

/**
 * Check if a given date is a rest day for this user.
 */
export function isRestDayForUser(user: any, date: Date): boolean {
  return getWorkoutForDate(user, date).isRestDay;
}
