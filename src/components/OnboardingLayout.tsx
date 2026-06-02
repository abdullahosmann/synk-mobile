/**
 * OnboardingLayout — RN port of src/components/OnboardingLayout.tsx.
 * Top progress bar, blurred sticky header w/ back button, screen title +
 * subtitle, scrollable content, and a fixed bottom footer with a gradient
 * fade. Safe-area aware. RTL: progress fills from the right, back arrow flips.
 */
import React from "react";
import { Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAppContext } from "../AppContext";
import { useColors, useTheme } from "../theme/ThemeProvider";
import { AppleBackdrop } from "./ui/AppleBackdrop";
import { AppText } from "./ui/Typography";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  step: number;
  totalSteps?: number;
  onBack?: () => void;
  title: string;
  arabicTitle?: string;
  subtitle?: string;
  arabicSubtitle?: string;
  footer?: React.ReactNode;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  step,
  totalSteps = 15,
  onBack,
  title,
  arabicTitle,
  subtitle,
  arabicSubtitle,
  footer,
}) => {
  const router = useRouter();
  const { user } = useAppContext();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const pct = Math.min(100, Math.max(0, (step / totalSteps) * 100));
  const goBack = onBack || (() => router.back());

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.canvasParchment }}
    >
      {/* Top progress bar */}
      {step && totalSteps ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
            zIndex: 60,
            flexDirection: isArabic ? "row-reverse" : "row",
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: colors.primary,
            }}
          />
        </View>
      ) : null}

      {/* Sticky blurred header with back button */}
      <AppleBackdrop
        style={{
          paddingTop: insets.top + 4,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
          zIndex: 50,
        }}
      >
        <View
          style={{
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            paddingHorizontal: 16,
          }}
        >
          <Pressable
            onPress={goBack}
            hitSlop={12}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft
              size={18}
              strokeWidth={2.5}
              color={colors.ink}
              style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }}
            />
          </Pressable>
        </View>
      </AppleBackdrop>

      {/* Scrollable content */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <ScrollableBody footer={footer} insets={insets}>
            <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
              <View style={{ marginBottom: 16 }}>
                <AppText
                  variant="title-2"
                  style={{ textAlign: isArabic ? "right" : "left" }}
                >
                  {isArabic ? arabicTitle || title : title}
                </AppText>
                {(subtitle || arabicSubtitle) && (
                  <AppText
                    variant="body"
                    className="text-ink-muted-48 dark:text-ink-dark-muted-48"
                    style={{
                      marginTop: 4,
                      maxWidth: 340,
                      textAlign: isArabic ? "right" : "left",
                      alignSelf: isArabic ? "flex-end" : "flex-start",
                    }}
                  >
                    {isArabic ? arabicSubtitle || subtitle : subtitle}
                  </AppText>
                )}
              </View>
              {children}
            </View>
          </ScrollableBody>
        </View>
      </View>

      {/* Fixed footer with gradient fade */}
      {footer && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
          }}
          pointerEvents="box-none"
        >
          <LinearGradient
            colors={["rgba(245,245,247,0)", colors.canvasParchment]}
            style={{ height: 32 }}
            pointerEvents="none"
          />
          <View
            style={{
              backgroundColor: colors.canvasParchment,
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {footer}
          </View>
        </View>
      )}
    </View>
  );
};

// Inner scroll area that reserves space for the fixed footer.
import { ScrollView } from "react-native";
const ScrollableBody: React.FC<{
  children: React.ReactNode;
  footer?: React.ReactNode;
  insets: { bottom: number };
}> = ({ children, footer, insets }) => (
  <ScrollView
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{
      paddingBottom: footer ? insets.bottom + 140 : insets.bottom + 24,
      alignItems: "stretch",
    }}
  >
    {children}
  </ScrollView>
);

export default OnboardingLayout;
