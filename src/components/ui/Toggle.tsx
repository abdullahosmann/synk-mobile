/**
 * Toggle — iOS-style switch with a spring-animated knob.
 * Port of the renderToggle helper used across onboarding/settings.
 * Knob slides left in RTL.
 */
import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "../../theme/ThemeProvider";
import { useIsArabic } from "../../lib/i18n";

interface ToggleProps {
  value: boolean;
  onValueChange: () => void;
  /** Optional spoken label for screen readers (e.g. the row's setting name). */
  accessibilityLabel?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ value, onValueChange, accessibilityLabel }) => {
  const colors = useColors();
  const isArabic = useIsArabic();

  const knob = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(value ? (isArabic ? -20 : 20) : 0, {
          stiffness: 500,
          damping: 30,
        }),
      },
    ],
  }));

  return (
    <Pressable
      onPress={onValueChange}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 9999,
        paddingHorizontal: 2,
        justifyContent: "center",
        backgroundColor: value ? colors.primary : "rgba(29,29,31,0.2)",
        alignItems: isArabic ? "flex-end" : "flex-start",
      }}
    >
      <Animated.View
        style={[
          {
            width: 20,
            height: 20,
            borderRadius: 9999,
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 1.5,
            elevation: 2,
          },
          knob,
        ]}
      />
    </Pressable>
  );
};
