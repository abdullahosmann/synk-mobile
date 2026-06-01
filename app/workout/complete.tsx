/**
 * WorkoutComplete — RN port of src/screens/main/WorkoutComplete.tsx.
 * Celebration: success check, PR section, stats grid, coach quote, streak
 * increment animation, tomorrow preview, return/share. Share sheet captures a
 * shareable card via react-native-view-shot + expo-sharing (replacing the web
 * html-to-image flow). The 5-template carousel is represented by the single
 * capture card here; the full template set lands in the ShareCardRenderer pass.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { CheckCircle2, TrendingUp, Clock, Hash, Dumbbell, Flame, Share2, Copy } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { formatWeight } from "../../src/lib/units";
import CoachAvatar from "../../src/components/CoachAvatar";
import BottomSheet from "../../src/components/BottomSheet";
import { getWorkoutForDate } from "../../src/lib/workoutSelection";
import { useColors, useTheme } from "../../src/theme/ThemeProvider";
import { AppText, ScreenTitle, StatValueSm } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";
import { Toggle } from "../../src/components/ui/Toggle";
import {
  Template1Bold,
  Template2Minimal,
  Template3Stats,
  Template4Map,
  Template5Quote,
  ShareTemplateProps,
} from "../../src/components/share-templates/WorkoutShareTemplates";

const TEMPLATES: React.FC<ShareTemplateProps>[] = [Template1Bold, Template2Minimal, Template3Stats, Template4Map, Template5Quote];
const THUMB_W = 200;
const THUMB_SCALE = THUMB_W / 1080;

interface Summary {
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  duration: number;
  workoutName: string;
  exerciseSets?: Record<string, { weight: number; reps: number }[]>;
  muscleGroups?: string[];
}

export default function WorkoutComplete() {
  const router = useRouter();
  const params = useLocalSearchParams<{ summary?: string }>();
  const { user, streaks, setStreaks } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const selectedCoach = user.coach || "khaled";

  const summary: Summary = useMemo(() => {
    try {
      if (params.summary) return JSON.parse(params.summary);
    } catch {}
    return { totalSets: 0, totalReps: 0, totalVolume: 0, duration: 0, workoutName: isArabic ? "جلسة تمرين" : "Workout Session" };
  }, [params.summary]);

  const trainingStreak = streaks.find((s) => s.type === "training")?.count ?? 0;
  const [streakVal, setStreakVal] = useState(trainingStreak);
  const [showStreakInc, setShowStreakInc] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [hideNumbers, setHideNumbers] = useState(false);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const shareRef = useRef<View>(null);

  const bestLift = useMemo(() => {
    let bestEx = "";
    let bestW = 0;
    let bestR = 0;
    Object.entries(summary.exerciseSets || {}).forEach(([name, sets]) => {
      if (!Array.isArray(sets)) return;
      sets.forEach((s) => {
        if (s.weight > bestW) {
          bestW = s.weight;
          bestR = s.reps;
          bestEx = name;
        }
      });
    });
    return bestW > 0 ? { exercise: bestEx, weight: bestW, reps: bestR, unit: user.weightUnit } : undefined;
  }, [summary.exerciseSets, user.weightUnit]);

  const workoutData = useMemo(
    () => ({
      name: summary.workoutName,
      muscleGroups: summary.muscleGroups || ["chest", "shoulders", "triceps"],
      durationMin: Math.floor(summary.duration / 60),
      totalVolumeKg: summary.totalVolume,
      setsCompleted: summary.totalSets,
      bestLift,
      isPR: !!bestLift,
      date: new Date(),
    }),
    [summary, bestLift],
  );

  const ActiveTemplate = TEMPLATES[activeTemplateIdx];

  // Increment streak (once) after a beat
  useEffect(() => {
    const t = setTimeout(() => {
      setShowStreakInc(true);
      setStreakVal(trainingStreak + 1);
      const today = new Date().toISOString().split("T")[0];
      const hasTraining = streaks.some((s) => s.type === "training");
      const next = hasTraining
        ? streaks.map((s) => (s.type === "training" ? { ...s, count: trainingStreak + 1, lastLogDate: today } : s))
        : [...streaks, { type: "training" as const, count: 1, lastLogDate: today }];
      setStreaks(next);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDuration = (s: number) => (Math.floor(s / 60) < 1 ? `${s}s` : `${Math.floor(s / 60)} min`);

  const tomorrowWorkout = useMemo(() => getWorkoutForDate(user, new Date(Date.now() + 86400000)), [user]);
  const tomorrowText = isArabic
    ? tomorrowWorkout.isRestDay ? "غدًا: يوم راحة — ركز على النوم" : `غدًا: ${tomorrowWorkout.arabicDayLabel} — ${tomorrowWorkout.arabicCategory}`
    : tomorrowWorkout.isRestDay ? "Tomorrow: rest day — focus on sleep" : `Tomorrow: ${tomorrowWorkout.dayLabel} — ${tomorrowWorkout.category}`;

  const quote = isArabic
    ? `${summary.totalSets} ست، ${summary.totalReps} تكرار من ${summary.workoutName}. جلسة نظيفة.`
    : `${summary.totalSets} sets, ${summary.totalReps} reps of ${summary.workoutName}. Clean session.`;

  const stats = [
    { icon: Clock, label: isArabic ? "المدة" : "Duration", value: formatDuration(summary.duration) },
    { icon: TrendingUp, label: isArabic ? "الحجم" : "Volume", value: formatWeight(summary.totalVolume, user.weightUnit) },
    { icon: Hash, label: isArabic ? "الجلسات" : "Total Sets", value: String(summary.totalSets) },
    { icon: Dumbbell, label: isArabic ? "التكرار" : "Total Reps", value: String(summary.totalReps) },
  ];

  const handleShare = async (save: boolean) => {
    try {
      const uri = await captureRef(shareRef, { format: "png", quality: 1, width: 1080, height: 1920 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        showToast(isArabic ? "تم حفظ الصورة" : "Image saved", "success");
      }
    } catch {
      showToast(isArabic ? "تعذرت المشاركة" : "Couldn't share", "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32, paddingHorizontal: 24, alignItems: "center" }}>
        <Animated.View entering={FadeIn.springify().damping(15)} style={{ alignItems: "center", marginBottom: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <CheckCircle2 size={40} strokeWidth={2.5} color="#fff" />
          </View>
          <ScreenTitle style={{ textTransform: isArabic ? "none" : "uppercase", marginBottom: 4, textAlign: "center" }}>
            {isArabic ? "تم الإنجاز!" : "Complete!"}
          </ScreenTitle>
          <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5 }}>
            {isArabic ? "خطوة أقرب لهدفك" : "One step closer to your goal"}
          </AppText>
        </Animated.View>

        {/* Stats grid */}
        <View style={{ width: "100%", maxWidth: 384, flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Animated.View key={i} entering={FadeInDown.delay(200 + i * 100)} style={{ width: "48%", backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 20, alignItems: "center" }}>
                <Icon size={20} color={colors.primary} style={{ marginBottom: 12 }} />
                <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</AppText>
                <StatValueSm>{s.value}</StatValueSm>
              </Animated.View>
            );
          })}
        </View>

        {/* Coach quote */}
        <Animated.View entering={FadeIn.delay(800)} style={{ width: "100%", maxWidth: 384, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 16, marginBottom: 40 }}>
          <CoachAvatar coachId={selectedCoach} size={48} />
          <View style={{ flex: 1, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, padding: 16, borderRadius: 14, borderTopLeftRadius: isArabic ? 16 : 0, borderTopRightRadius: isArabic ? 0 : 16 }}>
            <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontStyle: "italic", lineHeight: 22, textAlign: isArabic ? "right" : "left" }}>
              "{quote}"
            </AppText>
          </View>
        </Animated.View>

        {/* Streak */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 32 }}>
          <Flame size={20} color={colors.semanticOrange} fill={colors.semanticOrange} />
          <AppText variant="body-strong" style={{ textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>
            {isArabic ? "سلسلة: " : "Streak: "}{String(trainingStreak)}
            {showStreakInc && <AppText style={{ color: colors.primary }}>{`  →  ${streakVal}`}</AppText>}
          </AppText>
        </View>

        {/* Tomorrow preview */}
        <Animated.View entering={FadeInDown.delay(1000)} style={{ width: "100%", maxWidth: 384, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, marginBottom: 32 }}>
          <CoachAvatar coachId={selectedCoach} size={36} />
          <AppText variant="caption-strong" style={{ flex: 1, color: colors.ink, textAlign: isArabic ? "right" : "left" }}>{tomorrowText}</AppText>
        </Animated.View>

        {/* Actions */}
        <View style={{ width: "100%", maxWidth: 384, gap: 12 }}>
          <Btn variant="primary" fullWidth onPress={() => router.replace("/dashboard")} label={isArabic ? "العودة للرئيسية" : "RETURN TO HOME"} />
          <Btn variant="ghost" fullWidth onPress={() => setShowShareSheet(true)}>
            <Share2 size={16} strokeWidth={2.5} color={colors.primary} />
            <AppText variant="fine-print" className="text-primary dark:text-primary-dark" style={{ fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1 }}>
              {isArabic ? "مشاركة النتائج" : "Share Results"}
            </AppText>
          </Btn>
        </View>
      </ScrollView>

      {/* Off-screen full-res capture target (active template at 1080×1920) */}
      <View style={{ position: "absolute", left: -99999, top: -99999 }} pointerEvents="none">
        <View ref={shareRef} collapsable={false}>
          <ActiveTemplate workout={workoutData} user={{ name: user.name || "Athlete", coachName: selectedCoach }} isArabic={isArabic} hideNumbers={hideNumbers} />
        </View>
      </View>

      {/* Share sheet */}
      <BottomSheet isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} title={isArabic ? "شارك فوزك" : "Share your win"}>
        <View style={{ gap: 20 }}>
          {/* Template carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingVertical: 4, flexDirection: isArabic ? "row-reverse" : "row" }}
          >
            {TEMPLATES.map((Temp, idx) => (
              <Pressable
                key={idx}
                onPress={() => setActiveTemplateIdx(idx)}
                style={{ width: THUMB_W, height: THUMB_W * (1920 / 1080), borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: activeTemplateIdx === idx ? colors.primary : "transparent" }}
              >
                <View style={{ width: 1080, height: 1920, transform: [{ scale: THUMB_SCALE }], transformOrigin: "top left" }} pointerEvents="none">
                  <Temp workout={workoutData} user={{ name: user.name || "Athlete", coachName: selectedCoach }} isArabic={isArabic} hideNumbers={hideNumbers} />
                </View>
                {activeTemplateIdx !== idx && <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.1)" }} />}
              </Pressable>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
            {TEMPLATES.map((_, idx) => (
              <View key={idx} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeTemplateIdx === idx ? colors.primary : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", transform: [{ scale: activeTemplateIdx === idx ? 1.25 : 1 }] }} />
            ))}
          </View>

          {/* Hide numbers */}
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <AppText variant="body-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>{isArabic ? "إخفاء الأرقام والإحصائيات" : "Hide numbers and stats"}</AppText>
              <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left" }}>{isArabic ? "إخفاء الأرقام للخصوصية" : "Hide specific numbers for public sharing"}</AppText>
            </View>
            <Toggle value={hideNumbers} onValueChange={() => setHideNumbers((h) => !h)} />
          </View>

          {/* Actions */}
          <View style={{ gap: 12 }}>
            <Btn variant="primary" fullWidth onPress={() => handleShare(false)} style={{ height: 56 }}>
              <Share2 size={20} color="#fff" />
              <AppText variant="body-strong" style={{ color: "#fff" }}>{isArabic ? "شارك" : "Share"}</AppText>
            </Btn>
            <Btn variant="ghost" fullWidth onPress={() => handleShare(true)} style={{ height: 56 }}>
              <Copy size={20} color={colors.primary} />
              <AppText variant="body-strong" className="text-primary dark:text-primary-dark">{isArabic ? "احفظ على الصور" : "Save to photos"}</AppText>
            </Btn>
            <Pressable onPress={() => { setShowShareSheet(false); router.push("/community"); }} style={{ alignSelf: "center", paddingTop: 8 }}>
              <AppText variant="body-strong" className="text-primary dark:text-primary-dark">{isArabic ? "شارك مع مجتمع سنك" : "Share to Synk community"}</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
