/**
 * +not-found — localized, theme-aware fallback for unmatched routes.
 * Replaces expo-router's raw English "Unmatched Route" dev page (B3).
 */
import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Compass } from "lucide-react-native";
import { useColors } from "../src/theme/ThemeProvider";
import { useIsArabic } from "../src/lib/i18n";
import { AppText } from "../src/components/ui/Typography";
import { Btn } from "../src/components/ui/Btn";

export default function NotFound() {
  const router = useRouter();
  const colors = useColors();
  const isArabic = useIsArabic();

  const goHome = () => router.replace("/dashboard");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.canvasParchment,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.canvas,
          borderWidth: 1,
          borderColor: colors.hairline,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Compass size={36} color={colors.inkMuted48} strokeWidth={2} />
      </View>
      <AppText variant="title-2" style={{ color: colors.ink, textAlign: "center", marginBottom: 12 }}>
        {isArabic ? "الصفحة مش موجودة" : "Page not found"}
      </AppText>
      <AppText
        variant="body"
        className="text-ink-muted-48 dark:text-ink-dark-muted-48"
        style={{ textAlign: "center", lineHeight: 22, marginBottom: 32, maxWidth: 300 }}
      >
        {isArabic
          ? "الصفحة اللي بتدوّر عليها مش موجودة أو اتنقلت."
          : "The page you're looking for doesn't exist or has moved."}
      </AppText>
      <Btn variant="primary" onPress={goHome} style={{ paddingHorizontal: 32 }}>
        <AppText variant="body-strong" style={{ color: colors.onPrimary }}>
          {isArabic ? "العودة للرئيسية" : "Back to dashboard"}
        </AppText>
      </Btn>
    </View>
  );
}
