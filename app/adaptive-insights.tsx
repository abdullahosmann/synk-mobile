/**
 * AdaptiveInsights — RN port of src/screens/main/AdaptiveInsights.tsx.
 *
 * Detail view for one coach adaptation (passed as a JSON route param):
 * "what happened", an expandable "signals I used", before/after change cards,
 * the coach message, and Understood / Keep-Original (revert) actions. Premium-
 * gated content shows a locked upsell for free users.
 *
 * Web→RN: location.state.adaptation → JSON route param; subscriptionStatus ===
 * "active" gate → subscriptionTier !== "free" (mobile has no subscriptionStatus,
 * matching CoachChat); AnimatePresence height anim → conditional render; revert
 * modal → the ported BottomSheet. Object Pressable styles (css-interop bug).
 */
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChevronRight,
  CloudRain,
  History,
  Info,
  MoreVertical,
  Moon,
  Settings,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useToast } from "../src/components/ToastProvider";
import { useColors } from "../src/theme/ThemeProvider";
import { withAlpha } from "../src/theme/tint";
import { AppText } from "../src/components/ui/Typography";
import CoachAvatar from "../src/components/CoachAvatar";
import EmptyState from "../src/components/EmptyState";
import BottomSheet from "../src/components/BottomSheet";
import { COACHES } from "../src/constants";
import { Adaptation, AdaptationChange } from "../src/types";

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function AdaptiveInsights() {
  const router = useRouter();
  const params = useLocalSearchParams<{ adaptation?: string }>();
  const { user, pendingAdaptations, setPendingAdaptations, archiveAdaptation, todaysLogs } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const adaptation = React.useMemo<Adaptation | undefined>(() => {
    if (!params.adaptation) return undefined;
    try {
      return JSON.parse(params.adaptation) as Adaptation;
    } catch {
      return undefined;
    }
  }, [params.adaptation]);

  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [signalsExpanded, setSignalsExpanded] = useState(false);

  useEffect(() => {
    if (!adaptation) return;
    const stillPending = pendingAdaptations.some((a) =>
      a.id ? a.id === adaptation.id : a.type === adaptation.type && a.title === adaptation.title,
    );
    if (stillPending) {
      archiveAdaptation(adaptation, "viewed");
      setPendingAdaptations(
        pendingAdaptations.filter((a) =>
          a.id ? a.id !== adaptation.id : !(a.type === adaptation.type && a.title === adaptation.title),
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adaptation]);

  const getSignals = (): { label: string; value: string }[] => {
    if (!adaptation) return [];
    const mci = todaysLogs?.morningCheckIn;
    switch (adaptation.type) {
      case "sleep":
        return [
          { label: isArabic ? "النوم" : "Sleep", value: mci?.hoursSlept ? `${mci.hoursSlept} hrs` : "—" },
          { label: isArabic ? "الجودة" : "Quality", value: mci?.sleepQuality ? `${mci.sleepQuality}/4` : "—" },
        ];
      case "volume":
        return [
          { label: isArabic ? "متوسط RPE أمس" : "Avg RPE yesterday", value: "—" },
          { label: isArabic ? "مجموع المجموعات هذا الأسبوع" : "Total sets this week", value: "—" },
        ];
      case "calorie_overflow":
        return [
          { label: isArabic ? "السعرات اليوم مقابل الهدف" : "Calories today vs target", value: "—" },
          { label: isArabic ? "توزيع الماكروز" : "Macros breakdown", value: "—" },
        ];
      case "mood_low":
        return [
          { label: isArabic ? "المزاج اليوم" : "Today's mood", value: mci?.moodLabel || "—" },
          { label: isArabic ? "مستوى الطاقة" : "Energy level", value: mci?.energy ? `${mci.energy}/3` : "—" },
        ];
      case "plan_customized":
        return [
          { label: isArabic ? "تعديلك" : "Your edit", value: "—" },
          { label: isArabic ? "تاريخ التطبيق" : "Date applied", value: "—" },
        ];
      case "pr_detected":
        return [
          { label: isArabic ? "أفضل رقم سابق" : "Previous best", value: "—" },
          { label: isArabic ? "أفضل رقم جديد" : "New best", value: "—" },
          { label: isArabic ? "التاريخ" : "Date", value: "—" },
        ];
      case "missed_workout":
        return [
          { label: isArabic ? "التمرين الأخير" : "Last workout", value: "—" },
          { label: isArabic ? "أيام منذ" : "Days since", value: "—" },
        ];
      default:
        return [];
    }
  };

  const getTypeIcon = (type: Adaptation["type"]) => {
    const c = colors.primary;
    switch (type) {
      case "sleep":
        return <Moon size={140} fill={c} color={c} />;
      case "volume":
      case "pr_detected":
        return <TrendingUp size={140} strokeWidth={1} color={c} />;
      case "calorie_overflow":
        return <Utensils size={140} color={c} />;
      case "mood_low":
        return <CloudRain size={140} color={c} />;
      case "plan_customized":
      case "missed_workout":
        return <Settings size={140} color={c} />;
      default:
        return <Sparkles size={140} color={c} />;
    }
  };

  // ---- No adaptation: missing state ----
  if (!adaptation) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 12,
            paddingHorizontal: 24,
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: colors.hairline,
          }}
        >
          <Pressable
            onPress={() => router.push("/dashboard")}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Pressable>
          <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, fontFamily: fontFamily(isArabic, 600) }}>
            {isArabic ? "رؤية مفقودة" : "Insight Missing"}
          </AppText>
          <View style={{ width: 44 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <EmptyState
            icon={<Info />}
            title={isArabic ? "لم يتم العثور على التعديل" : "Adaptation not found"}
            body={isArabic ? "عذراً، لم نتمكن من العثور على بيانات هذا التعديل." : "Sorry, we couldn't find the data for this adaptation."}
          />
        </View>
      </View>
    );
  }

  const handleUnderstood = () => {
    setPendingAdaptations(pendingAdaptations.filter((a) => a.id !== adaptation.id));
    router.back();
  };

  const handleRevert = () => {
    setPendingAdaptations(pendingAdaptations.filter((a) => a.id !== adaptation.id));
    showToast(isArabic ? "تمت العودة للخطة الأصلية" : "Reverted to original plan", "success");
    setIsRevertModalOpen(false);
    router.back();
  };

  const originalPlans = Array.isArray(adaptation.originalPlan)
    ? adaptation.originalPlan
    : adaptation.originalPlan
      ? [adaptation.originalPlan]
      : [];
  const adaptedPlans = Array.isArray(adaptation.adaptedPlan)
    ? adaptation.adaptedPlan
    : adaptation.adaptedPlan
      ? [adaptation.adaptedPlan]
      : [];

  const renderChangeCard = (change: AdaptationChange, isOriginal: boolean) => (
    <View
      key={change.label + change.headline}
      style={{
        backgroundColor: isOriginal ? colors.canvasParchment : colors.canvas,
        opacity: isOriginal ? 0.6 : 1,
        borderWidth: 1,
        borderColor: isOriginal ? colors.hairline : withAlpha(colors.primary, 0.2),
        borderRadius: 14,
        padding: 24,
        height: 160,
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      {!isOriginal && (
        <View style={{ position: "absolute", top: 24, [isArabic ? "left" : "right"]: 24 }}>
          <Sparkles size={24} fill={colors.primary} strokeWidth={0} color={colors.primary} />
        </View>
      )}
      <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {isOriginal && <History size={14} strokeWidth={2.5} color={colors.inkMuted48} />}
          <AppText style={{ fontSize: 10, fontWeight: "600", color: isOriginal ? colors.inkMuted48 : colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
            {isOriginal ? (isArabic ? "الخطة الأصلية" : change.label) : isArabic ? "الخطة المعدلة" : change.label}
          </AppText>
        </View>
        <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, letterSpacing: -0.3, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
          {change.headline}
        </AppText>
      </View>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center" }}>
        <AppText style={{ fontSize: 12, fontWeight: "600", color: isOriginal ? colors.inkMuted48 : colors.primary, textTransform: isArabic ? "none" : "uppercase", fontFamily: fontFamily(isArabic, 600) }}>
          {change.sub}
        </AppText>
      </View>
    </View>
  );

  const sectionLabel = (text: string) => (
    <AppText style={{ fontSize: 12, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 16, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
      {text}
    </AppText>
  );

  const coachName = (() => {
    const coach = COACHES.find((c) => c.id === adaptation.coachId);
    return coach ? (isArabic ? coach.arabicName : coach.name) : adaptation.coachId;
  })();

  const isPremium = user.subscriptionTier !== "free";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 24,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
          backgroundColor: colors.canvasParchment,
          zIndex: 50,
        }}
      >
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16, flex: 1 }}>
          <Pressable
            onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Pressable>
          <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontSize: 10, color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 2, fontFamily: fontFamily(isArabic) }}>
              {isArabic ? "رؤية تكيفية" : "Adaptive Insight"}
            </AppText>
            <AppText numberOfLines={1} style={{ fontSize: 17, fontWeight: "600", color: colors.ink, letterSpacing: -0.3, textTransform: isArabic ? "none" : "uppercase", textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
              {adaptation.title}
            </AppText>
          </View>
        </View>
        <Pressable style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}>
          <MoreVertical size={22} color={colors.inkMuted48} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: insets.bottom + 160, maxWidth: 448, width: "100%", alignSelf: "center" }}
      >
        {/* What happened */}
        <View style={{ marginBottom: 40 }}>
          {sectionLabel(isArabic ? "ماذا حدث" : "What happened")}
          <View style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 24, overflow: "hidden" }}>
            <AppText style={{ fontSize: 17, color: colors.ink, lineHeight: 25, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
              {adaptation.eventText}
            </AppText>
            <View style={{ position: "absolute", bottom: -32, [isArabic ? "left" : "right"]: -24, opacity: 0.03 }}>
              {getTypeIcon(adaptation.type)}
            </View>
          </View>
        </View>

        {isPremium ? (
          <>
            {/* Signals I used */}
            {adaptation.type && getSignals().length > 0 && (
              <View style={{ marginBottom: 40 }}>
                <Pressable
                  onPress={() => setSignalsExpanded(!signalsExpanded)}
                  style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16 }}
                >
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                      <Sparkles size={18} color={colors.primary} />
                      <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: fontFamily(isArabic, 600) }}>
                        {isArabic ? "الإشارات اللي اعتمدت عليها" : "Signals I used"}
                      </AppText>
                    </View>
                    <ChevronRight
                      size={18}
                      color={colors.inkMuted48}
                      style={{ transform: [{ rotate: signalsExpanded ? "90deg" : "0deg" }, { scaleX: isArabic && !signalsExpanded ? -1 : 1 }] }}
                    />
                  </View>

                  {signalsExpanded && (
                    <View style={{ paddingTop: 16, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.hairline, gap: 8 }}>
                      {getSignals().map((signal, idx) => (
                        <View key={idx} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
                          <AppText style={{ fontSize: 11, color: colors.inkMuted48, fontFamily: fontFamily(isArabic) }}>{signal.label}</AppText>
                          <AppText style={{ fontSize: 11, fontWeight: "500", color: colors.ink, opacity: 0.8, fontFamily: fontFamily(isArabic) }}>{signal.value}</AppText>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              </View>
            )}

            {/* What I changed */}
            {(originalPlans.length > 0 || adaptedPlans.length > 0) && (
              <View style={{ marginBottom: 40 }}>
                {sectionLabel(isArabic ? "ماذا غيرت" : "What I changed")}
                <View style={{ gap: 24 }}>
                  {originalPlans.map((orig, i) => (
                    <View key={i} style={{ gap: 12 }}>
                      {renderChangeCard(orig, true)}
                      {adaptedPlans[i] && renderChangeCard(adaptedPlans[i], false)}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Coach message */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 16 }}>
                <CoachAvatar coachId={adaptation.coachId} size={48} grayscale={0} />
                <View style={{ flex: 1, paddingTop: 4, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                  <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: fontFamily(isArabic, 600) }}>
                    {isArabic ? `المدرب ${coachName} يقول:` : `Coach ${coachName} says:`}
                  </AppText>
                  <View
                    style={{
                      backgroundColor: colors.canvas,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      padding: 20,
                      borderRadius: 14,
                      borderTopLeftRadius: isArabic ? 14 : 0,
                      borderTopRightRadius: isArabic ? 0 : 14,
                      alignSelf: "stretch",
                    }}
                  >
                    <AppText style={{ fontSize: 15, color: colors.ink, lineHeight: 22, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                      {adaptation.coachMessage}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={{ marginBottom: 40, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Sparkles size={24} color={colors.primary} />
            </View>
            <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, marginBottom: 8, textAlign: "center", fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "محرك التكيف مقفول" : "Adaptation Engine Locked"}
            </AppText>
            <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginBottom: 24, maxWidth: 240, lineHeight: 18, textAlign: "center", fontFamily: fontFamily(isArabic) }}>
              {isArabic ? "الترقية للبريميوم مطلوبة." : "Upgrade to Premium to unlock insights."}
            </AppText>
            <Pressable
              onPress={() => router.push("/premium")}
              style={{ backgroundColor: colors.primary, height: 44, paddingHorizontal: 24, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}
            >
              <AppText style={{ fontSize: 15, fontWeight: "600", color: "#ffffff", fontFamily: fontFamily(isArabic, 600) }}>
                {isArabic ? "الترقية الآن" : "Unlock Insights"}
              </AppText>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          paddingBottom: insets.bottom + 16,
          backgroundColor: colors.canvasParchment,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          zIndex: 50,
        }}
      >
        <View style={{ maxWidth: 448, width: "100%", alignSelf: "center", gap: 16 }}>
          <Pressable
            onPress={handleUnderstood}
            style={{ width: "100%", height: 52, backgroundColor: colors.primary, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}
          >
            <AppText style={{ fontSize: 17, fontWeight: "600", color: "#ffffff", letterSpacing: -0.2, textTransform: isArabic ? "none" : "uppercase", fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "فهمت" : "Understood"}
            </AppText>
          </Pressable>
          <Pressable onPress={() => setIsRevertModalOpen(true)} style={{ alignSelf: "center" }}>
            <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "الاحتفاظ بالأصل" : "Keep Original Plan"}
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* Revert modal */}
      <BottomSheet
        isOpen={isRevertModalOpen}
        onClose={() => setIsRevertModalOpen(false)}
        title={isArabic ? "العودة للخطة الأصلية؟" : "Revert to original plan?"}
      >
        <View style={{ gap: 24, paddingTop: 8, paddingBottom: 8 }}>
          <View style={{ backgroundColor: colors.canvasParchment, padding: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline }}>
            <AppText style={{ fontSize: 15, color: colors.inkMuted48, lineHeight: 22, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
              {isArabic ? "يمكنك إعادة تطبيق هذا التغيير من سجل الخطة." : "You can re-apply this change anytime from Plan History."}
            </AppText>
          </View>
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={handleRevert}
              style={{ width: "100%", height: 52, backgroundColor: colors.ink, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}
            >
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.canvas, fontFamily: fontFamily(isArabic, 600) }}>
                {isArabic ? "نعم، العودة للأصل" : "Yes, Revert to Original"}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setIsRevertModalOpen(false)}
              style={{ width: "100%", height: 52, alignItems: "center", justifyContent: "center" }}
            >
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.inkMuted48, fontFamily: fontFamily(isArabic, 600) }}>
                {isArabic ? "إلغاء" : "Cancel"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
