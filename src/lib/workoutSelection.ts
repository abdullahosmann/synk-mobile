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
export function getWorkoutForDate(
  user: { split?: string; workoutSplit?: string; daysPerWeek?: number; trainingStartDay?: number } | null | undefined,
  date: Date
): MockWorkout {
  const splitMap: Record<string, string> = {
    'ppl': 'push-pull-legs',
    'upper-lower': 'upper-lower',
    'bro-split': 'bro-split',
    'full-body': 'full-body',
    'auto': 'push-pull-legs'
  };
  
  const rawSplit = user?.workoutSplit || user?.split || 'ppl';
  const split = splitMap[rawSplit] || 'push-pull-legs';
  const daysPerWeek = user?.daysPerWeek || 3;
  const patternKey = `${split}-${daysPerWeek}`;
  const pattern = SPLIT_PATTERNS[patternKey] || SPLIT_PATTERNS['push-pull-legs-3'];

  // Day index relative to the user's week.
  // For now: dayOfWeek (0=Sun, 6=Sat). User's "training start day" defaults to Monday.
  const dayOfWeek = date.getDay(); // 0–6
  const trainingStart = user?.trainingStartDay ?? 1; // Monday by default
  const dayIndex = (dayOfWeek - trainingStart + 7) % 7;

  const workoutKey = pattern[dayIndex];
  const trainingDaysInPattern = pattern.filter(Boolean).length;

  // Count how many training days occur in the pattern up to and including this day
  let dayLabel = '';
  let trainingDayNumber = 0;
  for (let i = 0; i <= dayIndex; i++) {
    if (pattern[i]) trainingDayNumber++;
  }

  if (workoutKey === null) {
    // Rest day
    return {
      id: `rest-${date.toISOString().split('T')[0]}`,
      name: 'Rest Day',
      arabicName: 'يوم راحة',
      category: 'REST',
      arabicCategory: 'راحة',
      image: '',
      estimatedMinutes: 0,
      dayLabel: 'REST DAY',
      arabicDayLabel: 'يوم راحة',
      isRestDay: true,
      exercises: [],
    };
  }

  const w = WORKOUTS[workoutKey];
  return {
    id: `workout-${workoutKey}-${date.toISOString().split('T')[0]}`,
    name: w.name,
    arabicName: w.arabicName,
    category: w.category,
    arabicCategory: w.arabicCategory,
    image: w.image,
    estimatedMinutes: w.estimatedMinutes,
    dayLabel: `DAY ${trainingDayNumber} OF ${trainingDaysInPattern}`,
    arabicDayLabel: `يوم ${trainingDayNumber} من ${trainingDaysInPattern}`,
    isRestDay: false,
    exercises: w.exercises.map(ex => ({ ...ex })), // shallow copy
  };
}

/**
 * Check if a given date is a rest day for this user.
 */
export function isRestDayForUser(user: any, date: Date): boolean {
  return getWorkoutForDate(user, date).isRestDay;
}
