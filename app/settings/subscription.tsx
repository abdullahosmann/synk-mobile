/**
 * Subscription — RN port of src/screens/main/Subscription.tsx.
 *
 * Two states:
 *  - isPremium: header + a gradient status card with a "Manage subscription"
 *    button (opens the cancel sheet).
 *  - free/upgrade: hero, feature list, annual/monthly plan selector (annual
 *    shows a SAVE 34% badge), "Start Now" CTA (flips isPremium), and the cancel
 *    sheet.
 *
 * Web→RN: navigate(-1) → router.back(); bg-gradient → expo-linear-gradient;
 * the cancel BottomSheet is shared across both views (the web only rendered it
 * in the free return — including it in premium too makes Manage actually work).
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Check, Sparkles, Crown, Zap } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import BottomSheet from "../../src/components/BottomSheet";
import { useColors } from "../../src/theme/ThemeProvider";
import { withAlpha } from "../../src/theme/tint";
import { AppText } from "../../src/components/ui/Typography";

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

export default function Subscription() {
  const router = useRouter();
  const { user, isPremium, setIsPremium } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";

  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");

  const planPricing = {
    monthly: { price: "149", period: isArabic ? "شهر" : "month", total: isArabic ? "١٤٩ ج.م/شهرياً" : "149 EGP billed monthly" },
    annual: { price: "99", period: isArabic ? "شهر" : "month", total: isArabic ? "١,١٨٨ ج.م/سنوياً" : "1,188 EGP billed yearly" },
  };

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", backgroundColor: colors.canvasParchment, zIndex: 50 }}>
      <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
        <ChevronLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
      </Pressable>
      <AppText style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: colors.ink, marginRight: isArabic ? 0 : 40, marginLeft: isArabic ? 40 : 0, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الاشتراك" : "Subscription"}</AppText>
    </View>
  );

  const cancelSheet = (
    <BottomSheet isOpen={showCancelSheet} onClose={() => setShowCancelSheet(false)} title={isArabic ? "إدارة الاشتراك" : "Manage subscription"}>
      <View style={{ gap: 16, paddingVertical: 8 }}>
        <Pressable onPress={() => { setIsPremium(false); setShowCancelSheet(false); showToast(isArabic ? "تم إلغاء الاشتراك" : "Subscription cancelled", "info"); }} style={{ height: 56, borderRadius: 10, backgroundColor: "rgba(255,59,48,0.1)", alignItems: "center", justifyContent: "center" }}>
          <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.semanticRed, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء الاشتراك" : "Cancel subscription"}</AppText>
        </Pressable>
        <Pressable onPress={() => setShowCancelSheet(false)} style={{ height: 56, borderRadius: 10, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
          <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "رجوع" : "Go back"}</AppText>
        </Pressable>
      </View>
    </BottomSheet>
  );

  // ---- PREMIUM ACTIVE ----
  if (isPremium) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
        {header}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, maxWidth: 448, width: "100%", alignSelf: "center" }}>
          <LinearGradient colors={[colors.primary, "#1d4ed8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 16, padding: 24, overflow: "hidden" }}>
            <View style={{ position: "absolute", top: -32, right: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: "rgba(255,255,255,0.1)" }} />
            <View style={{ position: "absolute", bottom: -40, left: -16, width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.05)" }} />
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Crown size={24} color="#fde047" fill="#fde047" />
              <AppText style={{ fontWeight: "700", fontSize: 18, color: "#fff", fontFamily: ff(isArabic, 700) }}>{isArabic ? "بريميوم" : "Premium"}</AppText>
            </View>
            <AppText style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, marginBottom: 24, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "أنت مشترك في الخطة السنوية" : "You are on the Annual plan"}</AppText>
            <Pressable onPress={() => setShowCancelSheet(true)} style={{ alignSelf: isArabic ? "flex-end" : "flex-start", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 9999, paddingHorizontal: 20, paddingVertical: 8 }}>
              <AppText style={{ fontSize: 14, fontWeight: "600", color: "#fff", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إدارة الاشتراك" : "Manage subscription"}</AppText>
            </Pressable>
          </LinearGradient>
        </View>
        {cancelSheet}
      </View>
    );
  }

  // ---- FREE / UPGRADE ----
  const features = [
    { Icon: Zap, en: "AI-powered workout adjustments", ar: "تعديلات تمارين بالذكاء الاصطناعي" },
    { Icon: Sparkles, en: "Unlimited voice logging", ar: "تسجيل صوتي غير محدود" },
    { Icon: Crown, en: "Advanced analytics & insights", ar: "تحليلات متقدمة ورؤى" },
    { Icon: Check, en: "Priority coach support", ar: "دعم مدرب ذو أولوية" },
  ];

  const planCard = (plan: "annual" | "monthly", title: string, badge?: string) => {
    const selected = selectedPlan === plan;
    const p = planPricing[plan];
    return (
      <Pressable onPress={() => setSelectedPlan(plan)} style={{ borderRadius: 16, borderWidth: 2, padding: 16, borderColor: selected ? colors.primary : colors.hairline, backgroundColor: selected ? withAlpha(colors.primary, 0.05) : "transparent" }}>
        {badge && selected && (
          <View style={{ position: "absolute", top: -10, right: isArabic ? undefined : 16, left: isArabic ? 16 : undefined, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 }}>
            <AppText style={{ color: "#fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>{badge}</AppText>
          </View>
        )}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontWeight: "700", fontSize: 17, color: colors.ink, fontFamily: ff(isArabic, 700) }}>{title}</AppText>
            <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{p.total}</AppText>
          </View>
          <View style={{ alignItems: isArabic ? "flex-start" : "flex-end" }}>
            <AppText style={{ fontSize: 24, fontWeight: "700", color: colors.ink }}>{p.price}</AppText>
            <AppText style={{ fontSize: 12, color: colors.inkMuted48 }}>/{p.period}</AppText>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {header}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: insets.bottom + 32, maxWidth: 448, width: "100%", alignSelf: "center" }}>
        {/* Hero */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <LinearGradient colors={[colors.primary, "#2563eb"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Sparkles size={32} color="#fff" fill="#fff" />
          </LinearGradient>
          <AppText style={{ fontSize: 28, fontWeight: "700", color: colors.ink, marginBottom: 8, textAlign: "center", fontFamily: ff(isArabic, 700) }}>{isArabic ? "افتح كل المميزات" : "Unlock Everything"}</AppText>
          <AppText style={{ fontSize: 15, color: colors.inkMuted48, textAlign: "center", fontFamily: ff(isArabic) }}>{isArabic ? "حقق أهدافك أسرع مع سنك بريميوم" : "Reach your goals faster with SYNK Premium"}</AppText>
        </View>

        {/* Features */}
        <View style={{ gap: 12, marginBottom: 32 }}>
          {features.map((f, i) => (
            <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center" }}>
                <f.Icon size={20} color={colors.primary} />
              </View>
              <AppText style={{ flex: 1, fontSize: 15, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? f.ar : f.en}</AppText>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          {planCard("annual", isArabic ? "سنوي" : "Annual", isArabic ? "وفّر ٣٤٪" : "SAVE 34%")}
          {planCard("monthly", isArabic ? "شهري" : "Monthly")}
        </View>

        {/* CTA */}
        <Pressable onPress={() => { setIsPremium(true); showToast(isArabic ? "مبروك! أنت الآن بريميوم" : "Welcome to Premium!", "success"); }} style={{ height: 56, backgroundColor: colors.primary, borderRadius: 9999, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <AppText style={{ color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: ff(isArabic, 700) }}>{isArabic ? "ابدأ الآن" : "Start Now"}</AppText>
        </Pressable>
        <AppText style={{ textAlign: "center", fontSize: 12, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "يمكنك الإلغاء في أي وقت" : "Cancel anytime"}</AppText>
      </ScrollView>
      {cancelSheet}
    </View>
  );
}
