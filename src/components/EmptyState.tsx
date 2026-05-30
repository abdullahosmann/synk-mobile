/**
 * EmptyState — RN port of src/components/EmptyState.tsx.
 * Circular icon chip + title (+ optional body + ghost CTA).
 */
import React from "react";
import { View } from "react-native";
import { useColors } from "../theme/ThemeProvider";
import { useIsArabic } from "../lib/i18n";
import { AppText } from "./ui/Typography";
import { Btn } from "./ui/Btn";

interface EmptyStateProps {
  icon: React.ReactElement<{ size?: number; color?: string }>;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
  size?: "sm" | "md";
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  body,
  ctaLabel,
  onCta,
  size = "md",
}) => {
  const colors = useColors();
  const isArabic = useIsArabic();
  const iconSize = size === "md" ? 32 : 24;
  const iconColor = size === "md" ? colors.hairline : colors.inkMuted48;

  return (
    <View style={{ alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
      <View style={{ borderRadius: 9999, backgroundColor: colors.canvasParchment, padding: 16, alignItems: "center", justifyContent: "center" }}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon, { size: iconSize, color: iconColor })
          : icon}
      </View>

      <View style={{ alignItems: "center", gap: size === "sm" ? 4 : 8 }}>
        <AppText
          variant="body-strong"
          className="text-ink-muted-48 dark:text-ink-dark-muted-48"
          style={{ textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, textAlign: "center" }}
        >
          {title}
        </AppText>
        {body && (
          <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ opacity: 0.7, maxWidth: 280, textAlign: "center", lineHeight: 16 }}>
            {body}
          </AppText>
        )}
      </View>

      {ctaLabel && onCta && (
        <Btn variant="ghost" onPress={onCta} style={{ height: 36, paddingHorizontal: 16 }}>
          <AppText variant="fine-print" className="text-primary dark:text-primary-dark" style={{ fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1 }}>
            {ctaLabel}
          </AppText>
        </Btn>
      )}
    </View>
  );
};

export default EmptyState;
