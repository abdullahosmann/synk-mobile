/**
 * Paywall — RN port of src/screens/main/Paywall.tsx (route /premium).
 *
 * Premium upsell: billing toggle (monthly/annual), founding-member banner,
 * Pro + Elite tier cards (selectable, with feature lists & badges), a free-
 * trial CTA, and Restore/Terms/Privacy footer links. Same copy/prices as web.
 *
 * Web→RN: motion scale on select → static border/scale via style; navigate →
 * router.push; all Pressables use object styles (css-interop drops function
 * styles — see RESUME.md).
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Sparkles, Star, X } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useToast } from "../src/components/ToastProvider";
import { useColors, useTheme } from "../src/theme/ThemeProvider";
import { withAlpha } from "../src/theme/tint";
import { AppText } from "../src/components/ui/Typography";

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

type EliteFeature = string | { text: string; badge: string };

export default function Paywall() {
  const router = useRouter();
  const { user, setIsPremium } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const softFill = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [selectedTier, setSelectedTier] = useState<"pro" | "elite">("pro");

  const handleSubscribe = () => {
    setIsPremium(true);
    showToast(isArabic ? "مرحباً بك في SYNK Premium" : "Welcome to SYNK Premium", "success");
    router.push("/dashboard");
  };

  const proFeatures = [
    isArabic ? "تسجيل صوتي غير محدود (عربي + إنجليزي)" : "Unlimited voice logging (Arabic + English)",
    isArabic ? "التعرف على الطعام من الصور" : "Food photo recognition",
    isArabic ? "تعديل الخطة الفوري في نفس اليوم" : "Real-time same-day plan adaptation",
    isArabic ? "تكامل واتساب" : "WhatsApp integration",
    isArabic ? "تخطيط وجبات ذكي" : "Smart meal planning",
    isArabic ? "بدون إعلانات في أي مكان" : "No ads anywhere in app",
  ];

  const eliteFeatures: EliteFeature[] = [
    isArabic ? "جميع ميزات Pro" : "All Pro features",
    { text: isArabic ? "إسقاط شكل الجسم المستقبلي" : "Future Self body projection", badge: "Wave 2" },
    { text: isArabic ? "تدريب عقلي يومي بالعربي" : "Daily Arabic mindset coaching", badge: "Wave 3" },
    isArabic ? "وضع رمضان + التكيف مع أحداث الحياة" : "Ramadan mode + life event adaptation",
    isArabic ? "دعم الأولوية" : "Priority support",
    isArabic ? "وصول مبكر للميزات الجديدة" : "Early access to new features",
  ];

  const prices = {
    pro: { monthly: "149", annual: "1,290", annualMonthly: "107" },
    elite: { monthly: "199", annual: "1,720", annualMonthly: "143" },
  };

  const billingToggleBtn = (period: "monthly" | "annual", label: string) => {
    const active = billingPeriod === period;
    return (
      <Pressable
        onPress={() => setBillingPeriod(period)}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 9999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active ? colors.canvas : "transparent",
        }}
      >
        <AppText style={{ fontSize: 12, fontWeight: "600", color: active ? colors.primary : colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: fontFamily(isArabic, 600) }}>
          {label}
        </AppText>
      </Pressable>
    );
  };

  const priceBlock = (tier: "pro" | "elite") => (
    <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "baseline", gap: 4 }}>
        <AppText style={{ fontSize: 30, fontWeight: "600", color: colors.ink, letterSpacing: -1, fontFamily: fontFamily(isArabic, 600) }}>
          {isArabic ? "ج.م " : "EGP "}
          {billingPeriod === "monthly" ? prices[tier].monthly : prices[tier].annual}
        </AppText>
        <AppText style={{ fontSize: 14, color: colors.inkMuted48, fontFamily: fontFamily(isArabic) }}>
          /{billingPeriod === "monthly" ? (isArabic ? "شهر" : "month") : isArabic ? "سنة" : "year"}
        </AppText>
      </View>
      {billingPeriod === "annual" && (
        <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, marginTop: 4, fontFamily: fontFamily(isArabic, 600) }}>
          {isArabic ? `تقريباً ${prices[tier].annualMonthly} ج.م / شهر` : `≈ EGP ${prices[tier].annualMonthly}/month`}
        </AppText>
      )}
    </View>
  );

  const footerLink = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress}>
      <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: fontFamily(isArabic, 600) }}>
        {label}
      </AppText>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 16,
          paddingHorizontal: 24,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.canvasParchment,
          zIndex: 50,
        }}
      >
        <Pressable
          onPress={() => router.push("/dashboard")}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}
        >
          <X size={20} strokeWidth={2.5} color={colors.ink} />
        </Pressable>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <Star size={12} fill="#ffffff" strokeWidth={0} color="#ffffff" />
          </View>
          <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 2, fontStyle: "italic", fontFamily: fontFamily(isArabic, 600) }}>
            {isArabic ? "سينك بريميوم" : "SYNK Premium"}
          </AppText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 40, paddingHorizontal: 24, maxWidth: 448, width: "100%", alignSelf: "center", alignItems: "center" }}
      >
        {/* Hero */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <AppText style={{ fontSize: 30, fontWeight: "600", color: colors.ink, letterSpacing: -0.5, textTransform: isArabic ? "none" : "uppercase", lineHeight: 34, marginBottom: 12, textAlign: "center", fontFamily: fontFamily(isArabic, 600) }}>
            {isArabic ? "أطلق إمكانياتك الكاملة" : "Unlock Potential"}
          </AppText>
          <AppText style={{ fontSize: 15, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, textAlign: "center", fontFamily: fontFamily(isArabic) }}>
            {isArabic ? "انضم لمجتمع SYNK المتميز" : "Join the SYNK community"}
          </AppText>
        </View>

        {/* Billing toggle */}
        <View style={{ width: "100%", maxWidth: 280, backgroundColor: softFill, padding: 4, borderRadius: 9999, flexDirection: isArabic ? "row-reverse" : "row", marginBottom: 40, borderWidth: 1, borderColor: colors.hairline }}>
          {billingToggleBtn("monthly", isArabic ? "شهري" : "Monthly")}
          {billingToggleBtn("annual", isArabic ? "سنوي" : "Annual")}
        </View>

        {/* Founding member banner */}
        <View style={{ width: "100%", backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 20, marginBottom: 32, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 16 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
            <Star size={20} fill={colors.primary} color={colors.primary} />
          </View>
          <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, lineHeight: 18, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "سعر العضو المؤسس — مقفل للأبد." : "Founding member pricing — locked in forever."}
            </AppText>
            <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
              {isArabic ? "١،٠٠٠ مكان فقط متبقي." : "Only 1,000 spots remaining."}
            </AppText>
          </View>
        </View>

        {/* Tier cards */}
        <View style={{ width: "100%", gap: 20, marginBottom: 48 }}>
          {/* Pro */}
          <Pressable
            onPress={() => setSelectedTier("pro")}
            style={{
              width: "100%",
              backgroundColor: colors.canvas,
              borderRadius: 14,
              padding: 32,
              borderWidth: 2,
              borderColor: selectedTier === "pro" ? colors.primary : colors.hairline,
            }}
          >
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <View>
                <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontFamily: "Inter_600SemiBold" }}>
                  Pro
                </AppText>
                {priceBlock("pro")}
              </View>
              <View style={{ backgroundColor: withAlpha(colors.primary, 0.1), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, borderColor: withAlpha(colors.primary, 0.2) }}>
                <AppText style={{ fontSize: 9, fontWeight: "600", color: colors.primary, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Inter_600SemiBold" }}>
                  FOUNDING
                </AppText>
              </View>
            </View>
            <View style={{ gap: 16, alignItems: isArabic ? "flex-end" : "flex-start" }}>
              {proFeatures.map((feat, i) => (
                <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: softFill, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <Check size={12} strokeWidth={3} color={colors.ink} />
                  </View>
                  <AppText style={{ flex: 1, fontSize: 13, color: colors.ink, opacity: 0.8, lineHeight: 17, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                    {feat}
                  </AppText>
                </View>
              ))}
            </View>
          </Pressable>

          {/* Elite */}
          <View style={{ position: "relative" }}>
            {selectedTier === "elite" && (
              <View style={{ position: "absolute", top: -16, alignSelf: "center", zIndex: 10, backgroundColor: colors.ink, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 9999, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <Sparkles size={12} fill={colors.canvas} color={colors.canvas} />
                <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.canvas, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: fontFamily(isArabic, 600) }}>
                  {isArabic ? "الأفضل للنتائج" : "Best for Results"}
                </AppText>
              </View>
            )}
            <Pressable
              onPress={() => setSelectedTier("elite")}
              style={{
                width: "100%",
                backgroundColor: colors.canvas,
                borderRadius: 14,
                padding: 32,
                borderWidth: 2,
                borderColor: selectedTier === "elite" ? colors.primary : colors.hairline,
              }}
            >
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <View>
                  <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, fontFamily: "Inter_600SemiBold" }}>
                    Elite
                  </AppText>
                  {priceBlock("elite")}
                </View>
                <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}>
                  <AppText style={{ fontSize: 9, fontWeight: "600", color: "#ffffff", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Inter_600SemiBold" }}>
                    GOLD PASS
                  </AppText>
                </View>
              </View>
              <View style={{ gap: 16, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                {eliteFeatures.map((feat, i) => (
                  <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: withAlpha(colors.primary, 0.2), alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <Check size={12} strokeWidth={3} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, lineHeight: 17, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
                        {typeof feat === "string" ? feat : feat.text}
                      </AppText>
                      {typeof feat !== "string" && (
                        <AppText style={{ fontSize: 9, fontWeight: "600", color: colors.primary, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4, opacity: 0.6, fontFamily: "Inter_600SemiBold" }}>
                          {feat.badge}
                        </AppText>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Pressable>
          </View>
        </View>

        {/* Footer actions */}
        <View style={{ width: "100%", gap: 16 }}>
          <Pressable
            onPress={handleSubscribe}
            style={{ width: "100%", height: 64, backgroundColor: colors.primary, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}
          >
            <AppText style={{ fontSize: 17, fontWeight: "600", color: "#ffffff", letterSpacing: 1, textTransform: isArabic ? "none" : "uppercase", fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "ابدأ تجربة مجانية لمدة ٧ أيام" : "Start 7-Day Free Trial"}
            </AppText>
          </Pressable>

          <AppText style={{ fontSize: 10, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, textAlign: "center", paddingHorizontal: 16, lineHeight: 16, opacity: 0.6, fontFamily: fontFamily(isArabic) }}>
            {isArabic
              ? "تبدأ التجربة اليوم. لن يتم تحصيل أي رسوم حتى تنتهي التجربة. يمكنك الإلغاء في أي وقت."
              : "Trial starts today. You won't be charged until trial ends. Cancel anytime in settings."}
          </AppText>

          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "center", gap: 32, paddingTop: 32 }}>
            {footerLink(isArabic ? "استعادة" : "Restore", () => {
              showToast(isArabic ? "بنتحقق من اشتراكاتك السابقة..." : "Checking previous purchases...", "info");
              setTimeout(() => {
                showToast(
                  isArabic ? "مفيش اشتراكات سابقة. لو حصل خطأ، تواصل معانا." : "No previous purchases found. Contact support if you need help.",
                  "info",
                );
              }, 1500);
            })}
            {footerLink(isArabic ? "الشروط" : "Terms", () => router.push("/settings/legal/terms"))}
            {footerLink(isArabic ? "الخصوصية" : "Privacy", () => router.push("/settings/legal/privacy"))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
