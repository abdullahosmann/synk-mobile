/**
 * WeightTrendChart — RN port of src/components/WeightTrendChart.tsx.
 * Pure SVG line chart (react-native-svg). Same coordinate math as the web;
 * goal-aware line color via getMetricSemantic.
 */
import React from "react";
import { View } from "react-native";
import Svg, { Path, Line, Circle, Text as SvgText } from "react-native-svg";
import { useAppContext } from "../AppContext";
import { WeightEntry } from "../types";
import { getMetricSemantic } from "../lib/goalAwareColors";
import { useColors } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

interface WeightTrendChartProps {
  entries?: WeightEntry[];
  height?: number;
}

const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ entries: override, height = 140 }) => {
  const { user } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";
  const unit = user.weightUnit || "kg";

  const entries = (override || user.weightLog || [])
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const unitLabel = unit === "lb" ? (isArabic ? "رطل" : "lb") : isArabic ? "كجم" : "kg";

  if (entries.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: "center" }}>
          {isArabic ? "سجّل وزنك علشان نرسم لك الاتجاه" : "Log your weight to see your trend"}
        </AppText>
      </View>
    );
  }

  if (entries.length === 1) {
    const v = unit === "lb" ? entries[0].weightKg * 2.20462 : entries[0].weightKg;
    return (
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <AppText style={{ fontSize: 28, fontWeight: "600", color: colors.ink }}>
          {v.toFixed(1)}
          <AppText style={{ fontSize: 14, color: colors.inkMuted48 }}> {unitLabel}</AppText>
        </AppText>
        <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 4 }}>
          {isArabic ? "سجّل تاني علشان نرسم الاتجاه" : "Log again to see the trend"}
        </AppText>
      </View>
    );
  }

  const w = 320;
  const h = height;
  const pad = { top: 16, right: 12, bottom: 24, left: 36 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const weights = entries.map((e) => (unit === "lb" ? e.weightKg * 2.20462 : e.weightKg));
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = Math.max(maxW - minW, 1);
  const yMin = minW - range * 0.15;
  const yMax = maxW + range * 0.15;
  const yRange = yMax - yMin;

  const delta = weights[weights.length - 1] - weights[0];
  const direction = delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat";
  const semantic = getMetricSemantic("weight", direction, user.goals as any);
  const lineColor = semantic === "positive" ? "#16a34a" : semantic === "negative" ? "#dc2626" : "#9ca3af";

  const xStep = innerW / (entries.length - 1);
  const points = weights.map((wt, i) => ({
    x: pad.left + i * xStep,
    y: pad.top + (1 - (wt - yMin) / yRange) * innerH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L${points[points.length - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`;

  const yTicks = [yMax, (yMin + yMax) / 2, yMin].map((v) => ({
    value: v.toFixed(1),
    y: pad.top + (1 - (v - yMin) / yRange) * innerH,
  }));
  const xLabels = [0, Math.floor(entries.length / 2), entries.length - 1].map((idx) => ({
    x: pad.left + idx * xStep,
    label: new Date(entries[idx].date).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { day: "numeric", month: "short" }),
  }));

  const semBg = semantic === "positive" ? "rgba(22,163,74,0.1)" : semantic === "negative" ? "rgba(220,38,38,0.1)" : "rgba(0,0,0,0.05)";
  const semText = semantic === "positive" ? "#16a34a" : semantic === "negative" ? "#dc2626" : colors.inkMuted48;

  return (
    <View>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <View>
          <AppText style={{ fontSize: 28, fontWeight: "600", color: colors.ink }}>
            {weights[weights.length - 1].toFixed(1)}
            <AppText style={{ fontSize: 14, color: colors.inkMuted48 }}> {unitLabel}</AppText>
          </AppText>
          <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 4 }}>
            {isArabic ? "الحالي" : "Current"}
          </AppText>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, backgroundColor: semBg }}>
          <AppText variant="caption-strong" style={{ color: semText }}>
            {delta >= 0 ? "+" : ""}{delta.toFixed(1)} {unitLabel}
          </AppText>
        </View>
      </View>

      <Svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
        {yTicks.map((tick, i) => (
          <React.Fragment key={i}>
            <Line x1={pad.left} y1={tick.y} x2={w - pad.right} y2={tick.y} stroke={colors.hairline} strokeWidth={1} />
            <SvgText x={pad.left - 6} y={tick.y + 3} fontSize={9} textAnchor="end" fill={colors.inkMuted48}>
              {tick.value}
            </SvgText>
          </React.Fragment>
        ))}
        <Path d={areaD} fill={lineColor} opacity={0.08} />
        <Path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={lineColor} />
        ))}
        <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={5} fill={lineColor} />
        <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={9} fill={lineColor} opacity={0.18} />
        {xLabels.map((l, i) => (
          <SvgText key={i} x={l.x} y={h - 6} fontSize={9} textAnchor="middle" fill={colors.inkMuted48}>
            {l.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

export default WeightTrendChart;
