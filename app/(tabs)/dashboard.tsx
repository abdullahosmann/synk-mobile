/**
 * Dashboard — RN port of src/screens/main/Dashboard.tsx (full parity).
 *
 * Default-visible surface: week strip, personalized greeting + coach line +
 * streak chip, the active-workout banner, past/future selected-day message,
 * welcome / missed-workout / morning-check-in / AI-adaptation cards, the
 * workout card (rest-day "Active Recovery" + active-day hero + past
 * "no workout logged" + future "planned workout" variants), the nutrition card
 * (calorie ring + macro bars + quick-add + past/future states), and the
 * empty state when every card is hidden.
 *
 * The 6 optional cards (hydration/recovery/analytics/challenges/leaderboard/
 * coachChat) are off by default and surfaced via Customize; each renders its
 * full rich inline body (1:1 with web): hydration quick-add, recovery bars,
 * the analytics mini-chart + metrics, the challenge progress card, the
 * leaderboard rows, and the coach-chat message/voice shortcuts.
 *
 * The Customize sheet persists both visibility (synk:dashboardCards) and order
 * (synk:dashboardCardOrder) — drag-to-reorder via the grip handle (gesture
 * Pan + reanimated absolute layout) plus a two-step reset-to-default.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import {
  Activity,
  Coffee,
  Plus,
  X,
  Flame,
  SlidersHorizontal,
  MessageCircle,
  ArrowRight,
  Play,
  ChevronRight,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Mic,
  GripVertical,
} from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { useColors, useTheme } from "../../src/theme/ThemeProvider";
import CoachAvatar from "../../src/components/CoachAvatar";
import BottomSheet from "../../src/components/BottomSheet";
import { Toggle } from "../../src/components/ui/Toggle";
import { AppText } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";
import { getItem, setItem } from "../../src/lib/storage";
import { computePlanPreview } from "../../src/lib/planUtils";
import { getWorkoutForDate } from "../../src/lib/workoutSelection";
import { getCoachLineForDay } from "../../src/lib/coachLines";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CARD_KEYS = [
  "workout", "nutrition", "hydration", "recovery",
  "analytics", "challenges", "leaderboard", "coachChat",
] as const;
type CardKey = (typeof CARD_KEYS)[number];

const DEFAULT_CARDS: Record<CardKey, boolean> = {
  workout: true, nutrition: true, hydration: false, recovery: false,
  analytics: false, challenges: false, leaderboard: false, coachChat: false,
};

const DEFAULT_ORDER: CardKey[] = [...CARD_KEYS];

const ROW_H = 60; // 52px row + 8px gap

// Reorderable customize row — web's Reorder.Item (drag handle) → gesture-handler
// Pan on the grip + reanimated absolute layout, the same pattern as PreSession.
function CustomizeRow({
  cardKey, label, enabled, positions, count, isArabic, colors, onToggle, commitOrder,
}: {
  cardKey: CardKey;
  label: string;
  enabled: boolean;
  positions: { value: Record<string, number> };
  count: number;
  isArabic: boolean;
  colors: ReturnType<typeof useColors>;
  onToggle: () => void;
  commitOrder: () => void;
}) {
  const isActive = useSharedValue(false);
  const top = useSharedValue(0);
  const startTop = useSharedValue(0);

  useAnimatedReaction(
    () => positions.value[cardKey],
    (slot, prev) => {
      if (slot == null) return;
      if (prev == null) top.value = slot * ROW_H;
      else if (!isActive.value) top.value = withSpring(slot * ROW_H, { damping: 30, stiffness: 350 });
    },
  );

  const pan = Gesture.Pan()
    .onStart(() => { isActive.value = true; startTop.value = top.value; })
    .onUpdate((e) => {
      top.value = startTop.value + e.translationY;
      const newSlot = Math.max(0, Math.min(Math.round(top.value / ROW_H), count - 1));
      const oldSlot = positions.value[cardKey];
      if (newSlot !== oldSlot) {
        const swapId = Object.keys(positions.value).find((k) => positions.value[k] === newSlot);
        const next = { ...positions.value };
        next[cardKey] = newSlot;
        if (swapId) next[swapId] = oldSlot;
        positions.value = next;
      }
    })
    .onEnd(() => {
      top.value = withSpring((positions.value[cardKey] ?? 0) * ROW_H, { damping: 30, stiffness: 350 });
      isActive.value = false;
      runOnJS(commitOrder)();
    });

  const style = useAnimatedStyle(() => ({
    position: "absolute", left: 0, right: 0, top: top.value,
    zIndex: isActive.value ? 100 : 1,
    transform: [{ scale: withTiming(isActive.value ? 1.02 : 1, { duration: 120 }) }],
  }));

  return (
    <Animated.View style={style}>
      <View style={{ height: 52, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, backgroundColor: colors.canvas, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <GestureDetector gesture={pan}>
            <View style={{ width: 28, height: 44, alignItems: "center", justifyContent: "center" }}>
              <GripVertical size={20} color={colors.inkMuted24} />
            </View>
          </GestureDetector>
          <AppText variant="body-strong" style={{ color: colors.ink }}>{label}</AppText>
        </View>
        <Toggle value={enabled} onValueChange={onToggle} />
      </View>
    </Animated.View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, todaysLogs, setTodaysLogs, streaks, selectedDate, setSelectedDate, appMode, pendingAdaptations, setPendingAdaptations, archiveAdaptation } = useAppContext();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const trainingStreak = streaks.find((s) => s.type === "training")?.count ?? 0;

  const coachName = (user.coach || "khaled").charAt(0).toUpperCase() + (user.coach || "khaled").slice(1);

  const todayStr = new Date().toISOString().split("T")[0];
  const hasActiveWorkout = !!getItem("synk:active_workout");
  const currentAdaptation = pendingAdaptations[0];

  const [showWelcome, setShowWelcome] = useState(() => getItem("synk:welcomeShown") !== "true");
  const [showCheckIn, setShowCheckIn] = useState(() => {
    if (todaysLogs.morningCheckIn) return false;
    return getItem("synk:checkinDismissed") !== todayStr;
  });
  const [showMissed, setShowMissed] = useState(() => {
    const lastWorkoutStr = getItem("synk:lastWorkoutDate");
    if (!lastWorkoutStr) return false;
    const lastDate = new Date(lastWorkoutStr);
    lastDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / 86400000);
    return diffDays >= 1 && getItem("synk:missedCardDismissedDate") !== todayStr;
  });
  const [showCustomize, setShowCustomize] = useState(false);
  const [showRestLog, setShowRestLog] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [cards, setCards] = useState<Record<CardKey, boolean>>(() => {
    try {
      const saved = getItem("synk:dashboardCards");
      if (saved) return { ...DEFAULT_CARDS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_CARDS;
  });
  const [cardOrder, setCardOrder] = useState<CardKey[]>(() => {
    try {
      const saved = getItem("synk:dashboardCardOrder");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) return parsed;
      }
    } catch {}
    return DEFAULT_ORDER;
  });

  // Reorder shared state (mirrors PreSession): cardKey → slot index.
  const positions = useSharedValue<Record<string, number>>(
    Object.fromEntries(cardOrder.map((k, i) => [k, i])),
  );
  useEffect(() => {
    positions.value = Object.fromEntries(cardOrder.map((k, i) => [k, i]));
  }, [cardOrder]);

  const commitOrder = () => {
    const next = [...cardOrder].sort((a, b) => positions.value[a] - positions.value[b]);
    setCardOrder(next);
    setItem("synk:dashboardCardOrder", JSON.stringify(next));
  };

  const toggleCard = (key: CardKey) => {
    const next = { ...cards, [key]: !cards[key] };
    setCards(next);
    setItem("synk:dashboardCards", JSON.stringify(next));
  };

  const resetDashboard = () => {
    setCards(DEFAULT_CARDS);
    setCardOrder(DEFAULT_ORDER);
    setItem("synk:dashboardCards", JSON.stringify(DEFAULT_CARDS));
    setItem("synk:dashboardCardOrder", JSON.stringify(DEFAULT_ORDER));
  };

  const allHidden = !Object.values(cards).some(Boolean);

  const todayZero = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const isTodaySelected = selectedDate.getTime() === todayZero.getTime();
  const isPastSelected = selectedDate < todayZero;
  const isFutureSelected = selectedDate > todayZero;

  const selectedDayEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][selectedDate.getDay()];
  const selectedDayAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][selectedDate.getDay()];
  const dayNameFull = isArabic ? selectedDayAr : selectedDayEn;

  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(todayZero);
      d.setDate(todayZero.getDate() - 3 + i);
      return d;
    }),
    [todayZero],
  );
  const dayLettersEn = ["S", "M", "T", "W", "T", "F", "S"];
  const dayLettersAr = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

  const todaysWorkout = getWorkoutForDate(user, selectedDate);
  const isRestDay = todaysWorkout.isRestDay;

  const hour = new Date().getHours();
  const arabicFallback = String(user.gender || "").toLowerCase() === "female" ? "يا بطلة" : "يا بطل";
  const firstName = user.name?.trim().split(/\s+/)[0] || (isArabic ? arabicFallback : "there");
  const greeting = isArabic
    ? hour < 12 ? `صباح الخير، ${firstName}` : `مساء الخير، ${firstName}`
    : hour < 12 ? `Good morning, ${firstName}` : hour < 18 ? `Good afternoon, ${firstName}` : `Good evening, ${firstName}`;
  const coachLine = getCoachLineForDay(user, {
    hour, isRestDay, hasPendingAdaptation: false,
    todaysWorkoutMuscleGroups: undefined, streak: trainingStreak,
    recentPRs: undefined, volumeDelta: undefined, lastSessionRPE: undefined,
  });
  const subtitle = isArabic ? coachLine.ar : coachLine.en;

  const consumed = {
    cal: isTodaySelected ? todaysLogs.foods.reduce((s, f) => s + f.calories, 0) : 0,
    p: isTodaySelected ? todaysLogs.foods.reduce((s, f) => s + f.protein, 0) : 0,
    c: isTodaySelected ? todaysLogs.foods.reduce((s, f) => s + f.carbs, 0) : 0,
    f: isTodaySelected ? todaysLogs.foods.reduce((s, f) => s + f.fat, 0) : 0,
  };
  const plan = computePlanPreview(user);
  const targets = {
    cal: user.calorieTarget || plan.calorieTarget,
    p: user.proteinTarget || plan.protein,
    c: user.carbsTarget || plan.carbs,
    f: user.fatTarget || plan.fat,
  };

  const C = 2 * Math.PI * 74;
  const ringOffset = useSharedValue(C);
  React.useEffect(() => {
    const pct = Math.min(consumed.cal, targets.cal) / Math.max(1, targets.cal);
    ringOffset.value = withTiming(C - C * pct, { duration: 1500, easing: Easing.out(Easing.cubic) });
  }, [consumed.cal, targets.cal]);
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: ringOffset.value }));

  const cardStyle = {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 14,
  };

  const quickAdd = (amount: number) => {
    const nowStr = new Date().toTimeString().split(" ")[0].substring(0, 5);
    setTodaysLogs((prev) => ({
      ...prev,
      foods: [...(prev.foods || []), {
        id: Date.now().toString(), name: isArabic ? "إضافة سريعة" : "Quick entry",
        calories: amount, protein: 0, carbs: 0, fat: 0, portion: "1 entry", time: nowStr,
        loggedAt: new Date().toISOString(), slot: "snack" as const, isCustom: true,
      }],
    }));
    showToast(isArabic ? `تم إضافة ${amount} سعرة` : `Logged ${amount} kcal`);
  };

  const CARD_LABELS: Record<CardKey, string> = {
    workout: isArabic ? "تمرين اليوم" : "Today's workout",
    nutrition: isArabic ? "التغذية" : "Nutrition",
    hydration: isArabic ? "الترطيب" : "Hydration",
    recovery: isArabic ? "الاستشفاء" : "Recovery",
    analytics: isArabic ? "التحليلات" : "Analytics",
    challenges: isArabic ? "التحديات" : "Challenges",
    leaderboard: isArabic ? "المتصدّرين" : "Leaderboard",
    coachChat: isArabic ? "محادثة المدرب" : "Coach chat shortcut",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 128 + insets.bottom }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", marginBottom: 24 }}>
            {weekDays.map((d, i) => {
              const isToday = d.getTime() === todayZero.getTime();
              const sel = d.getTime() === selectedDate.getTime();
              return (
                <Pressable key={i} onPress={() => setSelectedDate(d)} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                  {isToday ? (
                    <AppText style={{ fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: isArabic ? "none" : "uppercase", color: sel ? colors.primary : colors.ink }}>
                      {isArabic ? "اليوم" : "TODAY"}
                    </AppText>
                  ) : (
                    <AppText style={{ fontSize: 13, color: sel ? colors.primary : colors.inkMuted48, fontWeight: sel ? "600" : "400" }}>
                      {isArabic ? dayLettersAr[d.getDay()] : dayLettersEn[d.getDay()]}
                    </AppText>
                  )}
                  <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: sel || isToday ? colors.primary : "transparent", backgroundColor: sel ? colors.primary : "transparent" }}>
                    <AppText style={{ fontSize: 15, fontWeight: sel ? "600" : "400", color: sel ? "#fff" : colors.ink }}>{d.getDate()}</AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Past / future contextual message */}
          {!isTodaySelected && (
            <Animated.View entering={FadeInDown} style={{ marginBottom: 24, backgroundColor: "rgba(0,102,204,0.1)", borderWidth: 1, borderColor: "rgba(0,102,204,0.2)", borderRadius: 14, padding: 12, gap: 4 }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <Activity size={16} color={colors.primary} />
                <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.primary, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                  {isFutureSelected
                    ? isArabic ? `تخطيط ${dayNameFull}` : `Planning ${dayNameFull}`
                    : isArabic ? `عرض ${dayNameFull}` : `Viewing ${dayNameFull}`}
                </AppText>
              </View>
              <AppText style={{ fontSize: 13, color: "rgba(0,102,204,0.8)", marginLeft: isArabic ? 0 : 24, marginRight: isArabic ? 24 : 0, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                {isFutureSelected
                  ? isArabic ? "خطط لوجباتك وتمارينك مسبقاً." : "Plan your meals and workouts ahead."
                  : isArabic ? "يمكنك إضافة أي شيء فاتك." : "You can add anything you missed."}
              </AppText>
            </Animated.View>
          )}

          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="screen-title" style={{ textAlign: isArabic ? "right" : "left" }}>{greeting}</AppText>
              <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 8, textAlign: isArabic ? "right" : "left" }}>{subtitle}</AppText>
            </View>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
              <Pressable onPress={() => setShowCustomize(true)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                <SlidersHorizontal size={14} color={colors.ink} />
              </Pressable>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 10, height: 28, borderRadius: 9999 }}>
                <Flame size={14} color={colors.ink} fill={colors.ink} />
                <AppText variant="caption-strong">{String(trainingStreak)}</AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* Active workout banner */}
          {hasActiveWorkout && (
            <Pressable onPress={() => router.push("/workout/active")} style={{ backgroundColor: "rgba(52,199,89,0.1)", borderWidth: 1, borderColor: "rgba(52,199,89,0.3)", borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.semanticGreen, alignItems: "center", justifyContent: "center" }}>
                <Activity size={20} color="#fff" />
              </View>
              <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.semanticGreen, marginBottom: 2, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                  {isArabic ? "في تمرين شغّال" : "Workout in progress"}
                </AppText>
                <AppText variant="body-strong" style={{ color: colors.ink }}>{isArabic ? "ارجع كمّل" : "Tap to resume"}</AppText>
              </View>
              <ChevronRight size={20} color={colors.semanticGreen} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
            </Pressable>
          )}

          {/* Welcome card */}
          {showWelcome && isTodaySelected && (
            <Animated.View entering={FadeInDown} style={{ backgroundColor: "rgba(0,102,204,0.05)", borderWidth: 1, borderColor: "rgba(0,102,204,0.2)", borderRadius: 14, padding: 20 }}>
              <Pressable onPress={() => { setShowWelcome(false); setItem("synk:welcomeShown", "true"); }} style={{ position: "absolute", top: 12, right: isArabic ? undefined : 12, left: isArabic ? 12 : undefined, padding: 6, zIndex: 1 }}>
                <X size={16} color={colors.inkMuted48} />
              </Pressable>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <CoachAvatar coachId={user.coach || "khaled"} size={48} verified />
                <AppText style={{ color: colors.primary, fontSize: 11, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                  {isArabic ? "أهلاً" : "WELCOME"}
                </AppText>
              </View>
              <AppText variant="body" style={{ color: colors.ink, lineHeight: 22, marginBottom: 20, textAlign: isArabic ? "right" : "left" }}>
                {isArabic
                  ? `أهلاً يا ${firstName}، أنا ${coachName}. عملت أول أسبوع ليك حسب أهدافك. خد جلسة النهاردة على راحتك — أنا معاك.`
                  : `Hi ${firstName}, I'm ${coachName}. I built your first week around your goals. Take today's session at your pace — I'll be here.`}
              </AppText>
              <Btn variant="primary" fullWidth onPress={() => { setShowWelcome(false); setItem("synk:welcomeShown", "true"); }} label={isArabic ? "يلا بينا" : "LET'S GO"} />
            </Animated.View>
          )}

          {/* Missed workout card */}
          {showMissed && !showWelcome && isTodaySelected && (
            <Animated.View entering={FadeInDown} style={[cardStyle, { padding: 20 }]}>
              <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, marginBottom: 12, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                {isArabic ? `${coachName} بيقول` : `${coachName.toUpperCase()} SAYS`}
              </AppText>
              <AppText variant="body" style={{ color: colors.ink, lineHeight: 22, marginBottom: 20, textAlign: isArabic ? "right" : "left" }}>
                {isArabic
                  ? "مفيش مشكلة — جلسة إمبارح في الماضي. بنبدأ النهاردة."
                  : "No stress — yesterday's session is behind us. Let's pick up today."}
              </AppText>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Btn variant="primary" fullWidth onPress={() => router.push("/fitness")} label={isArabic ? "ابدأ تمرين النهاردة" : "START TODAY'S WORKOUT"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Btn variant="ghost" fullWidth onPress={() => { setShowMissed(false); setItem("synk:missedCardDismissedDate", todayStr); }} label={isArabic ? "مش النهاردة" : "NOT TODAY"} />
                </View>
              </View>
            </Animated.View>
          )}

          {/* Morning check-in */}
          {showCheckIn && !showWelcome && !showMissed && isTodaySelected && (
            <Animated.View entering={FadeInDown}>
              <Pressable onPress={() => router.push("/morning-checkin")} style={[cardStyle, { padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }]}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center" }}>
                    <MessageCircle size={18} color={colors.primary} />
                  </View>
                  <AppText variant="title" style={{ color: colors.ink }}>{isArabic ? "سجل حضورك لليوم" : "Check in for today"}</AppText>
                </View>
                <ArrowRight size={18} color={colors.primary} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
            </Animated.View>
          )}

          {/* AI adaptation card */}
          {currentAdaptation && isTodaySelected && (
            <Animated.View entering={FadeInDown} style={{ backgroundColor: colors.surfaceTile2, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 14, padding: 20 }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <CoachAvatar coachId={currentAdaptation.coachId || user.coach || "khaled"} size={36} />
                <View style={{ backgroundColor: colors.primary, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <AppText style={{ color: "#fff", fontWeight: "600", fontSize: 11, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                    {isArabic ? "تعديل الذكاء الاصطناعي" : "AI ADAPTATION"}
                  </AppText>
                </View>
              </View>
              <AppText style={{ color: "#fff", lineHeight: 22, marginBottom: 20, fontSize: 15, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                {currentAdaptation.eventText}
              </AppText>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Btn variant="utility-dark" fullWidth onPress={() => router.push({ pathname: "/adaptive-insights", params: { adaptation: JSON.stringify(currentAdaptation) } })} label={isArabic ? "رؤية التغييرات" : "See changes"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Btn variant="pearl" fullWidth onPress={() => { archiveAdaptation(pendingAdaptations[0], "dismissed"); setPendingAdaptations(pendingAdaptations.slice(1)); }} label={isArabic ? "الاحتفاظ بالأصل" : "Keep original"} />
                </View>
              </View>
              {pendingAdaptations.length > 1 && (
                <Pressable onPress={() => { archiveAdaptation(pendingAdaptations[0], "dismissed"); setPendingAdaptations(pendingAdaptations.slice(1)); }} style={{ marginTop: 16 }}>
                  <AppText style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.4)", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, textAlign: "center", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                    {isArabic ? `+${pendingAdaptations.length - 1} المزيد` : `+${pendingAdaptations.length - 1} MORE`}
                  </AppText>
                </Pressable>
              )}
            </Animated.View>
          )}

          {/* Empty state when every card is hidden */}
          {allHidden && (
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 80 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <SlidersHorizontal size={28} color={colors.inkMuted48} />
              </View>
              <AppText variant="title-2" style={{ color: colors.ink, fontWeight: "600", marginBottom: 8 }}>
                {isArabic ? "لوحتك فارغة" : "Your dashboard is empty"}
              </AppText>
              <AppText variant="body" style={{ color: colors.inkMuted48, marginBottom: 24, textAlign: "center" }}>
                {isArabic ? "أضف بطاقات لبناء شاشتك" : "Add cards to build your home screen."}
              </AppText>
              <Btn variant="primary" onPress={() => setShowCustomize(true)} label={isArabic ? "إضافة بطاقات" : "Add cards"} />
            </View>
          )}

          {/* Cards */}
          {cardOrder.filter((k) => cards[k]).map((key) => {
            if (key === "workout") {
              if (!(appMode === "full" || appMode === "workout-only")) return null;
              return (
                <View key={key}>
                  {isRestDay ? (
                    <View style={[cardStyle, { padding: 24 }]}>
                      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                        <View>
                          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <Coffee size={20} color={colors.primary} />
                            <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                              {isArabic ? "يوم راحة" : "REST DAY"}
                            </AppText>
                          </View>
                          <AppText variant="title-2" style={{ textTransform: isArabic ? "none" : "uppercase" }}>{isArabic ? "استشفاء نشط" : "ACTIVE RECOVERY"}</AppText>
                        </View>
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(0,102,204,0.05)", alignItems: "center", justifyContent: "center" }}>
                          <Activity size={24} color={colors.primary} />
                        </View>
                      </View>
                      <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontStyle: "italic", lineHeight: 22, marginBottom: 24, textAlign: isArabic ? "right" : "left" }}>
                        {isArabic
                          ? '"جسمك بيتبني وقت الراحة مش وقت التمرين. ركز النهاردة على الاستشفاء والترطيب."'
                          : '"Your body is built during rest, not training. Focus on recovery and hydration today."'}
                      </AppText>
                      <Btn variant="pearl" fullWidth onPress={() => setShowRestLog(true)}>
                        <Plus size={16} color={colors.inkMuted80} />
                        <AppText variant="caption-strong" style={{ color: colors.inkMuted80, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>
                          {isArabic ? "تسجيل نشاط خفيف" : "LOG LIGHT ACTIVITY"}
                        </AppText>
                      </Btn>
                    </View>
                  ) : isPastSelected ? (
                    <View style={[cardStyle, { padding: 24, alignItems: "center" }]}>
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfacePearl, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                        <AppText style={{ fontSize: 20 }}>💪</AppText>
                      </View>
                      <AppText variant="body-strong" style={{ color: colors.ink, marginBottom: 4 }}>{isArabic ? "لم يتم تسجيل تمرين" : "No workout logged"}</AppText>
                      <View style={{ width: "100%", marginTop: 16 }}>
                        <Btn variant="utility-dark" fullWidth onPress={() => router.push("/fitness")} label={isArabic ? "إضافة تمرين فائت" : "Add missed workout"} />
                      </View>
                    </View>
                  ) : isFutureSelected ? (
                    <View style={[cardStyle, { padding: 20 }]}>
                      <View style={{ alignSelf: isArabic ? "flex-end" : "flex-start", backgroundColor: "rgba(0,102,204,0.1)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999, marginBottom: 12 }}>
                        <AppText style={{ color: colors.primary, fontSize: 11, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                          {isArabic ? "تمرين مخطط" : "PLANNED WORKOUT"}
                        </AppText>
                      </View>
                      <AppText variant="title-2" style={{ color: colors.ink, textTransform: isArabic ? "none" : "uppercase", textAlign: isArabic ? "right" : "left" }}>
                        {isArabic ? todaysWorkout.arabicCategory : todaysWorkout.category}
                      </AppText>
                      <View style={{ marginTop: 20 }}>
                        <Btn variant="pearl" fullWidth onPress={() => router.push("/fitness")} label={isArabic ? "تعديل التمرين المخطط" : "Edit planned workout"} />
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => router.push("/workout/preview")} style={{ height: 220, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.hairline }}>
                      <Image source={{ uri: todaysWorkout.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", padding: 20, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 2, borderRadius: 9999, marginBottom: 4 }}>
                          <AppText style={{ color: "#fff", fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {isArabic ? todaysWorkout.arabicDayLabel : todaysWorkout.dayLabel}
                          </AppText>
                        </View>
                        <AppText variant="screen-title" style={{ color: "#fff", textTransform: isArabic ? "none" : "uppercase", marginTop: 4 }}>
                          {isArabic ? todaysWorkout.arabicCategory : todaysWorkout.category}
                        </AppText>
                        <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.canvas, height: 36, paddingHorizontal: 20, borderRadius: 9999 }}>
                          <Play size={14} color={colors.ink} fill={colors.ink} />
                          <AppText variant="caption-strong" style={{ color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>
                            {isArabic ? "حضّر التمرين" : "Prepare Workout"}
                          </AppText>
                        </View>
                      </View>
                    </Pressable>
                  )}
                </View>
              );
            }

            if (key === "nutrition") {
              if (!(appMode === "full" || appMode === "nutrition-only")) return null;
              const macros = [
                { label: isArabic ? "بروتين" : "PROTEIN", c: consumed.p, t: targets.p },
                { label: isArabic ? "كربوهيدرات" : "CARBS", c: consumed.c, t: targets.c },
                { label: isArabic ? "دهون" : "FAT", c: consumed.f, t: targets.f },
              ];
              return (
                <Pressable key={key} onPress={() => router.push("/nutrition")} style={[cardStyle, { padding: 24, alignItems: "center" }]}>
                  {isFutureSelected && (
                    <View style={{ width: "100%", alignItems: "center", marginBottom: 16 }}>
                      <View style={{ backgroundColor: "rgba(0,102,204,0.1)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 }}>
                        <AppText style={{ color: colors.primary, fontSize: 12, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                          {isArabic ? "وجبات مخططة" : "PLANNED MEALS"}
                        </AppText>
                      </View>
                    </View>
                  )}
                  {isPastSelected && consumed.cal === 0 && (
                    <AppText style={{ width: "100%", textAlign: "center", color: colors.inkMuted48, fontSize: 14, fontWeight: "500", marginBottom: 8, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                      {isArabic ? "لم يتم تسجيل وجبات لهذا اليوم" : "No meals logged for this day"}
                    </AppText>
                  )}
                  <View style={{ width: 160, height: 160, alignItems: "center", justifyContent: "center" }}>
                    <Svg width={160} height={160} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
                      <Circle cx={80} cy={80} r={74} fill="transparent" stroke={colors.hairline} strokeWidth={2} />
                      <AnimatedCircle cx={80} cy={80} r={74} fill="transparent" stroke={colors.primary} strokeWidth={2} strokeDasharray={C} strokeLinecap="round" animatedProps={ringProps} />
                    </Svg>
                    <View style={{ alignItems: "center" }}>
                      <AppText style={{ fontSize: 32, fontWeight: "600", color: colors.ink }}>{(consumed.cal || 0).toLocaleString()}</AppText>
                      <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 4, textTransform: isArabic ? "none" : "uppercase" }}>
                        {isArabic ? `من ${targets.cal.toLocaleString()} سعرة` : `OF ${targets.cal.toLocaleString()} KCAL`}
                      </AppText>
                    </View>
                  </View>

                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, marginTop: 16 }}>
                    <Plus size={16} strokeWidth={2.5} color={colors.primary} />
                    <AppText style={{ color: colors.primary, fontSize: 13, textTransform: isArabic ? "none" : "uppercase", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                      {isPastSelected
                        ? isArabic ? "إضافة وجبة فائتة" : "Add missed meal"
                        : isFutureSelected
                          ? isArabic ? "تخطيط وجبة" : "Add planned meal"
                          : isArabic ? "تسجيل وجبة" : "LOG MEAL"}
                    </AppText>
                  </View>

                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 20, width: "100%", marginTop: 32 }}>
                    {macros.map((m, i) => (
                      <View key={i} style={{ flex: 1, alignItems: "center" }}>
                        <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 6, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{m.label}</AppText>
                        <View style={{ height: 2, width: "100%", backgroundColor: "rgba(0,102,204,0.1)", borderRadius: 9999, overflow: "hidden", marginBottom: 8 }}>
                          <View style={{ height: "100%", width: `${Math.min(100, (m.c / Math.max(1, m.t)) * 100)}%`, backgroundColor: colors.primary }} />
                        </View>
                        <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink }}>{Math.round(m.c)}g</AppText>
                      </View>
                    ))}
                  </View>

                  <View style={{ width: "100%", height: 1, backgroundColor: colors.hairline, marginTop: 24, marginBottom: 12 }} />

                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8, width: "100%", marginTop: 12 }}>
                    {[200, 400, 600].map((amt) => (
                      <Pressable key={amt} onPress={() => quickAdd(amt)} style={{ flex: 1, height: 32, borderRadius: 8, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.dividerSoft, alignItems: "center", justifyContent: "center" }}>
                        <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted80 }}>+{amt} {isArabic ? "سعرة" : "KCAL"}</AppText>
                      </Pressable>
                    ))}
                  </View>
                </Pressable>
              );
            }

            if (key === "hydration") {
              const waterValue = todaysLogs?.water || 0;
              return (
                <Pressable key={key} onPress={() => router.push("/nutrition")} style={[cardStyle, { padding: 20 }]}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center" }}>
                      <AppText style={{ fontSize: 18 }}>💧</AppText>
                    </View>
                    <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText variant="body-strong" style={{ color: colors.ink }}>{isArabic ? "الترطيب" : "Hydration"}</AppText>
                      <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                        {waterValue === 0
                          ? isArabic ? "اضغط لتسجيل الماء" : "Tap to log water"
                          : isArabic ? `${(waterValue / 1000).toFixed(1)} من ٢٫٥ لتر` : `${(waterValue / 1000).toFixed(1)} of 2.5 L`}
                      </AppText>
                      {waterValue > 0 && (
                        <AppText style={{ fontSize: 11, color: colors.inkMuted48 }}>{waterValue}/2500ml</AppText>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                    {[250, 500, 1000].map((amount) => (
                      <Pressable
                        key={amount}
                        onPress={() => {
                          setTodaysLogs((prev) => ({ ...prev, water: (prev.water || 0) + amount }));
                          showToast(isArabic ? `تم إضافة ${amount} مل` : `Added ${amount}ml`);
                        }}
                        style={{ flex: 1, height: 36, borderRadius: 8, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.dividerSoft, alignItems: "center", justifyContent: "center" }}
                      >
                        <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted80 }}>+{amount}ml</AppText>
                      </Pressable>
                    ))}
                  </View>
                </Pressable>
              );
            }

            if (key === "recovery") {
              const recoveryData = [
                { nameEn: "Chest", nameAr: "الصدر", value: 85 },
                { nameEn: "Back", nameAr: "الظهر", value: 60 },
                { nameEn: "Legs", nameAr: "استشفاء الأرجل", value: 30 },
                { nameEn: "Shoulders", nameAr: "الأكتاف", value: 95 },
              ];
              return (
                <Pressable key={key} onPress={() => router.push("/muscle-recovery")} style={[cardStyle, { padding: 20 }]}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                      {isArabic ? "الاستشفاء" : "RECOVERY"}
                    </AppText>
                    <ChevronRight size={16} strokeWidth={2.5} color={colors.hairline} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
                  </View>
                  <View style={{ gap: 12 }}>
                    {recoveryData.map((muscle) => {
                      let barColor = colors.semanticGreen;
                      if (muscle.value < 40) barColor = colors.semanticRed;
                      else if (muscle.value < 70) barColor = colors.semanticOrange;
                      return (
                        <View key={muscle.nameEn} style={{ gap: 4 }}>
                          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                            <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.ink, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                              {isArabic ? muscle.nameAr : muscle.nameEn}
                            </AppText>
                            <AppText style={{ fontSize: 12, fontWeight: "500", color: colors.inkMuted48 }}>{muscle.value}%</AppText>
                          </View>
                          <View style={{ width: "100%", height: 3, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 9999, overflow: "hidden" }}>
                            <View style={{ height: "100%", borderRadius: 9999, backgroundColor: barColor, width: `${muscle.value}%` }} />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                  <AppText style={{ marginTop: 16, fontSize: 12, color: colors.inkMuted48, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                    {isArabic ? "اضغط هنا لرؤية جميع العضلات" : "Tap to see all muscles"}
                  </AppText>
                </Pressable>
              );
            }

            if (key === "analytics") {
              const chartBars = [60, 80, 40, 90, 70, 100, 85];
              return (
                <Pressable key={key} onPress={() => router.push("/analytics")} style={[cardStyle, { padding: 16 }]}>
                  <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 2, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                      {isArabic ? "تقدمك" : "YOUR PROGRESS"}
                    </AppText>
                    <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginBottom: 12, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                      {isArabic ? "هذا الأسبوع" : "This week"}
                    </AppText>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-end", gap: 6, height: 48, marginBottom: 16 }}>
                      {chartBars.map((h, i) => (
                        <View key={i} style={{ width: 8, borderRadius: 2, backgroundColor: colors.primary, height: `${h}%` }} />
                      ))}
                    </View>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                        <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 4, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                          {isArabic ? "السلسلة الأسبوعية" : "Weekly streak"}
                        </AppText>
                        <AppText variant="caption-strong" style={{ color: colors.ink }}>{isArabic ? "5 أيام" : "5 days"}</AppText>
                      </View>
                      <View style={{ width: 1, height: 32, backgroundColor: colors.hairline, marginHorizontal: 4 }} />
                      <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                        <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 4, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                          {isArabic ? "الحجم" : "Volume"}
                        </AppText>
                        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 2 }}>
                          <TrendingUp size={14} color={colors.semanticGreen} />
                          <AppText variant="caption-strong" style={{ color: colors.semanticGreen }}>+12%</AppText>
                        </View>
                      </View>
                      <View style={{ width: 1, height: 32, backgroundColor: colors.hairline, marginHorizontal: 4 }} />
                      <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                        <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 4, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                          {isArabic ? "أرقام قياسية" : "PRs"}
                        </AppText>
                        <AppText variant="caption-strong" style={{ color: colors.ink }}>{isArabic ? "3 الأسبوع ده" : "3 this week"}</AppText>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.inkMuted48} style={{ position: "absolute", top: 16, right: isArabic ? undefined : 16, left: isArabic ? 16 : undefined, transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
                </Pressable>
              );
            }

            if (key === "challenges") {
              const activeChallenge = {
                titleEn: "7-Day Consistency", titleAr: "استمرارية ٧ أيام",
                descEn: "Log a workout every day for a week", descAr: "سجل تمرينك كل يوم لمدة أسبوع",
                progress: 4, total: 7, daysLeftEn: "3 days left", daysLeftAr: "متبقي ٣ أيام",
              };
              return (
                <Pressable key={key} onPress={() => router.push("/community")} style={[cardStyle, { padding: 20 }]}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <Trophy size={16} color={colors.primary} />
                    <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                      {isArabic ? "تحدي نشط" : "ACTIVE CHALLENGE"}
                    </AppText>
                  </View>
                  <AppText variant="caption-strong" style={{ color: colors.ink, marginBottom: 4, textAlign: isArabic ? "right" : "left" }}>
                    {isArabic ? activeChallenge.titleAr : activeChallenge.titleEn}
                  </AppText>
                  <AppText style={{ fontSize: 13, color: colors.inkMuted48, lineHeight: 18, marginBottom: 16, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                    {isArabic ? activeChallenge.descAr : activeChallenge.descEn}
                  </AppText>
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                      <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                        {isArabic ? "التقدم" : "Progress"}
                      </AppText>
                      <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.ink }}>
                        {activeChallenge.progress} / {activeChallenge.total} {isArabic ? "أيام" : "days"}
                      </AppText>
                    </View>
                    <View style={{ width: "100%", height: 4, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 9999, overflow: "hidden" }}>
                      <View style={{ height: "100%", borderRadius: 9999, backgroundColor: colors.primary, width: `${(activeChallenge.progress / activeChallenge.total) * 100}%` }} />
                    </View>
                    <AppText style={{ marginTop: 4, fontSize: 11, color: colors.inkMuted48, textAlign: isArabic ? "left" : "right", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                      {isArabic ? activeChallenge.daysLeftAr : activeChallenge.daysLeftEn}
                    </AppText>
                  </View>
                </Pressable>
              );
            }

            if (key === "leaderboard") {
              const topUsers: { rank: number; nameEn: string; nameAr: string; score: string; initial: string; trend: "up" | "down" | "flat"; change?: number; isMe?: boolean }[] = [
                { rank: 1, nameEn: "Yousef", nameAr: "يوسف", score: "12,400", initial: "Y", trend: "up" },
                { rank: 2, nameEn: "Mariam", nameAr: "مريم", score: "11,250", initial: "M", trend: "flat" },
                { rank: 3, nameEn: "YOU", nameAr: "أنت", score: "10,800", initial: "A", trend: "up", change: 2, isMe: true },
              ];
              return (
                <Pressable key={key} onPress={() => router.push("/community")} style={[cardStyle, { padding: 20 }]}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                      {isArabic ? "المُتصدّرين" : "LEADERBOARD"}
                    </AppText>
                    <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                      {isArabic ? "هذا الأسبوع" : "This week"}
                    </AppText>
                  </View>
                  <View style={{ gap: 4 }}>
                    {topUsers.map((lbUser) => (
                      <View key={lbUser.rank} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 8, borderRadius: 10, backgroundColor: lbUser.isMe ? "rgba(0,102,204,0.05)" : "transparent" }}>
                        <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.inkMuted48, width: 16, textAlign: "center" }}>{lbUser.rank}</AppText>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" }}>
                          <AppText style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>{lbUser.initial}</AppText>
                        </View>
                        <AppText numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: lbUser.isMe ? "700" : "500", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? (lbUser.isMe ? "Cairo_600SemiBold" : "Cairo_400Regular") : (lbUser.isMe ? "Inter_600SemiBold" : "Inter_400Regular") }}>
                          {isArabic ? lbUser.nameAr : lbUser.nameEn}
                        </AppText>
                        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                          <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}>{lbUser.score}</AppText>
                          <View style={{ width: 16, alignItems: "center", justifyContent: "center" }}>
                            {lbUser.trend === "up" && (
                              <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <TrendingUp size={12} color={colors.semanticGreen} />
                                {lbUser.change ? <AppText style={{ fontSize: 12, color: colors.semanticGreen }}>{lbUser.change}</AppText> : null}
                              </View>
                            )}
                            {lbUser.trend === "down" && <TrendingDown size={12} color={colors.semanticRed} />}
                            {lbUser.trend === "flat" && <Minus size={12} color={colors.inkMuted48} />}
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </Pressable>
              );
            }

            if (key === "coachChat") {
              return (
                <View key={key} style={[cardStyle, { padding: 20 }]}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <CoachAvatar coachId={user.coach || "khaled"} size={40} />
                    <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText variant="body-strong" style={{ color: colors.ink, lineHeight: 18 }}>{coachName}</AppText>
                      <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>{isArabic ? "المدرب" : "Coach"}</AppText>
                    </View>
                  </View>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
                    <Pressable onPress={() => router.push("/coach")} style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, paddingHorizontal: 8, borderRadius: 12, backgroundColor: "rgba(0,102,204,0.05)", borderWidth: 1, borderColor: "rgba(0,102,204,0.1)" }}>
                      <MessageCircle size={24} color={colors.primary} />
                      <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.primary, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "رسالة نصية" : "Message"}</AppText>
                    </Pressable>
                    <Pressable onPress={() => router.push("/voice-log")} style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, paddingHorizontal: 8, borderRadius: 12, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(29,29,31,0.05)", borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                      <Mic size={24} color={colors.ink} />
                      <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "رسالة صوتية" : "Voice message"}</AppText>
                    </Pressable>
                  </View>
                </View>
              );
            }

            return null;
          })}
        </View>
      </ScrollView>

      <BottomSheet isOpen={showCustomize} onClose={() => { setShowCustomize(false); setConfirmReset(false); }} title={isArabic ? "تخصيص اللوحة" : "Customize Dashboard"} doneLabel={isArabic ? "حفظ" : "Save"}>
        <AppText variant="body" style={{ color: colors.inkMuted48, marginBottom: 24, textAlign: isArabic ? "right" : "left" }}>
          {isArabic ? "اختر ما يظهر على شاشتك الرئيسية." : "Choose what appears on your home screen."}
        </AppText>
        <View style={{ height: cardOrder.length * ROW_H }}>
          {cardOrder.map((key) => (
            <CustomizeRow
              key={key}
              cardKey={key}
              label={CARD_LABELS[key]}
              enabled={cards[key]}
              positions={positions}
              count={cardOrder.length}
              isArabic={isArabic}
              colors={colors}
              onToggle={() => toggleCard(key)}
              commitOrder={commitOrder}
            />
          ))}
        </View>
        {confirmReset ? (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginBottom: 8, fontWeight: "500", textAlign: "center" }}>
              {isArabic ? "متأكد؟ ده هيرجّع الافتراضي." : "Are you sure? This restores defaults."}
            </AppText>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12, width: "100%" }}>
              <View style={{ flex: 1 }}>
                <Btn variant="pearl" fullWidth onPress={() => setConfirmReset(false)} label={isArabic ? "إلغاء" : "Cancel"} />
              </View>
              <Pressable onPress={() => { resetDashboard(); setConfirmReset(false); }} style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: colors.semanticRed, alignItems: "center", justifyContent: "center" }}>
                <AppText variant="body-strong" style={{ color: "#fff" }}>{isArabic ? "إرجاع" : "Reset"}</AppText>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setConfirmReset(true)} style={{ marginTop: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", alignItems: "center" }}>
            <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.inkMuted48 }}>{isArabic ? "إعادة تعيين إلى الافتراضي" : "Reset to default"}</AppText>
          </Pressable>
        )}
      </BottomSheet>

      <BottomSheet isOpen={showRestLog} onClose={() => setShowRestLog(false)} title={isArabic ? "كيف كان يومك؟" : "How was your rest day?"}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          {[
            { id: "stretch", label: isArabic ? "إطالة" : "STRETCHING" },
            { id: "walk", label: isArabic ? "مشي" : "WALKING" },
            { id: "yoga", label: isArabic ? "يوجا" : "YOGA" },
            { id: "other", label: isArabic ? "أخرى" : "OTHER" },
          ].map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setShowRestLog(false)}
              style={{ width: "47%", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, alignItems: "center" }}
            >
              <AppText variant="caption-strong" style={{ color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>{item.label}</AppText>
            </Pressable>
          ))}
        </View>
        <Btn variant="primary" fullWidth onPress={() => setShowRestLog(false)} label={isArabic ? "تم" : "DONE"} />
      </BottomSheet>
    </View>
  );
}
