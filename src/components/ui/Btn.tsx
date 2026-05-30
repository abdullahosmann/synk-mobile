/**
 * Button preset — port of `.btn-primary / .btn-secondary / .btn-ghost /
 * .btn-utility-dark / .btn-pearl / .btn-circle` from src/index.css.
 *
 * Reproduces the web `active:scale-[0.97]` press feedback with Reanimated.
 * All variants are 44px tall (the web control height).
 *
 * Colors are applied via inline style from the active palette (not NativeWind
 * className) because NativeWind className backgrounds don't apply to
 * reanimated's Animated.View on web — and this also guarantees exact token hex.
 */
import React from "react";
import { Pressable, PressableProps, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useIsArabic } from "../../lib/i18n";
import { cn } from "../../lib/cn";
import { useColors } from "../../theme/ThemeProvider";
import { AppText } from "./Typography";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "utility-dark"
  | "pearl"
  | "circle";

interface BtnProps extends Omit<PressableProps, "children" | "style"> {
  variant?: Variant;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
  label?: string;
  fullWidth?: boolean;
  style?: ViewStyle;
}

// Layout-only classes (sizes/radii). Colors come from the palette below.
const LAYOUT: Record<Variant, string> = {
  primary: "rounded-pill px-6 h-[44px]",
  secondary: "rounded-pill px-6 h-[44px] border",
  ghost: "rounded-pill px-6 h-[44px] border",
  "utility-dark": "rounded-lg px-5 h-[44px]",
  pearl: "rounded-lg px-5 h-[44px] border",
  circle: "w-[44px] h-[44px] rounded-full",
};

function useVariantColors(variant: Variant) {
  const c = useColors();
  switch (variant) {
    case "primary":
      return { bg: c.primary, border: "transparent", text: c.onPrimary };
    case "secondary":
      return { bg: c.surfacePearl, border: c.hairline, text: c.ink };
    case "ghost":
      return { bg: "transparent", border: c.primary, text: c.primary };
    case "utility-dark":
      return { bg: c.ink, border: "transparent", text: c.canvas };
    case "pearl":
      return { bg: c.surfacePearl, border: c.dividerSoft, text: c.inkMuted80 };
    case "circle":
      return {
        bg: "rgba(210,210,215,0.64)",
        border: "transparent",
        text: c.ink,
      };
  }
}

export const Btn: React.FC<BtnProps> = ({
  variant = "primary",
  className,
  textClassName,
  children,
  label,
  fullWidth,
  disabled,
  style,
  ...rest
}) => {
  const isArabic = useIsArabic();
  const vc = useVariantColors(variant);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const textNode =
    label != null || typeof children === "string" ? (
      <AppText
        variant="body-strong"
        style={{ color: vc.text }}
        className={textClassName}
      >
        {label ?? (children as string)}
      </AppText>
    ) : (
      children
    );

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 120 });
      }}
      disabled={disabled}
      {...rest}
    >
      <Animated.View
        style={[
          animStyle,
          {
            opacity: disabled ? 0.4 : 1,
            backgroundColor: vc.bg,
            borderColor: vc.border,
          },
          style,
        ]}
        className={cn(
          "flex items-center justify-center",
          LAYOUT[variant],
          fullWidth && "w-full",
          className,
        )}
      >
        {variant === "circle" && typeof children !== "string" ? (
          textNode
        ) : (
          <View
            style={{ flexDirection: isArabic ? "row-reverse" : "row" }}
            className="items-center justify-center gap-2"
          >
            {textNode}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};
