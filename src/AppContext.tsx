import React, { createContext, useContext, useState, ReactNode } from "react";
import { UserProfile, AppMode, TodaysLogs, Streak, Adaptation } from "./types";
import {
  getItem,
  setItem,
  getStored,
  KEY_USER,
  KEY_STREAKS,
  KEY_PENDING_ADAPTATIONS,
  KEY_TODAYS_LOGS,
  KEY_XP,
  KEY_APP_MODE,
  KEY_LANGUAGE,
} from "./lib/storage";
import { useTheme } from "./theme/ThemeProvider";

interface AppContextType {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  isPremium: boolean;
  setIsPremium: React.Dispatch<React.SetStateAction<boolean>>;
  // Re-exposed from ThemeProvider so ported screens keep using
  // `const { theme, setTheme } = useAppContext()` unchanged.
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  todaysLogs: TodaysLogs;
  setTodaysLogs: React.Dispatch<React.SetStateAction<TodaysLogs>>;
  streaks: Streak[];
  setStreaks: (streaks: Streak[]) => void;
  pendingAdaptations: Adaptation[];
  setPendingAdaptations: (adaptations: Adaptation[]) => void;
  adaptationHistory: Adaptation[];
  archiveAdaptation: (
    adaptation: Adaptation,
    status: "viewed" | "dismissed",
  ) => void;
  xp: number;
  setXp: React.Dispatch<React.SetStateAction<number>>;
  level: number;
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
}

const defaultUser: UserProfile = {
  profileVisibility: "public",
  whoCanChallenge: "everyone",
  showActivityStatus: true,
  leaderboardOptIn: true,
  shareProgressPhotos: false,
  following: ["u_friend_1", "u_friend_2", "u_friend_3"],
  followers: ["u_friend_1", "u_friend_2", "u_stranger_1"],
  name: "",
  progressPhotos: [],
  language: "en",
  goals: [],
  goal: null,
  gender: null,
  age: 25,
  height: 180,
  currentWeight: 75,
  targetWeight: 70,
  weightLog: [],
  activityLevel: null,
  bodyType: null,
  injuries: [],
  injuriesOther: "",
  dietaryPreferences: [],
  dietaryOther: "",
  dislikedFoods: "",
  mealsPerDay: 3,
  obstacles: [],
  trainingLocation: null,
  fitnessLevel: "intermediate",
  daysPerWeek: 4,
  preferredTime: "afternoon",
  aiCoachMode: "ask-before",
  aiCoachAdaptsWorkouts: true,
  aiCoachAdaptsNutrition: true,
  aiQuietHours: false,
  aiQuietHoursStart: "22:00",
  aiQuietHoursEnd: "07:00",
  coach: "khaled",
  weightUnit: "kg",
  heightUnit: "cm",
  country: "",
  subscriptionTier: "free",
  isFoundingMember: false,
  workoutSplit: "auto",
  dietStyle: "balanced",
  mealPrepMode: false,
  ramadanMode: false,
  restDurationSets: 60,
  restDurationExercises: 90,
  sessionLength: undefined,
  workoutDuration: 45,
  customWorkouts: [],
  planOverride: null,
  defaultRoutineId: null,
  muscleRecovery: {
    shoulders: 100,
    biceps: 100,
    triceps: 100,
    back: 100,
    chest: 100,
    abs: 100,
    lower_back: 100,
    glutes: 100,
    quadriceps: 100,
    hamstrings: 100,
  },
  morningCheckInTime: "08:00",
  streakReminderTime: "20:00",
  workoutReminderTime: "18:00",
  notificationPermission: "default",
  showCalorieRing: true,
  showMacroBreakdown: true,
  waterReminders: false,
  dailyWaterTarget: 2000,
  excludedExercises: [],
  cardioEnabled: false,
  cardioIntensity: "light",
  restTimerEnabled: true,
  formTipsEnabled: true,
  cycleTrackingEnabled: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const getTodayString = () => new Date().toISOString().split("T")[0];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme, setTheme } = useTheme();

  // NOTE: storage is hydrated synchronously into the in-memory cache before
  // this provider mounts (see hydrateStorage() in the root layout), so these
  // getItem() reads behave exactly like the web localStorage reads.
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = getItem(KEY_USER);
    const savedLang = getItem(KEY_LANGUAGE);
    if (saved && saved !== "undefined") {
      try {
        const parsedUser = { ...defaultUser, ...JSON.parse(saved) };
        // Migration: old 'friends' visibility value mapped to 'public'
        if (parsedUser.profileVisibility === "friends")
          parsedUser.profileVisibility = "public";
        return parsedUser;
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }
    if (savedLang === "en" || savedLang === "ar") {
      return { ...defaultUser, language: savedLang as "en" | "ar" };
    }
    return defaultUser;
  });

  const [isPremium, setIsPremium] = useState(false);

  const [appMode, setAppModeState] = useState<AppMode>(() => {
    return (getItem(KEY_APP_MODE) as AppMode) || "full";
  });

  const setAppMode = (mode: AppMode) => {
    setAppModeState(mode);
    setItem(KEY_APP_MODE, mode);
  };

  const [todaysLogs, setTodaysLogs] = useState<TodaysLogs>(() => {
    const today = getTodayString();
    const saved = getItem(KEY_TODAYS_LOGS);
    if (saved && saved !== "undefined") {
      try {
        const logs = JSON.parse(saved) as TodaysLogs;
        if (logs.date === today) {
          return logs;
        } else {
          // Archive past logs
          setItem(`synk:logs:${logs.date}`, saved);
        }
      } catch (e) {
        console.error("Failed to parse todaysLogs", e);
      }
    }
    return { date: today, foods: [], workouts: [], water: 0 };
  });

  const [streaks, setStreaksState] = useState<Streak[]>(() => {
    return getStored<Streak[]>(KEY_STREAKS, [
      { count: 0, lastLogDate: "", type: "training" },
      { count: 0, lastLogDate: "", type: "nutrition" },
      { count: 0, lastLogDate: "", type: "perfect_week" },
    ]);
  });

  const setStreaks = (s: Streak[]) => {
    setStreaksState(s);
    setItem(KEY_STREAKS, JSON.stringify(s));
  };

  const [pendingAdaptations, setPendingAdaptationsState] = useState<
    Adaptation[]
  >(() => {
    return getStored<Adaptation[]>(KEY_PENDING_ADAPTATIONS, []);
  });

  const setPendingAdaptations = (a: Adaptation[]) => {
    setPendingAdaptationsState(a);
    setItem(KEY_PENDING_ADAPTATIONS, JSON.stringify(a));
  };

  const [adaptationHistory, setAdaptationHistoryState] = useState<Adaptation[]>(
    () => {
      try {
        const saved = getItem("synk:adaptationHistory");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    },
  );

  const setAdaptationHistory = (a: Adaptation[]) => {
    setAdaptationHistoryState(a);
    try {
      setItem("synk:adaptationHistory", JSON.stringify(a));
    } catch {}
  };

  const archiveAdaptation = (
    adaptation: Adaptation,
    status: "viewed" | "dismissed",
  ) => {
    const archived: Adaptation = {
      ...adaptation,
      status,
      archivedAt: new Date().toISOString(),
    };
    setAdaptationHistory([archived, ...adaptationHistory].slice(0, 100));
  };

  const [xp, setXp] = useState<number>(() => {
    const saved = getItem(KEY_XP);
    if (saved && saved !== "undefined") {
      const parsed = parseInt(saved, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  });

  const level = Math.floor(Math.log2(Math.max(xp, 100) / 100)) + 1;

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Persistence effects
  React.useEffect(() => {
    setItem(KEY_USER, JSON.stringify(user));
  }, [user]);

  React.useEffect(() => {
    setItem(KEY_TODAYS_LOGS, JSON.stringify(todaysLogs));
  }, [todaysLogs]);

  React.useEffect(() => {
    setItem(KEY_XP, xp.toString());
  }, [xp]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isPremium,
        setIsPremium,
        theme,
        setTheme,
        appMode,
        setAppMode,
        todaysLogs,
        setTodaysLogs,
        streaks,
        setStreaks,
        pendingAdaptations,
        setPendingAdaptations,
        adaptationHistory,
        archiveAdaptation,
        xp,
        setXp,
        level,
        selectedDate,
        setSelectedDate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within an AppProvider");
  return context;
};
