/**
 * CoachIntro — RN port of src/screens/onboarding/CoachIntro.tsx.
 * Coach avatar + greeting, then the account-creation form: first name,
 * username (@-prefixed, sanitized), email, password (show/hide + validation).
 */
import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { Eye, EyeOff } from "lucide-react-native";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { COACHES } from "../../src/constants";
import CoachAvatar from "../../src/components/CoachAvatar";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";

function Field({
  label,
  children,
  isArabic,
  invalid,
}: {
  label: string;
  children: React.ReactNode;
  isArabic: boolean;
  invalid?: boolean;
}) {
  const colors = useColors();
  return (
    <View>
      <AppText
        className="text-ink-muted-48 dark:text-ink-dark-muted-48"
        style={{
          marginBottom: 4,
          fontSize: isArabic ? 11 : 10,
          fontWeight: "600",
          letterSpacing: isArabic ? 0 : 0.5,
          textTransform: isArabic ? "none" : "uppercase",
          textAlign: isArabic ? "right" : "left",
          fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold",
        }}
      >
        {label}
      </AppText>
      <View
        style={{
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          backgroundColor: colors.canvas,
          borderWidth: 1,
          borderColor: invalid ? colors.semanticRed : colors.hairline,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 2,
          minHeight: 42,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function CoachIntro() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";

  const coach = COACHES.find((c) => c.id === user.coach) ?? COACHES[0];
  const [name, setName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleUsernameChange = (val: string) =>
    setUsername(val.toLowerCase().replace(/[^a-z0-9_.]/g, ""));

  const isUsernameValid = username.length >= 3 && username.length <= 20;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isDisabled =
    name.trim().length < 1 || !isUsernameValid || !isEmailValid || !isPasswordValid;

  const handleContinue = () => {
    setUser({ ...user, name: name.trim(), username, email });
    router.push("/onboarding/goal");
  };

  const inputStyle = {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold",
    color: colors.ink,
    textAlign: (isArabic ? "right" : "left") as "right" | "left",
  };

  return (
    <OnboardingLayout
      step={2}
      title="Create account"
      arabicTitle="إنشاء حساب"
      footer={<ContinueButton onPress={handleContinue} disabled={isDisabled} />}
    >
      <View style={{ paddingBottom: 16 }}>
        <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center" }}>
          <CoachAvatar coachId={coach.id} size={48} verified />
        </Animated.View>

        <AppText
          variant="title"
          style={{ textAlign: "center", fontSize: 20, marginTop: 8 }}
        >
          {isArabic
            ? `أنا ${coach.arabicName}، مدربك في سينك.`
            : `I'm ${coach.name}, your SYNK coach.`}
        </AppText>
        <AppText
          variant="caption"
          className="text-ink-muted-48 dark:text-ink-dark-muted-48"
          style={{ textAlign: "center", marginTop: 6, maxWidth: 320, alignSelf: "center" }}
        >
          {isArabic
            ? "هبنيلك خطتك، وبعدها هعدّلها حسب تمرينك وتطورك."
            : "I'll build your plan, then adapt it based on your workouts and progress."}
        </AppText>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Field label={isArabic ? "الاسم الأول" : "FIRST NAME"} isArabic={isArabic}>
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={40}
              placeholder={isArabic ? "الاسم الأول" : "First name"}
              placeholderTextColor={colors.inkMuted48}
              style={inputStyle}
            />
          </Field>

          <Field label={isArabic ? "اسم المستخدم" : "USERNAME"} isArabic={isArabic}>
            <AppText style={{ color: colors.inkMuted24, fontWeight: "600", fontSize: 14, marginHorizontal: 8 }}>
              @
            </AppText>
            <TextInput
              value={username}
              onChangeText={handleUsernameChange}
              maxLength={20}
              autoCapitalize="none"
              placeholder="username_123"
              placeholderTextColor={colors.inkMuted48}
              style={[inputStyle, { textAlign: "left" }]}
            />
          </Field>

          <Field label={isArabic ? "البريد الإلكتروني" : "EMAIL"} isArabic={isArabic}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="name@example.com"
              placeholderTextColor={colors.inkMuted48}
              style={inputStyle}
            />
          </Field>

          <View>
            <Field
              label={isArabic ? "كلمة المرور" : "PASSWORD"}
              isArabic={isArabic}
              invalid={password.length > 0 && password.length < 8}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.inkMuted48}
                style={inputStyle}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={16} color={colors.inkMuted48} />
                ) : (
                  <Eye size={16} color={colors.inkMuted48} />
                )}
              </Pressable>
            </Field>
            {password.length > 0 && password.length < 8 && (
              <AppText
                style={{
                  color: colors.semanticRed,
                  fontSize: 11,
                  marginTop: 4,
                  textAlign: isArabic ? "right" : "left",
                }}
              >
                {isArabic ? "٨ أحرف على الأقل" : "At least 8 characters"}
              </AppText>
            )}
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}
