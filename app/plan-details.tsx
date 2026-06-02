/**
 * PlanDetails — RN port of src/screens/main/PlanDetails.tsx.
 *
 * Read-only overview of the active coach plan: coach summary, a 2×2 metadata
 * grid, an "Edit Plan Settings" CTA, a horizontally-scrolling week-progress
 * carousel (tap → /plan/week/[n]), and a plan-history list (tap → adaptive
 * insights). All data is the same mock the web screen ships.
 *
 * Web→RN: motion list-stagger dropped (static); navigate('/profile') →
 * router.push('/me'); horizontal snap scroll → ScrollView horizontal.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Settings,
  SignalHigh,
  Sparkles,
} from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useColors } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";
import CoachAvatar from "../src/components/CoachAvatar";
import EmptyState from "../src/components/EmptyState";

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

type WeekStatus = "completed" | "ongoing" | "upcoming";

export default function PlanDetails() {
  const router = useRouter();
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const [showAllHistory, setShowAllHistory] = useState(false);

  const weeks: { number: number; status: WeekStatus; completion: boolean[] }[] = [
    { number: 1, status: "completed", completion: [true, true, true, true, true, true, true] },
    { number: 2, status: "ongoing", completion: [true, true, false, false, false, false, false] },
    { number: 3, status: "upcoming", completion: [false, false, false, false, false, false, false] },
    { number: 4, status: "upcoming", completion: [false, false, false, false, false, false, false] },
  ];

  const planHistory = [
    { id: "1", date: isArabic ? "١٢ مارس" : "Mar 12", summary: "Increased weight targets based on your last sessions.", summaryAr: "تم زيادة أهداف الوزن بناءً على جلساتك الأخيرة." },
    { id: "2", date: isArabic ? "١٠ مارس" : "Mar 10", summary: "Adjusted rest periods to improve recovery.", summaryAr: "تم تعديل فترات الراحة لتحسين الاستشفاء." },
    { id: "3", date: isArabic ? "٠٨ مارس" : "Mar 08", summary: "Rescheduled leg day due to your feedback.", summaryAr: "تمت إعادة جدولة يوم الأرجل بناءً على ملاحظاتك." },
  ];

  // C3 — derive the grid from the user's actual plan settings so it can't
  // contradict Plan Settings (was hardcoded "1 workout / Gym / 40 min / Advanced").
  const days = user.daysPerWeek || 3;
  const locationLabel = (() => {
    const map: Record<string, { en: string; ar: string }> = {
      gym: { en: "Full gym", ar: "جيم كامل" },
      "home-equipment": { en: "Home (equipped)", ar: "بيت بمعدات" },
      "home-no-equipment": { en: "Home (no equipment)", ar: "بيت بدون معدات" },
      outdoor: { en: "Outdoor", ar: "في الخلاء" },
    };
    const m = map[(user.trainingLocation as string) || "gym"] || map.gym;
    return isArabic ? m.ar : m.en;
  })();
  const levelLabel = (() => {
    const map: Record<string, { en: string; ar: string }> = {
      beginner: { en: "Beginner", ar: "مبتدئ" },
      intermediate: { en: "Intermediate", ar: "متوسط" },
      advanced: { en: "Advanced", ar: "متقدم" },
    };
    const m = user.fitnessLevel ? map[user.fitnessLevel] : null;
    return m ? (isArabic ? m.ar : m.en) : isArabic ? "غير محدد" : "Not set";
  })();
  const metadata = [
    { icon: Calendar, label: isArabic ? "أسبوعياً" : "Per week", value: isArabic ? `${days} أيام` : `${days} ${days === 1 ? "day" : "days"}` },
    { icon: MapPin, label: isArabic ? "الموقع" : "Location", value: locationLabel },
    { icon: Clock, label: isArabic ? "المدة" : "Duration", value: isArabic ? `${user.workoutDuration || 45} دقيقة` : `${user.workoutDuration || 45} min` },
    { icon: SignalHigh, label: isArabic ? "المستوى" : "Level", value: levelLabel },
  ];

  const dayLabels = isArabic ? ["أح", "اث", "ثل", "أر", "خم", "جم", "سب"] : ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  const sectionLabel = (text: string) => (
    <AppText
      style={{
        fontSize: 11,
        fontWeight: "600",
        color: colors.inkMuted48,
        textTransform: isArabic ? "none" : "uppercase",
        letterSpacing: 1,
        fontFamily: fontFamily(isArabic, 600),
      }}
    >
      {text}
    </AppText>
  );

  const statusBadge = (status: WeekStatus) => {
    if (status === "ongoing") {
      return (
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
            {isArabic ? "تعديل" : "Edit"}
          </AppText>
          <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </View>
      );
    }
    if (status === "completed") {
      return <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />;
    }
    return (
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
        <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
          {isArabic ? "تعديل" : "Edit"}
        </AppText>
        <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.canvasParchment,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
          zIndex: 50,
        }}
      >
        <Pressable
          onPress={() => router.push("/me")}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={20} strokeWidth={2.5} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
          {isArabic ? "خطة التمرين" : "Workout Plan"}
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 48, maxWidth: 448, width: "100%", alignSelf: "center" }}
      >
        {/* Coach summary */}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 16, marginBottom: 32, paddingHorizontal: 24 }}>
          <CoachAvatar coachId={user.coach || "khaled"} size={48} verified grayscale={0} />
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "تفاصيل الخطة" : "PLAN DETAILS"}
            </AppText>
            <AppText style={{ fontSize: 15, color: colors.ink, lineHeight: 21, marginTop: 4, opacity: 0.8, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
              {isArabic
                ? "انطلق في رحلة لإنقاص الوزن مصممة بدقة لتناسب ملفك الشخصي ومستوى لياقتك الحالي."
                : "Embark on a weight loss journey meticulously designed for your profile and fitness level."}
            </AppText>
          </View>
        </View>

        {/* Metadata grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32, paddingHorizontal: 24 }}>
          {metadata.map((item, i) => {
            const Icon = item.icon;
            return (
              <View
                key={i}
                style={{
                  width: "47.8%",
                  backgroundColor: colors.canvas,
                  padding: 20,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  alignItems: isArabic ? "flex-end" : "flex-start",
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={24} color={colors.primary} />
                </View>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
                  {item.label}
                </AppText>
                <AppText style={{ fontSize: 22, fontWeight: "600", color: colors.ink, marginTop: 2, fontFamily: fontFamily(isArabic, 600) }}>
                  {item.value}
                </AppText>
              </View>
            );
          })}
        </View>

        {/* Edit settings */}
        <View style={{ paddingHorizontal: 24, marginBottom: 48 }}>
          <Pressable
            onPress={() => router.push("/settings/plan")}
            style={{
              height: 44,
              backgroundColor: colors.surfacePearl,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 9999,
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Settings size={18} color={colors.primary} />
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "تعديل إعدادات الخطة" : "Edit Plan Settings"}
            </AppText>
          </Pressable>
        </View>

        {/* Plan progress */}
        <View style={{ marginBottom: 48 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingHorizontal: 24 }}>
            {sectionLabel(isArabic ? "تقدم الخطة" : "PLAN PROGRESS")}
            <Pressable onPress={() => router.push("/history")}>
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, fontFamily: fontFamily(isArabic, 600) }}>
                {isArabic ? "عرض الكل" : "View all"}
              </AppText>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingHorizontal: 24, flexDirection: isArabic ? "row-reverse" : "row" }}
          >
            {weeks.map((week, idx) => (
              <Pressable
                key={idx}
                onPress={() => router.push(`/plan/week/${week.number}`)}
                style={{
                  width: 300,
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: 14,
                  padding: 24,
                }}
              >
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: fontFamily(isArabic, 600) }}>
                      {isArabic ? `الأسبوع ${week.number}` : `WEEK ${week.number}`}
                    </AppText>
                    <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, opacity: 0.4, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, marginTop: 2, fontFamily: fontFamily(isArabic, 600) }}>
                      {week.status === "completed" ? (isArabic ? "مكتمل" : "Completed") : week.status === "ongoing" ? (isArabic ? "قيد التنفيذ" : "Ongoing") : isArabic ? "قادم" : "Upcoming"}
                    </AppText>
                  </View>
                  {statusBadge(week.status)}
                </View>

                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
                  {dayLabels.map((day, i) => (
                    <View key={i} style={{ flex: 1, alignItems: "center", gap: 8 }}>
                      <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", fontFamily: fontFamily(isArabic, 600) }}>
                        {day}
                      </AppText>
                      <View
                        style={{
                          width: "100%",
                          aspectRatio: 1,
                          borderRadius: 8,
                          borderWidth: 1,
                          ...(week.completion[i]
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { borderStyle: "dashed", borderColor: colors.hairline }),
                        }}
                      />
                    </View>
                  ))}
                </View>

                {week.status === "upcoming" && (
                  <View style={{ marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                    <View style={{ opacity: 0.4 }}>
                      <CoachAvatar coachId={user.coach || "khaled"} size={32} grayscale={1} />
                    </View>
                    <AppText style={{ flex: 1, fontSize: 12, color: colors.inkMuted48, fontStyle: "italic", lineHeight: 16, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                      {isArabic ? "سأقوم بضبط هذا الأسبوع بناءً على أدائك." : "I'll adjust this week based on your performance."}
                    </AppText>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Plan history */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            {sectionLabel(isArabic ? "سجل الخطة" : "PLAN HISTORY")}
            {planHistory.length > 5 && (
              <Pressable onPress={() => setShowAllHistory(!showAllHistory)}>
                <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: fontFamily(isArabic, 600) }}>
                  {showAllHistory ? (isArabic ? "عرض أقل" : "Show less") : isArabic ? "عرض الكل" : "View all"}
                </AppText>
              </Pressable>
            )}
          </View>

          <View style={{ gap: 12 }}>
            {planHistory.length > 0 ? (
              (showAllHistory ? planHistory : planHistory.slice(0, 5)).map((entry) => (
                <Pressable
                  key={entry.id}
                  onPress={() => router.push({ pathname: "/adaptive-insights", params: { adaptation: JSON.stringify(entry) } })}
                  style={{
                    backgroundColor: colors.canvas,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    borderRadius: 14,
                    padding: 16,
                    flexDirection: isArabic ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <View style={{ minWidth: 50, paddingVertical: 4, backgroundColor: colors.canvasParchment, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: fontFamily(isArabic, 600) }}>
                      {entry.date.split(" ")[0]}
                    </AppText>
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: fontFamily(isArabic, 600) }}>
                      {entry.date.split(" ")[1]}
                    </AppText>
                  </View>

                  <View style={{ flex: 1, gap: 4, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                      <CoachAvatar coachId={user.coach || "khaled"} size={24} grayscale={0} />
                      <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: fontFamily(isArabic, 600) }}>
                        {isArabic ? "تعديل ذكي" : "SMART ADAPTATION"}
                      </AppText>
                    </View>
                    <AppText numberOfLines={2} style={{ fontSize: 13, color: colors.ink, lineHeight: 18, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                      {isArabic ? entry.summaryAr : entry.summary}
                    </AppText>
                  </View>

                  <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
                </Pressable>
              ))
            ) : (
              <View style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 32 }}>
                <EmptyState
                  icon={<Sparkles />}
                  title={isArabic ? "لا توجد تعديلات بعد — ستتطور خطتك مع تدريبك." : "No adaptations yet — your plan will evolve as you train."}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
