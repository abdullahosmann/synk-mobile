/**
 * Dashboard — RN port of src/screens/main/Dashboard.tsx (default experience).
 *
 * Covers the default-visible surface: week strip, personalized greeting + coach
 * line + streak chip, welcome card, morning check-in prompt, the workout card
 * (rest-day "Active Recovery" + active-day hero variants), the nutrition card
 * (calorie ring + macro bars + quick-add), and the Customize bottom sheet.
 *
 * The 6 optional cards (hydration/recovery/analytics/challenges/leaderboard/
 * coachChat) are off by default and surfaced via Customize; they render as
 * lightweight shortcut tiles here and gain full bodies in a later pass.
 */
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  FadeInDown,
  useAnimatedProps,
  useSharedValue,
  withTiming,
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
} from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { useColors } from "../../src/theme/ThemeProvider";
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

export default function Dashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, todaysLogs, setTodaysLogs, streaks, selectedDate, setSelectedDate, appMode } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const trainingStreak = streaks.find((s) => s.type === "training")?.count ?? 0;

  const coachName = (user.coach || "khaled").charAt(0).toUpperCase() + (user.coach || "khaled").slice(1);

  const [showWelcome, setShowWelcome] = useState(() => getItem("synk:welcomeShown") !== "true");
  const [showCheckIn] = useState(() => !todaysLogs.morningCheckIn);
  const [showCustomize, setShowCustomize] = useState(false);
  const [cards, setCards] = useState<Record<CardKey, boolean>>(() => {
    try {
      const saved = getItem("synk:dashboardCards");
      if (saved) return { ...DEFAULT_CARDS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_CARDS;
  });

  const toggleCard = (key: CardKey) => {
    const next = { ...cards, [key]: !cards[key] };
    setCards(next);
    setItem("synk:dashboardCards", JSON.stringify(next));
  };

  const todayZero = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const isTodaySelected = selectedDate.getTime() === todayZero.getTime();

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

          {/* Morning check-in */}
          {showCheckIn && !showWelcome && isTodaySelected && (
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

          {/* Cards */}
          {CARD_KEYS.filter((k) => cards[k]).map((key) => {
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
                      <Btn variant="pearl" fullWidth onPress={() => router.push("/voice-log")}>
                        <Plus size={16} color={colors.inkMuted80} />
                        <AppText variant="caption-strong" style={{ color: colors.inkMuted80, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>
                          {isArabic ? "تسجيل نشاط خفيف" : "LOG LIGHT ACTIVITY"}
                        </AppText>
                      </Btn>
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
                      {isArabic ? "تسجيل وجبة" : "LOG MEAL"}
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

            const tile: Record<string, { route: string }> = {
              hydration: { route: "/nutrition" },
              recovery: { route: "/muscle-recovery" },
              analytics: { route: "/analytics" },
              challenges: { route: "/challenges" },
              leaderboard: { route: "/community" },
              coachChat: { route: "/coach" },
            };
            return (
              <Pressable key={key} onPress={() => router.push(tile[key].route as any)} style={[cardStyle, { padding: 20, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }]}>
                <AppText variant="title" style={{ color: colors.ink }}>{CARD_LABELS[key]}</AppText>
                <ChevronRight size={20} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <BottomSheet isOpen={showCustomize} onClose={() => setShowCustomize(false)} title={isArabic ? "تخصيص" : "Customize"}>
        <View style={{ gap: 4 }}>
          {CARD_KEYS.map((key) => (
            <View key={key} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 }}>
              <AppText variant="body-strong" style={{ color: colors.ink }}>{CARD_LABELS[key]}</AppText>
              <Toggle value={cards[key]} onValueChange={() => toggleCard(key)} />
            </View>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}
