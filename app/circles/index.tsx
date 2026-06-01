/**
 * Circles — RN port of src/screens/main/Circles.tsx.
 *
 * Intro blurb + list of circle cards (Users-icon chip, name, member count +
 * optional last-challenge note). Header "+" routes to /circles/create. Empty
 * state when there are no circles.
 *
 * Web→RN: navigate(-1) → router.back().
 */
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Users } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

interface MockCircle {
  id: string;
  name: string;
  arabicName: string;
  memberCount: number;
  lastChallenge?: string;
  arabicLastChallenge?: string;
}

const MOCK_CIRCLES: MockCircle[] = [
  { id: "leg-day-crew", name: "Leg Day Crew", arabicName: "كرو الرجل", memberCount: 4, lastChallenge: "Most workouts · 3 days left", arabicLastChallenge: "أكتر تمارين · ٣ أيام متبقي" },
  { id: "maadi-squad", name: "Maadi Squad", arabicName: "شلة المعادي", memberCount: 7, lastChallenge: "Longest streak · ended", arabicLastChallenge: "أطول سلسلة · انتهى" },
  { id: "cardio-club", name: "Cardio Club", arabicName: "نادي الكارديو", memberCount: 5 },
];

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function Circles() {
  const router = useRouter();
  const { user } = useAppContext();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const tile1 = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const primaryTint = colors.primary + "1A";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الحلقات" : "Circles"}</AppText>
        <Pressable onPress={() => router.push("/circles/create")} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Plus size={22} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 96 }}>
        <View style={{ backgroundColor: tile1, borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <AppText style={{ fontSize: 12, color: colors.inkMuted48, lineHeight: 17, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>
            {isArabic ? "الحلقات هي فِرَق من أصدقائك بتعمل بيها تحديات مع بعض." : "Circles are squads of your friends you run challenges with."}
          </AppText>
        </View>

        {MOCK_CIRCLES.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Users size={32} color={colors.inkMuted48} style={{ marginBottom: 12 }} />
            <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "لسه مفيش حلقات" : "No circles yet"}</AppText>
            <Pressable onPress={() => router.push("/circles/create")} style={{ marginTop: 12 }}>
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "اعمل أول حلقة" : "Create your first circle"}</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {MOCK_CIRCLES.map((g) => (
              <Pressable key={g.id} onPress={() => router.push(`/circles/${g.id}`)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center" }}>
                  <Users size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                  <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? g.arabicName : g.name}</AppText>
                  <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>
                    {g.memberCount} {isArabic ? "أعضاء" : "members"}
                    {g.lastChallenge ? ` · ${isArabic ? g.arabicLastChallenge : g.lastChallenge}` : ""}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
