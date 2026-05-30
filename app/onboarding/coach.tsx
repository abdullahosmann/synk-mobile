/**
 * CoachSelection — RN port of src/screens/onboarding/CoachSelection.tsx.
 * 2x2 coach grid with selection ring, grayscale on idle, and an animated
 * "speech" card for the selected coach. Also serves /coach-swap (save mode).
 */
import React, { useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter, usePathname } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CheckCircle } from "lucide-react-native";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { COACHES } from "../../src/constants";
import CoachAvatar from "../../src/components/CoachAvatar";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";
import { AppleBackdrop } from "../../src/components/ui/AppleBackdrop";

export default function CoachSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const isSwapMode = pathname === "/coach-swap";
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const isArabic = user.language === "ar";
  const { width } = useWindowDimensions();

  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(
    isSwapMode ? user.coach : null,
  );

  const handleContinue = () => {
    if (!selectedCoachId) return;
    setUser({ ...user, coach: selectedCoachId });
    if (isSwapMode) {
      showToast(isArabic ? "تم تغيير الكوتش" : "Coach changed", "success");
      router.back();
    } else {
      router.push("/onboarding/coach-intro");
    }
  };

  const selectedCoach = selectedCoachId
    ? COACHES.find((c) => c.id === selectedCoachId)
    : null;

  // grid: 2 columns, gap 8, container px 24
  const cardW = (Math.min(width, 448) - 48 - 8) / 2;
  const cardH = cardW * 1.15;

  const grid = (
    <>
      <View
        style={{
          flexDirection: isArabic ? "row-reverse" : "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {COACHES.map((coach) => {
          const isSelected = selectedCoachId === coach.id;
          return (
            <Pressable
              key={coach.id}
              onPress={() => setSelectedCoachId(coach.id)}
              style={{
                width: cardW,
                height: cardH,
                borderRadius: 8,
                overflow: "hidden",
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colors.primary : colors.hairline,
                backgroundColor: colors.surfacePearl,
              }}
            >
              <Image
                source={{ uri: coach.image }}
                style={{ width: "100%", height: "100%", opacity: isSelected ? 1 : 0.95 }}
                contentFit="cover"
              />
              <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 6 }}>
                <AppleBackdrop
                  style={{
                    borderRadius: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      flexDirection: isArabic ? "row-reverse" : "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <AppText
                        variant="caption-strong"
                        style={{ fontSize: 12, textAlign: isArabic ? "right" : "left" }}
                      >
                        {isArabic ? coach.arabicName : coach.name}
                      </AppText>
                      <AppText
                        numberOfLines={1}
                        className="text-ink-muted-48 dark:text-ink-dark-muted-48"
                        style={{ fontSize: 9, marginTop: 2, textAlign: isArabic ? "right" : "left" }}
                      >
                        {isArabic ? coach.arabicTag : coach.tag}
                      </AppText>
                    </View>
                    {isSelected && (
                      <CheckCircle
                        size={14}
                        strokeWidth={2.5}
                        color={colors.primary}
                        style={{ marginLeft: isArabic ? 0 : 4, marginRight: isArabic ? 4 : 0 }}
                      />
                    )}
                  </View>
                </AppleBackdrop>
              </View>
            </Pressable>
          );
        })}
      </View>

      {selectedCoach && (
        <Animated.View
          key={selectedCoach.id}
          entering={FadeInDown.duration(200)}
          style={{
            backgroundColor: colors.canvas,
            borderWidth: 1,
            borderColor: colors.hairline,
            borderLeftWidth: isArabic ? 1 : 2,
            borderRightWidth: isArabic ? 2 : 1,
            borderLeftColor: isArabic ? colors.hairline : colors.primary,
            borderRightColor: isArabic ? colors.primary : colors.hairline,
            borderRadius: 8,
            padding: 10,
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start" }}>
            <CoachAvatar coachId={selectedCoach.id} size={32} verified />
            <View style={{ flex: 1, marginLeft: isArabic ? 0 : 12, marginRight: isArabic ? 12 : 0 }}>
              <AppText variant="caption-strong" style={{ fontSize: 12, textAlign: isArabic ? "right" : "left" }}>
                {isArabic ? selectedCoach.arabicName : selectedCoach.name}
              </AppText>
              <AppText
                numberOfLines={2}
                className="text-ink-muted-80 dark:text-ink-dark-muted-80"
                style={{ fontSize: 11, marginTop: 2, lineHeight: 15, textAlign: isArabic ? "right" : "left" }}
              >
                "{isArabic ? selectedCoach.arabicSpeech : selectedCoach.speech}"
              </AppText>
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );

  return (
    <OnboardingLayout
      step={1}
      title="Choose your coach"
      arabicTitle="اختر مدربك"
      subtitle="Select the coaching style that matches how you want to be guided."
      arabicSubtitle="اختر نمط التدريب اللي بيناسب طريقة توجيهك المفضلة."
      footer={
        <ContinueButton
          onPress={handleContinue}
          disabled={!selectedCoachId || (isSwapMode && selectedCoachId === user.coach)}
          label={isSwapMode ? "Save" : "Continue"}
          arabicLabel={isSwapMode ? "حفظ" : "متابعة"}
        />
      }
    >
      {grid}
    </OnboardingLayout>
  );
}
