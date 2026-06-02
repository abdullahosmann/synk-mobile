/**
 * BodyStats — RN port of src/screens/onboarding/BodyStats.tsx.
 * Grouped card: gender, age, height (cm/ft·in), weight (kg/lb), target weight,
 * with unit toggles. Plus GoalPacePicker, validation errors, and a coach note.
 */
import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AlertCircle } from "lucide-react-native";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { COACHES } from "../../src/constants";
import CoachAvatar from "../../src/components/CoachAvatar";
import { GoalPacePicker } from "../../src/components/GoalPacePicker";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";

const cmToFtIn = (cm: number) => {
  if (!cm) return { ft: 0, in: 0 };
  const t = Math.round(cm / 2.54);
  return { ft: Math.floor(t / 12), in: t % 12 };
};
const ftInToCm = (ft: number, inches: number) => Math.round((ft * 12 + inches) * 2.54);

export default function BodyStats() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";
  const coach = COACHES.find((c) => c.id === user.coach) || COACHES[0];
  const [showWhy, setShowWhy] = useState(false);
  const weightUnit = user.weightUnit || "kg";
  const heightUnit = user.heightUnit || "cm";

  const setNum = (field: keyof typeof user, value: string) =>
    setUser({ ...user, [field]: parseFloat(value) || 0 });

  const errors = {
    age: user.age > 0 && (user.age < 14 || user.age > 80),
    height: user.height > 0 && (user.height < 100 || user.height > 250),
    currentWeight: user.currentWeight > 0 && (user.currentWeight < 30 || user.currentWeight > 250),
    targetWeight: user.targetWeight > 0 && (user.targetWeight < 30 || user.targetWeight > 250),
  };

  const showWarning =
    user.currentWeight > 0 &&
    user.targetWeight > 0 &&
    Math.abs(user.currentWeight - user.targetWeight) > 25;

  const canContinue =
    user.gender !== null &&
    user.age >= 14 && user.age <= 80 &&
    user.height >= 100 && user.height <= 250 &&
    user.currentWeight >= 30 && user.currentWeight <= 250 &&
    !(user.targetWeight > 0 && (user.targetWeight < 30 || user.targetWeight > 250));

  // --- small building blocks ---
  const SegPill = ({
    active,
    onPress,
    children,
  }: {
    active: boolean;
    onPress: () => void;
    children: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 9999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? colors.primary : colors.canvasParchment,
      }}
    >
      <AppText
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: active ? "#fff" : colors.inkMuted48,
          fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular",
        }}
      >
        {children}
      </AppText>
    </Pressable>
  );

  const Row = ({
    label,
    children,
    last,
  }: {
    label: string;
    children: React.ReactNode;
    last?: boolean;
  }) => (
    <View
      style={{
        flexDirection: isArabic ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.hairline,
        gap: 12,
      }}
    >
      <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.ink, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
        {label}
      </AppText>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
        {children}
      </View>
    </View>
  );

  const numInput = (
    value: string,
    onChange: (t: string) => void,
    placeholder: string,
    width = 56,
  ) => (
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      placeholder={placeholder}
      placeholderTextColor={colors.inkMuted48}
      style={{
        width,
        fontSize: 15,
        fontWeight: "600",
        color: colors.ink,
        textAlign: isArabic ? "left" : "right",
        fontFamily: "Inter_600SemiBold",
        padding: 0,
      }}
    />
  );

  const displayWeight = (kg: number) =>
    !kg ? "" : weightUnit === "lb" ? String(Math.round(kg * 2.20462 * 10) / 10) : String(kg);
  const onWeight = (field: "currentWeight" | "targetWeight") => (t: string) => {
    const v = parseFloat(t) || 0;
    setUser({ ...user, [field]: weightUnit === "lb" ? v / 2.20462 : v });
  };

  return (
    <OnboardingLayout
      step={5}
      title="Your basics"
      arabicTitle="بياناتك الأساسية"
      subtitle="I’ll use this to estimate safe starting targets. You can edit this anytime."
      arabicSubtitle="هستخدم ده عشان أحسب أرقام آمنة. وممكن تعدّلها بعدين."
      footer={
        <ContinueButton
          onPress={() => canContinue && router.push("/onboarding/body-composition")}
          disabled={!canContinue}
          label="Next"
          arabicLabel="التالي"
        />
      }
    >
      <View style={{ paddingBottom: 16 }}>
        {/* Why we ask */}
        <View style={{ marginBottom: 24, alignItems: isArabic ? "flex-end" : "flex-start" }}>
          <Pressable onPress={() => setShowWhy((s) => !s)}>
            <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.primary, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
              {isArabic ? "ليه بنسأل ده؟" : "Why we ask this"}
            </AppText>
          </Pressable>
          {showWhy && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={{
                marginTop: 12,
                backgroundColor: colors.canvas,
                borderWidth: 1,
                borderColor: colors.hairline,
                borderRadius: 8,
                padding: 16,
              }}
            >
              <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left", lineHeight: 19 }}>
                {isArabic
                  ? "بنستخدم ده عشان نحسب أرقام سعرات آمنة، نحدد أحمال تدريب جسمك يقدر يستشفي منها، ونقترح جدول واقعي. بياناتك بتفضل على جهازك ومش بتتشارك مع حد."
                  : "We use these to calculate safe calorie targets, set training loads you can recover from, and recommend a realistic timeline. Your data stays on your device and is never shared with other users."}
              </AppText>
            </Animated.View>
          )}
        </View>

        {/* Grouped card */}
        <View
          style={{
            backgroundColor: colors.canvas,
            borderWidth: 1,
            borderColor: colors.hairline,
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <Row label={isArabic ? "النوع" : "Gender"}>
            <SegPill active={user.gender === "male"} onPress={() => setUser({ ...user, gender: "male" })}>
              {isArabic ? "ذكر" : "Male"}
            </SegPill>
            <SegPill active={user.gender === "female"} onPress={() => setUser({ ...user, gender: "female" })}>
              {isArabic ? "أنثى" : "Female"}
            </SegPill>
          </Row>

          <Row label={isArabic ? "العمر" : "Age"}>
            {numInput(user.age ? String(user.age) : "", (t) => setNum("age", t), "25", 40)}
            <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48">
              {isArabic ? "سنة" : "yrs"}
            </AppText>
          </Row>

          <Row label={isArabic ? "الطول" : "Height"}>
            {heightUnit === "cm" ? (
              <>
                {numInput(user.height ? String(user.height) : "", (t) => setNum("height", t), "175", 44)}
                <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48">{isArabic ? "سم" : "cm"}</AppText>
              </>
            ) : (
              <>
                {numInput(
                  user.height ? String(cmToFtIn(user.height).ft) : "",
                  (t) => setUser({ ...user, height: ftInToCm(parseInt(t) || 0, cmToFtIn(user.height || 0).in) }),
                  "5",
                  24,
                )}
                <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48">{isArabic ? "ق" : "ft"}</AppText>
                {numInput(
                  user.height ? String(cmToFtIn(user.height).in) : "",
                  (t) => setUser({ ...user, height: ftInToCm(cmToFtIn(user.height || 0).ft, parseInt(t) || 0) }),
                  "9",
                  28,
                )}
                <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48">{isArabic ? "ب" : "in"}</AppText>
              </>
            )}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 4 }}>
              <SegPill active={heightUnit === "cm"} onPress={() => setUser({ ...user, heightUnit: "cm" })}>{isArabic ? "سم" : "cm"}</SegPill>
              <SegPill active={heightUnit === "ft"} onPress={() => setUser({ ...user, heightUnit: "ft" })}>{isArabic ? "قدم" : "ft"}</SegPill>
            </View>
          </Row>

          <Row label={isArabic ? "الوزن" : "Weight"}>
            {numInput(displayWeight(user.currentWeight), onWeight("currentWeight"), weightUnit === "lb" ? "165" : "75", 50)}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 4 }}>
              <SegPill active={weightUnit === "kg"} onPress={() => setUser({ ...user, weightUnit: "kg" })}>{isArabic ? "كجم" : "kg"}</SegPill>
              <SegPill active={weightUnit === "lb"} onPress={() => setUser({ ...user, weightUnit: "lb" })}>{isArabic ? "رطل" : "lb"}</SegPill>
            </View>
          </Row>

          <Row label={isArabic ? "الوزن المستهدف" : "Target"} last>
            {numInput(displayWeight(user.targetWeight), onWeight("targetWeight"), weightUnit === "lb" ? "155" : "70", 50)}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 4 }}>
              <SegPill active={weightUnit === "kg"} onPress={() => setUser({ ...user, weightUnit: "kg" })}>{isArabic ? "كجم" : "kg"}</SegPill>
              <SegPill active={weightUnit === "lb"} onPress={() => setUser({ ...user, weightUnit: "lb" })}>{isArabic ? "رطل" : "lb"}</SegPill>
            </View>
          </Row>
        </View>

        {/* Pace picker */}
        {user.currentWeight > 0 &&
          user.targetWeight > 0 &&
          Math.abs(user.currentWeight - user.targetWeight) >= 2 &&
          !errors.currentWeight &&
          !errors.targetWeight && (
            <View style={{ marginBottom: 24 }}>
              <AppText style={{ fontSize: 15, fontWeight: "500", color: colors.ink, marginBottom: 8, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                {isArabic ? "السرعة" : "Pace"}
              </AppText>
              <GoalPacePicker
                currentWeight={user.currentWeight}
                targetWeight={user.targetWeight}
                selectedRate={user.weeklyGoalRate || 0.5}
                onSelect={(rate) => setUser({ ...user, weeklyGoalRate: rate })}
                isArabic={isArabic}
              />
            </View>
          )}

        {/* Validation */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          {errors.age && (
            <ErrorLine isArabic={isArabic} color={colors.semanticRed}>
              {isArabic ? "العمر يجب أن يكون بين ١٤ و ٨٠ سنة" : "Age must be between 14 and 80 years"}
            </ErrorLine>
          )}
          {errors.height && (
            <ErrorLine isArabic={isArabic} color={colors.semanticRed}>
              {isArabic ? "الطول يجب أن يكون بين ١٠٠ و ٢٥٠ سم" : "Height must be between 100 and 250 cm"}
            </ErrorLine>
          )}
          {(errors.currentWeight || errors.targetWeight) && (
            <ErrorLine isArabic={isArabic} color={colors.semanticRed}>
              {isArabic
                ? weightUnit === "lb"
                  ? "الوزن لازم يكون بين 66 و 551 رطل"
                  : "الوزن يجب أن يكون بين ٣٠ و ٢٥٠ كجم"
                : weightUnit === "lb"
                  ? "Weight must be between 66 and 551 lb"
                  : "Weight must be between 30 and 250 kg"}
            </ErrorLine>
          )}
          {showWarning && !errors.targetWeight && !errors.currentWeight && (
            <ErrorLine isArabic={isArabic} color={colors.semanticOrange}>
              {isArabic ? "تغيير كبير — هنحدد جدول واقعي" : "That's a big change — we'll set a realistic timeline."}
            </ErrorLine>
          )}
        </View>

        {/* Coach note */}
        <View
          style={{
            backgroundColor: colors.canvas,
            borderWidth: 1,
            borderColor: colors.hairline,
            borderRadius: 8,
            padding: 16,
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <CoachAvatar coachId={coach.id} size={40} verified />
          <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ flex: 1, textAlign: isArabic ? "right" : "left", lineHeight: 22 }}>
            <AppText variant="body-strong" style={{ color: colors.ink }}>
              {isArabic ? `${coach.arabicName} يقول: ` : `${coach.name} says: `}
            </AppText>
            {isArabic
              ? "دي نقطة بداية آمنة، وتقدر تغير أي حاجة بعدين."
              : "This gives me a safe starting point. You can change anything later."}
          </AppText>
        </View>
      </View>
    </OnboardingLayout>
  );
}

function ErrorLine({
  children,
  color,
  isArabic,
}: {
  children: string;
  color: string;
  isArabic: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}
    >
      <AlertCircle size={14} color={color} />
      <AppText style={{ fontSize: 13, fontWeight: "500", color, flex: 1, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
        {children}
      </AppText>
    </Animated.View>
  );
}
