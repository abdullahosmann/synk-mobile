/**
 * AdaptationHistory — RN port of src/screens/main/AdaptationHistory.tsx.
 *
 * Combined list of pending + archived coach adaptations with all/pending/
 * viewed/dismissed filter tabs and relative-date labels. Tapping a row opens
 * /adaptive-insights with the adaptation as a JSON param.
 *
 * Web→RN: navigate(-1) → router.back(); navigate('/adaptive-insights',{state})
 * → router.push({params}); adaptation.subtitle (absent on the type) → eventText.
 * Object Pressable styles (css-interop drops function styles — see RESUME.md).
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Inbox, Sparkles } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useColors, useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import EmptyState from "../../src/components/EmptyState";
import { Adaptation } from "../../src/types";

type FilterMode = "all" | "pending" | "viewed" | "dismissed";

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function AdaptationHistory() {
  const router = useRouter();
  const { user, adaptationHistory, pendingAdaptations } = useAppContext();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const [filter, setFilter] = useState<FilterMode>("all");

  const allAdaptations = useMemo(() => {
    const pendingAsList: Adaptation[] = pendingAdaptations.map((a) => ({ ...a, status: "pending" as const }));
    return [...pendingAsList, ...adaptationHistory];
  }, [pendingAdaptations, adaptationHistory]);

  const filtered = useMemo(() => {
    if (filter === "all") return allAdaptations;
    return allAdaptations.filter((a) => a.status === filter);
  }, [allAdaptations, filter]);

  const filterTabs: Array<{ id: FilterMode; en: string; ar: string }> = [
    { id: "all", en: "All", ar: "الكل" },
    { id: "pending", en: "Pending", ar: "جديدة" },
    { id: "viewed", en: "Viewed", ar: "مشوفة" },
    { id: "dismissed", en: "Dismissed", ar: "متجاهلة" },
  ];

  const getStatusTag = (status?: Adaptation["status"]): { label: string; bg: string; color: string } | null => {
    if (status === "pending") return { label: isArabic ? "جديدة" : "New", bg: "rgba(0,102,204,0.15)", color: colors.primary };
    if (status === "viewed") return { label: isArabic ? "مشوفة" : "Viewed", bg: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", color: colors.inkMuted48 };
    if (status === "dismissed") return { label: isArabic ? "متجاهلة" : "Dismissed", bg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: colors.inkMuted48 };
    return null;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return isArabic ? "النهارده" : "Today";
    if (diffDays === 1) return isArabic ? "إمبارح" : "Yesterday";
    if (diffDays < 7) return isArabic ? `من ${diffDays} أيام` : `${diffDays} days ago`;
    return d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { day: "numeric", month: "short" });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 8,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.canvasParchment,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, letterSpacing: -0.3, fontFamily: fontFamily(isArabic, 600) }}>
          {isArabic ? "سجل تعديلات الكوتش" : "Coach insights history"}
        </AppText>
      </View>

      {/* Filter tabs */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: isArabic ? "row-reverse" : "row" }}
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setFilter(tab.id)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 9999,
                  backgroundColor: active ? colors.primary : colors.canvas,
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.hairline,
                }}
              >
                <AppText style={{ fontSize: 13, fontWeight: "500", color: active ? "#ffffff" : colors.ink, fontFamily: fontFamily(isArabic, active ? 600 : 400) }}>
                  {isArabic ? tab.ar : tab.en}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: insets.bottom + 40, maxWidth: 448, width: "100%", alignSelf: "center" }}
      >
        {filtered.length === 0 ? (
          <View style={{ paddingTop: 48 }}>
            <EmptyState
              icon={<Inbox />}
              title={
                filter === "all"
                  ? isArabic
                    ? "مفيش تعديلات لسه"
                    : "No coach insights yet"
                  : isArabic
                    ? "مفيش حاجة في الفلتر ده"
                    : "Nothing in this filter"
              }
              body={
                filter === "all"
                  ? isArabic
                    ? "لما الكوتش يلاحظ حاجة محتاج تعديل، هتلاقي السجل هنا."
                    : "When your coach makes adjustments, they'll show up here."
                  : undefined
              }
            />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((adaptation, idx) => {
              const statusTag = getStatusTag(adaptation.status);
              return (
                <Pressable
                  key={`${adaptation.id || idx}-${adaptation.archivedAt || ""}`}
                  onPress={() => router.push({ pathname: "/adaptive-insights", params: { adaptation: JSON.stringify(adaptation) } })}
                  style={{
                    backgroundColor: colors.canvas,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,102,204,0.15)", alignItems: "center", justifyContent: "center" }}>
                      <Sparkles size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 4, alignSelf: "stretch" }}>
                        <AppText numberOfLines={1} style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
                          {adaptation.title}
                        </AppText>
                        {statusTag && (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: statusTag.bg }}>
                            <AppText style={{ fontSize: 10, fontWeight: "600", color: statusTag.color, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1, fontFamily: fontFamily(isArabic, 600) }}>
                              {statusTag.label}
                            </AppText>
                          </View>
                        )}
                      </View>
                      <AppText numberOfLines={2} style={{ fontSize: 12, color: colors.inkMuted48, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                        {adaptation.eventText}
                      </AppText>
                      <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 6, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                        {formatDate(adaptation.archivedAt)}
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
