/**
 * Search — RN port of src/screens/main/Search.tsx.
 *
 * Search field (autofocus) + 4 segmented tabs: People, Challenges, Circles,
 * Posts. People/Challenges/Circles filter their mock lists by the query;
 * Circles also shows a dashed "Create new circle" row. Posts is a "coming soon"
 * empty state. Rows navigate to profile/challenge/circle routes.
 *
 * Web→RN: navigate(-1) → router.back(); <input> → <TextInput>; <Avatar>/
 * <EmptyState> shared components.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Search as SearchIcon, Trophy, Users, Hash, Plus } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import Avatar from "../src/components/Avatar";
import EmptyState from "../src/components/EmptyState";
import { useTheme } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";

type SearchTab = "people" | "challenges" | "circles" | "posts";

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function Search() {
  const router = useRouter();
  const { user } = useAppContext();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<SearchTab>("people");
  const [query, setQuery] = useState("");

  const mockPeople = [
    { name: "Yousef Adel", arabicName: "يوسف عادل", initials: "YA", subtitle: "Gold's Maadi · 248 followers", arabicSubtitle: "جولدز المعادي · ٢٤٨ متابع" },
    { name: "Mariam Hassan", arabicName: "مريم حسن", initials: "MH", subtitle: "Smart Gym · 412 followers", arabicSubtitle: "سمارت جيم · ٤١٢ متابع" },
    { name: "Salma Tarek", arabicName: "سلمى طارق", initials: "ST", subtitle: "Flex Heliopolis · 89 followers", arabicSubtitle: "فليكس مصر الجديدة · ٨٩ متابع" },
    { name: "Omar Sherif", arabicName: "عمر شريف", initials: "OS", subtitle: "Gold's Maadi · 156 followers", arabicSubtitle: "جولدز المعادي · ١٥٦ متابع" },
  ];

  const mockChallenges = [
    { name: "May Movement Challenge", arabicName: "تحدي حركة مايو", participants: 1247, daysLeft: 6, tier: "🥈" },
    { name: "7-Day Consistency", arabicName: "تحدي ٧ أيام", participants: 248, daysLeft: 3, tier: "🥉" },
    { name: "Protein Push", arabicName: "تحدي البروتين", participants: 132, daysLeft: 6, tier: "🥉" },
  ];

  const mockCircles = [
    { id: "leg-day-crew", name: "Leg Day Crew", arabicName: "كرو الرجل", memberCount: 4, competitionMetric: "workouts" },
    { id: "maadi-squad", name: "Maadi Squad", arabicName: "شلة المعادي", memberCount: 7, competitionMetric: "workouts" },
    { id: "cardio-club", name: "Cardio Club", arabicName: "نادي الكارديو", memberCount: 5, competitionMetric: "workouts" },
  ];

  const tabs: { id: SearchTab; label: string; arabicLabel: string }[] = [
    { id: "people", label: "People", arabicLabel: "أشخاص" },
    { id: "challenges", label: "Challenges", arabicLabel: "تحديات" },
    { id: "circles", label: "Circles", arabicLabel: "حلقات" },
    { id: "posts", label: "Posts", arabicLabel: "منشورات" },
  ];

  const filteredPeople = query.trim() === "" ? mockPeople : mockPeople.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.arabicName.includes(query));
  const filteredChallenges = query.trim() === "" ? mockChallenges : mockChallenges.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.arabicName.includes(query));
  const filteredCircles = mockCircles.filter((g) => query.trim() === "" || g.name.toLowerCase().includes(query.toLowerCase()) || g.arabicName.includes(query));

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const inputBg = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const primaryTint = colors.primary + "1A";
  const align = isArabic ? "right" : "left";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.canvas,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <SearchIcon size={16} color={colors.inkMuted48} style={{ position: "absolute", top: 12, [isArabic ? "right" : "left"]: 12, zIndex: 1 }} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={isArabic ? "ابحث…" : "Search…"}
            placeholderTextColor={colors.inkMuted48}
            style={{
              height: 40,
              borderRadius: 9999,
              backgroundColor: inputBg,
              borderWidth: 1,
              borderColor: colors.hairline,
              fontSize: 14,
              color: colors.ink,
              paddingLeft: isArabic ? 16 : 36,
              paddingRight: isArabic ? 36 : 16,
              textAlign: align,
              fontFamily: ff(isArabic),
            }}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
              <AppText style={{ fontSize: 13, fontWeight: active ? "600" : "400", color: active ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, active ? 600 : 400) }}>
                {isArabic ? t.arabicLabel : t.label}
              </AppText>
              {active && <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary }} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 96 }}>
        {activeTab === "people" && (
          <View style={{ gap: 8 }}>
            {filteredPeople.length === 0 ? (
              <EmptyState icon={<SearchIcon />} title={isArabic ? "مفيش نتايج" : "No results"} body={isArabic ? "جرب بحث تاني." : "Try a different search."} size="sm" />
            ) : (
              filteredPeople.map((p) => (
                <Pressable
                  key={p.name}
                  onPress={() => router.push(`/profile/${p.name.toLowerCase().replace(/\s+/g, "-")}`)}
                  style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10 }}
                >
                  <Avatar initials={p.initials} size={40} />
                  <View style={{ flex: 1, minWidth: 0, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? p.arabicName : p.name}</AppText>
                    <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>{isArabic ? p.arabicSubtitle : p.subtitle}</AppText>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === "challenges" && (
          <View style={{ gap: 8 }}>
            {filteredChallenges.length === 0 ? (
              <EmptyState icon={<Trophy />} title={isArabic ? "مفيش نتايج" : "No results"} body={isArabic ? "جرب بحث تاني." : "Try a different search."} size="sm" />
            ) : (
              filteredChallenges.map((c) => (
                <Pressable
                  key={c.name}
                  onPress={() => router.push("/challenges/ch3")}
                  style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10 }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 18 }}>{c.tier}</AppText>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? c.arabicName : c.name}</AppText>
                    <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>
                      {c.participants.toLocaleString()} {isArabic ? "مشارك · متبقي" : "joined ·"} {c.daysLeft} {isArabic ? "أيام" : "days left"}
                    </AppText>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {activeTab === "circles" && (
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => router.push("/circles/create")}
              style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: inputBg, borderWidth: 1, borderStyle: "dashed", borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", borderRadius: 10 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center" }}>
                <Plus size={20} color={colors.primary} />
              </View>
              <AppText style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.primary, textAlign: align, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إنشاء حلقة جديدة" : "Create new circle"}</AppText>
            </Pressable>

            {filteredCircles.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => router.push(`/circles/${g.id}`)}
                style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center" }}>
                  <Users size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                  <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? g.arabicName : g.name}</AppText>
                  <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>{g.memberCount} {isArabic ? "أعضاء" : "members"}</AppText>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === "posts" && <EmptyState icon={<Hash />} title={isArabic ? "ابحث عن منشورات" : "Search posts"} body={isArabic ? "هتيجي قريب" : "Coming soon"} />}
      </ScrollView>
    </View>
  );
}
