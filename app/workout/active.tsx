/**
 * ActiveWorkout — RN port of src/screens/main/ActiveWorkout.tsx.
 *
 * The live set-logging state machine: per-set reps/weight steppers, RPE prompt,
 * rest-timer + pause overlays, warmup/working-set grouping, exercise nav,
 * swap/skip sheets, the Ask-Coach sheet, plate-breakdown sheet, resume/end
 * confirmations, and crash-recovery persistence to `synk:active_workout`.
 *
 * Web→RN swaps:
 *  - location.state → useLocalSearchParams (JSON-encoded workout/exercises/phases)
 *  - document.visibilitychange → AppState "change"
 *  - <input type=number> → <TextInput keyboardType=numeric>
 *  - motion/AnimatePresence → reanimated entering animations
 *  - navigate("/workout/complete", {state}) → router.push({params:{summary}})
 */
import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Info,
  CheckCircle2,
  Clock,
  Flame,
  Settings as SettingsIcon,
  RefreshCw,
  Zap,
  MoreVertical,
  Plus,
  Layers,
} from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { formatWeight } from "../../src/lib/units";
import { COACHES } from "../../src/constants";
import type { ExerciseLite } from "../../src/types";
import BottomSheet from "../../src/components/BottomSheet";
import CoachAvatar from "../../src/components/CoachAvatar";
import { BASE_EXERCISES } from "../../src/data/exercises";
import { getSubstitutions } from "../../src/lib/exerciseSubstitution";
import {
  getStored,
  getItem,
  setItem,
  removeItem,
  KEY_HISTORICAL_SETS,
} from "../../src/lib/storage";
import { adaptationBus } from "../../src/lib/adaptationBus";
import { PlateBar, getPlateColor } from "../../src/components/PlateBar";
import { useColors, useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

const ACTIVE_WORKOUT_KEY = "synk:active_workout";

/** Append an alpha channel to a #rrggbb hex (used for primary/xx tints). */
function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

/** Three pulsing dots for the coach "thinking" state. */
function TypingDots({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {[0, 200, 400].map((delay) => (
        <Animated.View
          key={delay}
          entering={FadeIn.delay(delay)}
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

export default function ActiveWorkout() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    workout?: string;
    exercises?: string;
    warmupOn?: string;
    cooldownOn?: string;
    warmups?: string;
    cooldowns?: string;
  }>();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const parseParam = <T,>(raw: string | undefined, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const customWorkout = parseParam<any>(params.workout, undefined);
  const stateExercises = parseParam<any[]>(params.exercises, undefined as any);
  const warmupOn = parseParam<boolean>(params.warmupOn, false);
  const cooldownOn = parseParam<boolean>(params.cooldownOn, false);
  const paramWarmups = parseParam<any[]>(params.warmups, []);
  const paramCooldowns = parseParam<any[]>(params.cooldowns, []);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [timer, setTimer] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [showExerciseOptions, setShowExerciseOptions] = useState(false);
  const [showSwapSheet, setShowSwapSheet] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [swapExcludeIds, setSwapExcludeIds] = useState<string[]>([]);
  const [swapEquipment, setSwapEquipment] = useState<string[]>([
    "barbell",
    "dumbbell",
    "cable",
    "machine",
    "bodyweight",
    "bands",
  ]);
  const [skippedExercises, setSkippedExercises] = useState<string[]>([]);
  const [swappedLogs, setSwappedLogs] = useState<any[]>([]);
  const [rpePromptSetIdx, setRpePromptSetIdx] = useState<number | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [persistedState, setPersistedState] = useState<any>(null);
  const [showCoachSheet, setShowCoachSheet] = useState(false);
  const [selectedPlateSet, setSelectedPlateSet] = useState<any>(null);
  const [askCoachState, setAskCoachState] = useState<
    "questions" | "thinking" | "reply"
  >("questions");
  const [askCoachReply, setAskCoachReply] = useState<string | null>(null);

  const handleCoachQuestion = (id: string) => {
    setAskCoachState("thinking");
    let reply = "";
    if (isArabic) {
      switch (id) {
        case "weight":
          reply =
            "لو بتعمل ٨–١٠ تكرارات نظيفة ومعاك تكرارين زيادة، الوزن صح. لو بطّأ آخر تكرارين، نزّل ١٠٪.";
          break;
        case "replace":
          reply =
            "افتح قائمة التبديل (أعلى اليمين) — هوريك ٣ بدائل بنفس العضلة.";
          break;
        case "rest":
          reply = "للتكرارات دي، ٦٠–٩٠ ثانية. التمارين المركبة تاخد ١٢٠ ثانية.";
          break;
        case "pain":
          reply =
            "وقف الجلسة. الألم الحاد مش مجهود. اضغط على التبديل أو خلص النهاردة وأنا هعدّل بكره.";
          break;
        case "easy":
          reply =
            "زوّد ٥–١٠٪ في الست الجاي. لو لسه سهل، هرفع البرنامج الجلسة الجاية.";
          break;
        case "target":
          reply =
            "العضلة الأساسية: المستهدفة من خطتك. الثانوية: عضلات التثبيت والكور.";
          break;
      }
    } else {
      switch (id) {
        case "weight":
          reply =
            "If you can hit 8–10 clean reps with 2 in reserve, it's right. If it slows your last 2 reps, drop 10%.";
          break;
        case "replace":
          reply =
            "Open the swap menu (top right) — I'll show you three alternatives that hit the same muscle.";
          break;
        case "rest":
          reply = "For this rep range, 60–90 seconds. Compound lifts get 120s.";
          break;
        case "pain":
          reply =
            "Stop the set. Sharp pain ≠ effort. Tap the swap button to switch exercise, or finish here and we'll adjust tomorrow.";
          break;
        case "easy":
          reply =
            "Add 5–10% to the next set. If reps still fly, we'll bump the program next session.";
          break;
        case "target":
          reply =
            "Primary mover: the prescribed muscle group from your plan. Secondary: stabilizers and core.";
          break;
      }
    }

    setTimeout(() => {
      setAskCoachReply(reply);
      setAskCoachState("reply");
    }, 1200);
  };

  const restStartedAt = useRef<number | null>(null);
  const restDurationRef = useRef<number>(0);

  const getInitialExercises = () => {
    if (stateExercises) {
      return stateExercises.map((ex: any) => ({
        ...ex,
        sets: Array.isArray(ex.sets) ? ex.sets : parseInt(ex.sets) || 3,
        weight: ex.weight || 0,
        muscleGroup: ex.muscleGroup || "Chest",
        image:
          ex.image ||
          "https://images.unsplash.com/photo-1541534741688-6078c65b5a33?auto=format&fit=crop&q=80&w=600",
        description: ex.description || "Description not available.",
        instructions: ex.instructions || ["Start exercise"],
        proTip: ex.proTip || "Keep your form solid.",
      }));
    }
    return (
      customWorkout?.exercises || [
        {
          name: "Incline DB Press",
          sets: 4,
          reps: "8-10",
          weight: 24,
          muscleGroup: "Chest",
          image:
            "https://images.unsplash.com/photo-1541534741688-6078c65b5a33?auto=format&fit=crop&q=80&w=600",
          description:
            "Set the bench to a 30-45 degree angle. Press the dumbbells up while keeping your core tight and feet planted. Lower slowly to chest level.",
          instructions: [
            "Set bench to 30-45 degrees",
            "Plant feet firmly on the ground",
            "Retract shoulder blades into the bench",
            "Press weights up in a slight arc",
            "Lower slowly until elbows are at 90 degrees",
          ],
          proTip:
            "Keep your elbows slightly tucked to protect your shoulders during the press.",
        },
        {
          name: "Flat Bench Press",
          sets: [
            {
              reps: 10,
              weight: 40,
              isWarmup: true,
              plateBreakdown: {
                barWeightKg: 20,
                unit: "kg",
                perSide: [{ plateKg: 10, count: 1 }],
              },
            },
            {
              reps: 10,
              weight: 60,
              isWarmup: false,
              plateBreakdown: {
                barWeightKg: 20,
                unit: "kg",
                perSide: [{ plateKg: 20, count: 1 }],
              },
            },
            {
              reps: 10,
              weight: 60,
              isWarmup: false,
              plateBreakdown: {
                barWeightKg: 20,
                unit: "kg",
                perSide: [{ plateKg: 20, count: 1 }],
              },
            },
            {
              reps: 12,
              weight: 60,
              isWarmup: false,
              plateBreakdown: {
                barWeightKg: 20,
                unit: "kg",
                perSide: [{ plateKg: 20, count: 1 }],
              },
            },
          ],
          reps: "10-12",
          weight: 60,
          muscleGroup: "Chest",
          image:
            "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=60",
          description:
            "Lie flat on the bench. Grip the bar slightly wider than shoulder-width. Lower the bar to mid-chest and press back up explosively.",
          instructions: [
            "Maintain a slight arch in your lower back",
            "Grip bar wider than shoulder width",
            "Lower bar to mid-chest level",
            "Drive through your feet as you press up",
            "Lock out at the top but don't bounce",
          ],
          proTip:
            "Squeeze the bar as hard as you can to engage more muscle fibers.",
        },
      ]
    );
  };

  const getInitialExercisesWithPhases = () => {
    const mainEx = getInitialExercises();
    const wEx = warmupOn
      ? paramWarmups.map((w: any, idx: number) => ({
          id: "warmup-" + idx,
          name: w.name,
          sets: [{ reps: w.duration, weight: 0, isWarmup: true, done: false }],
          reps: w.duration,
          weight: 0,
          muscleGroup: "Mobility",
          image:
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=60",
          description: "Perform " + w.name + " for " + w.duration + ".",
          instructions: ["Follow duration"],
          isWarmupItem: true,
          phaseText: "warmup",
        }))
      : [];

    const cEx = cooldownOn
      ? paramCooldowns.map((w: any, idx: number) => ({
          id: "cooldown-" + idx,
          name: w.name,
          sets: [{ reps: w.duration, weight: 0, isWarmup: false, done: false }],
          reps: w.duration,
          weight: 0,
          muscleGroup: "Mobility",
          image:
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=60",
          description: "Perform " + w.name + " for " + w.duration + ".",
          instructions: ["Follow duration"],
          isCooldownItem: true,
          phaseText: "cooldown",
        }))
      : [];

    return [...wEx, ...mainEx, ...cEx];
  };

  const [exercises, setExercises] = useState<any[]>(
    getInitialExercisesWithPhases(),
  );

  const currentExerciseObj = exercises[currentExerciseIndex];
  const workoutPhase = currentExerciseObj?.isWarmupItem
    ? "warmup"
    : currentExerciseObj?.isCooldownItem
      ? "cooldown"
      : "main";

  const phaseExercises = exercises.filter((e: any) => {
    if (workoutPhase === "warmup") return e.isWarmupItem;
    if (workoutPhase === "cooldown") return e.isCooldownItem;
    return !e.isWarmupItem && !e.isCooldownItem;
  });

  const phaseStartIndex = exercises.findIndex((e: any) => {
    if (workoutPhase === "warmup") return e.isWarmupItem;
    if (workoutPhase === "cooldown") return e.isCooldownItem;
    return !e.isWarmupItem && !e.isCooldownItem;
  });
  const localExerciseIndex =
    currentExerciseIndex - (phaseStartIndex === -1 ? 0 : phaseStartIndex);

  const [skippedWarmups, setSkippedWarmups] = useState<Record<number, boolean>>(
    {},
  );

  const [setLogs, setSetLogs] = useState<{
    [key: number]: {
      done: boolean;
      reps: number;
      weight: number;
      rpe?: number;
      isWarmup?: boolean;
      plateBreakdown?: {
        barWeightKg: number;
        perSide: Array<{ plateKg: number; count: number }>;
        unit: "kg" | "lb";
      };
    }[];
  }>(() => {
    return exercises.reduce((acc, ex, idx) => {
      let initialSets;
      if (Array.isArray(ex.sets)) {
        initialSets = ex.sets.map((s: any) => ({
          done: false,
          reps:
            s.reps ??
            (typeof ex.reps === "string"
              ? parseInt(ex.reps.split("-")[0]) || 10
              : ex.reps),
          weight: s.weight ?? ex.weight ?? 0,
          isWarmup: s.isWarmup,
          plateBreakdown: s.plateBreakdown,
        }));
      } else {
        const setsCount = parseInt(ex.sets?.toString() || "3") || 3;
        initialSets = new Array(setsCount).fill(null).map(() => ({
          done: false,
          reps:
            typeof ex.reps === "string"
              ? parseInt(ex.reps.split("-")[0]) || 10
              : ex.reps,
          weight: ex.weight || 0,
        }));
      }
      return { ...acc, [idx]: initialSets };
    }, {});
  });

  // Recovery initialization
  useEffect(() => {
    const raw = getItem(ACTIVE_WORKOUT_KEY);
    if (raw && raw !== "undefined") {
      try {
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const savedAt = parsed.timestamp || now;
        if (now - savedAt < 24 * 60 * 60 * 1000) {
          setPersistedState(parsed);
          setShowResumePrompt(true);
        } else {
          removeItem(ACTIVE_WORKOUT_KEY);
        }
      } catch {
        removeItem(ACTIVE_WORKOUT_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResume = () => {
    if (persistedState) {
      setExercises(persistedState.exercises);
      setCurrentExerciseIndex(persistedState.currentExerciseIndex);
      setSetLogs(persistedState.setLogs);
      setTimer(persistedState.timer);
    }
    setShowResumePrompt(false);
  };

  const handleDiscardResume = () => {
    removeItem(ACTIVE_WORKOUT_KEY);
    setShowResumePrompt(false);
  };

  const isFinishedRef = useRef(false);

  // State persistence
  useEffect(() => {
    if (isFinishedRef.current) return;
    const hasStarted =
      Object.values(setLogs || {}).some((sets: any) =>
        sets.some((s: any) => s.done),
      ) || timer > 10;
    if (hasStarted) {
      const state = {
        exercises,
        currentExerciseIndex,
        setLogs,
        timer,
        status: "in_progress",
        timestamp: Date.now(),
      };
      setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(state));
    }
  }, [exercises, currentExerciseIndex, setLogs, timer]);

  const getPreviousSet = (exerciseName: string, setIndex: number) => {
    const history = getStored<any>(KEY_HISTORICAL_SETS, {});
    const exerciseHistory = history[exerciseName] || [];
    const sorted = [...exerciseHistory].sort(
      (a: any, b: any) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
    const match = sorted.find((s: any) => s.setIndex === setIndex);
    return match ? { reps: match.reps, weight: match.weight } : null;
  };

  const saveSetToHistory = (
    exerciseName: string,
    setIndex: number,
    reps: number,
    weight: number,
  ) => {
    const history = getStored<any>(KEY_HISTORICAL_SETS, {});
    if (!history[exerciseName]) history[exerciseName] = [];
    history[exerciseName].push({
      reps,
      weight,
      completedAt: new Date().toISOString(),
      setIndex,
    });
    if (history[exerciseName].length > 50) {
      history[exerciseName] = history[exerciseName].slice(-50);
    }
    setItem(KEY_HISTORICAL_SETS, JSON.stringify(history));
  };

  const setRestTimerWithPersistence = (duration: number | null | undefined) => {
    const validDuration =
      typeof duration === "number" && !isNaN(duration)
        ? duration
        : duration === null
          ? null
          : 90;
    setRestTimer(validDuration);
    if (validDuration !== null) {
      restStartedAt.current = Date.now();
      restDurationRef.current = validDuration;
    } else {
      restStartedAt.current = null;
    }
  };

  const toggleSet = (exerciseIdx: number, setIdx: number) => {
    setSetLogs((prev) => {
      const newState = { ...prev };
      const exerciseSets = [...newState[exerciseIdx]];
      const isNowDone = !exerciseSets[setIdx].done;
      exerciseSets[setIdx] = { ...exerciseSets[setIdx], done: isNowDone };
      newState[exerciseIdx] = exerciseSets;

      if (isNowDone) {
        saveSetToHistory(
          exercises[exerciseIdx].name,
          setIdx,
          exerciseSets[setIdx].reps,
          exerciseSets[setIdx].weight,
        );
        setRpePromptSetIdx(setIdx);
      } else {
        setRestTimerWithPersistence(null);
        setRpePromptSetIdx(null);
      }
      return newState;
    });
  };

  const handleRpeSelect = (setIdx: number, rpe: number) => {
    setSetLogs((prev) => {
      const newState = { ...prev };
      const exerciseSets = [...newState[currentExerciseIndex]];
      exerciseSets[setIdx] = { ...exerciseSets[setIdx], rpe };
      newState[currentExerciseIndex] = exerciseSets;
      return newState;
    });
    setRpePromptSetIdx(null);
    setRestTimerWithPersistence(user.restDurationSets);
  };

  useEffect(() => {
    if (rpePromptSetIdx !== null) {
      const t = setTimeout(() => {
        handleRpeSelect(rpePromptSetIdx, 8); // Default to 8 (Solid)
      }, 5000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rpePromptSetIdx]);

  const updateReps = (exerciseIdx: number, setIdx: number, delta: number) => {
    setSetLogs((prev) => {
      const newState = { ...prev };
      const exerciseSets = [...newState[exerciseIdx]];
      const newReps = Math.max(0, exerciseSets[setIdx].reps + delta);
      exerciseSets[setIdx] = { ...exerciseSets[setIdx], reps: newReps };
      newState[exerciseIdx] = exerciseSets;
      return newState;
    });
  };

  const updateWeight = (exerciseIdx: number, setIdx: number, delta: number) => {
    setSetLogs((prev) => {
      const newState = { ...prev };
      const exerciseSets = [...newState[exerciseIdx]];
      const newWeight = Math.max(0, exerciseSets[setIdx].weight + delta);
      exerciseSets[setIdx] = { ...exerciseSets[setIdx], weight: newWeight };
      newState[exerciseIdx] = exerciseSets;
      return newState;
    });
  };

  const setReps = (exerciseIdx: number, setIdx: number, value: number) => {
    setSetLogs((prev) => {
      const newState = { ...prev };
      const exerciseSets = [...newState[exerciseIdx]];
      exerciseSets[setIdx] = {
        ...exerciseSets[setIdx],
        reps: Math.max(0, value),
      };
      newState[exerciseIdx] = exerciseSets;
      return newState;
    });
  };

  const setWeight = (exerciseIdx: number, setIdx: number, value: number) => {
    setSetLogs((prev) => {
      const newState = { ...prev };
      const exerciseSets = [...newState[exerciseIdx]];
      exerciseSets[setIdx] = {
        ...exerciseSets[setIdx],
        weight: Math.max(0, value),
      };
      newState[exerciseIdx] = exerciseSets;
      return newState;
    });
  };

  const handleCopyPrev = (
    exerciseIdx: number,
    setIdx: number,
    prev: { reps: number; weight: number },
  ) => {
    setSetLogs((prevLogs) => {
      const newState = { ...prevLogs };
      const exerciseSets = [...newState[exerciseIdx]];
      exerciseSets[setIdx] = {
        ...exerciseSets[setIdx],
        reps: prev.reps,
        weight: prev.weight,
      };
      newState[exerciseIdx] = exerciseSets;
      return newState;
    });
  };

  // visibilitychange → AppState (recompute rest timer on return to foreground)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && restStartedAt.current !== null) {
        const elapsed = (Date.now() - restStartedAt.current) / 1000;
        if (elapsed >= restDurationRef.current) {
          setRestTimer(null);
          restStartedAt.current = null;
        } else {
          setRestTimer(
            Math.max(0, restDurationRef.current - Math.floor(elapsed)),
          );
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (restTimer !== null && restTimer > 0 && !isPaused) {
      interval = setInterval(
        () => setRestTimer((t) => (t !== null ? t - 1 : null)),
        1000,
      );
    } else if (restTimer === 0) {
      setRestTimer(null);
      restStartedAt.current = null;
    }
    return () => clearInterval(interval);
  }, [restTimer, isPaused]);

  const currentExercise = exercises[currentExerciseIndex];
  const currentSetLogs = setLogs[currentExerciseIndex] || [];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (!isPaused) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSkipWarmups = () => {
    setSetLogs((prev) => {
      const newState = { ...prev };
      exercises.forEach((ex, idx) => {
        const exerciseSets = [...(newState[idx] || [])];
        if (ex.isWarmupItem) {
          newState[idx] = exerciseSets.map((log) => ({ ...log, done: true }));
        } else {
          newState[idx] = exerciseSets.map((log) =>
            log.isWarmup ? { ...log, done: true } : log,
          );
        }
      });
      return newState;
    });

    const firstMainIdx = exercises.findIndex(
      (ex) => !ex.isWarmupItem && !ex.isCooldownItem,
    );
    if (firstMainIdx !== -1) setCurrentExerciseIndex(firstMainIdx);

    setSkippedWarmups((prev) => {
      const next = { ...prev };
      exercises.forEach((_, idx) => {
        next[idx] = true;
      });
      return next;
    });

    setRestTimerWithPersistence(null);

    showToast(
      isArabic
        ? "اتعدّى الإحماء — على طول للوزن الأساسي."
        : "Warmups skipped — straight to working weight.",
      "success",
    );
  };

  const handleNext = () => {
    if (restTimer !== null) return; // block nav during rest
    setShowGuide(false);
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setRestTimerWithPersistence(user.restDurationExercises);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = () => {
    isFinishedRef.current = true;
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    const exerciseSets: { [key: string]: any[] } = {};

    exercises.forEach((exercise, exIdx) => {
      const logs = setLogs[exIdx];
      if (!logs) return;
      const completedSets: any[] = [];
      logs.forEach((set) => {
        if (set.done) {
          totalSets += 1;
          totalReps += set.reps;
          totalVolume += set.reps * set.weight;
          completedSets.push({ ...set, completedAt: new Date().toISOString() });
        }
      });
      exerciseSets[exercise.name] = completedSets;
    });

    removeItem(ACTIVE_WORKOUT_KEY);
    router.push({
      pathname: "/workout/complete",
      params: {
        summary: JSON.stringify({
          totalSets,
          totalReps,
          totalVolume,
          duration: timer,
          exerciseSets,
          workoutName:
            customWorkout?.name ||
            (isArabic ? "جلسة تمرين" : "Workout Session"),
          swappedLogs,
          skippedExercises: skippedExercises.map(
            (id) => exercises.find((e) => e.id === id)?.name || id,
          ),
        }),
      },
    });
  };

  const handlePrevious = () => {
    if (restTimer !== null) return;
    setShowGuide(false);
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const updateRestDuration = (
    type: "sets" | "exercises",
    newDuration: number,
  ) => {
    if (type === "sets") {
      setUser((prev) => ({ ...prev, restDurationSets: newDuration }));
    } else {
      setUser((prev) => ({ ...prev, restDurationExercises: newDuration }));
    }
  };

  const handleSwapClick = () => setShowExerciseOptions(true);

  const loadSwaps = (excludeExtras: string[] = []) => {
    const originalId = currentExercise.id;
    const baseOrg =
      BASE_EXERCISES.find((e) => e.id === originalId) || BASE_EXERCISES[0];
    return getSubstitutions(
      baseOrg,
      {
        availableEquipment: swapEquipment as any,
        excludeIds: [...swapExcludeIds, ...excludeExtras],
      },
      BASE_EXERCISES,
    );
  };

  const swapExercise = (newExerciseLite: ExerciseLite) => {
    const originalWorkingSetsCount = Array.isArray(currentExercise.sets)
      ? currentExercise.sets.filter((s: any) => !s.isWarmup).length || 3
      : typeof currentExercise.sets === "number"
        ? currentExercise.sets
        : parseInt(currentExercise.sets?.toString() || "3") || 3;

    const newExercise = {
      id: newExerciseLite.id,
      name: newExerciseLite.name,
      sets: originalWorkingSetsCount,
      reps: currentExercise.reps,
      weight: Math.round(
        (Array.isArray(currentExercise.sets)
          ? currentExercise.sets.find((s: any) => !s.isWarmup)?.weight ||
            currentExercise.weight
          : currentExercise.weight) * 0.7,
      ),
      muscleGroup: newExerciseLite.primaryMuscle,
      equipment: newExerciseLite.equipment[0],
      image:
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60",
    };

    setExercises((prev) => {
      const next = [...prev];
      next[currentExerciseIndex] = newExercise;
      return next;
    });

    setSwappedLogs((prev) => [
      ...prev,
      {
        originalId: currentExercise.id,
        newId: newExercise.id,
        swappedAt: new Date().toISOString(),
        reason: "user",
      },
    ]);

    setSetLogs((prev) => {
      const nextLogs = new Array(newExercise.sets).fill(null).map(() => ({
        done: false,
        reps:
          typeof newExercise.reps === "string"
            ? parseInt(newExercise.reps.split("-")[0]) || 10
            : newExercise.reps,
        weight: newExercise.weight,
      }));
      return { ...prev, [currentExerciseIndex]: nextLogs };
    });

    setShowSwapSheet(false);
    setShowGuide(false);
    showToast(
      isArabic
        ? `اتبدّل لـ${newExercise.name}. اتعدّل الوزن المقترح.`
        : `Swapped to ${newExercise.name}. Adjusted recommended weight.`,
      "success",
    );
    adaptationBus.dispatch("exercise-substitution", {
      originalId: currentExercise.id,
      newId: newExercise.id,
    });
  };

  const skipExercise = () => {
    setSkippedExercises((prev) => [...prev, currentExercise.id]);
    setShowSkipConfirm(false);
    setShowExerciseOptions(false);

    setExercises((prev) => {
      const next = [...prev];
      const ex = next.splice(currentExerciseIndex, 1)[0];
      next.push(ex);
      return next;
    });

    setSetLogs((prev) => {
      const logs = { ...prev };
      const thisLog = logs[currentExerciseIndex];
      for (let i = currentExerciseIndex; i < exercises.length - 1; i++) {
        logs[i] = logs[i + 1];
      }
      logs[exercises.length - 1] = thisLog;
      return logs;
    });

    adaptationBus.dispatch("exercise-skipped", {
      exerciseId: currentExercise.id,
    });
    showToast(
      isArabic
        ? `تم تخطّي ${currentExercise.name}`
        : `Skipped ${currentExercise.name}`,
      "default",
    );
  };

  const togglePause = () => {
    if (isPaused) {
      if (pausedAt) setTotalPausedMs(totalPausedMs + (Date.now() - pausedAt));
      setPausedAt(null);
      setIsPaused(false);
    } else {
      setPausedAt(Date.now());
      setIsPaused(true);
    }
  };

  // ---- Small shared style atoms ----
  const circleBtn = {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "rgba(210,210,215,0.64)",
  };
  const stepperBtn = {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: colors.canvasParchment,
    borderWidth: 1,
    borderColor: colors.hairline,
  };

  // ---- Per-set row ----
  const renderSetRow = (log: any, idx: number, originalIdx: number) => {
    const prev = getPreviousSet(currentExercise.name, originalIdx);
    const isActive = originalIdx === currentSetLogs.findIndex((s) => !s.done);
    const isRpeActive = rpePromptSetIdx === originalIdx;

    let bg = colors.canvas;
    let border = colors.hairline;
    if (log.isWarmup) {
      bg = colors.canvasParchment;
      border = colors.hairline;
    } else if (log.done) {
      bg = colors.canvasParchment;
      border = withAlpha(colors.primary, 0.3);
    } else if (isActive) {
      bg = colors.canvas;
      border = withAlpha(colors.primary, 0.4);
    }

    // badge styling
    let badgeBg = colors.canvasParchment;
    let badgeBorder = colors.hairline;
    let badgeText = colors.inkMuted48;
    if (log.done) {
      badgeBg = colors.primary;
      badgeBorder = colors.primary;
      badgeText = "#fff";
    } else if (log.isWarmup) {
      badgeBg = "transparent";
      badgeBorder = withAlpha(colors.primary, 0.2);
      badgeText = colors.primary;
    } else if (isActive) {
      badgeBg = colors.canvas;
      badgeBorder = colors.primary;
      badgeText = colors.primary;
    }

    return (
      <View
        key={originalIdx}
        style={{
          overflow: "hidden",
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          backgroundColor: bg,
          borderColor: border,
        }}
      >
        {isRpeActive ? (
          <Animated.View
            entering={FadeInRight}
            style={{ alignItems: "center", gap: 12, paddingVertical: 4 }}
          >
            <AppText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.ink,
                textTransform: isArabic ? "none" : "uppercase",
                letterSpacing: 1,
                fontFamily: fontFamily(isArabic, 600),
              }}
            >
              {isArabic ? "إيه رأيك؟" : "How was that?"}
            </AppText>
            <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
              {[
                { label: isArabic ? "سهل" : "Easy", val: 7 },
                { label: isArabic ? "تمام" : "Solid", val: 8 },
                { label: isArabic ? "صعب" : "Hard", val: 9 },
                { label: isArabic ? "بأقصى مجهود" : "All-out", val: 10 },
              ].map((chip) => (
                <Pressable
                  key={chip.val}
                  onPress={() => handleRpeSelect(originalIdx, chip.val)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.canvas,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                  }}
                >
                  <AppText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: colors.ink,
                      fontFamily: fontFamily(isArabic, 600),
                    }}
                  >
                    {chip.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : (
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              {/* 1. Set badge */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: badgeBg,
                  borderWidth: 1,
                  borderColor: badgeBorder,
                }}
              >
                {log.done ? (
                  <CheckCircle2 size={18} strokeWidth={2.5} color="#fff" />
                ) : log.isWarmup ? (
                  <AppText
                    style={{
                      color: colors.primary,
                      fontSize: 10,
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    W{idx + 1}
                  </AppText>
                ) : (
                  <AppText
                    style={{
                      color: badgeText,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    {idx + 1}
                  </AppText>
                )}
              </View>

              {/* 2. PREVIOUS */}
              <Pressable
                onPress={() =>
                  prev &&
                  !log.done &&
                  handleCopyPrev(currentExerciseIndex, originalIdx, prev)
                }
                disabled={!prev || log.done}
                style={{ width: 72, gap: 2 }}
              >
                <AppText
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: colors.inkMuted48,
                  }}
                >
                  {isArabic ? "السابق" : "PREVIOUS"}
                </AppText>
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.ink,
                  }}
                >
                  {prev
                    ? `${prev.reps} × ${prev.weight}${user.weightUnit === "kg" ? "k" : "l"}`
                    : "—"}
                </AppText>
              </Pressable>

              {/* 3. REPS */}
              <View style={{ width: 64, alignItems: "center" }}>
                <AppText
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: colors.inkMuted48,
                    marginBottom: 2,
                  }}
                >
                  {isArabic ? "تكرار" : "REPS"}
                </AppText>
                <TextInput
                  value={String(log.reps)}
                  editable={!log.done}
                  keyboardType="number-pad"
                  onChangeText={(t) =>
                    setReps(currentExerciseIndex, originalIdx, parseInt(t) || 0)
                  }
                  style={{
                    width: "100%",
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: "600",
                    color: log.isWarmup ? colors.inkMuted48 : colors.ink,
                    padding: 0,
                    marginBottom: 4,
                  }}
                />
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <Pressable
                    disabled={log.done}
                    onPress={() =>
                      updateReps(currentExerciseIndex, originalIdx, -1)
                    }
                    style={[stepperBtn, { opacity: log.done ? 0.5 : 1 }]}
                  >
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}>
                      −
                    </AppText>
                  </Pressable>
                  <Pressable
                    disabled={log.done}
                    onPress={() =>
                      updateReps(currentExerciseIndex, originalIdx, 1)
                    }
                    style={[stepperBtn, { opacity: log.done ? 0.5 : 1 }]}
                  >
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}>
                      +
                    </AppText>
                  </Pressable>
                </View>
              </View>

              {/* 4. WEIGHT */}
              <View style={{ width: 80, alignItems: "center" }}>
                <AppText
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: colors.inkMuted48,
                    marginBottom: 2,
                  }}
                >
                  {isArabic ? "وزن" : "WEIGHT"}
                </AppText>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  <TextInput
                    value={String(log.weight)}
                    editable={!log.done}
                    keyboardType="numeric"
                    onChangeText={(t) =>
                      setWeight(
                        currentExerciseIndex,
                        originalIdx,
                        parseFloat(t) || 0,
                      )
                    }
                    style={{
                      width: 48,
                      textAlign: "center",
                      fontSize: 16,
                      fontWeight: "600",
                      color: log.isWarmup ? colors.inkMuted48 : colors.ink,
                      padding: 0,
                      marginBottom: 4,
                    }}
                  />
                  <AppText
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      textTransform: "uppercase",
                      marginLeft: 2,
                      color: colors.inkMuted48,
                    }}
                  >
                    {user.weightUnit}
                  </AppText>
                  {log.plateBreakdown && (
                    <Pressable
                      onPress={() => setSelectedPlateSet(log)}
                      style={{ marginLeft: 4, padding: 2 }}
                    >
                      <Layers size={14} color={colors.inkMuted48} />
                    </Pressable>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <Pressable
                    disabled={log.done}
                    onPress={() =>
                      updateWeight(
                        currentExerciseIndex,
                        originalIdx,
                        user.weightUnit === "kg" ? -2.5 : -5,
                      )
                    }
                    style={[stepperBtn, { opacity: log.done ? 0.5 : 1 }]}
                  >
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}>
                      −
                    </AppText>
                  </Pressable>
                  <Pressable
                    disabled={log.done}
                    onPress={() =>
                      updateWeight(
                        currentExerciseIndex,
                        originalIdx,
                        user.weightUnit === "kg" ? 2.5 : 5,
                      )
                    }
                    style={[stepperBtn, { opacity: log.done ? 0.5 : 1 }]}
                  >
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}>
                      +
                    </AppText>
                  </Pressable>
                </View>
              </View>

              {/* 5. CHECK */}
              <Pressable
                onPress={() => toggleSet(currentExerciseIndex, originalIdx)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 2,
                  marginLeft: isArabic ? 0 : "auto",
                  marginRight: isArabic ? "auto" : 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: log.done ? colors.primary : colors.canvas,
                  borderColor: log.done ? colors.primary : colors.hairline,
                }}
              >
                <CheckCircle2
                  size={20}
                  strokeWidth={2.5}
                  color={log.done ? "#fff" : colors.hairline}
                />
              </Pressable>
            </View>

            {/* Inline plate preview for active set */}
            {isActive && log.plateBreakdown && (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                  paddingTop: 6,
                  marginTop: 2,
                  alignItems: "center",
                }}
              >
                <PlateBar
                  barWeightKg={log.plateBreakdown.barWeightKg}
                  perSide={log.plateBreakdown.perSide}
                  unit={log.plateBreakdown.unit}
                  isArabic={isArabic}
                  compact
                  displayUnit={user.weightUnit}
                />
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const coachData = COACHES.find((c) => c.id === user.coach) ?? COACHES[0];
  const setsLabelCount = Array.isArray(currentExercise?.sets)
    ? currentExercise.sets.length
    : currentExercise?.sets;
  const doneCount = currentSetLogs.filter((s) => s.done).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 24,
          height: insets.top + 72,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.canvas,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
          zIndex: 40,
        }}
      >
        <Pressable onPress={() => setShowEndConfirmation(true)} accessibilityRole="button" accessibilityLabel={isArabic ? "إنهاء التمرين" : "End workout"} style={circleBtn}>
          <X size={20} strokeWidth={2.5} color={colors.ink} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <AppText
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: colors.primary,
              textTransform: isArabic ? "none" : "uppercase",
              letterSpacing: 0.5,
              marginBottom: 2,
              fontFamily: fontFamily(isArabic, 600),
            }}
          >
            {isArabic ? "نشط" : "ACTIVE"}
          </AppText>
          <AppText
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.ink,
              letterSpacing: -0.3,
            }}
          >
            {formatTime(timer)}
          </AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable onPress={togglePause} style={circleBtn}>
            {isPaused ? (
              <Play size={18} fill={colors.ink} color={colors.ink} />
            ) : (
              <Pause size={18} fill={colors.ink} color={colors.ink} />
            )}
          </Pressable>
          <Pressable onPress={() => setShowSettings(true)} style={circleBtn}>
            <SettingsIcon size={18} strokeWidth={2.5} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {/* Main scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 220,
          maxWidth: 480,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {/* Phase progress bar */}
        {(warmupOn || cooldownOn) && (
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 24 }}>
            {warmupOn && (
              <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 9999,
                    backgroundColor:
                      workoutPhase === "warmup"
                        ? colors.primary
                        : withAlpha(colors.primary, 0.4),
                  }}
                />
                <AppText
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color:
                      workoutPhase === "warmup"
                        ? colors.primary
                        : colors.inkMuted48,
                  }}
                >
                  {isArabic ? "إحماء" : "Warmup"}
                </AppText>
              </View>
            )}
            <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
              <View
                style={{
                  width: "100%",
                  height: 6,
                  borderRadius: 9999,
                  backgroundColor:
                    workoutPhase === "main"
                      ? colors.primary
                      : workoutPhase === "cooldown"
                        ? withAlpha(colors.primary, 0.4)
                        : isDark
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(0,0,0,0.10)",
                }}
              />
              <AppText
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color:
                    workoutPhase === "main"
                      ? colors.primary
                      : colors.inkMuted48,
                }}
              >
                {isArabic ? "تمرين" : "Main"}
              </AppText>
            </View>
            {cooldownOn && (
              <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
                <View
                  style={{
                    width: "100%",
                    height: 6,
                    borderRadius: 9999,
                    backgroundColor:
                      workoutPhase === "cooldown"
                        ? colors.primary
                        : isDark
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(0,0,0,0.10)",
                  }}
                />
                <AppText
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color:
                      workoutPhase === "cooldown"
                        ? colors.primary
                        : colors.inkMuted48,
                  }}
                >
                  {isArabic ? "تهدئة" : "Cooldown"}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* Exercise nav */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 8,
            paddingVertical: 8,
            paddingHorizontal: 4,
            flexDirection: isArabic ? "row-reverse" : "row",
          }}
          style={{ marginBottom: 32 }}
        >
          {phaseExercises.map((_, i) => {
            const actualIndex = phaseStartIndex + i;
            const selected = currentExerciseIndex === actualIndex;
            return (
              <Pressable
                key={actualIndex}
                onPress={() => {
                  if (restTimer !== null) return;
                  setCurrentExerciseIndex(actualIndex);
                  setShowGuide(false);
                }}
                style={{
                  minWidth: 36,
                  height: 36,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  backgroundColor: selected ? colors.primary : colors.canvas,
                  borderColor: selected ? colors.primary : colors.hairline,
                }}
              >
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: selected ? "#fff" : colors.ink,
                  }}
                >
                  {i + 1}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Animated.View key={currentExerciseIndex} entering={FadeInRight}>
          {/* Hero card */}
          <View
            style={{
              backgroundColor: colors.canvas,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 14,
              overflow: "hidden",
              marginBottom: 24,
            }}
          >
            <View style={{ width: "100%", aspectRatio: showGuide ? 1 : 16 / 9 }}>
              <Image
                source={{ uri: currentExercise?.image }}
                style={{ width: "100%", height: "100%", opacity: 0.9 }}
                contentFit="cover"
              />
            </View>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pressable
                onPress={() => setIsVideoPlaying(!isVideoPlaying)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isVideoPlaying ? (
                  <Pause size={24} fill="#fff" color="#fff" />
                ) : (
                  <Play size={24} fill="#fff" color="#fff" style={{ marginLeft: 4 }} />
                )}
              </Pressable>
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                right: 16,
                flexDirection: isArabic ? "row-reverse" : "row",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <View
                style={{
                  backgroundColor: colors.canvas,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                }}
              >
                <AppText
                  style={{
                    color: colors.ink,
                    fontSize: 11,
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {isArabic
                    ? `تمرين ${localExerciseIndex + 1} / ${phaseExercises.length}`
                    : `Ex. ${localExerciseIndex + 1} / ${phaseExercises.length}`}
                </AppText>
              </View>
            </View>
          </View>

          {/* Form guide toggle */}
          <Pressable
            onPress={() => setShowGuide(!showGuide)}
            style={{
              height: 44,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: colors.hairline,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: isArabic ? "row-reverse" : "row",
              gap: 8,
              marginBottom: 32,
            }}
          >
            <Info size={16} color={colors.primary} />
            <AppText
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: colors.primary,
                textTransform: isArabic ? "none" : "uppercase",
                fontFamily: fontFamily(isArabic, 600),
              }}
            >
              {showGuide
                ? isArabic
                  ? "إخفاء دليل الأداء"
                  : "Hide Form Guide"
                : isArabic
                  ? "اعرض دليل الأداء"
                  : "View Form Guide"}
            </AppText>
          </Pressable>

          {showGuide && (
            <Animated.View entering={FadeIn} style={{ marginBottom: 32 }}>
              <View
                style={{
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: 14,
                  padding: 24,
                  gap: 16,
                }}
              >
                {currentExercise?.instructions?.map(
                  (step: string, i: number) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: isArabic ? "row-reverse" : "row",
                        gap: 16,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          backgroundColor: colors.canvasParchment,
                          borderWidth: 1,
                          borderColor: colors.hairline,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AppText
                          style={{ fontSize: 12, fontWeight: "600", color: colors.ink }}
                        >
                          {i + 1}
                        </AppText>
                      </View>
                      <AppText
                        variant="body"
                        style={{
                          flex: 1,
                          color: colors.ink,
                          textAlign: isArabic ? "right" : "left",
                        }}
                      >
                        {step}
                      </AppText>
                    </View>
                  ),
                )}
                {currentExercise?.proTip && (
                  <View
                    style={{
                      backgroundColor: colors.canvasParchment,
                      borderRadius: 8,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      marginTop: 4,
                      flexDirection: isArabic ? "row-reverse" : "row",
                      gap: 12,
                    }}
                  >
                    <Flame size={16} color={colors.primary} style={{ marginTop: 2 }} />
                    <AppText
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontStyle: "italic",
                        color: colors.ink,
                        lineHeight: 19,
                        textAlign: isArabic ? "right" : "left",
                      }}
                    >
                      {currentExercise.proTip}
                    </AppText>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Exercise info */}
          <View style={{ alignItems: "center", gap: 8, marginBottom: 40, paddingHorizontal: 16 }}>
            {skippedExercises.includes(currentExercise?.id) && (
              <View
                style={{
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <AppText
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: "700",
                    color: colors.inkMuted48,
                  }}
                >
                  {isArabic ? "تم تأجيله من قبل" : "Skipped earlier"}
                </AppText>
              </View>
            )}
            {workoutPhase === "main" && (
              <Pressable
                onPress={handleSwapClick}
                style={{
                  position: "absolute",
                  top: 0,
                  right: isArabic ? undefined : 0,
                  left: isArabic ? 0 : undefined,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MoreVertical size={20} strokeWidth={2.5} color={colors.ink} />
              </Pressable>
            )}
            <AppText
              variant="section-title"
              style={{ color: colors.ink, textTransform: "uppercase", textAlign: "center" }}
            >
              {currentExercise?.name}
            </AppText>
            <View
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.inkMuted48,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {setsLabelCount} {isArabic ? "الجولات" : "Sets"}
              </AppText>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.hairline }} />
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.inkMuted48,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {currentExercise?.reps} {isArabic ? "التكرارات" : "Reps"}
              </AppText>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.hairline }} />
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.inkMuted48,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {formatWeight(currentExercise?.weight, user.weightUnit)}
              </AppText>
            </View>
            <Pressable
              onPress={() =>
                router.push(`/exercise/${currentExercise?.id || "bench_press"}`)
              }
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Zap size={14} color={colors.primary} />
              <AppText
                style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}
              >
                {isArabic ? "عرض تقدم التمرين" : "View progression"}
              </AppText>
            </Pressable>
          </View>

          {/* Set tracker */}
          <View>
            <View
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                paddingHorizontal: 4,
              }}
            >
              <AppText
                variant="title"
                style={{ color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                {isArabic ? "الجولات" : "Sets"}
              </AppText>
              <View
                style={{
                  flexDirection: isArabic ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <AppText
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.primary,
                    textTransform: "uppercase",
                  }}
                >
                  {doneCount} / {currentSetLogs.length}
                </AppText>
                <View
                  style={{
                    width: 64,
                    height: 4,
                    borderRadius: 9999,
                    backgroundColor: colors.hairline,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      backgroundColor: colors.primary,
                      width: `${(doneCount / Math.max(1, currentSetLogs.length)) * 100}%`,
                    }}
                  />
                </View>
              </View>
            </View>

            {(() => {
              const mappedSets = currentSetLogs.map((log, originalIdx) => ({
                log,
                originalIdx,
              }));
              const warmupSets = mappedSets.filter((item) => item.log.isWarmup);
              const workingSets = mappedSets.filter((item) => !item.log.isWarmup);
              const hasWarmups = warmupSets.length > 0;
              const hasUndoneWarmup = warmupSets.some((item) => !item.log.done);
              const skipWarmupsUsed = skippedWarmups[currentExerciseIndex];

              return (
                <View style={{ gap: 12 }}>
                  {hasWarmups && (
                    <View
                      style={{
                        backgroundColor: withAlpha(colors.primary, isDark ? 0.1 : 0.05),
                        padding: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: withAlpha(colors.primary, 0.1),
                      }}
                    >
                      {!skipWarmupsUsed && hasUndoneWarmup && (
                        <Pressable
                          onPress={handleSkipWarmups}
                          style={{
                            flexDirection: isArabic ? "row-reverse" : "row",
                            alignItems: "center",
                            gap: 4,
                            marginBottom: 8,
                            alignSelf: "flex-start",
                          }}
                        >
                          <SkipForward size={14} color={colors.primary} />
                          <AppText
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: colors.primary,
                              textDecorationLine: "underline",
                            }}
                          >
                            {isArabic
                              ? "تعدي الإحماء — أنا متسخّن"
                              : "Skip warmups — I'm already warm"}
                          </AppText>
                        </Pressable>
                      )}
                      <AppText
                        style={{
                          fontSize: 12,
                          color: colors.inkMuted48,
                          lineHeight: 16,
                          textAlign: isArabic ? "right" : "left",
                        }}
                      >
                        {isArabic
                          ? "الإحماء بيوصلك للوزن الأساسي. متعديهوش."
                          : "Warmup builds you up to your working weight. Don't skip it."}
                      </AppText>
                    </View>
                  )}

                  {warmupSets.length > 0 && (
                    <View style={{ gap: 12 }}>
                      {warmupSets.map((item, idx) =>
                        renderSetRow(item.log, idx, item.originalIdx),
                      )}
                    </View>
                  )}

                  {hasWarmups && workingSets.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                      }}
                    >
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
                      <AppText
                        style={{
                          marginHorizontal: 16,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          fontWeight: "700",
                          color: colors.inkMuted48,
                        }}
                      >
                        {isArabic ? "السيتات الأساسية" : "WORKING SETS"}
                      </AppText>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
                    </View>
                  )}

                  <View style={{ gap: 12 }}>
                    {workingSets.map((item, idx) =>
                      renderSetRow(item.log, idx, item.originalIdx),
                    )}
                  </View>
                </View>
              );
            })()}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Coach FAB */}
      <Pressable
        onPress={() => setShowCoachSheet(true)}
        style={{
          position: "absolute",
          bottom: insets.bottom + 110,
          right: isArabic ? undefined : 24,
          left: isArabic ? 24 : undefined,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.canvas,
          borderWidth: 1,
          borderColor: colors.hairline,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 40,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.primary,
            zIndex: 1,
          }}
        />
        <CoachAvatar coachId={user.coach || "khaled"} size={48} verified />
      </Pressable>

      {/* Footer controls */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: colors.canvas,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          zIndex: 50,
        }}
      >
        <View
          style={{
            maxWidth: 480,
            width: "100%",
            alignSelf: "center",
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Pressable
            onPress={handlePrevious}
            disabled={currentExerciseIndex === 0}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(210,210,215,0.64)",
              alignItems: "center",
              justifyContent: "center",
              opacity: currentExerciseIndex === 0 ? 0.2 : 1,
            }}
          >
            <SkipBack size={20} fill={colors.ink} color={colors.ink} strokeWidth={0} />
          </Pressable>
          <Pressable
            onPress={togglePause}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "rgba(210,210,215,0.64)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPaused ? (
              <Play size={20} fill={colors.ink} color={colors.ink} strokeWidth={0} style={{ marginLeft: 2 }} />
            ) : (
              <Pause size={20} fill={colors.ink} color={colors.ink} strokeWidth={0} />
            )}
          </Pressable>
          <Pressable
            onPress={handleNext}
            style={{
              flex: 1,
              height: 56,
              backgroundColor: colors.primary,
              borderRadius: 9999,
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <AppText
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: "600",
                textTransform: isArabic ? "none" : "uppercase",
                letterSpacing: -0.3,
                fontFamily: fontFamily(isArabic, 600),
              }}
            >
              {currentExerciseIndex === exercises.length - 1
                ? isArabic
                  ? "إنهي"
                  : "Finish"
                : isArabic
                  ? "التالي"
                  : "Next"}
            </AppText>
            <SkipForward size={18} fill="#fff" color="#fff" strokeWidth={0} />
          </Pressable>
        </View>
      </View>

      {/* Pause overlay */}
      {isPaused && (
        <Animated.View
          entering={FadeIn}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            zIndex: 105,
          }}
        >
          <View style={{ alignItems: "center", maxWidth: 360, width: "100%" }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Pause size={36} fill="#fff" color="#fff" />
            </View>
            <AppText style={{ fontSize: 28, fontWeight: "600", color: "#fff", marginBottom: 8 }}>
              {isArabic ? "متوقف" : "Paused"}
            </AppText>
            <AppText
              style={{
                fontSize: 15,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 32,
                textAlign: "center",
              }}
            >
              {isArabic
                ? "الوقت متوقف. ارجع لما تكون جاهز."
                : "Timer paused. Come back when you're ready."}
            </AppText>
            <View style={{ width: "100%", gap: 12 }}>
              <Pressable
                onPress={togglePause}
                style={{
                  width: "100%",
                  height: 56,
                  backgroundColor: "#fff",
                  borderRadius: 9999,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Play size={20} fill={colors.ink} color={colors.ink} />
                <AppText style={{ color: colors.ink, fontSize: 16, fontWeight: "600" }}>
                  {isArabic ? "استكمل" : "Resume"}
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsPaused(false);
                  setPausedAt(null);
                  setShowEndConfirmation(true);
                }}
                style={{
                  width: "100%",
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "500" }}>
                  {isArabic ? "إنهي التمرين" : "End workout"}
                </AppText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Rest timer overlay */}
      {restTimer !== null && (
        <Animated.View
          entering={FadeIn}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.canvas,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
            zIndex: 100,
          }}
        >
          <View style={{ width: "100%", maxWidth: 320, alignItems: "center" }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.canvas,
                borderWidth: 1,
                borderColor: colors.hairline,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              <Clock size={28} color={colors.primary} strokeWidth={2.5} />
            </View>
            <AppText
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: colors.inkMuted48,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 16,
              }}
            >
              {isArabic ? "استراحة" : "RESTING"}
            </AppText>
            <AppText
              variant="stat-value"
              style={{ color: colors.ink, marginBottom: 48 }}
            >
              {restTimer}s
            </AppText>
            <View style={{ width: "100%", gap: 12 }}>
              <Pressable
                onPress={() => setRestTimerWithPersistence(null)}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 9999,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {isArabic ? "تخطي" : "Skip Rest"}
                </AppText>
              </Pressable>
              <Pressable
                onPress={() =>
                  setRestTimerWithPersistence(
                    restTimer !== null ? restTimer + 15 : null,
                  )
                }
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText
                  style={{
                    color: colors.primary,
                    fontSize: 11,
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {isArabic ? "+١٥ ث" : "+15 Seconds"}
                </AppText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Settings modal */}
      {showSettings && (
        <Animated.View
          entering={FadeIn}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            zIndex: 101,
          }}
        >
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setShowSettings(false)}
          />
          <View
            style={{
              backgroundColor: colors.canvas,
              borderRadius: 14,
              padding: 24,
              width: "100%",
              maxWidth: 360,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <View
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <AppText
                variant="title"
                style={{ color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5 }}
              >
                {isArabic ? "الإعدادات" : "Settings"}
              </AppText>
              <Pressable onPress={() => setShowSettings(false)} accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق" : "Close"} style={circleBtn}>
                <X size={20} color={colors.ink} />
              </Pressable>
            </View>

            <View style={{ gap: 32 }}>
              <View>
                <AppText
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: colors.inkMuted48,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 16,
                  }}
                >
                  {isArabic ? "مدة الراحة" : "Rest Duration"}
                </AppText>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[30, 45, 60, 90].map((duration) => {
                    const active = user.restDurationSets === duration;
                    return (
                      <Pressable
                        key={duration}
                        onPress={() => updateRestDuration("sets", duration)}
                        style={{
                          flex: 1,
                          height: 40,
                          borderRadius: 8,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          backgroundColor: active ? colors.primary : colors.canvas,
                          borderColor: active ? colors.primary : colors.hairline,
                        }}
                      >
                        <AppText
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            textTransform: "uppercase",
                            color: active ? "#fff" : colors.ink,
                          }}
                        >
                          {duration}s
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={() => setShowSettings(false)}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 9999,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {isArabic ? "حفظ التغييرات" : "Apply Changes"}
                </AppText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Exercise Options Sheet */}
      <BottomSheet
        isOpen={showExerciseOptions}
        onClose={() => setShowExerciseOptions(false)}
        title={isArabic ? "خيارات التمرين" : "Exercise Options"}
      >
        <View style={{ gap: 12, paddingVertical: 8 }}>
          {[
            {
              icon: <RefreshCw size={20} color={colors.primary} />,
              label: isArabic ? "غيّر التمرين" : "Swap exercise",
              onPress: () => {
                setShowExerciseOptions(false);
                setShowSwapSheet(true);
              },
              soon: false,
              dim: false,
            },
            {
              icon: <SkipForward size={20} color={colors.inkMuted48} />,
              label: isArabic ? "تخطّى التمرين" : "Skip exercise",
              onPress: () => {
                setShowExerciseOptions(false);
                setShowSkipConfirm(true);
              },
              soon: false,
              dim: false,
            },
            {
              icon: <Plus size={20} color={colors.inkMuted48} />,
              label: isArabic ? "ضيف ملاحظة" : "Add a note",
              onPress: () => setShowExerciseOptions(false),
              soon: true,
              dim: true,
            },
          ].map((opt, i) => (
            <Pressable
              key={i}
              onPress={opt.onPress}
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                padding: 16,
                backgroundColor: colors.canvas,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.hairline,
                opacity: opt.dim ? 0.6 : 1,
              }}
            >
              <View style={{ marginRight: isArabic ? 0 : 16, marginLeft: isArabic ? 16 : 0 }}>
                {opt.icon}
              </View>
              <AppText variant="body-strong" style={{ color: colors.ink }}>
                {opt.label}
              </AppText>
              {opt.soon && (
                <AppText
                  style={{
                    marginLeft: isArabic ? 0 : "auto",
                    marginRight: isArabic ? "auto" : 0,
                    fontSize: 11,
                    color: colors.inkMuted48,
                  }}
                >
                  ({isArabic ? "قريباً" : "Soon"})
                </AppText>
              )}
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* Skip Confirm */}
      <BottomSheet
        isOpen={showSkipConfirm}
        onClose={() => setShowSkipConfirm(false)}
        title={
          isArabic
            ? `تتخطّى ${currentExercise?.name}؟`
            : `Skip ${currentExercise?.name}?`
        }
      >
        <View style={{ gap: 24, paddingVertical: 16 }}>
          <AppText
            variant="body"
            style={{ color: colors.inkMuted48, textAlign: "center" }}
          >
            {isArabic ? "تقدر ترجعله بعدين." : "You can come back to it later."}
          </AppText>
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={skipExercise}
              style={{
                height: 44,
                borderRadius: 9999,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>
                {isArabic ? "تخطّى" : "Skip"}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setShowSkipConfirm(false)}
              style={{
                height: 44,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={{ color: colors.ink, fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>
                {isArabic ? "إلغاء" : "Cancel"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Swap Sheet */}
      <BottomSheet
        isOpen={showSwapSheet}
        onClose={() => setShowSwapSheet(false)}
        title={
          isArabic ? `غيّر ${currentExercise?.name}` : `Swap ${currentExercise?.name}`
        }
      >
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <AppText
            style={{ fontSize: 11, color: colors.inkMuted48, textAlign: isArabic ? "right" : "left" }}
          >
            {isArabic
              ? "اختار حركة بديلة بتشتغل نفس العضلات"
              : "Pick an alternative that hits the same muscles"}
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, flexDirection: isArabic ? "row-reverse" : "row" }}
          >
            {[
              "What I have",
              "All",
              "barbell",
              "dumbbell",
              "cable",
              "machine",
              "bodyweight",
              "bands",
            ].map((eq) => {
              const isWhatIHave = eq === "What I have";
              const isAll = eq === "All";
              let active = false;
              if (isWhatIHave) {
                active =
                  !swapEquipment.includes("machine") &&
                  swapEquipment.includes("dumbbell");
              } else if (isAll) {
                active = swapEquipment.length === 6;
              } else {
                active = swapEquipment.includes(eq);
              }
              return (
                <Pressable
                  key={eq}
                  onPress={() => {
                    if (isAll)
                      setSwapEquipment([
                        "barbell",
                        "dumbbell",
                        "cable",
                        "machine",
                        "bodyweight",
                        "bands",
                      ]);
                    else if (isWhatIHave)
                      setSwapEquipment(["dumbbell", "bodyweight", "bands"]);
                    else {
                      if (swapEquipment.includes(eq))
                        setSwapEquipment(swapEquipment.filter((e) => e !== eq));
                      else setSwapEquipment([...swapEquipment, eq]);
                    }
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 9999,
                    borderWidth: 1,
                    backgroundColor: active ? colors.primary : colors.canvas,
                    borderColor: active ? colors.primary : colors.hairline,
                  }}
                >
                  <AppText
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      textTransform: "uppercase",
                      color: active ? "#fff" : colors.inkMuted48,
                    }}
                  >
                    {isArabic && eq === "What I have"
                      ? "اللي عندي"
                      : isArabic && eq === "All"
                        ? "الكل"
                        : eq}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ gap: 12, maxHeight: 340 }}>
            {loadSwaps().length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {loadSwaps().map((alt, i) => (
                  <Pressable
                    key={i}
                    onPress={() => swapExercise(alt)}
                    style={{
                      flexDirection: isArabic ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      backgroundColor: colors.canvas,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      borderRadius: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        backgroundColor: colors.canvasParchment,
                        borderWidth: 1,
                        borderColor: colors.hairline,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RefreshCw size={20} color={colors.inkMuted48} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        variant="body-strong"
                        style={{ color: colors.ink, textTransform: "uppercase", textAlign: isArabic ? "right" : "left" }}
                      >
                        {isArabic ? alt.arabicName : alt.name}
                      </AppText>
                      <View
                        style={{
                          flexDirection: isArabic ? "row-reverse" : "row",
                          gap: 8,
                          marginTop: 4,
                        }}
                      >
                        <View style={{ backgroundColor: colors.canvasParchment, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <AppText style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", color: colors.inkMuted48 }}>
                            {alt.primaryMuscle}
                          </AppText>
                        </View>
                        {alt.equipment.map((eq) => (
                          <View key={eq} style={{ backgroundColor: colors.canvasParchment, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                            <AppText style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", color: colors.inkMuted48 }}>
                              {eq}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 24 }}>
                <AppText variant="body" style={{ color: colors.inkMuted48, textAlign: "center", marginBottom: 16 }}>
                  {isArabic
                    ? "مفيش تمارين بديلة جاهزة للمعدات دي."
                    : "No alternative exercises found for these equipment."}
                </AppText>
                <Pressable onPress={skipExercise}>
                  <AppText style={{ color: colors.primary, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>
                    {isArabic ? "تخطّى هذا التمرين" : "Skip this exercise"}
                  </AppText>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </BottomSheet>

      {/* End Workout Confirmation */}
      <BottomSheet
        isOpen={showEndConfirmation}
        onClose={() => setShowEndConfirmation(false)}
        title={isArabic ? "إنهاء التمرين؟" : "End workout?"}
      >
        <View style={{ gap: 24, paddingVertical: 16 }}>
          <AppText variant="body" style={{ color: colors.inkMuted48, textAlign: "center" }}>
            {isArabic ? "سيتم حفظ تقدمك." : "Your progress will be saved."}
          </AppText>
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={() => setShowEndConfirmation(false)}
              style={{
                height: 44,
                borderRadius: 9999,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>
                {isArabic ? "متابعة" : "Continue Workout"}
              </AppText>
            </Pressable>
            <Pressable
              onPress={finishWorkout}
              style={{
                height: 44,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={{ color: colors.ink, fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>
                {isArabic ? "حفظ والخروج" : "Save & Exit"}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => {
                removeItem(ACTIVE_WORKOUT_KEY);
                router.replace("/fitness");
              }}
              style={{ height: 44, alignItems: "center", justifyContent: "center" }}
            >
              <AppText style={{ color: colors.semanticRed, fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>
                {isArabic ? "إلغاء" : "Discard"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Resume Prompt */}
      <BottomSheet
        isOpen={showResumePrompt}
        onClose={handleDiscardResume}
        title={isArabic ? "متابعة التمرين؟" : "Resume workout?"}
      >
        <View style={{ gap: 24, paddingVertical: 16 }}>
          <AppText variant="body" style={{ color: colors.inkMuted48, textAlign: "center" }}>
            {isArabic
              ? "يبدو أنك لم تكمل تمرينك السابق. هل ترغب في المتابعة من حيث توقفت؟"
              : "It looks like you didn't finish your last workout. Would you like to continue from where you left off?"}
          </AppText>
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleResume}
              style={{
                height: 44,
                borderRadius: 9999,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>
                {isArabic ? "متابعة" : "Resume"}
              </AppText>
            </Pressable>
            <Pressable
              onPress={handleDiscardResume}
              style={{
                height: 44,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={{ color: colors.ink, fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>
                {isArabic ? "إلغاء" : "Discard"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Coach Sheet */}
      <BottomSheet
        isOpen={showCoachSheet}
        onClose={() => {
          setShowCoachSheet(false);
          setTimeout(() => setAskCoachState("questions"), 300);
        }}
        title={isArabic ? `اسأل ${coachData.arabicName}` : `Ask ${coachData.name}`}
      >
        <View>
          {askCoachState === "questions" && (
            <>
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.inkMuted48,
                  marginBottom: 12,
                  textTransform: isArabic ? "none" : "uppercase",
                  letterSpacing: isArabic ? 0 : 1.5,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: fontFamily(isArabic, 600),
                }}
              >
                {isArabic ? "أسئلة سريعة" : "QUICK QUESTIONS"}
              </AppText>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                {[
                  { id: "weight", en: "Is this weight okay?", ar: "الوزن ده مناسب؟" },
                  { id: "replace", en: "Replace this exercise", ar: "استبدل التمرين" },
                  { id: "rest", en: "How long should I rest?", ar: "أرتاح قد إيه؟" },
                  { id: "pain", en: "I feel pain", ar: "حاسس بألم" },
                  { id: "easy", en: "Too easy", ar: "سهل أوي" },
                  { id: "target", en: "What does this target?", ar: "بيشتغل على إيه؟" },
                ].map((q) => (
                  <Pressable
                    key={q.id}
                    onPress={() => handleCoachQuestion(q.id)}
                    style={{
                      width: "47%",
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      backgroundColor: colors.canvas,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: colors.ink,
                        textTransform: isArabic ? "none" : "uppercase",
                        letterSpacing: isArabic ? 0 : 0.5,
                        textAlign: isArabic ? "right" : "left",
                        fontFamily: fontFamily(isArabic, 600),
                      }}
                    >
                      {isArabic ? q.ar : q.en}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <View
                style={{
                  height: 48,
                  marginTop: 8,
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: 14,
                  justifyContent: "center",
                  paddingHorizontal: 16,
                  opacity: 0.6,
                }}
              >
                <AppText
                  style={{
                    fontSize: 11,
                    color: colors.inkMuted48,
                    textAlign: isArabic ? "right" : "left",
                  }}
                >
                  {isArabic
                    ? "الدردشة الصوتية والنصية قريباً"
                    : "Voice & text chat coming soon"}
                </AppText>
              </View>
            </>
          )}

          {askCoachState === "thinking" && (
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 16 }}>
              <CoachAvatar coachId={user.coach || "khaled"} size={32} />
              <View
                style={{
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TypingDots color={colors.inkMuted48} />
              </View>
            </View>
          )}

          {askCoachState === "reply" && (
            <View>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 16 }}>
                <CoachAvatar coachId={user.coach || "khaled"} size={32} />
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.canvas,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <AppText
                    style={{
                      color: colors.ink,
                      fontSize: 15,
                      lineHeight: 22,
                      textAlign: isArabic ? "right" : "left",
                    }}
                  >
                    {askCoachReply}
                  </AppText>
                </View>
              </View>
              <Pressable
                onPress={() => setAskCoachState("questions")}
                style={{ marginTop: 24, alignSelf: isArabic ? "flex-end" : "flex-start" }}
              >
                <AppText style={{ fontSize: 11, color: colors.inkMuted48 }}>
                  {isArabic ? "← الرجوع للأسئلة" : "← Back to questions"}
                </AppText>
              </Pressable>
            </View>
          )}
        </View>
      </BottomSheet>

      {/* Plate Breakdown Sheet */}
      <BottomSheet
        isOpen={selectedPlateSet !== null}
        onClose={() => setSelectedPlateSet(null)}
        title={isArabic ? "تفاصيل الأوزان" : "Plate breakdown"}
      >
        {selectedPlateSet?.plateBreakdown &&
          (() => {
            const pb = selectedPlateSet.plateBreakdown;
            const activeDisplayUnit = user.weightUnit || pb.unit;
            const isKgToLb = pb.unit === "kg" && activeDisplayUnit === "lb";
            const isLbToKg = pb.unit === "lb" && activeDisplayUnit === "kg";
            const convert = (val: number) => {
              if (isKgToLb) return Math.round(val * 2.20462 * 2) / 2;
              if (isLbToKg) return Math.round(val * 0.453592 * 2) / 2;
              return val;
            };
            const displayPerSide = pb.perSide.map((p: any) => ({
              count: p.count,
              plateKg: convert(p.plateKg),
            }));
            const unitLabel =
              activeDisplayUnit === "kg"
                ? isArabic
                  ? "كجم"
                  : "kg"
                : isArabic
                  ? "رطل"
                  : "lb";
            const displayBar = convert(pb.barWeightKg);
            const totalPlates = pb.perSide.reduce(
              (sum: number, p: any) => sum + p.plateKg * p.count,
              0,
            );
            const displayTotal = displayBar + 2 * convert(totalPlates);

            return (
              <View style={{ gap: 24, paddingVertical: 16 }}>
                <View
                  style={{
                    backgroundColor: colors.canvasParchment,
                    padding: 16,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    alignItems: "center",
                  }}
                >
                  <PlateBar
                    barWeightKg={pb.barWeightKg}
                    perSide={pb.perSide}
                    unit={pb.unit}
                    isArabic={isArabic}
                    compact={false}
                    displayUnit={user.weightUnit}
                  />
                </View>

                <View style={{ gap: 12 }}>
                  <AppText
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      letterSpacing: 1,
                      color: colors.inkMuted48,
                      textTransform: "uppercase",
                      textAlign: isArabic ? "right" : "left",
                    }}
                  >
                    {isArabic
                      ? "كل جنب، من الأكبر للأصغر:"
                      : "Per side, largest to smallest:"}
                  </AppText>

                  {displayPerSide.length === 0 ? (
                    <AppText variant="body" style={{ fontStyle: "italic", color: colors.inkMuted48 }}>
                      {isArabic
                        ? "مفيش أوزان تانية محطوطة على البار."
                        : "No plates loaded on the bar."}
                    </AppText>
                  ) : (
                    displayPerSide.map((p: any, idx: number) => {
                      const { fill } = getPlateColor(p.plateKg, activeDisplayUnit, isDark);
                      return (
                        <View
                          key={idx}
                          style={{
                            flexDirection: isArabic ? "row-reverse" : "row",
                            alignItems: "center",
                            gap: 12,
                            padding: 12,
                            backgroundColor: colors.canvas,
                            borderWidth: 1,
                            borderColor: colors.hairline,
                            borderRadius: 14,
                          }}
                        >
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              backgroundColor: fill,
                              borderWidth: 1,
                              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                            }}
                          />
                          <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink }}>
                            {p.count} × {p.plateKg} {unitLabel}
                          </AppText>
                        </View>
                      );
                    })
                  )}
                </View>

                <AppText
                  style={{
                    fontSize: 12,
                    lineHeight: 18,
                    color: colors.inkMuted48,
                    opacity: 0.8,
                    textAlign: isArabic ? "right" : "left",
                  }}
                >
                  {isArabic
                    ? "هتلاقي الأوزان الأولمبية المعتادة. عدّل يدويًا لو الجيم بتاعك مختلف."
                    : "Showing standard Olympic plates. Adjust manually if your gym is different."}
                </AppText>

                <View
                  style={{
                    paddingTop: 16,
                    borderTopWidth: 1,
                    borderTopColor: colors.hairline,
                    flexDirection: isArabic ? "row-reverse" : "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <AppText variant="body-strong" style={{ color: colors.ink }}>
                    {isArabic ? "الإجمالي الكلي" : "Grand Total"}
                  </AppText>
                  <AppText style={{ fontSize: 20, fontWeight: "700", color: colors.primary }}>
                    {displayTotal} {unitLabel}
                  </AppText>
                </View>

                <Pressable
                  onPress={() => setSelectedPlateSet(null)}
                  style={{
                    width: "100%",
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                    {isArabic ? "تمام" : "Done"}
                  </AppText>
                </Pressable>
              </View>
            );
          })()}
      </BottomSheet>
    </View>
  );
}
