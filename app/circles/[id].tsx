/**
 * CircleDetail — RN port of src/screens/main/CircleDetail.tsx.
 *
 * Circle header (round back/members buttons) + profile block (avatar, name,
 * member count) + 3 segments: Feed (empty state), Leaderboard (metric-ranked
 * members, highlights you, medal colors for top 3), Challenges (active list +
 * "start a challenge" CTA). Mock data keyed off the id param.
 *
 * Web→RN: useParams → useLocalSearchParams; navigate(-1) → router.back();
 * shared Avatar/EmptyState.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Users, Trophy as TrophyIcon, MessageCircle } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import Avatar from "../../src/components/Avatar";
import EmptyState from "../../src/components/EmptyState";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

type CircleSegment = "feed" | "leaderboard" | "challenges";

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

const CIRCLE_DATA: Record<string, { name: string; arabicName: string; metric: string; count: number }> = {
  c1: { name: "Bros Gym", arabicName: "بروز جيم", metric: "workouts", count: 5 },
  c2: { name: "Lift Fam", arabicName: "عيلة الحديد", metric: "volume", count: 3 },
  c3: { name: "Cairo Lifters", arabicName: "أبطال القاهرة", metric: "streak", count: 8 },
  "leg-day-crew": { name: "Leg Day Crew", arabicName: "كرو الرجل", metric: "volume", count: 4 },
  "maadi-squad": { name: "Maadi Squad", arabicName: "شلة المعادي", metric: "streak", count: 4 },
};

const formatLeaderboardValue = (metric: string, raw: number, isArabic: boolean): string => {
  switch (metric) {
    case "workouts": return `${raw}`;
    case "volume": return isArabic ? `${raw.toLocaleString("en-US")} كجم` : `${raw.toLocaleString("en-US")} kg`;
    case "streak": return isArabic ? `${raw} يوم` : `${raw}d`;
    default: return `${raw}`;
  }
};

const getRaw = (memberId: string, metric: string): number => {
  if (metric === "volume") return { os: 2950, mh: 2450, ya: 2100, you: 1850, ni: 1200 }[memberId] ?? 950;
  if (metric === "streak") return { os: 14, mh: 10, ya: 9, you: 5, ni: 2 }[memberId] ?? 1;
  return { os: 15, mh: 13, ya: 11, you: 10, ni: 8 }[memberId] ?? 6;
};

export default function CircleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const [segment, setSegment] = useState<CircleSegment>("feed");

  const circleId = id || "c1";
  const circleData = CIRCLE_DATA[circleId] || { name: "Cardio Club", arabicName: "نادي الكارديو", metric: "workouts", count: 4 };
  const circleName = circleData.name;
  const arabicCircleName = circleData.arabicName;
  const circleMetric = circleData.metric;
  const membersCount = circleData.count;

  const challenges = [
    { id: "gc1", title: "Most workouts this week", arabicTitle: "أكتر تمارين الأسبوع ده", status: "active", detail: "3 days left · You're 2nd", arabicDetail: "٣ أيام متبقي · أنت ٢" },
    { id: "gc2", title: "Longest streak", arabicTitle: "أطول سلسلة", status: "active", detail: "Yousef won · 14 days", arabicDetail: "يوسف كسب · ١٤ يوم" },
  ];

  const rawData = [
    { id: "os", name: "Omar Sherif", arabicName: "عمر شريف", handle: "omar", initials: "OS" },
    { id: "mh", name: "Mariam Hassan", arabicName: "مريم حسن", handle: "mariam", initials: "MH" },
    { id: "ya", name: "Yousef Adel", arabicName: "يوسف عادل", handle: "yousef", initials: "YA" },
    { id: "you", name: user.name || "You", arabicName: "أنت", handle: "", initials: (user.name || "U").charAt(0).toUpperCase() },
    { id: "ni", name: "Nour Ibrahim", arabicName: "نور إبراهيم", handle: "nour", initials: "NI" },
    { id: "sa", name: "Salma Ahmed", arabicName: "سلمى أحمد", handle: "salma", initials: "SA" },
  ];

  const leaderboardData = rawData
    .map((m) => {
      const raw = getRaw(m.id, circleMetric);
      return { ...m, raw, value: formatLeaderboardValue(circleMetric, raw, false), arabicValue: formatLeaderboardValue(circleMetric, raw, true) };
    })
    .sort((a, b) => b.raw - a.raw);

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const primaryTint = colors.primary + "1A";
  const primaryFaint = colors.primary + "0D";
  const align = isArabic ? "right" : "left";

  const CircleBtn = ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
    <Pressable onPress={onPress} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
      {children}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvasParchment, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <CircleBtn onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </CircleBtn>
        <AppText numberOfLines={1} style={{ fontSize: 16, fontWeight: "600", color: colors.ink, maxWidth: 200, fontFamily: ff(isArabic, 600) }}>{isArabic ? arabicCircleName : circleName}</AppText>
        <CircleBtn onPress={() => showToast(isArabic ? "الأعضاء قريباً" : "Members coming soon", "info")}>
          <Users size={20} color={colors.ink} />
        </CircleBtn>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Profile block */}
        <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 16, backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
          <View style={{ width: 80, height: 80, borderRadius: 9999, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Users size={36} color={colors.primary} />
          </View>
          <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? arabicCircleName : circleName}</AppText>
          <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 4, fontFamily: ff(isArabic) }}>{membersCount} {isArabic ? "أعضاء" : "members"}</AppText>
        </View>

        {/* Segments */}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, paddingHorizontal: 16, backgroundColor: colors.canvasParchment, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
          {(["feed", "leaderboard", "challenges"] as CircleSegment[]).map((t) => {
            const active = segment === t;
            return (
              <Pressable key={t} onPress={() => setSegment(t)} style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
                <AppText style={{ fontSize: 14, fontWeight: active ? "600" : "400", color: active ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, active ? 600 : 400) }}>
                  {t === "feed" ? (isArabic ? "الفيد" : "Feed") : t === "leaderboard" ? (isArabic ? "اللوحة" : "Leaderboard") : isArabic ? "التحديات" : "Challenges"}
                </AppText>
                {active && <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, borderTopLeftRadius: 9999, borderTopRightRadius: 9999 }} />}
              </Pressable>
            );
          })}
        </View>

        {segment === "feed" && (
          <View style={{ paddingTop: 32 }}>
            <EmptyState
              icon={<MessageCircle />}
              title={isArabic ? "مفيش منشورات لسه" : "No posts yet"}
              body={isArabic ? "كن أول واحد يشارك حاجة مع حلقتك" : "Be the first to share something with your circle"}
              ctaLabel={isArabic ? "شارك حاجة" : "Share something"}
              onCta={() => router.push("/community")}
            />
          </View>
        )}

        {segment === "leaderboard" && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 32 }}>
            <View style={{ marginBottom: 24 }}>
              <AppText style={{ fontSize: 22, fontWeight: "600", color: colors.ink, letterSpacing: -0.3, textAlign: align, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الأسبوع ده" : "This week"}</AppText>
              <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 4, textAlign: align, fontFamily: ff(isArabic) }}>
                {circleMetric === "workouts" ? (isArabic ? "الترتيب حسب عدد التمارين" : "Ranked by total workouts") : circleMetric === "volume" ? (isArabic ? "الترتيب حسب إجمالي الوزن المرفوع" : "Ranked by total kg lifted") : isArabic ? "الترتيب حسب أطول سلسلة نشطة" : "Ranked by longest active streak"}
              </AppText>
            </View>
            <View style={{ gap: 8 }}>
              {leaderboardData.map((row, index) => {
                const isUser = row.id === "you";
                const rankColor = index === 0 ? "#f59e0b" : index === 2 ? "#ea580c" : colors.inkMuted48;
                return (
                  <View key={row.id} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 10, backgroundColor: isUser ? primaryFaint : cardBg, borderWidth: isUser ? 2 : 1, borderColor: isUser ? colors.primary : colors.hairline }}>
                    <AppText style={{ width: 32, fontSize: 17, fontWeight: "600", textAlign: "center", color: rankColor, fontVariant: ["tabular-nums"] }}>{index + 1}</AppText>
                    <Avatar initials={row.initials} size={40} />
                    <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? row.arabicName : row.name}</AppText>
                      <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>@{isUser ? user.handle || "you" : row.handle}</AppText>
                    </View>
                    <AppText style={{ fontSize: 22, fontWeight: "600", color: colors.ink, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 600) }}>{isArabic ? row.arabicValue : row.value}</AppText>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {segment === "challenges" && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 32 }}>
            <AppText style={{ fontSize: 22, fontWeight: "600", color: colors.ink, letterSpacing: -0.3, marginBottom: 16, textAlign: align, fontFamily: ff(isArabic, 600) }}>{isArabic ? "نشط في الحلقة دي" : "Active in this circle"}</AppText>
            <View style={{ gap: 12, marginBottom: 24 }}>
              {challenges.map((c) => (
                <Pressable key={c.id} onPress={() => router.push(`/challenges/${c.id}`)} style={{ padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, alignItems: "stretch" }}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <AppText style={{ fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>🥉 {isArabic ? "ودي" : "Friendly"}</AppText>
                  </View>
                  <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, marginTop: 4, textAlign: align, fontFamily: ff(isArabic, 600) }}>{isArabic ? c.arabicTitle : c.title}</AppText>
                  <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 4, textAlign: align, fontFamily: ff(isArabic) }}>{isArabic ? c.arabicDetail : c.detail}</AppText>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline }}>
                    <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ينتهي قريباً" : "Ends soon"}</AppText>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                      <Users size={14} color={colors.inkMuted48} />
                      <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{membersCount}</AppText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={() => router.push(`/challenges/create?circle=${circleId}`)} style={{ width: "100%", height: 44, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginVertical: 8 }}>
              <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ابدأ تحدي في الحلقة دي" : "Start a challenge in this circle"}</AppText>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
