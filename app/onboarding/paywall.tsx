/**
 * Paywall (onboarding) — RN port of src/screens/onboarding/Paywall.tsx.
 * Gradient header, ratings strip, plan selector (annual/quarterly/monthly with
 * EG vs intl pricing), feature list, and a sticky subscribe footer.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Star, Check } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";
import { AppleBackdrop } from "../../src/components/ui/AppleBackdrop";

export default function Paywall() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isEgypt = user?.country === "EG" || user?.country?.toLowerCase() === "egypt" || !user?.country;
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly" | "quarterly">("annual");

  const plans = {
    annual: {
      id: "annual" as const,
      title: isArabic ? "سنوي" : "Annual",
      price: isEgypt ? (isArabic ? "ج.م ١,٤٩٩ / سنويًا" : "EGP 1,499 / year") : "$89.99 / year",
      originalPrice: isEgypt ? (isArabic ? "ج.م ٢,٣٨٨" : "EGP 2,388") : "$179.88",
      subtitle: isEgypt ? (isArabic ? "ج.م ١٢٥ شهريًا — وفّر ٣٧٪" : "EGP 125 / month — save 37%") : "$7.49 / month — save 50%",
      badge: isArabic ? "أفضل قيمة" : "BEST VALUE",
      cta: isEgypt ? (isArabic ? "ج.م ١,٤٩٩ سنويًا" : "EGP 1,499 / year") : "$89.99 / year",
    },
    monthly: {
      id: "monthly" as const,
      title: isArabic ? "شهري" : "Monthly",
      price: isEgypt ? (isArabic ? "ج.م ١٩٩ / شهريًا" : "EGP 199 / month") : "$14.99 / month",
      originalPrice: undefined as string | undefined,
      subtitle: isArabic ? "تقدر تلغي في أي وقت" : "Cancel anytime",
      badge: undefined as string | undefined,
      cta: isEgypt ? (isArabic ? "ج.م ١٩٩ شهريًا" : "EGP 199 / month") : "$14.99 / month",
    },
    quarterly: {
      id: "quarterly" as const,
      title: isArabic ? "٣ شهور" : "3 months",
      price: isEgypt ? (isArabic ? "ج.م ٤٩٩ / ٣ شهور" : "EGP 499 / 3 months") : "$39.99 / 3 months",
      originalPrice: undefined as string | undefined,
      subtitle: isEgypt ? (isArabic ? "ج.م ١٦٦ شهريًا" : "EGP 166 / month") : "$13.33 / month",
      badge: undefined as string | undefined,
      cta: isEgypt ? (isArabic ? "ج.م ٤٩٩ / ٣ شهور" : "EGP 499 / 3 months") : "$39.99 / 3 months",
    },
  };

  const features = isArabic
    ? [
        "الخطة بتتأقلم مع حياتك — رمضان، سفر، إصابات",
        "صوت مدرب مصري — خالد، نور، عمر، سارة",
        "نصايح شكل وأداء وانت بتمرّن",
        "متابعة تقدمك بذكاء — متعلقش في مكانك",
        "افتح الكوميونيتي والتحديات وترتيب الأرقام القياسية",
        "تقدر تلغي من الإعدادات بضغطتين",
      ]
    : [
        "Plan adapts to your life — Ramadan, travel, injuries",
        "Egyptian Arabic coach voice — Khaled, Nour, Omar, Sara",
        "Real-time form tips during every set",
        "Smart progress tracking — never plateau",
        "Unlock community, challenges, and PR leaderboards",
        "Cancel from Settings in 2 taps",
      ];

  const handleSubscribe = () => {
    setUser((prev: any) => ({ ...prev, subscriptionStatus: "active", subscriptionTier: selectedPlan }));
    router.replace("/dashboard");
  };
  const handleRestore = () => {
    setUser((prev: any) => ({ ...prev, subscriptionStatus: "active", subscriptionTier: "monthly" }));
    router.replace("/dashboard");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* progress bar */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: "rgba(0,0,0,0.1)", zIndex: 60 }}>
        <View style={{ width: "100%", height: "100%", backgroundColor: colors.primary }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 180 }}>
        {/* Gradient header */}
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={{ paddingTop: insets.top + 32, paddingBottom: 32, paddingHorizontal: 24, alignItems: "center" }}
        >
          <AppText style={{ fontSize: 28, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 8, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
            {isArabic ? "خطتك جاهزة." : "Your plan is ready."}
          </AppText>
          <AppText style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", textAlign: "center", maxWidth: 260 }}>
            {isArabic ? "اتعملت ليك انت بالذات. افتح اشتراكك وابدأ." : "Built specifically for you. Unlock to start."}
          </AppText>
        </LinearGradient>

        {/* Ratings */}
        <View style={{ backgroundColor: colors.canvas, paddingVertical: 16, paddingHorizontal: 24, alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 4 }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} color="#fbbf24" fill="#fbbf24" />
            ))}
            <AppText variant="caption-strong" style={{ marginLeft: 8 }}>
              {isArabic ? "٤.٩ · +١٢,٠٠٠ تقييم" : "4.9 · 12,000+ ratings"}
            </AppText>
          </View>
          <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48">
            {isArabic ? "بيستخدمها لاعبين في كل مصر والعالم العربي" : "Trusted by lifters across Egypt and the Arab world"}
          </AppText>
        </View>

        {/* Plans */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 12 }}>
          {(Object.values(plans) as (typeof plans)[keyof typeof plans][]).map((plan) => {
            const sel = selectedPlan === plan.id;
            return (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedPlan(plan.id)}
                style={{
                  backgroundColor: colors.canvas,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 2,
                  borderColor: sel ? colors.primary : colors.hairline,
                  marginTop: plan.badge ? 8 : 0,
                }}
              >
                {plan.badge && (
                  <View style={{ position: "absolute", top: -12, left: isArabic ? undefined : 16, right: isArabic ? 16 : undefined, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 }}>
                    <AppText style={{ color: "#fff", fontSize: 10, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5 }}>
                      {plan.badge}
                    </AppText>
                  </View>
                )}
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: sel ? colors.primary : "rgba(29,29,31,0.2)", alignItems: "center", justifyContent: "center" }}>
                      {sel && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                    </View>
                    <AppText variant="title" style={{ color: colors.ink, fontSize: 17 }}>{plan.title}</AppText>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {plan.originalPrice && (
                      <AppText style={{ fontSize: 12, color: colors.inkMuted48, textDecorationLine: "line-through" }}>{plan.originalPrice}</AppText>
                    )}
                    <AppText variant="body-strong" style={{ color: colors.ink }}>{plan.price.split(" / ")[0]}</AppText>
                  </View>
                </View>
                <AppText style={{ fontSize: 13, fontWeight: "500", marginTop: 4, marginLeft: isArabic ? 0 : 32, marginRight: isArabic ? 32 : 0, color: sel ? colors.primary : colors.inkMuted48, textAlign: isArabic ? "right" : "left" }}>
                  {plan.subtitle}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Features */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
          <AppText variant="title" style={{ color: colors.ink, fontSize: 17, marginBottom: 16, textAlign: isArabic ? "right" : "left" }}>
            {isArabic ? "كل ده مفتوح ليك" : "Everything included"}
          </AppText>
          <View style={{ gap: 12 }}>
            {features.map((f, i) => (
              <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
                <View style={{ marginTop: 2, backgroundColor: "rgba(0,102,204,0.1)", borderRadius: 9999, padding: 2 }}>
                  <Check size={14} color={colors.primary} />
                </View>
                <AppText variant="body" style={{ color: colors.ink, flex: 1, lineHeight: 20, textAlign: isArabic ? "right" : "left" }}>
                  {f}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <AppleBackdrop style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.hairline, paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 16 }}>
        <Btn variant="primary" fullWidth onPress={handleSubscribe} style={{ height: 54, borderRadius: 16 }}>
          <AppText style={{ color: "#fff", fontSize: 17, fontWeight: "700", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
            {isArabic ? `ابدأ خطتي — ${plans[selectedPlan].cta}` : `Start my plan — ${plans[selectedPlan].cta}`}
          </AppText>
        </Btn>
        <View style={{ alignItems: "center", marginTop: 16, gap: 12 }}>
          <AppText onPress={handleRestore} style={{ color: colors.primary, fontSize: 13, fontWeight: "500" }}>
            {isArabic ? "استرجاع المشتريات" : "Restore purchases"}
          </AppText>
          <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: "center", maxWidth: 280, lineHeight: 16 }}>
            {isArabic
              ? "الاشتراك بيتجدد تلقائيًا. تقدر تلغي في أي وقت من الإعدادات."
              : "Subscription renews automatically. Cancel anytime in Settings."}
          </AppText>
        </View>
      </AppleBackdrop>
    </View>
  );
}
