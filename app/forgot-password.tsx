/**
 * ForgotPassword — RN port of src/screens/onboarding/ForgotPassword.tsx.
 * Email entry -> success state with a resend countdown.
 */
import React, { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useColors } from "../src/theme/ThemeProvider";
import { AppText, HeroTitle, ScreenTitle } from "../src/components/ui/Typography";
import { Btn } from "../src/components/ui/Btn";

export default function ForgotPassword() {
  const router = useRouter();
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [email, setEmail] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const validateEmail = (val: string) => {
    if (!val) return isArabic ? "البريد الإلكتروني مطلوب" : "Email is required";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? "" : isArabic ? "أدخل بريد إلكتروني صحيح" : "Please enter a valid email";
  };

  const handleSubmit = () => {
    const e = validateEmail(email);
    if (e) { setError(e); return; }
    setHasSubmitted(true);
    setCountdown(30);
    setError("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 14, fontWeight: "600", letterSpacing: 4, color: colors.ink, fontStyle: "italic", fontFamily: "Inter_600SemiBold" }}>SYNK</AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, maxWidth: 448, width: "100%", alignSelf: "center", paddingTop: 32 }}>
        {!hasSubmitted ? (
          <Animated.View entering={FadeInDown}>
            <HeroTitle style={{ textTransform: isArabic ? "none" : "uppercase", marginBottom: 12, textAlign: isArabic ? "right" : "left" }}>
              {isArabic ? "إعادة تعيين كلمة المرور" : "Reset password"}
            </HeroTitle>
            <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ lineHeight: 22, marginBottom: 40, textAlign: isArabic ? "right" : "left" }}>
              {isArabic
                ? "أدخل البريد الإلكتروني المرتبط بحسابك في SYNK. سنرسل لك رابط إعادة التعيين."
                : "Enter the email associated with your SYNK account. We'll send you a reset link."}
            </AppText>

            <View style={{ gap: 6, marginBottom: 24 }}>
              <View style={{ backgroundColor: colors.canvas, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 1, borderColor: error ? colors.semanticRed : colors.hairline }}>
                <AppText className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 10, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, marginBottom: 2, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                  {isArabic ? "البريد الإلكتروني" : "Email Address"}
                </AppText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={colors.inkMuted48}
                  style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: "Inter_600SemiBold", padding: 0, textAlign: isArabic ? "right" : "left" }}
                />
              </View>
              {error ? (
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, paddingHorizontal: 4 }}>
                  <AlertCircle size={12} color={colors.semanticRed} />
                  <AppText style={{ color: colors.semanticRed, fontSize: 11, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase" }}>{error}</AppText>
                </View>
              ) : null}
            </View>

            <Btn variant="primary" fullWidth onPress={handleSubmit} label={isArabic ? "أرسل رابط إعادة التعيين" : "Send reset link"} />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown} style={{ alignItems: "center", paddingTop: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
              <CheckCircle size={40} color={colors.primary} />
            </View>
            <ScreenTitle style={{ textTransform: isArabic ? "none" : "uppercase", marginBottom: 16, textAlign: "center" }}>
              {isArabic ? "تحقق من بريدك" : "Check your inbox"}
            </ScreenTitle>
            <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ lineHeight: 22, marginBottom: 40, textAlign: "center" }}>
              {isArabic ? "إذا كان الحساب موجوداً، أرسلنا لك رابط لإعادة تعيين كلمة المرور." : "If an account exists, we sent you a link to reset your password."}
            </AppText>
            <AppText className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 12, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, marginBottom: 16 }}>
              {isArabic ? "لم تستلمه؟" : "Didn't receive it?"}
            </AppText>
            <Pressable onPress={() => countdown <= 0 && setCountdown(30)} disabled={countdown > 0}>
              <AppText style={{ fontSize: 12, fontWeight: "600", letterSpacing: 2, textTransform: isArabic ? "none" : "uppercase", color: countdown > 0 ? colors.inkMuted48 : colors.primary }}>
                {countdown > 0
                  ? isArabic ? `إرسال مرة أخرى خلال ${countdown} ثانية` : `Send again in ${countdown}s`
                  : isArabic ? "إرسال مرة أخرى" : "Send again"}
              </AppText>
            </Pressable>
            <View style={{ marginTop: 64, width: "100%" }}>
              <Btn variant="secondary" fullWidth onPress={() => router.replace("/login")} label={isArabic ? "العودة لتسجيل الدخول" : "Back to Login"} />
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
