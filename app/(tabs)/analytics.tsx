/**
 * Analytics — RN port of src/screens/main/Analytics.tsx.
 * Empty state until data is logged; otherwise weight chart, stat tiles, and
 * goal progress bars.
 */
import React from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Activity, Award, Target, BarChart3, ArrowRight } from "lucide-react-native";
import TopBar from "../../src/components/TopBar";
import EmptyState from "../../src/components/EmptyState";
import WeightTrendChart from "../../src/components/WeightTrendChart";
import { getAllWorkouts } from "../../src/lib/historyQueries";
import { useAppContext } from "../../src/AppContext";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText, StatValueSm, Title } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";

function ProgressBar({ pct, color, track }: { pct: number; color: string; track: string }) {
  const w = useSharedValue(0);
  React.useEffect(() => {
    w.value = withTiming(pct, { duration: 600 });
  }, [pct]);
  const style = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={{ height: 6, width: "100%", backgroundColor: track, borderRadius: 9999, overflow: "hidden" }}>
      <Animated.View style={[{ height: "100%", backgroundColor: color }, style]} />
    </View>
  );
}

export default function Analytics() {
  const router = useRouter();
  const { user, todaysLogs } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  // Gate on real historical presence — not just whether food was logged *today*
  // (a user with months of history must not see the empty state). All derived
  // from the same sources the rest of the app uses; metrics with no source are
  // hidden rather than faked (M3/F6).
  const allWorkouts = getAllWorkouts(user);
  const weightLog = user.weightLog ?? [];
  const hasData = allWorkouts.length > 0 || weightLog.length > 0 || todaysLogs.foods.length > 0;

  const totalWorkouts = allWorkouts.length;
  const weekAgo = Date.now() - 7 * 86400000;
  const workoutsThisWeek = allWorkouts.filter((w) => new Date(w.date).getTime() >= weekAgo).length;

  const startWeight = weightLog.length > 0 ? weightLog[0].weightKg : null;
  const latestWeight = weightLog.length > 0 ? weightLog[weightLog.length - 1].weightKg : null;
  const targetWeight = user.targetWeight ?? null;
  const weightPct =
    startWeight != null && latestWeight != null && targetWeight != null && startWeight !== targetWeight
      ? Math.round(Math.min(100, Math.max(0, ((latestWeight - startWeight) / (targetWeight - startWeight)) * 100)))
      : null;

  const card = {
    backgroundColor: colors.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
  };
  const statLabel = {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.inkMuted48,
    textTransform: (isArabic ? "none" : "uppercase") as "none" | "uppercase",
    letterSpacing: 0.5,
  };

  const statTile = (Icon: any, value: string, label: string) => (
    <View style={[card, { flex: 1, padding: 24, gap: 16 }]}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} strokeWidth={2.5} color={colors.ink} />
      </View>
      <View>
        <StatValueSm style={{ marginBottom: 4 }}>{value}</StatValueSm>
        <AppText style={statLabel}>{label}</AppText>
      </View>
    </View>
  );

  const goalRow = (label: string, pct: number) => (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between" }}>
        <AppText style={statLabel}>{label}</AppText>
        <AppText style={{ ...statLabel, color: colors.primary }}>{pct}%</AppText>
      </View>
      <ProgressBar pct={pct} color={colors.primary} track={colors.hairline} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      <TopBar title={isArabic ? "التحليلات" : "Analytics"} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 128 + insets.bottom, gap: 12 }}>
        {!hasData ? (
          <View style={[card, { paddingVertical: 48 }]}>
            <EmptyState
              icon={<BarChart3 />}
              title={isArabic ? "سجل تمارينك ووجباتك لرؤية تقدمك" : "Log workouts and meals to see your progress"}
            />
          </View>
        ) : (
          <>
            <View style={[card, { padding: 24 }]}>
              <WeightTrendChart height={180} />
            </View>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
              {statTile(Award, String(totalWorkouts), isArabic ? "التمارين" : "Workouts")}
              {statTile(Activity, String(workoutsThisWeek), isArabic ? "هذا الأسبوع" : "This week")}
            </View>
            <View style={[card, { padding: 24, gap: 24 }]}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <Title style={{ textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5 }}>{isArabic ? "الأهداف" : "GOALS"}</Title>
                <Target size={18} color={colors.primary} strokeWidth={2.5} />
              </View>
              <View style={{ gap: 24 }}>
                {weightPct != null ? (
                  goalRow(isArabic ? "هدف الوزن" : "Weight goal", weightPct)
                ) : (
                  <AppText style={{ fontSize: 13, color: colors.inkMuted48, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
                    {isArabic ? "سجّل وزنك عشان نتابع تقدمك نحو هدفك." : "Log your weight to track progress toward your goal."}
                  </AppText>
                )}
              </View>
              <Btn variant="secondary" fullWidth onPress={() => router.push("/history")}>
                <AppText variant="body-strong" style={{ color: colors.ink, textTransform: isArabic ? "none" : "uppercase" }}>
                  {isArabic ? "التقرير الكامل" : "Full Report"}
                </AppText>
                <ArrowRight size={16} strokeWidth={2.5} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Btn>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
