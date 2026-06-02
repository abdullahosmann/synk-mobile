/**
 * BodyMeasurements — RN port of src/screens/main/BodyMeasurements.tsx.
 *
 * 2-col grid of body measurement tiles (latest value + goal-aware delta color).
 * Tap a tile → chart sheet (range toggle, react-native-svg line chart with tap
 * tooltips, history list, long-press to delete). "+" → add sheet (date field +
 * per-type number inputs). cm/in conversion from heightUnit.
 *
 * Web→RN: navigate(-1) → router.back(); window.confirm → Alert.alert; <input
 * type=date> → editable TextInput (YYYY-MM-DD; no native date picker dep);
 * inline <svg> chart → react-native-svg.
 */
import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Plus } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import BottomSheet from "../src/components/BottomSheet";
import { useTheme } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";
import type { BodyMeasurement, MeasurementType } from "../src/types";

const MEASUREMENT_INFO: Record<MeasurementType, { en: string; ar: string; optimalFatLoss: "down" | "up"; optimalMuscleGain: "down" | "up" }> = {
  waist: { en: "Waist", ar: "الخصر", optimalFatLoss: "down", optimalMuscleGain: "down" },
  hips: { en: "Hips", ar: "الورك", optimalFatLoss: "down", optimalMuscleGain: "down" },
  "arm-r": { en: "Right Arm", ar: "دراع يمين", optimalFatLoss: "down", optimalMuscleGain: "up" },
  "arm-l": { en: "Left Arm", ar: "دراع شمال", optimalFatLoss: "down", optimalMuscleGain: "up" },
  "thigh-r": { en: "Right Thigh", ar: "فخد يمين", optimalFatLoss: "down", optimalMuscleGain: "up" },
  "thigh-l": { en: "Left Thigh", ar: "فخد شمال", optimalFatLoss: "down", optimalMuscleGain: "up" },
  chest: { en: "Chest", ar: "الصدر", optimalFatLoss: "down", optimalMuscleGain: "up" },
  neck: { en: "Neck", ar: "الرقبة", optimalFatLoss: "down", optimalMuscleGain: "up" },
  shoulders: { en: "Shoulders", ar: "الكتفين", optimalFatLoss: "down", optimalMuscleGain: "up" },
};

const GREEN = "#34c759";
const RED = "#ff3b30";

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

function Chart({ history, toDisplay, unitLabel, colors, cardBg, isDark, emptyLabel }: { history: BodyMeasurement[]; toDisplay: (cm: number) => number; unitLabel: string; colors: any; cardBg: string; isDark: boolean; emptyLabel: string }) {
  const [w, setW] = useState(0);
  const [tip, setTip] = useState<{ x: number; y: number; text: string; date: string } | null>(null);
  const H = 192;
  const PAD = 16;
  const innerW = Math.max(0, w - PAD * 2);
  const innerH = H - PAD * 2;

  if (history.length === 0) {
    return (
      <View style={{ height: H, alignItems: "center", justifyContent: "center" }}>
        <AppText style={{ fontSize: 13, color: colors.inkMuted48 }}>{emptyLabel}</AppText>
      </View>
    );
  }

  const minVal = Math.min(...history.map((h) => h.valueCm)) * 0.95;
  const maxVal = Math.max(...history.map((h) => h.valueCm)) * 1.05;
  const range = maxVal - minVal || 1;
  const px = (i: number) => (history.length === 1 ? innerW / 2 : (i / (history.length - 1)) * innerW);
  const py = (v: number) => (1 - (v - minVal) / range) * innerH;
  const points = history.map((d, i) => `${px(i)},${py(d.valueCm)}`).join(" ");

  return (
    <Pressable onPress={() => setTip(null)} style={{ height: H, backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, padding: PAD, marginBottom: 16 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width + PAD * 2)} style={{ flex: 1 }}>
        <Svg width="100%" height="100%">
          {[0, 1, 2, 3, 4].map((i) => {
            const y = i * (innerH / 4);
            const gridVal = maxVal - i * (range / 4);
            return (
              <React.Fragment key={i}>
                <Line x1={0} y1={y} x2={innerW} y2={y} stroke={colors.ink} strokeOpacity={0.05} strokeWidth={1} />
                <SvgText x={0} y={y + (i === 0 ? 10 : i === 4 ? -4 : 4)} fontSize={10} fill={colors.inkMuted48} opacity={0.6}>{gridVal.toFixed(1)}</SvgText>
              </React.Fragment>
            );
          })}
          {history.length > 1 && <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={2} />}
          {history.map((d, i) => (
            <Circle
              key={i}
              cx={px(i)}
              cy={py(d.valueCm)}
              r={5}
              fill={cardBg}
              stroke={colors.primary}
              strokeWidth={2}
              onPress={() => setTip({ x: px(i), y: py(d.valueCm), text: `${toDisplay(d.valueCm).toFixed(1)} ${unitLabel}`, date: new Date(d.date).toLocaleDateString() })}
            />
          ))}
        </Svg>
        {tip && (
          <View style={{ position: "absolute", left: tip.x, top: tip.y, transform: [{ translateX: -40 }, { translateY: -44 }], backgroundColor: "#000", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, alignItems: "center", width: 80 }}>
            <AppText style={{ color: "#fff", fontSize: 11, fontWeight: "600", fontVariant: ["tabular-nums"] }}>{tip.text}</AppText>
            <AppText style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>{tip.date}</AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function BodyMeasurements() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const isDark = theme === "dark";

  const prefersInches = user.heightUnit === "ft";
  const unitLabel = prefersInches ? "in" : "cm";
  const toDisplay = (cm: number) => (prefersInches ? cm / 2.54 : cm);
  const toCm = (val: number) => (prefersInches ? val * 2.54 : val);

  const measurements = user.measurements || [];

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showChartSheet, setShowChartSheet] = useState(false);
  const [selectedType, setSelectedType] = useState<MeasurementType | null>(null);
  const [addDate, setAddDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [addValues, setAddValues] = useState<Partial<Record<MeasurementType, string>>>({});
  const [chartRange, setChartRange] = useState<"3M" | "6M" | "1Y" | "All">("3M");

  const isLoseGoal = user.goals?.includes("lose-body-fat") || user.goal === "lose-weight";
  const isGainGoal = user.goals?.includes("gain-muscle") || user.goal === "build-muscle";

  const dirColor = (type: MeasurementType, change: number) => {
    if (change === 0) return colors.inkMuted48;
    const direction = change > 0 ? "up" : "down";
    const info = MEASUREMENT_INFO[type];
    if (isGainGoal && info.optimalMuscleGain === direction) return GREEN;
    if (isLoseGoal && info.optimalFatLoss === direction) return GREEN;
    if ((isGainGoal && info.optimalMuscleGain !== direction) || (isLoseGoal && info.optimalFatLoss !== direction)) return RED;
    return colors.inkMuted48;
  };

  const { latest, previous } = useMemo(() => {
    const latest: Partial<Record<MeasurementType, BodyMeasurement>> = {};
    const previous: Partial<Record<MeasurementType, BodyMeasurement>> = {};
    const sorted = [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    sorted.forEach((m) => {
      if (!latest[m.type]) latest[m.type] = m;
      else if (!previous[m.type] && m.date !== latest[m.type]!.date) previous[m.type] = m;
    });
    return { latest, previous };
  }, [measurements]);

  const handleSaveAdd = () => {
    const newLogs: BodyMeasurement[] = [];
    Object.entries(addValues).forEach(([type, valStr]) => {
      if (valStr && !isNaN(Number(valStr))) newLogs.push({ id: `m_${Date.now()}_${type}`, type: type as MeasurementType, date: addDate, valueCm: toCm(Number(valStr)) });
    });
    if (newLogs.length > 0) setUser({ ...user, measurements: [...measurements, ...newLogs] });
    setShowAddSheet(false);
    setAddValues({});
  };

  const selectedTypeHistory = useMemo(() => {
    if (!selectedType) return [];
    let items = measurements.filter((m) => m.type === selectedType).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (chartRange !== "All") {
      const days = chartRange === "3M" ? 90 : chartRange === "6M" ? 180 : 365;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      items = items.filter((m) => new Date(m.date) >= cutoff);
    }
    return items;
  }, [measurements, selectedType, chartRange]);

  const handleDelete = (id: string) => {
    Alert.alert(isArabic ? "مسح القياس" : "Delete log", isArabic ? "متأكد انك عايز تمسح القياس ده؟" : "Are you sure you want to delete this log?", [
      { text: isArabic ? "إلغاء" : "Cancel", style: "cancel" },
      { text: isArabic ? "مسح" : "Delete", style: "destructive", onPress: () => setUser({ ...user, measurements: measurements.filter((m) => m.id !== id) }) },
    ]);
  };

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const tile1 = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const align = isArabic ? "right" : "left";
  const types = Object.keys(MEASUREMENT_INFO) as MeasurementType[];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 44, height: 44, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "قياسات الجسم" : "Body Measurements"}</AppText>
        <Pressable onPress={() => setShowAddSheet(true)} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.primary + "1A", alignItems: "center", justifyContent: "center" }}>
          <Plus size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: insets.bottom + 100, maxWidth: 512, width: "100%", alignSelf: "center" }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {types.map((type) => {
            const info = MEASUREMENT_INFO[type];
            const current = latest[type];
            const prev = previous[type];
            let deltaStr = "";
            let color = colors.inkMuted48;
            if (current && prev) {
              const diff = current.valueCm - prev.valueCm;
              const days = Math.round((new Date(current.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24));
              const weeks = Math.round(days / 7);
              const timeStr = weeks > 0 ? (isArabic ? `في ${weeks} أسبوع` : `in ${weeks}w`) : isArabic ? `في ${days} يوم` : `in ${days}d`;
              if (diff !== 0) {
                deltaStr = `${diff > 0 ? "+" : ""}${diff.toFixed(1)} ${timeStr}`;
                color = dirColor(type, diff);
              }
            }
            return (
              <Pressable key={type} onPress={() => { setSelectedType(type); setChartRange("3M"); setShowChartSheet(true); }} style={{ width: "48%", backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, padding: 12 }}>
                <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, marginBottom: 8, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1, textAlign: align, fontFamily: ff(isArabic, 600) }}>{isArabic ? info.ar : info.en}</AppText>
                <AppText style={{ fontSize: 20, fontWeight: "700", color: colors.ink, fontVariant: ["tabular-nums"], textAlign: align, fontFamily: ff(isArabic, 700) }}>
                  {current ? toDisplay(current.valueCm).toFixed(1) : "—"}
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: ff(isArabic) }}> {unitLabel}</AppText>
                </AppText>
                <AppText style={{ fontSize: 11, marginTop: 4, height: 16, fontWeight: "500", color, textAlign: align, fontFamily: ff(isArabic, 600) }}>{deltaStr}</AppText>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Add sheet */}
      <BottomSheet isOpen={showAddSheet} onClose={() => setShowAddSheet(false)} title={isArabic ? "إضافة قياسات" : "Add Measurements"}>
        <View style={{ paddingTop: 4, paddingBottom: 24 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "التاريخ" : "Date"}</AppText>
            <TextInput value={addDate} onChangeText={setAddDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.inkMuted48} style={{ backgroundColor: tile1, borderWidth: 1, borderColor: colors.hairline, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: colors.ink, minWidth: 130, textAlign: "center", fontFamily: ff(isArabic) }} />
          </View>
          <View style={{ gap: 12 }}>
            {types.map((type) => (
              <View key={type} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingBottom: 8 }}>
                <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? MEASUREMENT_INFO[type].ar : MEASUREMENT_INFO[type].en}</AppText>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                  <TextInput keyboardType="decimal-pad" placeholder="0.0" placeholderTextColor={colors.inkMuted48} value={addValues[type] || ""} onChangeText={(t) => setAddValues({ ...addValues, [type]: t })} style={{ width: 80, backgroundColor: tile1, borderRadius: 6, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 8, paddingVertical: 6, fontSize: 15, fontWeight: "700", color: colors.ink, textAlign: "center", fontVariant: ["tabular-nums"] }} />
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48, width: 24 }}>{unitLabel}</AppText>
                </View>
              </View>
            ))}
          </View>
          <Pressable onPress={handleSaveAdd} style={{ marginTop: 32, width: "100%", height: 48, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ" : "Save"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Chart sheet */}
      <BottomSheet isOpen={showChartSheet} onClose={() => setShowChartSheet(false)} title={selectedType ? (isArabic ? MEASUREMENT_INFO[selectedType].ar : MEASUREMENT_INFO[selectedType].en) : ""}>
        <View style={{ paddingTop: 4, paddingBottom: 24 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "center", gap: 4, marginBottom: 16 }}>
            {(["3M", "6M", "1Y", "All"] as const).map((r) => {
              const sel = chartRange === r;
              return (
                <Pressable key={r} onPress={() => setChartRange(r)} style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: sel ? (isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)") : "transparent" }}>
                  <AppText style={{ fontSize: 12, fontWeight: "600", color: sel ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{r === "All" && isArabic ? "الكل" : r}</AppText>
                </Pressable>
              );
            })}
          </View>

          <Chart history={selectedTypeHistory} toDisplay={toDisplay} unitLabel={unitLabel} colors={colors} cardBg={cardBg} isDark={isDark} emptyLabel={isArabic ? "لا توجد بيانات كافية" : "Not enough data"} />

          <View style={{ marginTop: 8 }}>
            <AppText style={{ fontSize: 11, fontWeight: "700", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, marginBottom: 12, textAlign: align, fontFamily: ff(isArabic, 700) }}>{isArabic ? "السجل" : "HISTORY"}</AppText>
            <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, overflow: "hidden" }}>
              {selectedTypeHistory.length === 0 ? (
                <View style={{ padding: 16, alignItems: "center" }}>
                  <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "مفيش قياسات" : "No entries"}</AppText>
                </View>
              ) : (
                selectedTypeHistory.slice().reverse().map((entry, idx) => (
                  <Pressable key={entry.id} onLongPress={() => handleDelete(entry.id)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: colors.hairline }}>
                    <AppText style={{ fontSize: 13, color: colors.ink, fontFamily: ff(isArabic) }}>{new Date(entry.date).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</AppText>
                    <AppText style={{ fontSize: 15, fontWeight: "700", color: colors.primary, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 700) }}>{toDisplay(entry.valueCm).toFixed(1)} <AppText style={{ fontSize: 12, fontWeight: "400", color: colors.inkMuted48 }}>{unitLabel}</AppText></AppText>
                  </Pressable>
                ))
              )}
            </View>
            <AppText style={{ fontSize: 10, color: colors.inkMuted48, marginTop: 8, textAlign: "center", fontFamily: ff(isArabic) }}>{isArabic ? "اضغط مطولاً على أي قياس لمسحه" : "Long press on an entry to delete it"}</AppText>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
