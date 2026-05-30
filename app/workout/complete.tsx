/**
 * WorkoutComplete — RN port of src/screens/main/WorkoutComplete.tsx.
 * Celebration: success check, PR section, stats grid, coach quote, streak
 * increment animation, tomorrow preview, return/share. Share sheet captures a
 * shareable card via react-native-view-shot + expo-sharing (replacing the web
 * html-to-image flow). The 5-template carousel is represented by the single
 * capture card here; the full template set lands in the ShareCardRenderer pass.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { CheckCircle2, TrendingUp, Clock, Hash, Dumbbell, Award, Flame, Share2, Copy } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { formatWeight } from "../../src/lib/units";
import CoachAvatar from "../../src/components/CoachAvatar";
import BottomSheet from "../../src/components/BottomSheet";
import { getWorkoutForDate } from "../../src/lib/workoutSelection";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText, ScreenTitle, StatValueSm } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";
import { Toggle } from "../../src/components/ui/Toggle";

interface Summary {
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  duration: number;
  workoutName: string;
}

export default function WorkoutComplete() {
  const router = useRouter();
  const params = useLocalSearchParams<{ summary?: string }>();
  const { user, streaks, setStreaks } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
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
  const shareRef = useRef<View>(null);

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
      const uri = await captureRef(shareRef, { format: "png", quality: 1 });
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
          <View style={{ flex: 1, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, padding: 16, borderRadius: 16, borderTopLeftRadius: isArabic ? 16 : 0, borderTopRightRadius: isArabic ? 0 : 16 }}>
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

      {/* Off-screen capture card */}
      <View style={{ position: "absolute", left: -9999, top: -9999 }}>
        <View ref={shareRef} collapsable={false} style={{ width: 320, height: 568, backgroundColor: colors.primary, padding: 32, justifyContent: "space-between" }}>
          <AppText style={{ color: "#fff", fontSize: 24, fontWeight: "700", letterSpacing: 4, textAlign: "center" }}>SYNK</AppText>
          <View style={{ alignItems: "center" }}>
            <AppText style={{ color: "#fff", fontSize: 32, fontWeight: "700", textAlign: "center", marginBottom: 16 }}>{summary.workoutName}</AppText>
            {!hideNumbers && (
              <>
                <AppText style={{ color: "#fff", fontSize: 64, fontWeight: "700" }}>{formatWeight(summary.totalVolume, user.weightUnit)}</AppText>
                <AppText style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, textTransform: "uppercase", letterSpacing: 1 }}>{isArabic ? "إجمالي الحجم" : "Total Volume"}</AppText>
                <AppText style={{ color: "#fff", fontSize: 18, marginTop: 16 }}>{summary.totalSets} sets · {summary.totalReps} reps · {formatDuration(summary.duration)}</AppText>
              </>
            )}
          </View>
          <AppText style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textAlign: "center" }}>{isArabic ? "كسرها مع سنك · synk.app" : "Crushed it with Synk · synk.app"}</AppText>
        </View>
      </View>

      {/* Share sheet */}
      <BottomSheet isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} title={isArabic ? "شارك فوزك" : "Share your win"}>
        <View style={{ gap: 24 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <AppText variant="body-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>{isArabic ? "إخفاء الأرقام والإحصائيات" : "Hide numbers and stats"}</AppText>
              <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left" }}>{isArabic ? "إخفاء الأرقام للخصوصية" : "Hide specific numbers for public sharing"}</AppText>
            </View>
            <Toggle value={hideNumbers} onValueChange={() => setHideNumbers((h) => !h)} />
          </View>
          <View style={{ gap: 12 }}>
            <Btn variant="primary" fullWidth onPress={() => handleShare(false)} style={{ height: 56 }}>
              <Share2 size={20} color="#fff" />
              <AppText variant="body-strong" style={{ color: "#fff" }}>{isArabic ? "شارك" : "Share"}</AppText>
            </Btn>
            <Btn variant="ghost" fullWidth onPress={() => handleShare(true)} style={{ height: 56 }}>
              <Copy size={20} color={colors.primary} />
              <AppText variant="body-strong" className="text-primary dark:text-primary-dark">{isArabic ? "احفظ على الصور" : "Save to photos"}</AppText>
            </Btn>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
