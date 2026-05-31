/**
 * BodySVG — RN port of src/components/BodySVG.tsx (react-native-svg).
 * Front/back body silhouette with per-muscle fill driven by recovery data or a
 * highlighted set. Same paths and fill logic as the web. The web's motion.g
 * pulse on active muscles is restored here as a reanimated fill-opacity
 * "breathing" loop (SVG-G center-scaling is awkward in RN; the opacity pulse
 * reads the same and is cheap), gated by `animateHighlight` so the off-screen
 * share-template captures stay static.
 */
import React, { useEffect } from "react";
import Svg, { G, Path } from "react-native-svg";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "../theme/ThemeProvider";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const getRecoveryColor = (pct: number) => {
  if (pct >= 90) return "#0066cc";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
};

interface BodySVGProps {
  view: "front" | "back";
  recoveryData?: Record<string, number>;
  highlightedId?: string;
  highlightedMuscles?: string[];
  onMusclePress?: (id: string) => void;
  /** Pulse active muscles (web motion.g). Off by default so captures are static. */
  animateHighlight?: boolean;
}

export const BodySVG: React.FC<BodySVGProps> = ({
  view,
  recoveryData = {},
  highlightedId,
  highlightedMuscles,
  onMusclePress,
  animateHighlight = false,
}) => {
  const colors = useColors();
  const isFront = view === "front";

  // Breathing pulse for active muscles (fillOpacity 0.8 ↔ 0.45 over 2s).
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (animateHighlight) {
      pulse.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => cancelAnimation(pulse);
  }, [animateHighlight, pulse]);
  const pulseProps = useAnimatedProps(() => ({ fillOpacity: 0.8 - pulse.value * 0.35 }));

  const fillFor = (id: string) => {
    if (highlightedId) {
      return highlightedId === id
        ? { fill: colors.primary, fillOpacity: 0.8 }
        : { fill: "transparent", fillOpacity: 1 };
    }
    if (highlightedMuscles) {
      return highlightedMuscles.includes(id)
        ? { fill: colors.primary, fillOpacity: 0.8 }
        : { fill: "transparent", fillOpacity: 1 };
    }
    const pct = recoveryData[id] ?? 100;
    return {
      fill: getRecoveryColor(pct),
      fillOpacity: pct >= 90 ? 0.3 : pct >= 50 ? 0.7 : 1.0,
    };
  };

  const isActive = (id: string) => {
    if (highlightedId) return highlightedId === id;
    if (highlightedMuscles) return highlightedMuscles.includes(id);
    return (recoveryData[id] ?? 100) < 90;
  };

  const muscle = (id: string, ds: string[]) => {
    const f = fillFor(id);
    const active = isActive(id);
    const pulsing = animateHighlight && active && f.fill !== "transparent";
    return (
      <G key={id} onPress={onMusclePress ? () => onMusclePress(id) : undefined}>
        {ds.map((d, i) =>
          pulsing ? (
            <AnimatedPath
              key={i}
              d={d}
              fill={f.fill}
              animatedProps={pulseProps}
              stroke={colors.primary}
              strokeWidth={0.8}
            />
          ) : (
            <Path
              key={i}
              d={d}
              fill={f.fill}
              fillOpacity={f.fillOpacity}
              stroke={active ? colors.primary : "rgba(0,0,0,0.2)"}
              strokeWidth={active ? 0.8 : 0.3}
            />
          ),
        )}
      </G>
    );
  };

  return (
    <Svg viewBox="0 0 100 240" width="100%" height="100%">
      {/* Base silhouette */}
      <G stroke="rgba(0,0,0,0.05)" strokeWidth={0.5} fill={colors.canvasParchment}>
        <Path d="M50,5 Q58,5 62,12 Q65,20 62,28 Q58,35 50,35 Q42,35 38,28 Q35,20 38,12 Q42,5 50,5 Z" />
        <Path d="M42,32 L58,32 L60,40 L40,40 Z" />
        <Path d="M35 40 Q50 38 65 40 L75 50 L85 110 Q80 115 75 110 L70 55 L65 125 L35 125 L30 55 L25 110 Q20 115 15 110 L25 50 Z" />
        <Path d="M35 125 L30 180 L25 230 Q35 235 45 230 L50 140 L55 230 Q65 235 75 230 L70 180 L65 125 Z" />
      </G>

      <G stroke={colors.hairline} strokeWidth={0.3}>
        {isFront ? (
          <>
            {muscle("shoulders", ["M32,42 Q22,42 18,55 L28,65 Q32,60 35,45 Z", "M68,42 Q78,42 82,55 L72,65 Q68,60 65,45 Z"])}
            {muscle("chest", ["M35,48 Q50,45 50,48 L50,82 Q35,85 32,75 Z", "M65,48 Q50,45 50,48 L50,82 Q65,85 68,75 Z"])}
            {muscle("biceps", ["M18,60 L14,95 Q20,100 24,95 L28,65 Z", "M82,60 L86,95 Q80,100 76,95 L72,65 Z"])}
            {muscle("abs", ["M38,85 L49,85 L49,95 L38,95 Z", "M51,85 L62,85 L62,95 L51,95 Z", "M38,97 L49,97 L49,107 L38,107 Z", "M51,97 L62,97 L62,107 L51,107 Z", "M38,109 L49,109 L49,119 L38,119 Z", "M51,109 L62,109 L62,119 L51,119 Z"])}
            {muscle("quadriceps", ["M35,130 L28,185 Q38,190 45,185 L48,130 Z", "M65,130 L72,185 Q62,190 55,185 L52,130 Z"])}
            {muscle("triceps", ["M25,65 L18,95 Q24,100 28,95 L32,65 Z", "M75,65 L82,95 Q76,100 72,95 L68,65 Z"])}
            {muscle("back", ["M35,42 Q50,38 65,42 L60,65 Q50,60 40,65 Z", "M32,65 Q50,60 68,65 L75,105 Q50,115 25,105 Z"])}
            {muscle("glutes", ["M30,130 Q49,125 49,135 L49,165 Q35,170 32,160 Z", "M70,130 Q51,125 51,135 L51,165 Q65,170 68,160 Z"])}
            {muscle("hamstrings", ["M32,170 L28,220 Q38,225 45,220 L48,170 Z", "M68,170 L72,220 Q62,225 55,220 L52,170 Z"])}
            {muscle("calves", ["M28,220 L27,245 L45,245 L45,220 Z", "M72,220 L73,245 L55,245 L55,220 Z"])}
          </>
        ) : (
          <>
            {muscle("shoulders", ["M32,42 Q22,42 18,55 L28,65 Q32,60 35,45 Z", "M68,42 Q78,42 82,55 L72,65 Q68,60 65,45 Z"])}
            {muscle("back", ["M35,42 Q50,38 65,42 L60,65 Q50,60 40,65 Z", "M32,65 Q50,60 68,65 L75,105 Q50,115 25,105 Z"])}
            {muscle("triceps", ["M25,65 L18,95 Q24,100 28,95 L32,65 Z", "M75,65 L82,95 Q76,100 72,95 L68,65 Z"])}
            {muscle("lower_back", ["M38,105 Q50,105 62,105 L62,125 Q50,128 38,125 Z"])}
            {muscle("glutes", ["M30,130 Q49,125 49,135 L49,165 Q35,170 32,160 Z", "M70,130 Q51,125 51,135 L51,165 Q65,170 68,160 Z"])}
            {muscle("hamstrings", ["M32,170 L28,220 Q38,225 45,220 L48,170 Z", "M68,170 L72,220 Q62,225 55,220 L52,170 Z"])}
            {muscle("calves", ["M28,220 L27,245 L45,245 L45,220 Z", "M72,220 L73,245 L55,245 L55,220 Z"])}
          </>
        )}
      </G>
    </Svg>
  );
};

export default BodySVG;
