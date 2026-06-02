/**
 * GoalSelection — RN port of src/screens/onboarding/GoalSelection.tsx.
 * Two 2-col chip grids (goals: choose any; obstacles: up to 3) + a coach
 * "speech" card that animates in for ~900ms before continuing to stats.
 */
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { COACHES } from "../../src/constants";
import CoachAvatar from "../../src/components/CoachAvatar";
import { GoalV2, Obstacle } from "../../src/types";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";

const GOAL_OPTIONS: { id: GoalV2; en: string; ar: string }[] = [
  { id: "build-strength", en: "Build strength", ar: "بناء قوة" },
  { id: "gain-muscle", en: "Gain muscle", ar: "زيادة عضل" },
  { id: "lose-body-fat", en: "Lose body fat", ar: "تخفيف دهون" },
  { id: "improve-cardio", en: "Improve cardio", ar: "تحسين اللياقة" },
  { id: "sport-performance", en: "Sport performance", ar: "أداء رياضي" },
  { id: "stay-consistent", en: "Stay consistent", ar: "الاستمرارية" },
];

const OBSTACLE_OPTIONS: { id: Obstacle; en: string; ar: string }[] = [
  { id: "lack-of-time", en: "Lack of time", ar: "ضيق الوقت" },
  { id: "inconsistency", en: "Inconsistency", ar: "عدم الانتظام" },
  { id: "food-cravings", en: "Food cravings", ar: "الوحام على الأكل" },
  { id: "low-energy", en: "Low energy", ar: "طاقة منخفضة" },
  { id: "not-knowing-what-to-do", en: "Not knowing what to do", ar: "مش عارف أعمل إيه" },
  { id: "stress", en: "Stress", ar: "ضغط نفسي" },
];

function SectionLabel({ children, isArabic }: { children: string; isArabic: boolean }) {
  return (
    <AppText
      className="text-ink-muted-48 dark:text-ink-dark-muted-48"
      style={{
        paddingHorizontal: 4,
        marginBottom: 8,
        fontSize: isArabic ? 12 : 11,
        fontWeight: "600",
        letterSpacing: isArabic ? 0 : 0.44,
        textTransform: isArabic ? "none" : "uppercase",
        textAlign: isArabic ? "right" : "left",
        fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold",
      }}
    >
      {children}
    </AppText>
  );
}

export default function GoalSelection() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";
  const [showCoach, setShowCoach] = useState(false);
  const coach = COACHES.find((c) => c.id === user.coach) ?? COACHES[0];

  const handleContinue = () => {
    setShowCoach(true);
    setTimeout(() => router.push("/onboarding/stats"), 900);
  };

  const toggleGoal = (id: GoalV2) => {
    const next = user.goals.includes(id)
      ? user.goals.filter((g) => g !== id)
      : [...user.goals, id];
    setUser({ ...user, goals: next });
  };

  const toggleObstacle = (id: Obstacle) => {
    if (user.obstacles.includes(id)) {
      setUser({ ...user, obstacles: user.obstacles.filter((o) => o !== id) });
    } else if (user.obstacles.length < 3) {
      setUser({ ...user, obstacles: [...user.obstacles, id] });
    }
  };

  return (
    <OnboardingLayout
      step={3}
      title="What are you working on?"
      arabicTitle="بنشتغل على إيه؟"
      footer={
        <ContinueButton onPress={handleContinue} disabled={user.goals.length === 0} />
      }
    >
      <View style={{ paddingBottom: 16 }}>
        {/* Goals */}
        <SectionLabel isArabic={isArabic}>
          {isArabic ? "الأهداف · اختر اللي يناسبك" : "GOALS · CHOOSE ANY"}
        </SectionLabel>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
          {GOAL_OPTIONS.map((g) => {
            const sel = user.goals.includes(g.id);
            return (
              <Pressable
                key={g.id}
                onPress={() => toggleGoal(g.id)}
                style={{
                  width: "48.5%",
                  minHeight: 44,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: sel ? colors.primary : colors.hairline,
                  backgroundColor: colors.canvas,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <AppText
                  variant="body-strong"
                  style={{ color: sel ? colors.primary : colors.ink, textAlign: "center", fontSize: 14 }}
                >
                  {isArabic ? g.ar : g.en}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Obstacles */}
        <View style={{ marginTop: 24 }}>
          <SectionLabel isArabic={isArabic}>
            {isArabic ? "العقبات · لحد ٣" : "OBSTACLES · UP TO 3"}
          </SectionLabel>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
            {OBSTACLE_OPTIONS.map((o) => {
              const sel = user.obstacles.includes(o.id);
              return (
                <Pressable
                  key={o.id}
                  onPress={() => toggleObstacle(o.id)}
                  style={{
                    width: "48.5%",
                    minHeight: 40,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: sel ? colors.primary : colors.hairline,
                    backgroundColor: colors.canvasParchment,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <AppText
                    style={{
                      color: sel ? colors.primary : colors.inkMuted80,
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: "500",
                      fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular",
                    }}
                  >
                    {isArabic ? o.ar : o.en}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Coach speech */}
        {showCoach && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={{
              backgroundColor: colors.canvas,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderLeftWidth: isArabic ? 1 : 2,
              borderRightWidth: isArabic ? 2 : 1,
              borderLeftColor: isArabic ? colors.hairline : colors.primary,
              borderRightColor: isArabic ? colors.primary : colors.hairline,
              borderRadius: 8,
              padding: 16,
              marginTop: 24,
            }}
          >
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <CoachAvatar coachId={coach.id} size={24} />
              <AppText variant="caption-strong" style={{ fontSize: 12 }}>
                {isArabic ? `${coach.arabicName} يقول:` : `${coach.name} says:`}
              </AppText>
            </View>
            <AppText
              variant="caption"
              style={{ fontSize: 13, lineHeight: 19, textAlign: isArabic ? "right" : "left" }}
            >
              {isArabic
                ? "تمام. هبني على أهدافك وهخليك ماشي حتى لما الحياة تبقى زحمة."
                : "Got it. I'll build around your goals and help you stay on track when life gets messy."}
            </AppText>
          </Animated.View>
        )}
      </View>
    </OnboardingLayout>
  );
}
