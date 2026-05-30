/**
 * ExerciseProgression — RN port of src/screens/main/ExerciseProgression.tsx.
 *
 * Per-exercise history: hero stat strip (best/est-1RM/volume/sessions), a
 * Weight/Volume/1RM line+bar chart with a tap tooltip and 3M/6M/1Y/All range
 * filter, PR list, recent sessions with an effort bar, and a collapsible notes
 * editor persisted to user.exerciseNotes.
 *
 * Web→RN swaps: useParams → useLocalSearchParams; navigate(-1) → router.back();
 * percentage/calc() SVG coords → pixel coords measured via onLayout (matches
 * WeightTrendChart); <textarea> → multiline <TextInput>.
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Line, Circle, Rect, Text as SvgText } from "react-native-svg";
import {
  ChevronLeft,
  MoreVertical,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import {
  getExerciseSessions,
  getExercisePRs,
  getAllExercisesForUser,
} from "../../src/lib/historyQueries";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

const AMBER = "#f59e0b";
const CHART_INNER_H = 224; // h-64 (256) minus p-4 (32)

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function ExerciseProgression() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [activeTab, setActiveTab] = useState<"Weight" | "Volume" | "1RM">("Weight");
  const [range, setRange] = useState<"3M" | "6M" | "1Y" | "All">("3M");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState(
    user.exerciseNotes?.[exerciseId || ""] || "",
  );
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
    date: string;
  } | null>(null);
  const [chartW, setChartW] = useState(0);

  const exerciseName = useMemo(() => {
    const all = getAllExercisesForUser(user);
    return all.find((e) => e.id === exerciseId)?.name || "Exercise";
  }, [user, exerciseId]);

  const sessions = useMemo(
    () => getExerciseSessions(user, exerciseId!),
    [user, exerciseId],
  );
  const prs = useMemo(() => getExercisePRs(user, exerciseId!), [user, exerciseId]);

  const filteredSessions = useMemo(() => {
    if (range === "All") return sessions;
    const days = range === "3M" ? 90 : range === "6M" ? 180 : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sessions.filter((s) => new Date(s.date) >= cutoff);
  }, [sessions, range]);

  const stats = useMemo(() => {
    if (sessions.length === 0) return { best: 0, reps: 0, est1RM: 0, totalVol: 0 };
    let best = 0;
    let reps = 0;
    let max1RM = 0;
    let totalVol = 0;
    sessions.forEach((s) => {
      totalVol += s.totalVolumeKg;
      if (s.est1RM > max1RM) max1RM = s.est1RM;
      if (s.isPR && s.topWeight >= best) {
        best = s.topWeight;
        let r = 0;
        s.sets.forEach((set) => {
          if (set.weight === s.topWeight && set.reps > r) r = set.reps;
        });
        reps = r;
      }
    });
    return { best, reps, est1RM: max1RM, totalVol };
  }, [sessions]);

  const chartData = useMemo(() => {
    return filteredSessions
      .slice()
      .reverse()
      .map((s) => {
        let val = 0;
        if (activeTab === "Weight") val = s.topWeight;
        if (activeTab === "Volume") val = s.totalVolumeKg;
        if (activeTab === "1RM") val = s.est1RM;
        return { val, date: new Date(s.date), isPR: s.isPR, original: s };
      });
  }, [filteredSessions, activeTab]);

  const maxVal = Math.max(...chartData.map((d) => d.val), 1);
  const minVal =
    activeTab === "Volume"
      ? 0
      : Math.min(...chartData.map((d) => d.val).filter((v) => v > 0), maxVal);
  const rangeVal = maxVal - minVal;

  const sortedVol = sessions.map((s) => s.totalVolumeKg).sort((a, b) => b - a);
  const bestVolEver = sortedVol[0] || 1;

  const handleNotesChange = (val: string) => {
    setNotesText(val);
    setUser({
      ...user,
      exerciseNotes: { ...user.exerciseNotes, [exerciseId!]: val },
    });
  };

  const fmtK = (v: number) => (v > 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`);

  // Hero stat cell
  const statCell = (label: string, value: string, last = false, hint = false) => (
    <View
      style={{
        flex: 1,
        padding: 12,
        alignItems: "center",
        justifyContent: "center",
        borderRightWidth: last ? 0 : 1,
        borderRightColor: colors.hairline,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <AppText
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: colors.inkMuted48,
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}
        >
          {label}
        </AppText>
        {hint && <HelpCircle size={10} color={colors.inkMuted48} />}
      </View>
      <AppText
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: colors.ink,
          marginTop: 4,
        }}
        numberOfLines={1}
      >
        {value}
      </AppText>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 4,
          height: insets.top + 60,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          backgroundColor: colors.canvas,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
          zIndex: 40,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(210,210,215,0.64)",
          }}
        >
          <ChevronLeft
            size={24}
            color={colors.ink}
            style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }}
          />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <AppText
            style={{ fontSize: 17, fontWeight: "600", color: colors.ink, maxWidth: 220 }}
            numberOfLines={1}
          >
            {exerciseName}
          </AppText>
          <AppText
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: colors.inkMuted48,
              textTransform: isArabic ? "none" : "uppercase",
              letterSpacing: 1.5,
              marginTop: isArabic ? 4 : 2,
              fontFamily: fontFamily(isArabic, 600),
            }}
          >
            {isArabic ? "التقدم" : "Progression"}
          </AppText>
        </View>
        <Pressable
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(210,210,215,0.64)",
          }}
        >
          <MoreVertical size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          maxWidth: 512,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {/* Hero stats */}
        <View
          style={{
            flexDirection: isArabic ? "row-reverse" : "row",
            backgroundColor: colors.canvas,
            borderBottomWidth: 1,
            borderBottomColor: colors.hairline,
          }}
        >
          {statCell(isArabic ? "الأفضل" : "BEST", stats.best ? `${stats.best}×${stats.reps}` : "-")}
          {statCell(
            isArabic ? "١RM مقدّر" : "EST 1RM",
            stats.est1RM ? `${stats.est1RM}kg` : "-",
            false,
            true,
          )}
          {statCell(
            isArabic ? "الحجم" : "VOLUME",
            stats.totalVol > 0 ? `${(stats.totalVol / 1000).toFixed(1)}k` : "-",
          )}
          {statCell(isArabic ? "جلسات" : "SESSIONS", `${sessions.length}`, true)}
        </View>

        {/* Chart section */}
        <View style={{ marginTop: 24, marginBottom: 16 }}>
          {/* Metric tabs */}
          <View
            style={{
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
              paddingHorizontal: 16,
            }}
          >
            {(["Weight", "Volume", "1RM"] as const).map((tab) => {
              const active = activeTab === tab;
              const label =
                tab === "Weight"
                  ? isArabic
                    ? "الوزن"
                    : "Weight"
                  : tab === "Volume"
                    ? isArabic
                      ? "الحجم"
                      : "Volume"
                    : isArabic
                      ? "١RM المقدّر"
                      : "Est 1RM";
              return (
                <Pressable
                  key={tab}
                  onPress={() => {
                    setActiveTab(tab);
                    setTooltip(null);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 9999,
                    borderWidth: 1,
                    backgroundColor: active ? colors.primary : "transparent",
                    borderColor: active ? colors.primary : colors.hairline,
                  }}
                >
                  <AppText
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: active ? "#fff" : colors.ink,
                    }}
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Chart card */}
          <Pressable
            onPress={() => setTooltip(null)}
            style={{
              height: 256,
              marginHorizontal: 16,
              backgroundColor: colors.canvas,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.hairline,
              padding: 16,
            }}
          >
            <View style={{ flex: 1 }} onLayout={(e) => setChartW(e.nativeEvent.layout.width)}>
              {chartData.length > 0 && chartW > 0 ? (
                <Svg width={chartW} height={CHART_INNER_H}>
                  {/* Grid lines + Y labels */}
                  {[0, 1, 2, 3, 4].map((i) => {
                    const y = i * (CHART_INNER_H / 4);
                    const gridVal = maxVal - i * (rangeVal / 4);
                    return (
                      <React.Fragment key={i}>
                        <Line
                          x1={0}
                          y1={y}
                          x2={chartW}
                          y2={y}
                          stroke={colors.ink}
                          strokeOpacity={0.05}
                          strokeWidth={1}
                        />
                        <SvgText
                          x={isArabic ? chartW : 0}
                          y={y + (i === 0 ? 10 : i === 4 ? -4 : 4)}
                          fontSize={10}
                          fill={colors.inkMuted48}
                          opacity={0.5}
                          textAnchor={isArabic ? "end" : "start"}
                        >
                          {fmtK(gridVal)}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* Data */}
                  {activeTab === "Volume"
                    ? chartData.map((d, i) => {
                        const barW = Math.max(4, Math.min(20, chartW / chartData.length - 2));
                        const xPx =
                          chartData.length === 1
                            ? chartW / 2
                            : (i / (chartData.length - 1)) * chartW;
                        const hPx = ((d.val - minVal) / (rangeVal || 1)) * CHART_INNER_H;
                        return (
                          <Rect
                            key={i}
                            x={xPx - barW / 2}
                            y={CHART_INNER_H - hPx}
                            width={barW}
                            height={hPx}
                            rx={2}
                            fill={colors.primary}
                            onPress={() =>
                              setTooltip({
                                x: xPx,
                                y: CHART_INNER_H - hPx,
                                text: `${(d.val / 1000).toFixed(1)}k kg`,
                                date: d.date.toLocaleDateString(),
                              })
                            }
                          />
                        );
                      })
                    : (() => {
                        const pts = chartData.map((d, i) => ({
                          x:
                            chartData.length === 1
                              ? chartW / 2
                              : (i / (chartData.length - 1)) * chartW,
                          y:
                            CHART_INNER_H -
                            ((d.val - minVal) / (rangeVal || 1)) * CHART_INNER_H,
                          d,
                        }));
                        return (
                          <React.Fragment>
                            {pts.length > 1 && (
                              <Path
                                d={pts
                                  .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                                  .join(" ")}
                                fill="none"
                                stroke={colors.primary}
                                strokeWidth={2}
                              />
                            )}
                            {pts.map((p, i) => (
                              <React.Fragment key={i}>
                                {p.d.isPR && activeTab === "Weight" && (
                                  <Circle cx={p.x} cy={p.y} r={8} fill="none" stroke={AMBER} strokeWidth={2} />
                                )}
                                <Circle
                                  cx={p.x}
                                  cy={p.y}
                                  r={p.d.isPR && activeTab === "Weight" ? 6 : 4}
                                  fill={colors.canvas}
                                  stroke={colors.primary}
                                  strokeWidth={2}
                                  onPress={() =>
                                    setTooltip({
                                      x: p.x,
                                      y: p.y,
                                      text: `${p.d.val} kg`,
                                      date: p.d.date.toLocaleDateString(),
                                    })
                                  }
                                />
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        );
                      })()}
                </Svg>
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <AppText style={{ color: colors.inkMuted48, fontSize: 13 }}>
                    {isArabic ? "لا توجد بيانات كافية" : "Not enough data"}
                  </AppText>
                </View>
              )}
            </View>

            {tooltip && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 16 + tooltip.x - 32,
                  top: 16 + tooltip.y - 44,
                  backgroundColor: "#000",
                  paddingVertical: 4,
                  paddingHorizontal: 8,
                  borderRadius: 4,
                  alignItems: "center",
                  minWidth: 64,
                }}
              >
                <AppText style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                  {tooltip.text}
                </AppText>
                <AppText style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                  {tooltip.date}
                </AppText>
              </View>
            )}
          </Pressable>

          {/* Range filter */}
          <View
            style={{
              flexDirection: isArabic ? "row-reverse" : "row",
              justifyContent: "center",
              gap: 4,
              marginTop: 16,
            }}
          >
            {(["3M", "6M", "1Y", "All"] as const).map((r) => {
              const active = range === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => {
                    setRange(r);
                    setTooltip(null);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 4,
                    backgroundColor: active
                      ? isDarkSurface(colors)
                      : "transparent",
                  }}
                >
                  <AppText
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: active ? colors.ink : colors.inkMuted48,
                    }}
                  >
                    {r === "All" && isArabic ? "الكل" : r}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* PR History */}
        {prs.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <AppText
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: colors.inkMuted48,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                marginBottom: 12,
                textAlign: isArabic ? "right" : "left",
              }}
            >
              {isArabic ? "أرقام قياسية" : "PERSONAL RECORDS"}
            </AppText>
            <View
              style={{
                backgroundColor: colors.canvas,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.hairline,
                overflow: "hidden",
              }}
            >
              {prs.map((pr, i) => {
                const d = new Date(pr.date);
                const dateStr = d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <Pressable
                    key={i}
                    onPress={() => router.push(`/history/workout/${pr.workoutId}`)}
                    style={{
                      padding: 12,
                      flexDirection: isArabic ? "row-reverse" : "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.hairline,
                    }}
                  >
                    <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.ink }}>
                      {dateStr}
                    </AppText>
                    <View
                      style={{
                        flexDirection: isArabic ? "row-reverse" : "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <AppText style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                        {pr.weight}kg × {pr.reps}
                      </AppText>
                      <View style={{ backgroundColor: "rgba(245,158,11,0.1)", padding: 4, borderRadius: 4 }}>
                        <Star size={12} color={AMBER} fill={AMBER} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        <View style={{ paddingHorizontal: 16, marginTop: 32 }}>
          <AppText
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: colors.inkMuted48,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 12,
              textAlign: isArabic ? "right" : "left",
            }}
          >
            {isArabic ? "أحدث الجلسات" : "RECENT SESSIONS"}
          </AppText>
          <View
            style={{
              backgroundColor: colors.canvas,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.hairline,
              overflow: "hidden",
            }}
          >
            {sessions.length === 0 ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <AppText style={{ fontSize: 13, color: colors.inkMuted48 }}>
                  {isArabic ? "لا توجد جلسات بعد" : "No sessions yet"}
                </AppText>
              </View>
            ) : (
              sessions.slice(0, 10).map((s, i) => {
                const d = new Date(s.date);
                const dateStr = d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
                  month: "short",
                  day: "numeric",
                });
                const effortW = Math.max(5, (s.totalVolumeKg / bestVolEver) * 100);
                return (
                  <Pressable
                    key={i}
                    onPress={() => router.push(`/history/workout/${s.workoutId}`)}
                    style={{
                      padding: 12,
                      flexDirection: isArabic ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 12,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: colors.hairline,
                    }}
                  >
                    <AppText
                      style={{ width: 64, fontSize: 12, fontWeight: "600", color: colors.inkMuted48 }}
                    >
                      {dateStr}
                    </AppText>
                    <AppText style={{ width: 80, fontSize: 14, fontWeight: "700", color: colors.ink }}>
                      {s.topWeight}kg
                    </AppText>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          width: "100%",
                          height: 6,
                          backgroundColor: isDark(colors) ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                          borderRadius: 9999,
                          overflow: "hidden",
                          flexDirection: isArabic ? "row-reverse" : "row",
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            backgroundColor: "rgba(0,102,204,0.4)",
                            borderRadius: 9999,
                            width: `${effortW}%`,
                          }}
                        />
                      </View>
                      <AppText
                        style={{
                          fontSize: 10,
                          color: colors.inkMuted48,
                          marginTop: 2,
                          textAlign: isArabic ? "left" : "right",
                        }}
                      >
                        {(s.totalVolumeKg / 1000).toFixed(1)}k
                      </AppText>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* Notes panel */}
        <View style={{ paddingHorizontal: 16, marginTop: 32, marginBottom: 48 }}>
          <View
            style={{
              backgroundColor: colors.canvasParchment,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Pressable
              onPress={() => setNotesOpen(!notesOpen)}
              style={{
                padding: 16,
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <AppText
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: colors.ink,
                  fontFamily: fontFamily(isArabic, 600),
                }}
              >
                {isArabic ? "ملاحظاتك الخاصة" : "Your Notes"}
              </AppText>
              {notesOpen ? (
                <ChevronUp size={18} color={colors.inkMuted48} />
              ) : (
                <ChevronDown size={18} color={colors.inkMuted48} />
              )}
            </Pressable>
            {notesOpen && (
              <View style={{ padding: 16, paddingTop: 0 }}>
                <TextInput
                  value={notesText}
                  onChangeText={handleNotesChange}
                  multiline
                  placeholder={
                    isArabic
                      ? "ركز على كذا، جرب قبضة مختلفة..."
                      : "Form cues, tweaks, e.g. 'use wider grip'..."
                  }
                  placeholderTextColor={colors.inkMuted48}
                  style={{
                    minHeight: 100,
                    backgroundColor: colors.canvas,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 14,
                    color: colors.ink,
                    textAlign: isArabic ? "right" : "left",
                    textAlignVertical: "top",
                    fontFamily: fontFamily(isArabic),
                  }}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Active range-pill background: bg-black/5 dark:bg-white/10
function isDarkSurface(colors: ReturnType<typeof useColors>) {
  return colors.canvas === "#0B0D10" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)";
}
function isDark(colors: ReturnType<typeof useColors>) {
  return colors.canvas === "#0B0D10";
}
