/**
 * `.apple-backdrop` port — backdrop-saturate + blur(20) + parchment tint.
 * Web: `backdrop-blur-[20px] bg-canvas-parchment/92 dark:bg-canvas-parchment/80`.
 * RN: expo-blur BlurView with a matching tint and a translucent parchment
 * overlay to approximate the saturated, slightly-opaque glass.
 */
import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "../../theme/ThemeProvider";

interface AppleBackdropProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export const AppleBackdrop: React.FC<AppleBackdropProps> = ({
  children,
  intensity = 40,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? "dark" : "light"}
      style={style}
      {...rest}
    >
      {/* Parchment tint overlay to match bg-canvas-parchment/92|80 */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark
              ? "rgba(17,20,24,0.80)"
              : "rgba(245,245,247,0.80)",
          },
        ]}
      />
      {children}
    </BlurView>
  );
};

/** `.product-shadow`: rgba(0,0,0,0.22) 3px 5px 30px 0. */
export const productShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 3, height: 5 },
  shadowOpacity: 0.22,
  shadowRadius: 30,
  elevation: 12,
} as const;
