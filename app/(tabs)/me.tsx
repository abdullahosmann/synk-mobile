/**
 * Profile ("Me") — RN port of src/screens/main/Profile.tsx.
 * Avatar (initials/photo) + name + level, stat strip (streak/minutes/workouts),
 * and the row stack: plan details, analytics preview (mini bar chart), body
 * measurements, weight log, weight trend, progress photos, coach insights,
 * workout history. Floating coach icon + photo + weight sheets.
 */
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import {
  Flame, Clock, Dumbbell, Camera, Image as ImageIcon, Settings,
  ChevronRight, ClipboardList, Ruler, Sparkles, Scale,
} from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { showPermissionDeniedAlert } from "../../src/lib/permissions";
import BottomSheet from "../../src/components/BottomSheet";
import CoachIcon from "../../src/components/CoachIcon";
import CoachAvatar from "../../src/components/CoachAvatar";
import WeightLogSheet from "../../src/components/WeightLogSheet";
import WeightTrendChart from "../../src/components/WeightTrendChart";
import { useColors } from "../../src/theme/ThemeProvider";
import { withAlpha } from "../../src/theme/tint";
import { AppText, SectionTitle } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";
import { getAllWorkouts } from "../../src/lib/historyQueries";

function PressableScale({ children, onPress, style }: any) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable onPressIn={() => (s.value = withTiming(0.97, { duration: 80 }))} onPressOut={() => (s.value = withTiming(1, { duration: 120 }))} onPress={onPress}>
      <Animated.View style={[a, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const { user, setUser, level, todaysLogs, streaks } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const trainingStreak = streaks?.find((s) => s.type === "training")?.count ?? 0;

  const [showWeightSheet, setShowWeightSheet] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);

  const caloriesToday = (todaysLogs?.foods || []).reduce((a, f) => a + f.calories, 0);
  const initials =
    (user?.name || (isArabic ? "المستخدم" : "User")).split(" ").map((n) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "?";

  // C2 — derive workouts + minutes from the same source as Analytics/History
  // (getAllWorkouts) so the profile strip can't disagree with them (was reading
  // synk:historicalSets, which is empty while getAllWorkouts has the history).
  const { derivedWorkouts, derivedMinutes } = useMemo(() => {
    const all = getAllWorkouts(user);
    return {
      derivedWorkouts: all.length,
      derivedMinutes: all.reduce((s, w) => s + (w.durationMin || 0), 0),
    };
  }, [user]);

  const planName = useMemo(() => {
    const splitMap: Record<string, { en: string; ar: string }> = {
      auto: { en: "Auto (Recommended)", ar: "تلقائي (الموصى به)" },
      ppl: { en: "Push-Pull-Legs", ar: "Push-Pull-Legs" },
      "upper-lower": { en: "Upper-Lower", ar: "Upper-Lower" },
      arnold: { en: "Arnold", ar: "Arnold" },
      phul: { en: "PHUL", ar: "PHUL" },
      phat: { en: "PHAT", ar: "PHAT" },
      "bro-split": { en: "Bro Split", ar: "Bro Split" },
      "full-body": { en: "Full Body", ar: "Full Body" },
      custom: { en: "Custom", ar: "Custom" },
    };
    const levelMap: Record<string, { en: string; ar: string }> = {
      beginner: { en: "Beginner", ar: "مبتدئ" },
      intermediate: { en: "Intermediate", ar: "متوسط" },
      advanced: { en: "Advanced", ar: "متقدم" },
    };
    const split = splitMap[user?.workoutSplit || "auto"] || splitMap.auto;
    const lvl = user?.fitnessLevel ? levelMap[user.fitnessLevel] : null;
    const base = isArabic ? split.ar : split.en;
    return lvl ? `${base} · ${isArabic ? lvl.ar : lvl.en}` : base;
  }, [user?.workoutSplit, user?.fitnessLevel, isArabic]);

  const stats = [
    { icon: Flame, label: isArabic ? "سلسلة" : "Streak", value: String(trainingStreak) },
    { icon: Clock, label: isArabic ? "دقائق" : "Minutes", value: String(derivedMinutes) },
    { icon: Dumbbell, label: isArabic ? "تمارين" : "Workouts", value: String(derivedWorkouts) },
  ];

  // C1 — derive the progress card from real history (same source as the
  // dashboard analytics card) instead of hardcoded demo numbers, so it matches
  // the streak strip above and the Analytics screen.
  const progressStats = useMemo(() => {
    const all = getAllWorkouts(user);
    const dayMs = 86400000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const bars = Array.from({ length: 7 }).map((_, i) => {
      const start = todayMs - (6 - i) * dayMs;
      return all.filter((w) => { const t = new Date(w.date).getTime(); return t >= start && t < start + dayMs; }).reduce((s, w) => s + w.totalVolumeKg, 0);
    });
    const maxBar = Math.max(1, ...bars);
    const barHeights = bars.map((v) => (v > 0 ? Math.max(8, Math.round((v / maxBar) * 100)) : 0));
    const weekAgo = todayMs - 7 * dayMs;
    const prevStart = todayMs - 14 * dayMs;
    const volThis = all.filter((w) => new Date(w.date).getTime() >= weekAgo).reduce((s, w) => s + w.totalVolumeKg, 0);
    const volPrev = all.filter((w) => { const t = new Date(w.date).getTime(); return t >= prevStart && t < weekAgo; }).reduce((s, w) => s + w.totalVolumeKg, 0);
    const volDelta = volPrev > 0 ? Math.round(((volThis - volPrev) / volPrev) * 100) : null;
    const prsThisWeek = all.filter((w) => w.isPR && new Date(w.date).getTime() >= weekAgo).length;
    return { barHeights, volDelta, prsThisWeek };
  }, [user]);
  const chartBars = isArabic ? [...progressStats.barHeights].reverse() : progressStats.barHeights;

  const pickPhoto = async (mode: "camera" | "library") => {
    setPhotoSheetOpen(false);
    try {
      const perm =
        mode === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showPermissionDeniedAlert(mode === "camera" ? "camera" : "photos", isArabic);
        return;
      }
      const result =
        mode === "camera"
          ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
          : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        setUser((prev) => ({ ...prev, avatarUrl: result.assets[0].uri }));
        showToast(isArabic ? "تم تحديث صورتك" : "Avatar updated", "success");
      }
    } catch {
      showToast(isArabic ? "حدث خطأ" : "Something went wrong", "error");
    }
  };

  const rowCard = (Icon: any, title: string, subtitle: string, onPress: () => void) => (
    <PressableScale onPress={onPress} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, flex: 1 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center" }}>
          <Icon size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="body-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>{title}</AppText>
          <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left" }}>{subtitle}</AppText>
        </View>
      </View>
      <ChevronRight size={18} color={colors.inkMuted48} strokeWidth={2} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
    </PressableScale>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 128 + insets.bottom }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20, alignItems: "center" }}>
          <Pressable onPress={() => router.push("/settings")} style={{ position: "absolute", top: insets.top + 8, right: isArabic ? undefined : 16, left: isArabic ? 16 : undefined, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
            <Settings size={20} color={colors.ink} />
          </Pressable>

          <Pressable onPress={() => setPhotoSheetOpen(true)} style={{ marginBottom: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: "100%", height: "100%" }} />
              ) : (
                <SectionTitle style={{ color: "#fff" }}>{initials}</SectionTitle>
              )}
            </View>
            <View style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
              <Camera size={14} color="#fff" />
            </View>
          </Pressable>

          <SectionTitle>{user?.name || (isArabic ? "مستخدم جديد" : "New User")}</SectionTitle>
          <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 4 }}>
            {isArabic ? `مستوى ${level} • ${caloriesToday} سعرة اليوم` : `Level ${level} • ${caloriesToday} kcal today`}
          </AppText>

          {/* Stats */}
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", width: "100%", marginTop: 16 }}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <React.Fragment key={i}>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Icon size={18} color={colors.inkMuted48} />
                    <AppText style={{ fontSize: 22, fontWeight: "700", color: colors.ink, marginTop: 6 }}>{s.value}</AppText>
                    <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 4 }}>{s.label}</AppText>
                  </View>
                  {i < stats.length - 1 && <View style={{ width: 1, height: 32, backgroundColor: "rgba(0,0,0,0.1)", marginTop: 14 }} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Rows */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {/* Plan details */}
          <PressableScale onPress={() => router.push("/plan-details")} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
            <CoachAvatar coachId={user?.coach || "khaled"} size={40} />
            <View style={{ flex: 1 }}>
              <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, marginBottom: 2, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                {isArabic ? "تفاصيل خطتك" : "PLAN DETAILS"}
              </AppText>
              <AppText variant="caption-strong" numberOfLines={1} style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>{planName}</AppText>
            </View>
            <ChevronRight size={18} color={colors.hairline} strokeWidth={2.5} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </PressableScale>

          {/* Nutrition plan */}
          {!!user?.nutritionPlan && (
            <PressableScale onPress={() => router.push("/nutrition-plan")} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                <Flame size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, marginBottom: 2, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                  {isArabic ? "خطة التغذية" : "NUTRITION PLAN"}
                </AppText>
                <AppText variant="caption-strong" numberOfLines={1} style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>
                  {`${(user.calorieTarget || user.nutritionPlan?.dailyCalories || 0).toLocaleString()} ${isArabic ? "سعرة/يوم" : "kcal / day"}`}
                </AppText>
              </View>
              <ChevronRight size={18} color={colors.hairline} strokeWidth={2.5} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
            </PressableScale>
          )}

          {/* Analytics preview */}
          <PressableScale onPress={() => router.push("/analytics")} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16 }}>
            <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, marginBottom: 2, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
              {isArabic ? "تقدمك" : "YOUR PROGRESS"}
            </AppText>
            <AppText variant="caption-strong" style={{ color: colors.ink, marginBottom: 12, textAlign: isArabic ? "right" : "left" }}>{isArabic ? "التحليلات" : "Analytics"}</AppText>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-end", gap: 6, height: 48, marginBottom: 16, justifyContent: isArabic ? "flex-end" : "flex-start" }}>
              {chartBars.map((hp, i) => (
                <View key={i} style={{ width: 8, backgroundColor: colors.primary, borderRadius: 2, height: `${hp}%` }} />
              ))}
            </View>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
              {[
                { l: isArabic ? "السلسلة الأسبوعية" : "Weekly streak", v: isArabic ? `${trainingStreak} ${trainingStreak === 1 ? "يوم" : "أيام"}` : `${trainingStreak} ${trainingStreak === 1 ? "day" : "days"}`, c: colors.ink },
                { l: isArabic ? "الحجم" : "Volume", v: progressStats.volDelta == null ? "—" : `${progressStats.volDelta >= 0 ? "+" : ""}${progressStats.volDelta}%`, c: progressStats.volDelta != null && progressStats.volDelta < 0 ? colors.semanticRed : colors.semanticGreen },
                { l: isArabic ? "أرقام قياسية" : "PRs", v: isArabic ? `${progressStats.prsThisWeek} الأسبوع ده` : `${progressStats.prsThisWeek} this week`, c: colors.ink },
              ].map((m, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <View style={{ width: 1, height: 32, backgroundColor: colors.hairline }} />}
                  <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{m.l}</AppText>
                    <AppText variant="caption-strong" style={{ color: m.c }}>{m.v}</AppText>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </PressableScale>

          {rowCard(Ruler, isArabic ? "قياسات الجسم" : "Body Measurements", isArabic ? "تتبع تقدم قياساتك عبر الزمن" : "Track how your measurements change over time", () => router.push("/measurements"))}
          {rowCard(Scale, isArabic ? "سجّل وزنك" : "Log weight", user?.weightLog?.[0] ? (isArabic ? `آخر تسجيل: ${user.weightLog[0].weightKg.toFixed(1)} كجم` : `Last: ${user.weightLog[0].weightKg.toFixed(1)} kg`) : (isArabic ? "مفيش تسجيلات لسه" : "No entries yet"), () => setShowWeightSheet(true))}

          {(user?.weightLog?.length || 0) >= 2 && (
            <View style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16 }}>
              <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, marginBottom: 12, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                {isArabic ? "اتجاه الوزن" : "Weight trend"}
              </AppText>
              <WeightTrendChart height={140} />
            </View>
          )}

          {rowCard(Camera, isArabic ? "صور التقدّم" : "Progress Photos", isArabic ? "قارن صورك لتشوف الفرق الحقيقي" : "Compare visual changes in your physique", () => router.push("/photos"))}
          {rowCard(Sparkles, isArabic ? "سجل تعديلات الكوتش" : "Coach insights history", isArabic ? "شوف التعديلات السابقة والأسباب" : "See past plan changes and reasons", () => router.push("/profile/adaptation-history"))}
          {rowCard(ClipboardList, isArabic ? "سجل التمارين" : "Workout History", isArabic ? "تصفّح كل تمرين، كل رقم قياسي" : "Browse every session, every PR", () => router.push("/history"))}
        </View>
      </ScrollView>

      {/* Floating coach icon (self-positioning + draggable) */}
      <CoachIcon coachId={user?.coach || "khaled"} onPress={() => router.push("/coach")} />

      {/* Photo sheet */}
      <BottomSheet isOpen={photoSheetOpen} onClose={() => setPhotoSheetOpen(false)} title={isArabic ? "صورة الملف" : "Profile photo"}>
        <View style={{ gap: 8 }}>
          {[
            { icon: Camera, label: isArabic ? "كاميرا" : "Take photo", mode: "camera" as const },
            { icon: ImageIcon, label: isArabic ? "من الاستوديو" : "Choose from library", mode: "library" as const },
          ].map(({ icon: Icon, label, mode }) => (
            <Btn key={mode} variant="secondary" fullWidth onPress={() => pickPhoto(mode)} style={{ height: 56, borderRadius: 14, justifyContent: "flex-start" }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, width: "100%" }}>
                <Icon size={20} color={colors.inkMuted48} />
                <AppText variant="body-strong" style={{ color: colors.ink }}>{label}</AppText>
              </View>
            </Btn>
          ))}
        </View>
      </BottomSheet>

      <WeightLogSheet isOpen={showWeightSheet} onClose={() => setShowWeightSheet(false)} />
    </View>
  );
}
