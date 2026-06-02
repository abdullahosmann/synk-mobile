/**
 * Login — RN port of src/screens/onboarding/Login.tsx.
 * Email/password fields (label-in-box) with inline validation, forgot-password
 * link, login CTA, divider, social buttons (toast: coming soon), signup footer.
 */
import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useToast } from "../src/components/ToastProvider";
import { useColors } from "../src/theme/ThemeProvider";
import { AppText, HeroTitle } from "../src/components/ui/Typography";
import { Btn } from "../src/components/ui/Btn";

export default function Login() {
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateEmail = (val: string) => {
    if (!val) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
      ? ""
      : isArabic ? "أدخل بريد إلكتروني صحيح" : "Please enter a valid email";
  };
  const validatePassword = (val: string) => {
    if (!val) return "";
    return val.length >= 8 ? "" : isArabic ? "كلمة المرور لازم ٨ أحرف على الأقل" : "Password must be at least 8 characters";
  };

  const handleSubmit = () => {
    const emailError = validateEmail(email) || (!email ? (isArabic ? "البريد الإلكتروني مطلوب" : "Email is required") : "");
    const passwordError = validatePassword(password) || (!password ? (isArabic ? "كلمة المرور مطلوبة" : "Password is required") : "");
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }
    router.replace("/dashboard");
  };

  const field = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    opts: { secure?: boolean; error?: string; onBlur?: () => void } = {},
  ) => (
    <View style={{ gap: 6 }}>
      <View
        style={{
          backgroundColor: colors.canvas,
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderWidth: 1,
          borderColor: opts.error ? colors.semanticRed : colors.hairline,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 10, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, marginBottom: 2, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
            {label}
          </AppText>
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={opts.onBlur}
            secureTextEntry={opts.secure && !showPassword}
            autoCapitalize="none"
            keyboardType={opts.secure ? "default" : "email-address"}
            placeholder={opts.secure ? "••••••••" : "name@example.com"}
            placeholderTextColor={colors.inkMuted48}
            style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: "Inter_600SemiBold", padding: 0, textAlign: isArabic ? "right" : "left" }}
          />
        </View>
        {opts.secure && (
          <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
            {showPassword ? <EyeOff size={18} color={colors.inkMuted48} /> : <Eye size={18} color={colors.inkMuted48} />}
          </Pressable>
        )}
      </View>
      {opts.error ? (
        <Animated.View entering={FadeInDown.duration(200)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, paddingHorizontal: 4 }}>
          <AlertCircle size={12} color={colors.semanticRed} />
          <AppText style={{ color: colors.semanticRed, fontSize: 11, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase" }}>{opts.error}</AppText>
        </Animated.View>
      ) : null}
    </View>
  );

  const socialButton = (label: string) => (
    <Pressable
      onPress={() => showToast(isArabic ? "قريباً" : "Coming soon", "info")}
      style={{ height: 52, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, alignItems: "center", justifyContent: "center" }}
    >
      <AppText variant="body-strong" style={{ color: colors.ink }}>{label}</AppText>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 14, fontWeight: "600", letterSpacing: 4, color: colors.ink, fontStyle: "italic", fontFamily: "Inter_600SemiBold" }}>SYNK</AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, maxWidth: 448, width: "100%", alignSelf: "center", paddingTop: 32 }}>
        <Animated.View entering={FadeInDown} style={{ alignItems: "center", marginBottom: 40 }}>
          <HeroTitle style={{ textTransform: isArabic ? "none" : "uppercase", textAlign: "center" }}>
            {isArabic ? "مرحباً بعودتك" : "Welcome back"}
          </HeroTitle>
        </Animated.View>

        <View style={{ gap: 16 }}>
          {field(isArabic ? "البريد الإلكتروني" : "Email Address", email, setEmail, {
            error: errors.email,
            onBlur: () => setErrors((p) => ({ ...p, email: validateEmail(email) })),
          })}
          {field(isArabic ? "كلمة المرور" : "Password", password, setPassword, {
            secure: true,
            error: errors.password,
            onBlur: () => setErrors((p) => ({ ...p, password: validatePassword(password) })),
          })}

          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: isArabic ? "flex-start" : "flex-end", paddingTop: 4 }}>
            <AppText onPress={() => router.push("/forgot-password")} style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1 }}>
              {isArabic ? "نسيت كلمة المرور؟" : "Forgot password?"}
            </AppText>
          </View>

          <View style={{ paddingTop: 8 }}>
            <Btn variant="primary" fullWidth onPress={handleSubmit} label={isArabic ? "تسجيل الدخول" : "Log In"} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 8 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
            <AppText className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 10, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1 }}>
              {isArabic ? "أو تابع باستخدام" : "or continue with"}
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.hairline }} />
          </View>

          <View style={{ gap: 12 }}>
            {socialButton(isArabic ? "المتابعة باستخدام جوجل" : "Continue with Google")}
            {socialButton(isArabic ? "المتابعة باستخدام أبل" : "Continue with Apple")}
          </View>
        </View>
      </View>

      <View style={{ padding: 32, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
        <AppText className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 12, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1 }}>
          {isArabic ? "ليس لديك حساب؟" : "Don't have an account?"}
        </AppText>
        <AppText onPress={() => router.replace("/")} style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>
          {isArabic ? "إنشاء حساب" : "Sign up"}
        </AppText>
      </View>
    </View>
  );
}
