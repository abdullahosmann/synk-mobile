/**
 * Challenges — RN port of src/screens/main/Challenges.tsx (standalone route).
 *
 * Two tabs: My Challenges / Discover. Discover shows category filter chips.
 * Cards show tier badge + SYNK verified pill + participants/days + a progress
 * bar (joined). Header "+" opens a Create BottomSheet listing 4 friendly-tier
 * templates that route to /challenges/create?template=…
 *
 * Web→RN: navigate(-1) → router.back(); shared BottomSheet; horizontal chip row
 * → <ScrollView horizontal>; 1:1 with the web.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Users, Trophy as TrophyIcon, Check } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import BottomSheet from "../../src/components/BottomSheet";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

type ChallengesTab = "my" | "discover";

interface MockChallenge {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  arabicDescription: string;
  tier: "friendly" | "ranked" | "verified";
  participants: number;
  daysLeft: number;
  joined: boolean;
  progress?: number;
  goalLabel?: string;
  arabicGoalLabel?: string;
  source: "synk" | "user";
  category?: string;
}

const CATEGORIES = [
  { id: "All", en: "All", ar: "الكل" },
  { id: "Workout", en: "Workout", ar: "تمرين" },
  { id: "Streak", en: "Streak", ar: "استمرارية" },
  { id: "Nutrition", en: "Nutrition", ar: "تغذية" },
  { id: "Cardio", en: "Cardio", ar: "كارديو" },
];

const MOCK_MY: MockChallenge[] = [
  { id: "ch1", title: "7-Day Consistency", arabicTitle: "تحدي ٧ أيام", description: "Log a workout every day for a week", arabicDescription: "سجل تمرين كل يوم لمدة أسبوع", tier: "ranked", participants: 248, daysLeft: 3, joined: true, progress: 57, goalLabel: "4 / 7 days", arabicGoalLabel: "٤ / ٧ أيام", source: "synk", category: "Streak" },
  { id: "ch2", title: "Protein Push", arabicTitle: "تحدي البروتين", description: "Hit your protein target 5 days running", arabicDescription: "حقق هدف البروتين ٥ أيام متتالية", tier: "ranked", participants: 132, daysLeft: 6, joined: true, progress: 40, goalLabel: "2 / 5 days", arabicGoalLabel: "٢ / ٥ أيام", source: "synk", category: "Nutrition" },
];

const MOCK_DISCOVER: MockChallenge[] = [
  { id: "ch3", title: "May Movement Challenge", arabicTitle: "تحدي حركة مايو", description: "20 workouts in 30 days", arabicDescription: "٢٠ تمرين في ٣٠ يوم", tier: "verified", participants: 1247, daysLeft: 6, joined: false, source: "synk", category: "Workout" },
  { id: "ch4", title: "Step It Up", arabicTitle: "زود خطواتك", description: "10,000 steps a day for two weeks", arabicDescription: "١٠٬٠٠٠ خطوة يومياً لمدة أسبوعين", tier: "ranked", participants: 519, daysLeft: 11, joined: false, source: "synk", category: "Cardio" },
  { id: "ch5", title: "Yousef's Bench Battle", arabicTitle: "معركة البنش مع يوسف", description: "Most bench reps this week", arabicDescription: "أكتر تكرارات بنش الأسبوع ده", tier: "friendly", participants: 4, daysLeft: 5, joined: false, source: "user", category: "Workout" },
];

const tierBadge = (tier: MockChallenge["tier"]) => (tier === "friendly" ? "🥉" : tier === "ranked" ? "🥈" : "🥇");
const tierLabel = (tier: MockChallenge["tier"], isArabic: boolean) => (tier === "friendly" ? (isArabic ? "ودي" : "Friendly") : tier === "ranked" ? (isArabic ? "مصنف" : "Ranked") : isArabic ? "موثق" : "Verified");

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

const CREATE_TEMPLATES = [
  { id: "workouts", label: "Most workouts this week", arabicLabel: "أكتر تمارين الأسبوع ده" },
  { id: "streak", label: "Longest streak", arabicLabel: "أطول سلسلة" },
  { id: "volume", label: "Most volume lifted", arabicLabel: "أكبر حجم رفع" },
  { id: "steps", label: "Most steps", arabicLabel: "أكبر عدد خطوات" },
];

export default function Challenges() {
  const router = useRouter();
  const { user } = useAppContext();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<ChallengesTab>("my");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const list = activeTab === "my" ? MOCK_MY : selectedCategory === "All" ? MOCK_DISCOVER : MOCK_DISCOVER.filter((c) => c.category === selectedCategory);

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
        <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "التحديات" : "Challenges"}</AppText>
        <Pressable onPress={() => setCreateOpen(true)} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <Plus size={22} color={colors.ink} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        {(["my", "discover"] as ChallengesTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable key={tab} onPress={() => { setActiveTab(tab); if (tab === "discover") setSelectedCategory("All"); }} style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
              <AppText style={{ fontSize: 13, fontWeight: active ? "600" : "400", color: active ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, active ? 600 : 400) }}>
                {tab === "my" ? (isArabic ? "تحدياتي" : "My Challenges") : isArabic ? "اكتشف" : "Discover"}
              </AppText>
              {active && <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary }} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Category chips (discover) */}
        {activeTab === "discover" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8, paddingTop: 12, paddingBottom: 8, paddingHorizontal: 16 }}>
            {CATEGORIES.map((cat) => {
              const count = cat.id === "All" ? MOCK_DISCOVER.length : MOCK_DISCOVER.filter((c) => c.category === cat.id).length;
              const sel = selectedCategory === cat.id;
              return (
                <Pressable key={cat.id} onPress={() => setSelectedCategory(cat.id)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: sel ? colors.primary : cardBg, borderWidth: sel ? 0 : 1, borderColor: colors.hairline }}>
                  <AppText style={{ fontSize: 13, fontWeight: "500", color: sel ? colors.onPrimary : colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? cat.ar : cat.en}</AppText>
                  <AppText style={{ fontSize: 11, color: sel ? "rgba(255,255,255,0.8)" : colors.inkMuted48, fontVariant: ["tabular-nums"] }}>({count})</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
          {list.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <TrophyIcon size={32} color={colors.inkMuted48} style={{ marginBottom: 12 }} />
              <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ما انضممتش لأي تحدي" : "You haven't joined any"}</AppText>
              <Pressable onPress={() => setActiveTab("discover")} style={{ marginTop: 12 }}>
                <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "اكتشف التحديات" : "Browse challenges"}</AppText>
              </Pressable>
            </View>
          ) : (
            list.map((c) => (
              <Pressable key={c.id} onPress={() => router.push(`/challenges/${c.id}`)} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16 }}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <AppText style={{ fontSize: 16 }}>{tierBadge(c.tier)}</AppText>
                      <AppText style={{ fontSize: 10, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, color: colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{tierLabel(c.tier, isArabic)}</AppText>
                      {c.source === "synk" && (
                        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.primary }}>
                          <Check size={10} color={colors.onPrimary} />
                          <AppText style={{ fontSize: 10, fontWeight: "700", letterSpacing: 1.5, color: colors.onPrimary }}>SYNK</AppText>
                        </View>
                      )}
                    </View>
                    <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? c.arabicTitle : c.title}</AppText>
                    <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 4, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? c.arabicDescription : c.description}</AppText>
                  </View>
                </View>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                    <Users size={12} color={colors.inkMuted48} />
                    <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontVariant: ["tabular-nums"] }}>{c.participants.toLocaleString()}</AppText>
                  </View>
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic) }}>{c.daysLeft} {isArabic ? "أيام متبقي" : "days left"}</AppText>
                </View>
                {c.joined && c.progress !== undefined && (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <AppText style={{ fontSize: 11, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "تقدمك" : "Your progress"}</AppText>
                      <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 600) }}>{isArabic ? c.arabicGoalLabel : c.goalLabel}</AppText>
                    </View>
                    <View style={{ height: 3, width: "100%", backgroundColor: primaryTint, borderRadius: 9999, overflow: "hidden" }}>
                      <View style={{ height: "100%", width: `${c.progress}%`, backgroundColor: colors.primary, borderRadius: 9999 }} />
                    </View>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Challenge Sheet */}
      <BottomSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} title={isArabic ? "تحدي جديد" : "Create Challenge"}>
        <View style={{ paddingTop: 8, paddingBottom: 24, gap: 16 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, backgroundColor: tile1, borderRadius: 10, padding: 12 }}>
            <AppText style={{ fontSize: 20 }}>🥉</AppText>
            <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "تحدي ودي" : "Friendly Challenge"}</AppText>
              <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "اللي بتعمله بنفسك للمتعة. مفيش جوايز رسمية." : "User-created. Bragging rights only, no SYNK rewards."}</AppText>
            </View>
          </View>
          {CREATE_TEMPLATES.map((t) => (
            <Pressable key={t.id} onPress={() => { setCreateOpen(false); router.push(`/challenges/create?template=${t.id}`); }} style={{ padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
              <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? t.arabicLabel : t.label}</AppText>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}
