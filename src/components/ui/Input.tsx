/**
 * Input preset — port of `.input-pill` from src/index.css.
 */
import React from "react";
import { TextInput, TextInputProps } from "react-native";
import { useIsArabic } from "../../lib/i18n";
import { useColors } from "../../theme/ThemeProvider";
import { cn } from "../../lib/cn";

interface InputProps extends TextInputProps {
  className?: string;
}

export const InputPill: React.FC<InputProps> = ({
  className,
  style,
  ...rest
}) => {
  const isArabic = useIsArabic();
  const colors = useColors();
  return (
    <TextInput
      placeholderTextColor={colors.inkMuted48}
      className={cn(
        "bg-white dark:bg-surface-tile-2 border border-black/10 dark:border-hairline-dark rounded-pill px-4 h-[44px] w-full text-ink dark:text-ink-dark",
        className,
      )}
      style={[
        {
          fontSize: 15,
          fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular",
          textAlign: isArabic ? "right" : "left",
        },
        style,
      ]}
      {...rest}
    />
  );
};
