/**
 * ChallengeDetail — RN port of src/screens/main/ChallengeDetail.tsx.
 *
 * Hero (tier badge + title + description), stats row (joined / days left),
 * optional reward card, rules list, leaderboard (highlights "You"), and a
 * Join/Leave toggle that toasts. Mock data keyed off the `id` param.
 *
 * Web→RN: useParams → useLocalSearchParams; navigate(-1) → router.back();
 * shared Avatar/EmptyState.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Trophy as TrophyIcon } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import Avatar from "../../src/components/Avatar";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const [joined, setJoined] = useState(false);

  const challenge = {
    title: id === "ch3" ? "May Movement Challenge" : id === "ch4" ? "Step It Up" : id === "ch5" ? "Yousef's Bench Battle" : id === "ch1" ? "7-Day Consistency" : "Protein Push",
    arabicTitle: id === "ch3" ? "تحدي حركة مايو" : id === "ch4" ? "زود خطواتك" : id === "ch5" ? "معركة البنش مع يوسف" : id === "ch1" ? "تحدي ٧ أيام" : "تحدي البروتين",
    description: "Compete with the SYNK community. Track your progress and climb the leaderboard.",
    arabicDescription: "نافس مجتمع SYNK. تابع تقدمك واعلى التصنيف.",
    tier: id === "ch3" ? "verified" : id === "ch5" ? "friendly" : "ranked",
    participants: id === "ch3" ? 1247 : id === "ch4" ? 519 : id === "ch5" ? 4 : 248,
    daysLeft: id === "ch3" ? 6 : id === "ch4" ? 11 : id === "ch5" ? 5 : 3,
    reward: id === "ch3" ? "Free month of SYNK Pro" : null,
    arabicReward: id === "ch3" ? "شهر مجاني من SYNK Pro" : null,
    rules: [
      { en: "Log workouts inside the app", ar: "سجل تمارينك جوه التطبيق" },
      { en: "Manual entries don't count", ar: "الإدخال اليدوي ما بيتحسبش" },
      { en: "Must complete by deadline", ar: "لازم تكمل قبل الموعد النهائي" },
    ],
  };

  const tierBadge = challenge.tier === "friendly" ? "🥉" : challenge.tier === "ranked" ? "🥈" : "🥇";
  const tierLbl = challenge.tier === "friendly" ? (isArabic ? "ودي" : "Friendly") : challenge.tier === "ranked" ? (isArabic ? "مصنف" : "Ranked") : isArabic ? "موثق" : "Verified";

  const leaderboard = [
    { rank: 1, name: "Yousef", arabicName: "يوسف", initials: "Y", score: "7 / 7", arabicScore: "٧ / ٧", isUser: false },
    { rank: 2, name: "Mariam", arabicName: "مريم", initials: "M", score: "6 / 7", arabicScore: "٦ / ٧", isUser: false },
    { rank: 3, name: "Omar", arabicName: "عمر", initials: "O", score: "6 / 7", arabicScore: "٦ / ٧", isUser: false },
    { rank: 4, name: "Salma", arabicName: "سلمى", initials: "S", score: "5 / 7", arabicScore: "٥ / ٧", isUser: false },
    { rank: 5, name: "You", arabicName: "أنت", initials: user.name?.charAt(0) || "U", score: "4 / 7", arabicScore: "٤ / ٧", isUser: true },
  ];

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const tile1 = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const primaryTint = colors.primary + "1A";
  const primaryFaint = colors.primary + "0D";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText numberOfLines={1} style={{ fontSize: 16, fontWeight: "600", color: colors.ink, maxWidth: 200, fontFamily: ff(isArabic, 600) }}>{isArabic ? challenge.arabicTitle : challenge.title}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24, paddingBottom: insets.bottom + 32, gap: 24 }}>
        {/* Hero */}
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            <AppText style={{ fontSize: 40 }}>{tierBadge}</AppText>
          </View>
          <AppText style={{ fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, color: colors.inkMuted48, marginBottom: 8, fontFamily: ff(isArabic, 600) }}>{tierLbl}</AppText>
          <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, textAlign: "center", fontFamily: ff(isArabic, 600) }}>{isArabic ? challenge.arabicTitle : challenge.title}</AppText>
          <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 8, maxWidth: 300, textAlign: "center", lineHeight: 18, fontFamily: ff(isArabic) }}>{isArabic ? challenge.arabicDescription : challenge.description}</AppText>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-around", alignItems: "center", backgroundColor: tile1, borderRadius: 10, paddingVertical: 16 }}>
          <View style={{ alignItems: "center", gap: 4 }}>
            <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 600) }}>{challenge.participants.toLocaleString()}</AppText>
            <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.8, fontFamily: ff(isArabic) }}>{isArabic ? "مشارك" : "Joined"}</AppText>
          </View>
          <View style={{ width: 1, height: 32, backgroundColor: colors.hairline }} />
          <View style={{ alignItems: "center", gap: 4 }}>
            <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 600) }}>{challenge.daysLeft}</AppText>
            <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.8, fontFamily: ff(isArabic) }}>{isArabic ? "أيام" : "Days left"}</AppText>
          </View>
        </View>

        {/* Reward */}
        {challenge.reward && (
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, backgroundColor: primaryTint, borderWidth: 1, borderColor: colors.primary + "33", borderRadius: 10, padding: 16 }}>
            <TrophyIcon size={20} color={colors.primary} />
            <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
              <AppText style={{ fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الجائزة" : "Reward"}</AppText>
              <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, marginTop: 2, fontFamily: ff(isArabic, 600) }}>{isArabic ? challenge.arabicReward : challenge.reward}</AppText>
            </View>
          </View>
        )}

        {/* Rules */}
        <View>
          <AppText style={{ fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, color: colors.inkMuted48, marginBottom: 8, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? "القواعد" : "Rules"}</AppText>
          <View style={{ gap: 8 }}>
            {challenge.rules.map((r, i) => (
              <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 8 }}>
                <AppText style={{ color: colors.primary, marginTop: 1 }}>•</AppText>
                <AppText style={{ fontSize: 13, color: colors.ink, flex: 1, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? r.ar : r.en}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Leaderboard */}
        <View>
          <AppText style={{ fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, color: colors.inkMuted48, marginBottom: 8, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? "التصنيف" : "Leaderboard"}</AppText>
          <View style={{ gap: 8 }}>
            {leaderboard.map((row) => (
              <View key={row.rank} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, backgroundColor: row.isUser ? primaryFaint : cardBg, borderColor: row.isUser ? colors.primary + "33" : colors.hairline }}>
                <AppText style={{ fontSize: 14, fontWeight: "700", width: 24, textAlign: "center", color: row.rank <= 3 ? colors.primary : colors.inkMuted48, fontVariant: ["tabular-nums"] }}>{row.rank}</AppText>
                <Avatar initials={row.initials} size={36} />
                <AppText style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? row.arabicName : row.name}</AppText>
                <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.primary, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 600) }}>{isArabic ? row.arabicScore : row.score}</AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Join / Leave */}
        <Pressable
          onPress={() => { setJoined(!joined); showToast(joined ? (isArabic ? "غادرت التحدي" : "Left challenge") : isArabic ? "انضممت للتحدي" : "Joined challenge", "success"); }}
          style={{ width: "100%", height: 48, borderRadius: 9999, alignItems: "center", justifyContent: "center", backgroundColor: joined ? tile1 : colors.primary, borderWidth: joined ? 1 : 0, borderColor: colors.hairline }}
        >
          <AppText style={{ fontSize: 14, fontWeight: "600", color: joined ? colors.ink : colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{joined ? (isArabic ? "مغادرة التحدي" : "Leave Challenge") : isArabic ? "انضم الآن" : "Join Challenge"}</AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}
