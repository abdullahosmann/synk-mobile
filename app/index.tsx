/**
 * Welcome — RN port of src/screens/onboarding/Welcome.tsx.
 * Hero orb (spinning rings + coach avatar cluster + floating icon chips),
 * animated title/subtitle, primary CTA, and "log in" link.
 * Redirects to /dashboard if already onboarded.
 */
import React, { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { ArrowRight, Dumbbell, Utensils } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { getItem } from "../src/lib/storage";
import { useColors } from "../src/theme/ThemeProvider";
import { withAlpha } from "../src/theme/tint";
import { AppText, HeroTitle } from "../src/components/ui/Typography";
import { Btn } from "../src/components/ui/Btn";
import { productShadow } from "../src/components/ui/AppleBackdrop";
import CoachAvatar from "../src/components/CoachAvatar";

function SpinningRing({
  size,
  duration,
  reverse,
  color,
}: {
  size: number;
  duration: number;
  reverse?: boolean;
  color: string;
}) {
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }),
      -1,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: 9999,
          borderWidth: 1,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

export default function Welcome() {
  const router = useRouter();
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const isDark = colors.canvas === "#0B0D10";

  useEffect(() => {
    if (getItem("synk:onboarded") === "true") {
      router.replace("/dashboard");
    }
  }, []);

  const chip = {
    position: "absolute" as const,
    backgroundColor: isDark ? colors.surfaceTile2 : "#fff",
    padding: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    ...productShadow,
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.canvasParchment,
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Header */}
      <View style={{ height: 52, justifyContent: "center" }}>
        <AppText
          style={{
            fontFamily: "Inter_600SemiBold",
            letterSpacing: 3.25,
            fontSize: 13,
          }}
        >
          SYNK
        </AppText>
      </View>

      {/* Center */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 32 }}>
        {/* Orb */}
        <Animated.View
          entering={FadeIn.duration(800)}
          style={{
            width: "100%",
            height: 160,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <SpinningRing size={160} duration={12000} color={withAlpha(colors.primary, 0.1)} />
          <SpinningRing size={128} duration={8000} reverse color={withAlpha(colors.primary, 0.2)} />

          {/* Coach cluster */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <View
              style={[
                {
                  position: "absolute",
                  borderRadius: 9999,
                  backgroundColor: isDark ? colors.surfaceTile2 : "#fff",
                  padding: 6,
                  transform: [{ translateX: -44 }, { translateY: 8 }],
                  ...productShadow,
                },
              ]}
            >
              <CoachAvatar coachId="maya" size={60} />
            </View>
            <View
              style={[
                {
                  position: "absolute",
                  borderRadius: 9999,
                  backgroundColor: isDark ? colors.surfaceTile2 : "#fff",
                  padding: 6,
                  transform: [{ translateX: 44 }, { translateY: 8 }],
                  ...productShadow,
                },
              ]}
            >
              <CoachAvatar coachId="nour" size={60} />
            </View>
            <View
              style={{
                borderRadius: 9999,
                backgroundColor: isDark ? colors.surfaceTile2 : "#fff",
                padding: 8,
                zIndex: 10,
                ...productShadow,
              }}
            >
              <CoachAvatar coachId="khaled" size={80} verified />
            </View>
          </View>

          {/* Floating chips */}
          <View style={[chip, { top: 0, right: "25%" }]}>
            <Dumbbell size={14} color={colors.primary} />
          </View>
          <View style={[chip, { bottom: 16, left: "25%" }]}>
            <Utensils size={14} color={colors.primary} />
          </View>
        </Animated.View>

        <View style={{ maxWidth: 320, gap: 16 }}>
          <Animated.View entering={FadeInDown.delay(200)}>
            <HeroTitle style={{ textAlign: "center" }}>
              {isArabic ? "مرحباً بك في سينك" : "Welcome to SYNK"}
            </HeroTitle>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(300)}>
            <AppText
              variant="body"
              className="text-ink-muted-48 dark:text-ink-dark-muted-48"
              style={{ textAlign: "center" }}
            >
              {isArabic
                ? "مدرّب يتأقلم مع طريقة تمرينك، أكلك، وراحتك."
                : "A coach that adapts to how you train, eat, and recover."}
            </AppText>
          </Animated.View>
        </View>
      </View>

      {/* Footer */}
      <View style={{ width: "100%", maxWidth: 448, paddingBottom: 16 }}>
        <Btn
          variant="primary"
          fullWidth
          onPress={() => router.push("/onboarding/coach")}
        >
          <AppText variant="body-strong" style={{ color: "#fff" }}>
            {isArabic ? "ابدأ الآن" : "Get Started"}
          </AppText>
          <ArrowRight
            size={16}
            strokeWidth={2.5}
            color="#fff"
            style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }}
          />
        </Btn>

        <View style={{ alignItems: "center", marginTop: 20, flexDirection: "row", justifyContent: "center" }}>
          <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48">
            {isArabic ? "لديك حساب بالفعل؟ " : "Already have an account? "}
          </AppText>
          <AppText
            variant="fine-print"
            onPress={() => router.push("/login")}
            className="text-primary dark:text-primary-dark"
            style={{ fontWeight: "600" }}
          >
            {isArabic ? "تسجيل الدخول" : "Log in"}
          </AppText>
        </View>
      </View>
    </View>
  );
}
