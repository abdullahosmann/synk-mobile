/**
 * ErrorBoundary — catches render-time throws below the providers so a single
 * screen crash shows a localized, recoverable fallback instead of whitescreening
 * the whole app (B3). Placed inside ThemeProvider + AppProvider so the fallback
 * has access to theme + language.
 */
import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import { useColors } from "../theme/ThemeProvider";
import { useIsArabic } from "../lib/i18n";
import { AppText } from "./ui/Typography";
import { Btn } from "./ui/Btn";

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const router = useRouter();
  const colors = useColors();
  const isArabic = useIsArabic();

  const recover = () => {
    onReset();
    router.replace("/dashboard");
  };

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
        <AlertCircle size={36} color={colors.semanticRed} strokeWidth={2} />
      </View>
      <AppText variant="title-2" style={{ color: colors.ink, textAlign: "center", marginBottom: 12 }}>
        {isArabic ? "حصل خطأ" : "Something went wrong"}
      </AppText>
      <AppText
        variant="body"
        className="text-ink-muted-48 dark:text-ink-dark-muted-48"
        style={{ textAlign: "center", lineHeight: 22, marginBottom: 32, maxWidth: 300 }}
      >
        {isArabic
          ? "حصلت مشكلة غير متوقعة. جرّب ترجع للرئيسية."
          : "An unexpected error occurred. Try heading back to your dashboard."}
      </AppText>
      <Btn variant="primary" onPress={recover} style={{ paddingHorizontal: 32 }}>
        <AppText variant="body-strong" style={{ color: colors.onPrimary }}>
          {isArabic ? "العودة للرئيسية" : "Back to dashboard"}
        </AppText>
      </Btn>
    </View>
  );
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Surface in dev; in production this is where a crash reporter would hook in.
    console.error("Uncaught render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
