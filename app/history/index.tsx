/**
 * WorkoutHistory — RN port of src/screens/main/WorkoutHistory.tsx.
 *
 * List view (month-grouped workout cards with date column, muscle tags, stats,
 * PR badge) and Calendar view (month nav, day grid with workout dots / today
 * ring / dimmed future, monthly summary). List has muscle-group filter chips.
 * Empty state when there are no workouts.
 *
 * Web→RN: navigate(-1) → router.back(); EmptyState description → body.
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { getAllWorkouts, getWorkoutsInMonth } from "../../src/lib/historyQueries";
import EmptyState from "../../src/components/EmptyState";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import type { WorkoutLog } from "../../src/types";
import { muscleLabel } from "../../src/lib/muscleLabels";

const AMBER = "#f59e0b";
const AMBER_DARK = "#d97706";

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

export default function WorkoutHistory() {
  const router = useRouter();
  const { user } = useAppContext();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const isDark = theme === "dark";

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filterMode, setFilterMode] = useState("All");
  const [calDate, setCalDate] = useState(new Date());

  const allWorkouts = useMemo(() => getAllWorkouts(user), [user]);

  const filteredWorkouts = useMemo(() => {
    if (filterMode === "All") return allWorkouts;
    const g = filterMode.toLowerCase();
    return allWorkouts.filter((w) => {
      if (g === "push") return w.muscleGroups.some((m) => m === "chest" || m === "shoulders" || m === "triceps");
      if (g === "pull") return w.muscleGroups.some((m) => m === "back" || m === "biceps");
      if (g === "legs" || g === "lower") return w.muscleGroups.some((m) => m === "quads" || m === "hamstrings" || m === "glutes" || m === "calves");
      if (g === "upper") return w.muscleGroups.some((m) => m === "chest" || m === "back" || m === "shoulders");
      if (g === "cardio") return w.muscleGroups.some((m) => m === "cardio");
      return true;
    });
  }, [allWorkouts, filterMode]);

  const listByMonth = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    filteredWorkouts.forEach((w) => {
      const d = new Date(w.date);
      const key = `${d.toLocaleString(isArabic ? "ar-EG" : "en-US", { month: "long" }).toUpperCase()} ${d.getFullYear()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    });
    return Array.from(map.entries());
  }, [filteredWorkouts, isArabic]);

  const filtersEn = ["All", "Push", "Pull", "Legs", "Upper", "Lower"];
  const filtersAr = ["الكل", "دفع", "سحب", "رجل", "أعلى", "أسفل"];
  const filters = isArabic ? filtersAr : filtersEn;
  const filterKeyMap: Record<string, string> | null = isArabic ? filtersAr.reduce((acc, f, i) => ({ ...acc, [f]: filtersEn[i] }), {} as Record<string, string>) : null;

  const calMonthWorkouts = useMemo(() => getWorkoutsInMonth(user, calDate.getFullYear(), calDate.getMonth()), [user, calDate]);
  const monthName = calDate.toLocaleString(isArabic ? "ar-EG" : "en-US", { month: "long" });
  const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const slot = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const toggleBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const primaryTint = colors.primary + "1A";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 48, paddingHorizontal: 16 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Pressable>
          <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "السجل" : "History"}</AppText>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ alignItems: "center", paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", backgroundColor: toggleBg, padding: 4, borderRadius: 10 }}>
            {(["list", "calendar"] as const).map((m) => {
              const sel = viewMode === m;
              return (
                <Pressable key={m} onPress={() => setViewMode(m)} style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: sel ? cardBg : "transparent" }}>
                  <AppText style={{ fontSize: 13, fontWeight: "600", color: sel ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{m === "list" ? (isArabic ? "قائمة" : "List") : isArabic ? "تقويم" : "Calendar"}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
        {viewMode === "list" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12 }} style={{ borderTopWidth: 1, borderTopColor: colors.hairline }}>
            {filters.map((f) => {
              const filterVal = filterKeyMap ? filterKeyMap[f] : f;
              const sel = filterMode === filterVal;
              return (
                <Pressable key={f} onPress={() => setFilterMode(filterVal)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, backgroundColor: sel ? colors.primary : cardBg, borderColor: sel ? colors.primary : colors.hairline }}>
                  <AppText style={{ fontSize: 12, fontWeight: "500", color: sel ? colors.onPrimary : colors.ink, fontFamily: ff(isArabic, 600) }}>{f}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120, maxWidth: 512, width: "100%", alignSelf: "center" }}>
        {allWorkouts.length === 0 ? (
          <View style={{ paddingVertical: 48, marginTop: 48, paddingHorizontal: 24 }}>
            <EmptyState icon={<ClipboardList size={32} color={colors.primary} />} title={isArabic ? "لسه مفيش تمارين" : "No workouts yet"} body={isArabic ? "اعمل أول تمرين عشان نبدأ نسجّل ليك." : "Complete your first workout to start building your history."} />
          </View>
        ) : viewMode === "list" && listByMonth.length === 0 ? (
          <View style={{ paddingVertical: 48, marginTop: 48, paddingHorizontal: 24 }}>
            <EmptyState icon={<ClipboardList size={32} color={colors.primary} />} title={isArabic ? "مفيش تمارين بالفلتر ده" : "No workouts match this filter"} body={isArabic ? "جرّب فلتر تاني عشان تشوف باقي تمارينك." : "Try a different filter to see the rest of your history."} />
          </View>
        ) : viewMode === "list" ? (
          <View style={{ marginTop: 16 }}>
            {listByMonth.map(([monthKey, workouts]) => (
              <View key={monthKey} style={{ marginBottom: 24 }}>
                <AppText style={{ paddingHorizontal: 16, paddingVertical: 8, fontSize: 12, fontWeight: "700", color: colors.inkMuted48, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: ff(isArabic, 700) }}>{monthKey}</AppText>
                {workouts.map((w) => {
                  const d = new Date(w.date);
                  const dayStr = isArabic ? d.toLocaleDateString("ar-EG", { weekday: "short" }) : d.toLocaleDateString("en-US", { weekday: "short" });
                  return (
                    <Pressable key={w.id} onPress={() => router.push(`/history/workout/${w.id}`)} style={{ backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, padding: 16, marginHorizontal: 16, marginBottom: 8, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16, flex: 1 }}>
                        <View style={{ width: 48, alignItems: "center", justifyContent: "center", borderRightWidth: isArabic ? 0 : 1, borderLeftWidth: isArabic ? 1 : 0, borderColor: colors.hairline, paddingRight: isArabic ? 0 : 12, paddingLeft: isArabic ? 12 : 0 }}>
                          <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", fontFamily: ff(isArabic, 600) }}>{dayStr.charAt(0)}</AppText>
                          <AppText style={{ fontSize: 20, fontWeight: "700", color: colors.ink, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 700) }}>{d.getDate()}</AppText>
                        </View>
                        <View style={{ flex: 1, minWidth: 0, gap: 6, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                          <AppText numberOfLines={1} style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{w.name}</AppText>
                          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 4 }}>
                            {w.muscleGroups.map((m) => (
                              <View key={m} style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: primaryTint }}>
                                <AppText style={{ fontSize: 10, fontWeight: "700", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.8, fontFamily: ff(isArabic, 700) }}>{muscleLabel(m, isArabic)}</AppText>
                              </View>
                            ))}
                          </View>
                          <AppText numberOfLines={1} style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{w.durationMin} {isArabic ? "دقيقة" : "min"} · {w.totalVolumeKg.toLocaleString()} {isArabic ? "كجم" : "kg"} · {w.setsCompleted} {isArabic ? "مجموعات" : "sets"}</AppText>
                        </View>
                      </View>
                      <View style={{ alignItems: isArabic ? "flex-start" : "flex-end", gap: 8 }}>
                        {w.isPR && (
                          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: AMBER + "1A", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <AppText style={{ fontSize: 9, fontWeight: "700", letterSpacing: 1.5, color: AMBER_DARK }}>PR</AppText>
                          </View>
                        )}
                        <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={{ padding: 16, marginTop: 8 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <Pressable onPress={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: cardBg, alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
              <AppText style={{ fontSize: 18, fontWeight: "700", color: colors.ink, fontFamily: ff(isArabic, 700) }}>{monthName} {calDate.getFullYear()}</AppText>
              <Pressable onPress={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: cardBg, alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
            </View>

            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", marginBottom: 8 }}>
              {(isArabic ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"]).map((dd, i) => (
                <View key={i} style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}>
                  <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{dd}</AppText>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap" }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`e${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dNum = i + 1;
                const dayWorkouts = calMonthWorkouts.filter((w) => new Date(w.date).getDate() === dNum);
                const wFound = dayWorkouts[0];
                const today = new Date();
                const isToday = calDate.getFullYear() === today.getFullYear() && calDate.getMonth() === today.getMonth() && dNum === today.getDate();
                const isFuture = new Date(calDate.getFullYear(), calDate.getMonth(), dNum) > today;
                return (
                  <View key={dNum} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 2 }}>
                    <Pressable
                      onPress={() => wFound && router.push(`/history/workout/${wFound.id}`)}
                      style={{ flex: 1, borderRadius: 8, alignItems: "center", justifyContent: "flex-start", paddingVertical: 6, backgroundColor: wFound ? cardBg : slot, borderWidth: wFound ? 1 : 0, borderColor: colors.hairline, opacity: isFuture ? 0.3 : 1, ...(isToday ? { borderWidth: 2, borderColor: colors.primary } : null) }}
                    >
                      <AppText style={{ fontSize: 13, fontWeight: "500", color: wFound ? colors.ink : colors.inkMuted48, fontVariant: ["tabular-nums"], marginBottom: 4 }}>{dNum}</AppText>
                      {dayWorkouts.length > 0 && (
                        <View style={{ flexDirection: "row", gap: 2, marginTop: "auto" }}>
                          {dayWorkouts.slice(0, 3).map((_, di) => (
                            <View key={di} style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: colors.primary }} />
                          ))}
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={{ marginTop: 32, backgroundColor: primaryTint, borderRadius: 12, padding: 16, alignItems: "center" }}>
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1.5, marginBottom: 8, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ملخص الشهر" : "Monthly Summary"}</AppText>
              <AppText style={{ fontSize: 15, fontWeight: "500", color: colors.ink, textAlign: "center", fontFamily: ff(isArabic, 600) }}>{calMonthWorkouts.length} {isArabic ? "تمارين" : "workouts"} · {calMonthWorkouts.reduce((a, b) => a + b.durationMin, 0)} {isArabic ? "دقيقة" : "min"} · {calMonthWorkouts.reduce((a, b) => a + b.totalVolumeKg, 0).toLocaleString()} {isArabic ? "كجم إجمالي" : "kg total volume"}</AppText>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
