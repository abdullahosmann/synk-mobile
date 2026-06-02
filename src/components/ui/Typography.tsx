/**
 * Typography presets — port of the `.text-*` utility classes in src/index.css.
 * Each preset reproduces the exact fontSize / fontWeight / lineHeight /
 * letterSpacing from the web stylesheet, with automatic Inter/Cairo selection.
 */
import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useIsArabic } from "../../lib/i18n";
import { useColors } from "../../theme/ThemeProvider";
import { cn } from "../../lib/cn";

type Variant =
  | "screen-title"
  | "section-title"
  | "title"
  | "title-2"
  | "hero-title"
  | "body"
  | "body-strong"
  | "caption"
  | "caption-strong"
  | "stat-value"
  | "stat-value-sm"
  | "fine-print";

interface AppTextProps extends TextProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

// Values copied verbatim from index.css @layer utilities.
const VARIANTS: Record<
  Variant,
  { fontSize: number; lineHeight?: number; letterSpacing: number; weight: 400 | 600 }
> = {
  "screen-title": { fontSize: 28, lineHeight: 28 * 1.1, letterSpacing: -0.3, weight: 600 },
  "section-title": { fontSize: 22, lineHeight: 22 * 1.15, letterSpacing: -0.3, weight: 600 },
  title: { fontSize: 17, lineHeight: 17 * 1.2, letterSpacing: -0.3, weight: 600 },
  "title-2": { fontSize: 24, lineHeight: 24 * 1.12, letterSpacing: -0.3, weight: 600 },
  "hero-title": { fontSize: 28, lineHeight: 32, letterSpacing: -0.4, weight: 600 },
  body: { fontSize: 15, lineHeight: 15 * 1.47, letterSpacing: -0.2, weight: 400 },
  "body-strong": { fontSize: 15, lineHeight: 15 * 1.24, letterSpacing: -0.2, weight: 600 },
  caption: { fontSize: 13, lineHeight: 13 * 1.4, letterSpacing: -0.1, weight: 400 },
  "caption-strong": { fontSize: 13, lineHeight: 13 * 1.3, letterSpacing: -0.1, weight: 600 },
  "stat-value": { fontSize: 32, lineHeight: 32, letterSpacing: -0.3, weight: 600 },
  "stat-value-sm": { fontSize: 22, lineHeight: 22, letterSpacing: -0.2, weight: 600 },
  "fine-print": { fontSize: 11, letterSpacing: -0.1, weight: 400 },
};

// P5 — cap Dynamic-Type scaling so large OS font sizes don't overflow the many
// fixed-height pills/rows/stat lines. Display/stat variants (big text in tight
// containers) get a tighter cap; body/caption text is allowed to grow more for
// readability. Callers can still override via the maxFontSizeMultiplier prop.
const MAX_MULT: Record<Variant, number> = {
  "screen-title": 1.3,
  "section-title": 1.3,
  title: 1.4,
  "title-2": 1.3,
  "hero-title": 1.3,
  body: 1.6,
  "body-strong": 1.5,
  caption: 1.6,
  "caption-strong": 1.5,
  "stat-value": 1.3,
  "stat-value-sm": 1.3,
  "fine-print": 1.5,
};

export const AppText: React.FC<AppTextProps> = ({
  variant = "body",
  className,
  style,
  children,
  ...rest
}) => {
  const isArabic = useIsArabic();
  const v = VARIANTS[variant];
  const fontFamily =
    v.weight === 600
      ? isArabic
        ? "Cairo_600SemiBold"
        : "Inter_600SemiBold"
      : isArabic
        ? "Cairo_400Regular"
        : "Inter_400Regular";

  // RN clips tall glyphs when lineHeight is tighter than the font's natural
  // height. Callers often override `fontSize` inline without a matching
  // `lineHeight`, which would otherwise leave the (smaller) variant lineHeight
  // in place and crop digits/descenders. Resolve the final fontSize and apply a
  // clip-safe lineHeight (>= 1.2×) unless the caller set lineHeight explicitly.
  const flat = style ? (StyleSheet.flatten(style) as { fontSize?: number; lineHeight?: number }) : null;
  const finalFontSize = flat?.fontSize ?? v.fontSize;
  const ratio = v.lineHeight ? v.lineHeight / v.fontSize : 1.2;
  const resolvedLineHeight =
    flat?.lineHeight != null ? undefined : Math.round(finalFontSize * Math.max(ratio, 1.2));

  return (
    <Text
      className={cn("text-ink dark:text-ink-dark", className)}
      style={[
        {
          fontSize: v.fontSize,
          lineHeight: resolvedLineHeight,
          letterSpacing: v.letterSpacing,
          fontFamily,
          writingDirection: isArabic ? "rtl" : "ltr",
        },
        style,
      ]}
      maxFontSizeMultiplier={MAX_MULT[variant]}
      {...rest}
    >
      {children}
    </Text>
  );
};

// Named shortcuts matching the migration map preset list.
export const ScreenTitle: React.FC<Omit<AppTextProps, "variant">> = (p) => (
  <AppText variant="screen-title" {...p} />
);
export const SectionTitle: React.FC<Omit<AppTextProps, "variant">> = (p) => (
  <AppText variant="section-title" {...p} />
);
export const Title: React.FC<Omit<AppTextProps, "variant">> = (p) => (
  <AppText variant="title" {...p} />
);
export const HeroTitle: React.FC<Omit<AppTextProps, "variant">> = (p) => (
  <AppText variant="hero-title" {...p} />
);
export const StatValue: React.FC<Omit<AppTextProps, "variant">> = (p) => (
  <AppText variant="stat-value" {...p} />
);
export const StatValueSm: React.FC<Omit<AppTextProps, "variant">> = (p) => (
  <AppText variant="stat-value-sm" {...p} />
);

// The recurring small uppercase "eyebrow" label (was hand-written ~63× with
// drifting letterSpacing/color). Standardized: 11px / 600 / letterSpacing 1 /
// uppercase (LTR only), tone primary | muted.
export const SectionLabel: React.FC<Omit<AppTextProps, "variant"> & { tone?: "primary" | "muted" }> = ({
  tone = "primary",
  style,
  children,
  ...rest
}) => {
  const colors = useColors();
  const isArabic = useIsArabic();
  return (
    <AppText
      variant="fine-print"
      style={[
        {
          fontWeight: "600",
          color: tone === "primary" ? colors.primary : colors.inkMuted48,
          textTransform: isArabic ? "none" : "uppercase",
          letterSpacing: isArabic ? 0 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </AppText>
  );
};

// Re-export a stylesheet-free no-op to keep imports tidy if needed.
export const typographyStyles = StyleSheet.create({});
