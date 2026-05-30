/**
 * PlateBar — RN port of src/components/PlateBar.tsx.
 * Renders a horizontal barbell with colour-coded plates stacked symmetrically
 * via react-native-svg (the web used inline <svg>). Same plate-height tiers,
 * kg↔lb conversion, bar-weight label and total/empty footer. `getPlateColor`
 * exposes the per-weight hex (used for the breakdown dots in ActiveWorkout).
 */
import React from "react";
import { View } from "react-native";
import Svg, { Rect, Line, G } from "react-native-svg";
import { useColors, useTheme } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

export interface PlateBarProps {
  barWeightKg: number;
  perSide: Array<{ plateKg: number; count: number }>;
  unit: "kg" | "lb";
  isArabic: boolean;
  compact?: boolean;
  displayUnit?: "kg" | "lb";
}

function getPlateHeight(plateW: number, unit: "kg" | "lb", compact: boolean) {
  const isLb = unit === "lb";
  let h = 22;
  if (isLb) {
    if (plateW >= 45) h = 64;
    else if (plateW >= 35) h = 56;
    else if (plateW >= 25) h = 48;
    else if (plateW >= 10) h = 36;
    else if (plateW >= 5) h = 28;
    else h = 22;
  } else {
    if (plateW >= 20) h = 64;
    else if (plateW >= 15) h = 56;
    else if (plateW >= 10) h = 48;
    else if (plateW >= 5) h = 36;
    else if (plateW >= 2.5) h = 28;
    else h = 22;
  }
  return compact ? h / 2 : h;
}

/**
 * Hex equivalents of the web tailwind plate colours (light / dark), returning
 * the fill + a subtle stroke. The lightest tier keeps its slate border.
 */
export function getPlateColor(
  plateW: number,
  unit: "kg" | "lb",
  isDark: boolean,
): { fill: string; stroke: string } {
  const isLb = unit === "lb";
  const blue = isDark ? "#3b82f6" : "#2563eb";
  const amber = isDark ? "#fbbf24" : "#f59e0b";
  const emerald = isDark ? "#34d399" : "#059669";
  const orange = isDark ? "#fb923c" : "#f97316";
  const gray = isDark ? "#6b7280" : "#9ca3af";
  const slate = isDark ? "#1e293b" : "#f1f5f9";
  const slateBorder = isDark ? "#475569" : "#cbd5e1";
  const genericStroke = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.20)";

  const thresholds: Array<[number, string]> = isLb
    ? [
        [45, blue],
        [35, amber],
        [25, emerald],
        [10, orange],
        [5, gray],
      ]
    : [
        [20, blue],
        [15, amber],
        [10, emerald],
        [5, orange],
        [2.5, gray],
      ];

  for (const [min, fill] of thresholds) {
    if (plateW >= min) return { fill, stroke: genericStroke };
  }
  return { fill: slate, stroke: slateBorder };
}

export const PlateBar: React.FC<PlateBarProps> = ({
  barWeightKg,
  perSide,
  unit,
  isArabic,
  compact = false,
  displayUnit,
}) => {
  const colors = useColors();
  const isDark = useTheme().theme === "dark";

  const activeDisplayUnit = displayUnit || unit;
  const isKgToLb = unit === "kg" && activeDisplayUnit === "lb";
  const isLbToKg = unit === "lb" && activeDisplayUnit === "kg";

  const convert = (val: number) => {
    if (isKgToLb) return Math.round(val * 2.20462 * 2) / 2;
    if (isLbToKg) return Math.round(val * 0.453592 * 2) / 2;
    return val;
  };

  const displayBarWeight = convert(barWeightKg);
  const displayPerSide = perSide.map((p) => ({
    count: p.count,
    plateKg: convert(p.plateKg),
  }));

  const flatPlates: number[] = [];
  displayPerSide.forEach((p) => {
    for (let i = 0; i < p.count; i++) flatPlates.push(p.plateKg);
  });

  const displayTotalWeight =
    displayBarWeight + 2 * flatPlates.reduce((sum, w) => sum + w, 0);

  // SVG geometry (mirrors the web exactly)
  const scale = compact ? 0.5 : 1.0;
  const w = compact ? 200 : 400;
  const h = compact ? 50 : 100;
  const centerY = h / 2;
  const shaftHeight = compact ? 4 : 8;
  const collarWidth = compact ? 3 : 6;
  const collarHeight = compact ? 15 : 30;

  const startXLeft = 150 * scale - collarWidth / 2;
  const startXRight = 250 * scale + collarWidth / 2;

  const plateWidth = compact ? 8 : 14;
  const plateGap = compact ? 1 : 1.5;

  const barFill = isDark ? "rgba(255,255,255,0.80)" : colors.ink;
  const notchStroke = isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.10)";

  const unitLabel =
    activeDisplayUnit === "kg"
      ? isArabic
        ? "كجم"
        : "kg"
      : isArabic
        ? "رطل"
        : "lb";

  return (
    <View style={{ alignItems: "center", paddingVertical: compact ? 4 : 12 }}>
      {/* Bar weight label */}
      <AppText
        style={{
          fontSize: compact ? 9 : 11,
          fontWeight: "600",
          color: colors.inkMuted48,
          textTransform: isArabic ? "none" : "uppercase",
          letterSpacing: 0.6,
          marginBottom: compact ? 2 : 4,
        }}
      >
        {isArabic
          ? `بار ${displayBarWeight} ${unitLabel}`
          : `${displayBarWeight} ${unitLabel} bar`}
      </AppText>

      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Sleeve shaft */}
        <Rect
          x={50 * scale}
          y={centerY - shaftHeight / 2}
          width={300 * scale}
          height={shaftHeight}
          rx={1 * scale}
          fill={barFill}
        />

        {/* Sleeve notches */}
        {[65, 85, 105, 125, 275, 295, 315, 335].map((nx) => (
          <Line
            key={nx}
            x1={nx * scale}
            y1={centerY - shaftHeight}
            x2={nx * scale}
            y2={centerY + shaftHeight}
            stroke={notchStroke}
            strokeWidth={1}
          />
        ))}

        {/* Collars */}
        <Rect
          x={150 * scale - collarWidth / 2}
          y={centerY - collarHeight / 2}
          width={collarWidth}
          height={collarHeight}
          rx={1.5 * scale}
          fill={barFill}
        />
        <Rect
          x={250 * scale - collarWidth / 2}
          y={centerY - collarHeight / 2}
          width={collarWidth}
          height={collarHeight}
          rx={1.5 * scale}
          fill={barFill}
        />

        {/* Plates, stacked outward symmetrically */}
        {flatPlates.map((plateWeight, i) => {
          const pH = getPlateHeight(plateWeight, activeDisplayUnit, compact);
          const pY = centerY - pH / 2;
          const { fill, stroke } = getPlateColor(
            plateWeight,
            activeDisplayUnit,
            isDark,
          );
          const leftX = startXLeft - (i + 1) * plateWidth - i * plateGap;
          const rightX = startXRight + i * (plateWidth + plateGap);

          return (
            <G key={i}>
              <Rect
                x={leftX}
                y={pY}
                width={plateWidth}
                height={pH}
                rx={2 * scale}
                fill={fill}
                stroke={stroke}
                strokeWidth={0.5}
              />
              <Rect
                x={rightX}
                y={pY}
                width={plateWidth}
                height={pH}
                rx={2 * scale}
                fill={fill}
                stroke={stroke}
                strokeWidth={0.5}
              />
            </G>
          );
        })}
      </Svg>

      {/* Footer: total or "just the bar" */}
      <View style={{ alignItems: "center", marginTop: compact ? 2 : 8 }}>
        {flatPlates.length === 0 ? (
          <AppText
            style={{
              fontSize: 11,
              fontStyle: "italic",
              color: colors.inkMuted48,
            }}
          >
            {isArabic ? "بار لوحده" : "Just the bar"}
          </AppText>
        ) : (
          <AppText
            style={{
              fontSize: compact ? 12 : 18,
              fontWeight: "700",
              color: colors.ink,
            }}
          >
            {displayTotalWeight} {unitLabel}
          </AppText>
        )}
      </View>
    </View>
  );
};

export default PlateBar;
