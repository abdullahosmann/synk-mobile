/**
 * ChallengeCreate — RN port of src/screens/main/ChallengeCreate.tsx.
 *
 * 3-step friendly-challenge flow: template → opponents (Friends/Circles tabs,
 * multi-select with search) → duration. Pre-fills from query params (template /
 * opponent / circle). Sticky footer CTA advances/creates. Custom back steps
 * through the flow.
 *
 * Web→RN: useSearchParams → useLocalSearchParams; navigate(-1) → router.back();
 * <input> → <TextInput>; shared Avatar.
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check, Search as SearchIcon, Users } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import Avatar from "../../src/components/Avatar";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

type Step = "template" | "opponents" | "duration";
type OpponentTab = "friends" | "circles";

const TEMPLATES = [
  { id: "workouts", label: "Most workouts", arabicLabel: "أكتر تمارين", description: "Who logs more sessions wins", arabicDescription: "اللي يسجل تمارين أكتر يكسب" },
  { id: "streak", label: "Longest streak", arabicLabel: "أطول سلسلة", description: "Consecutive workout days", arabicDescription: "أيام تمرين متتالية" },
  { id: "volume", label: "Most volume", arabicLabel: "أكبر حجم", description: "Total kg lifted across the period", arabicDescription: "إجمالي الكيلوجرامات المرفوعة" },
  { id: "steps", label: "Most steps", arabicLabel: "أكبر عدد خطوات", description: "Daily step count totals", arabicDescription: "مجموع الخطوات اليومية" },
];

const MOCK_MUTUALS = [
  { id: "yousef", name: "Yousef Adel", arabicName: "يوسف عادل", initials: "YA" },
  { id: "mariam", name: "Mariam Hassan", arabicName: "مريم حسن", initials: "MH" },
  { id: "omar", name: "Omar Sherif", arabicName: "عمر شريف", initials: "OS" },
  { id: "salma", name: "Salma Tarek", arabicName: "سلمى طارق", initials: "ST" },
  { id: "khaled", name: "Khaled Hassan", arabicName: "خالد حسن", initials: "KH" },
  { id: "nour", name: "Nour Ibrahim", arabicName: "نور إبراهيم", initials: "NI" },
];

const MOCK_CIRCLES = [
  { id: "leg-day-crew", name: "Leg Day Crew", arabicName: "كرو الرجل", memberCount: 4 },
  { id: "maadi-squad", name: "Maadi Squad", arabicName: "شلة المعادي", memberCount: 7 },
  { id: "cardio-club", name: "Cardio Club", arabicName: "نادي الكارديو", memberCount: 5 },
];

const DURATIONS = [
  { id: "3", label: "3 days", arabicLabel: "٣ أيام" },
  { id: "7", label: "1 week", arabicLabel: "أسبوع" },
  { id: "14", label: "2 weeks", arabicLabel: "أسبوعين" },
  { id: "30", label: "1 month", arabicLabel: "شهر" },
];

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function ChallengeCreate() {
  const router = useRouter();
  const params = useLocalSearchParams<{ template?: string; opponent?: string; circle?: string }>();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const initialTemplate = params.template ?? null;
  const initialOpponent = params.opponent ?? null;
  const initialCircle = params.circle ?? null;

  const [step, setStep] = useState<Step>(initialTemplate ? "opponents" : "template");
  const [, setTemplateId] = useState<string>(initialTemplate || "");
  const [opponentTab, setOpponentTab] = useState<OpponentTab>("friends");
  const [selectedFriends, setSelectedFriends] = useState<string[]>(initialOpponent ? [initialOpponent] : []);
  const [selectedCircles, setSelectedCircles] = useState<string[]>(initialCircle ? [initialCircle] : []);
  const [duration, setDuration] = useState<string>("7");
  const [query, setQuery] = useState("");

  const filteredMutuals = useMemo(() => (!query.trim() ? MOCK_MUTUALS : MOCK_MUTUALS.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.arabicName.includes(query))), [query]);
  const filteredCircles = useMemo(() => (!query.trim() ? MOCK_CIRCLES : MOCK_CIRCLES.filter((g) => g.name.toLowerCase().includes(query.toLowerCase()) || g.arabicName.includes(query))), [query]);

  const totalOpponents = selectedFriends.length + selectedCircles.reduce((sum, gId) => sum + (MOCK_CIRCLES.find((g) => g.id === gId)?.memberCount || 0), 0);

  const toggleFriend = (id: string) => setSelectedFriends((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleCircle = (id: string) => setSelectedCircles((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleBack = () => {
    if (step === "duration") setStep("opponents");
    else if (step === "opponents") {
      if (initialTemplate) router.back();
      else setStep("template");
    } else router.back();
  };

  const handleCreate = () => {
    showToast(isArabic ? "تم إنشاء التحدي" : "Challenge created", "success");
    router.replace("/challenges");
  };

  const headerTitle = step === "template" ? (isArabic ? "اختار التحدي" : "Pick a challenge") : step === "opponents" ? (isArabic ? "اختار المنافسين" : "Pick opponents") : isArabic ? "اختار المدة" : "Pick duration";

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const tile1 = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const primaryTint = colors.primary + "1A";
  const primaryFaint = colors.primary + "0D";
  const selBorder = colors.primary + "4D";
  const checkBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";

  const Checkbox = ({ on }: { on: boolean }) => (
    <View style={{ width: 24, height: 24, borderRadius: 9999, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.primary : "transparent", borderWidth: on ? 0 : 2, borderColor: checkBorder }}>
      {on && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={handleBack} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{headerTitle}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        {step === "template" && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, backgroundColor: tile1, borderRadius: 10, padding: 12, marginBottom: 4 }}>
              <AppText style={{ fontSize: 20 }}>🥉</AppText>
              <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "تحدي ودي" : "Friendly Challenge"}</AppText>
                <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "للمتعة فقط. مفيش جوايز رسمية." : "Bragging rights only, no SYNK rewards."}</AppText>
              </View>
            </View>
            {TEMPLATES.map((t) => (
              <Pressable key={t.id} onPress={() => { setTemplateId(t.id); setStep("opponents"); }} style={{ padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? t.arabicLabel : t.label}</AppText>
                <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginTop: 4, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? t.arabicDescription : t.description}</AppText>
              </Pressable>
            ))}
          </View>
        )}

        {step === "opponents" && (
          <View>
            <View style={{ justifyContent: "center", marginBottom: 16 }}>
              <SearchIcon size={16} color={colors.inkMuted48} style={{ position: "absolute", top: 12, [isArabic ? "right" : "left"]: 12, zIndex: 1 }} />
              <TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "ابحث…" : "Search…"} placeholderTextColor={colors.inkMuted48} style={{ height: 40, borderRadius: 9999, backgroundColor: tile1, borderWidth: 1, borderColor: colors.hairline, fontSize: 14, color: colors.ink, paddingLeft: isArabic ? 16 : 36, paddingRight: isArabic ? 36 : 16, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }} />
            </View>

            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.hairline, marginBottom: 16 }}>
              {(["friends", "circles"] as OpponentTab[]).map((t) => {
                const active = opponentTab === t;
                return (
                  <Pressable key={t} onPress={() => setOpponentTab(t)} style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
                    <AppText style={{ fontSize: 13, fontWeight: active ? "600" : "400", color: active ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, active ? 600 : 400) }}>{t === "friends" ? (isArabic ? "أصدقاء" : "Friends") : isArabic ? "حلقات" : "Circles"}</AppText>
                    {active && <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary }} />}
                  </Pressable>
                );
              })}
            </View>

            {opponentTab === "friends" && (
              <View style={{ gap: 8 }}>
                {filteredMutuals.map((m) => {
                  const selected = selectedFriends.includes(m.id);
                  return (
                    <Pressable key={m.id} onPress={() => toggleFriend(m.id)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, backgroundColor: selected ? primaryFaint : cardBg, borderColor: selected ? selBorder : colors.hairline }}>
                      <Avatar initials={m.initials} size={40} />
                      <AppText style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? m.arabicName : m.name}</AppText>
                      <Checkbox on={selected} />
                    </Pressable>
                  );
                })}
              </View>
            )}

            {opponentTab === "circles" && (
              <View style={{ gap: 8 }}>
                {filteredCircles.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Users size={32} color={colors.inkMuted48} style={{ marginBottom: 12 }} />
                    <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "لسه مفيش حلقات" : "No circles yet"}</AppText>
                    <Pressable onPress={() => router.push("/circles")} style={{ marginTop: 12 }}>
                      <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "اعمل حلقة" : "Create one"}</AppText>
                    </Pressable>
                  </View>
                ) : (
                  filteredCircles.map((g) => {
                    const selected = selectedCircles.includes(g.id);
                    return (
                      <Pressable key={g.id} onPress={() => toggleCircle(g.id)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, backgroundColor: selected ? primaryFaint : cardBg, borderColor: selected ? selBorder : colors.hairline }}>
                        <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center" }}>
                          <Users size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                          <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? g.arabicName : g.name}</AppText>
                          <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>{g.memberCount} {isArabic ? "أعضاء" : "members"}</AppText>
                        </View>
                        <Checkbox on={selected} />
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        {step === "duration" && (
          <View style={{ gap: 12 }}>
            {DURATIONS.map((d) => {
              const sel = duration === d.id;
              return (
                <Pressable key={d.id} onPress={() => setDuration(d.id)} style={{ padding: 16, borderRadius: 10, borderWidth: 1, backgroundColor: sel ? primaryFaint : cardBg, borderColor: sel ? selBorder : colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                  <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? d.arabicLabel : d.label}</AppText>
                  <Checkbox on={sel} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky footer CTA */}
      {step === "opponents" && totalOpponents > 0 && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.canvas }}>
          <Pressable onPress={() => setStep("duration")} style={{ width: "100%", height: 44, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? `التالي · ${totalOpponents} منافس` : `Next · ${totalOpponents} ${totalOpponents === 1 ? "opponent" : "opponents"}`}</AppText>
          </Pressable>
        </View>
      )}

      {step === "duration" && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.canvas }}>
          <Pressable onPress={handleCreate} style={{ width: "100%", height: 44, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ابدأ التحدي" : "Start Challenge"}</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}
