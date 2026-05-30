export type GoalV2 =
  | "build-strength"
  | "gain-muscle"
  | "lose-body-fat"
  | "improve-cardio"
  | "sport-performance"
  | "stay-consistent";
export type Obstacle =
  | "lack-of-time"
  | "inconsistency"
  | "food-cravings"
  | "low-energy"
  | "not-knowing-what-to-do"
  | "stress";
export type TrainingLocationV2 = "gym" | "home" | "mix";
export type SessionLength = 20 | 30 | 45 | 60 | 75 | 90 | "auto" | undefined;
export type AICoachMode = "suggest-only" | "ask-before" | "auto-adjust";

export type Goal =
  | "lose-weight"
  | "build-muscle"
  | "stay-fit"
  | "athletic-performance";
export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "moderately-active" | "very-active";
export type BodyType = "ectomorph" | "mesomorph" | "endomorph";
export type TrainingLocation =
  | "full-gym"
  | "home-equipment"
  | "bodyweight-only";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type PreferredTime = "morning" | "afternoon" | "evening";
export type Language = "en" | "ar";

export interface ConnectedIntegration {
  id: 'apple-health' | 'apple-watch' | 'google-fit' | 'health-connect' 
      | 'garmin' | 'whoop' | 'strava' | 'fitbit';
  status: 'connected' | 'available' | 'unavailable';
  connectedAt?: string;   // ISO when connected; undefined if not connected
  lastSyncAt?: string;    // ISO of last successful sync; undefined if never synced
}

export interface WeightEntry {
  id: string;
  weightKg: number; // always stored in kg internally
  date: string;     // ISO date YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface SuggestedMeal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CoachNutritionPlan {
  dailyCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  mealStructure: string[];
  suggestedMeals: Record<string, SuggestedMeal[]>; // key: meal slot
  dietaryNotes: string;
  coachExplanation: string;
}

export interface UserProfile {
  weightLog?: WeightEntry[];
  connectedIntegrations?: ConnectedIntegration[];
  profileVisibility?: "public" | "private";
  whoCanChallenge?: "everyone" | "mutuals" | "nobody";
  showActivityStatus?: boolean;
  leaderboardOptIn?: boolean;
  shareProgressPhotos?: boolean;
  following?: string[];
  followers?: string[];
  name: string;
  username?: string;
  handle?: string;
  bio?: string;
  email?: string;
  avatarUrl?: string;
  language: Language;
  goals: GoalV2[];
  goal: Goal | null;
  gender: Gender | null;
  age: number;
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: ActivityLevel | null;
  bodyType: BodyType | null;
  injuries: string[];
  injuryDetails?: string;
  injuriesOther?: string;
  dietaryPreferences: string[];
  dietaryOther?: string;
  dislikedFoods: string;
  mealsPerDay: number;
  obstacles: Obstacle[];
  trainingLocationV2?: TrainingLocationV2;
  trainingLocation: TrainingLocation | null;
  fitnessLevel: FitnessLevel | null;
  daysPerWeek: number;
  preferredTime: PreferredTime | null;
  aiCoachMode: AICoachMode;
  aiCoachAdaptsWorkouts: boolean;
  aiCoachAdaptsNutrition: boolean;
  aiQuietHours: boolean;
  aiQuietHoursStart: string;
  aiQuietHoursEnd: string;
  coach: string | null;
  weightUnit: "kg" | "lb";
  heightUnit: "cm" | "ft";
  country: string;
  phone?: string;
  bodyFatRange?: string;
  subscriptionTier: "free" | "pro" | "elite";
  isFoundingMember: boolean;
  workoutSplit?:
    | "auto"
    | "ppl"
    | "upper-lower"
    | "bro-split"
    | "full-body"
    | "custom";
  dietStyle?: "balanced" | "high-protein" | "low-carb" | "mediterranean";
  mealPrepMode?: boolean;
  ramadanMode?: boolean;
  calorieTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  restDurationSets: number;
  restDurationExercises: number;
  sessionLength: SessionLength;
  workoutDuration: number; // in minutes
  customWorkouts?: CustomRoutine[];
  planOverride?: {
    routineId: string;
    appliesTo: 'just-today' | 'replace-today';
    date: string; // ISO date the override applies to
  } | null;
  defaultRoutineId?: string | null;
  muscleRecovery?: {
    [key: string]: number; // muscleId: percentage (0-100)
  };
  morningCheckInTime: string;
  streakReminderTime: string;
  workoutReminderTime: string;
  notificationPermission?: "granted" | "denied" | "default";
  showCalorieRing?: boolean;
  showMacroBreakdown?: boolean;
  waterReminders?: boolean;
  dailyWaterTarget?: number;
  excludedExercises?: Array<{
    exerciseId: string;
    exerciseName: string;
    arabicName?: string;
    excludedAt: string;
    reason?: string;
  }>;
  cardioEnabled?: boolean;
  cardioIntensity?: 'light' | 'moderate' | 'heavy';
  restTimerEnabled?: boolean;
  formTipsEnabled?: boolean;
  cycleTrackingEnabled?: boolean;
  weeklyGoalRate?: number; // kg/week, e.g. 0.25 / 0.5 / 0.75
  notificationsGranted?: boolean;
  healthSyncEnabled?: boolean;
  attributionSource?: string;
  measurements?: BodyMeasurement[];
  measurementGoals?: Partial<Record<MeasurementType, number>>;
  progressPhotos?: ProgressPhotoEntry[]; // We will redefine progressPhotos as ProgressPhotoEntry[]
  preferences?: {
    autoShareDisabled?: boolean;
  };
  weekOverrides?: Record<string, DayOverride>;
  exerciseNotes?: Record<string, string>;
  nutritionPlan?: CoachNutritionPlan;
}

export interface WorkoutLog {
  id: string;
  date: string;
  name: string;
  durationMin: number;
  totalVolumeKg: number;
  setsCompleted: number;
  muscleGroups: string[];
  exercises: {
    id: string;
    name: string;
    sets: LoggedSet[];
  }[];
  isPR?: boolean;
  swaps?: {
    originalId: string;
    newId: string;
    swappedAt: string;
    reason: string;
  }[];
  skipped?: string[];
}

export interface ExerciseLite {
  id: string;
  name: string;
  arabicName: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: ('barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'bands')[];
  category: 'compound' | 'isolation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SubstitutionContext {
  availableEquipment: ExerciseLite['equipment'];
  preserveType?: 'compound' | 'isolation' | 'either';
  excludeIds?: string[];
}


export interface ExerciseSession {
  date: string;
  workoutId: string;
  sets: LoggedSet[];
  topWeight: number;
  totalVolumeKg: number;
  isPR: boolean;
  est1RM: number;
}

export interface ExercisePR {
  date: string;
  workoutId: string;
  weight: number;
  reps: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  calcium?: number;
  potassium?: number;
  iron?: number;
  saturatedFat?: number;
  cholesterol?: number;
  portion: string;
  time: string;
  isCustom?: boolean;
  recipeId?: string;
  subFoods?: FoodItem[];
}

export interface Exercise {
  id: string;
  name: string;
  arabicName?: string;
  sets: number;
  reps: number | string;
  weight: number;
  image: string;
  muscleGroup?: string;
  equipment?: string;
  description?: string;
  videoUrl?: string;
  instructions?: string[];
  proTip?: string;
}

export interface CustomRoutineExercise {
  id: string;
  name: string;
  arabicName?: string;
  sets: number;
  reps: number | string;
  weight: number;
  muscleGroup?: string;
  equipment?: string;
}

export interface CustomRoutine {
  id: string;
  name: string;
  arabicName?: string;
  exercises: CustomRoutineExercise[];
  createdAt: string;
  sourceWorkoutId?: string; // optional, tracks where it was saved from
}

export interface Workout {
  id: string;
  name: string;
  duration: number;
  calories: number;
  exercises: Exercise[];
  tags: string[];
}

export type AppMode = "full" | "workout-only" | "nutrition-only";
export type MoodLevel = "low" | "okay" | "good" | "great";

export interface LoggedFood extends FoodItem {
  loggedAt: string; // ISO timestamp
  slot?: "breakfast" | "lunch" | "dinner" | "snack" | "snack1" | "snack2";
  isCoachSuggested?: boolean;
}

export interface LoggedSet {
  reps: number;
  weight: number; // always stored in kg
  rpe?: 6 | 7 | 8 | 9 | 10;
  completedAt: string;
  isWarmup?: boolean;
  plateBreakdown?: {
    barWeightKg: number;       // e.g. 20 (standard Olympic)
    perSide: Array<{           // ordered largest to smallest
      plateKg: number;         // e.g. 20, 15, 10, 5, 2.5, 1.25
      count: number;           // number of plates of this size per side
    }>;
    unit: 'kg' | 'lb';         // for display formatting
  };
}

export interface LoggedWorkout {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSet[];
  startedAt: string;
  completedAt?: string;
}

export interface TodaysLogs {
  date: string; // YYYY-MM-DD
  foods: LoggedFood[];
  workouts: LoggedWorkout[];
  water: number; // ml
  weight?: number; // kg, optional (logged that day)
  mood?: MoodLevel;
  morningCheckIn?: {
    hoursSlept: number;
    sleepQuality: 1 | 2 | 3 | 4;
    moodLabel: string;
    energy: 1 | 2 | 3;
  };
  missedWorkout?: {
    name: string;
    duration: number;
    intensity: string;
    notes: string;
  };
  planOverride?: {
    focus: string;
    duration: number;
    isRestDay: boolean;
    equipment?: string;
    intensity?: string;
    notes?: string;
  };
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: {
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  steps: string[];
  servings: number;
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt: string;
}

export type StreakType = "training" | "nutrition" | "perfect_week";
export interface Streak {
  count: number;
  lastLogDate: string;
  type: StreakType;
}

export type DayOverrideKind = 'travel-bodyweight' | 'home-equipment' | 'short-session' | 'low-energy' | 'sick' | 'rest';

export interface DayOverride {
  date: string;
  kind: DayOverrideKind;
  reasoning: string;
  newWorkoutPreview?: { name: string; duration: number; sets: number };
}

export interface WeekUpdate {
  overrides: DayOverride[];
  coachResponse: { en: string; ar: string };
}

export interface AdaptationChange {
  icon: string;
  label: string;
  headline: string;
  sub: string;
}

export interface Adaptation {
  id: string;
  status?: 'pending' | 'viewed' | 'dismissed';
  archivedAt?: string;
  type:
    | "sleep"
    | "volume"
    | "calorie_overflow"
    | "mood_low"
    | "plan_customized"
    | "pr_detected"
    | "missed_workout";
  title: string;
  eventText: string;
  originalPlan?: AdaptationChange | AdaptationChange[];
  adaptedPlan?: AdaptationChange | AdaptationChange[];
  coachMessage: string;
  coachId: string;
  createdAt: string;
}

export type MeasurementType = 'waist' | 'chest' | 'arm-r' | 'arm-l' | 'thigh-r' | 'thigh-l' | 'hips' | 'neck' | 'shoulders';

export interface BodyMeasurement {
  id: string;
  date: string;
  type: MeasurementType;
  valueCm: number;
}

export interface ProgressPhotoEntry {
  id: string;
  date: string;
  angle: 'front' | 'side' | 'back';
  photoId: string;
  weight?: number;
}
