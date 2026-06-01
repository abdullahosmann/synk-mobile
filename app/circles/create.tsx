/**
 * CircleCreate — RN port of src/screens/main/CircleCreate.tsx.
 *
 * Step 1: circle name (30-char cap) + friend multi-select with search.
 * Step 2: pick the weekly competition metric (workouts / volume / streak).
 * Sticky footer CTA: Continue (step 1) / Create Circle (step 2), disabled until
 * valid. Custom back steps through.
 *
 * Web→RN: navigate(-1) → router.back(); <input> → <TextInput>; shared Avatar.
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check, Search as SearchIcon, Dumbbell, Activity, Flame, ChevronRight } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import Avatar from "../../src/components/Avatar";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

const MOCK_MUTUALS = [
  { id: "yousef", name: "Yousef Adel", arabicName: "يوسف عادل", initials: "YA" },
  { id: "mariam", name: "Mariam Hassan", arabicName: "مريم حسن", initials: "MH" },
  { id: "omar", name: "Omar Sherif", arabicName: "عمر شريف", initials: "OS" },
  { id: "salma", name: "Salma Tarek", arabicName: "سلمى طارق", initials: "ST" },
  { id: "khaled", name: "Khaled Hassan", arabicName: "خالد حسن", initials: "KH" },
  { id: "nour", name: "Nour Ibrahim", arabicName: "نور إبراهيم", initials: "NI" },
];

type Metric = "workouts" | "volume" | "streak";

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function CircleCreate() {
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const [circleName, setCircleName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [metric, setMetric] = useState<Metric | null>(null);

  const filtered = useMemo(() => (!query.trim() ? MOCK_MUTUALS : MOCK_MUTUALS.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.arabicName.includes(query))), [query]);
  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const canCreate = circleName.trim().length > 0 && selected.length > 0;

  const handleCreate = () => {
    showToast(isArabic ? "تم إنشاء الحلقة" : "Circle created", "success");
    router.replace("/circles");
  };
  const handleBack = () => {
    if (step === 2) setStep(1);
    else router.back();
  };

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const tile1 = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const primaryTint = colors.primary + "1A";
  const primaryFaint = colors.primary + "0D";
  const selBorder = colors.primary + "4D";
  const checkBorder = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
  const disabledBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const label = isArabic ? "right" : "left";

  const metricCards: { id: Metric; icon: React.ReactNode; title: string; subtitle: string }[] = [
    { id: "workouts", icon: <Dumbbell size={24} color={colors.primary} />, title: isArabic ? "أكتر تمارين" : "Most workouts", subtitle: isArabic ? "مين اللي التزم أكتر الأسبوع ده" : "Who showed up most this week" },
    { id: "volume", icon: <Activity size={24} color={colors.primary} />, title: isArabic ? "إجمالي الحجم" : "Total volume", subtitle: isArabic ? "إجمالي الوزن المرفوع في كل السيتات" : "Total kg lifted across all sets" },
    { id: "streak", icon: <Flame size={24} color={colors.primary} />, title: isArabic ? "أطول سلسلة" : "Longest streak", subtitle: isArabic ? "أكتر أيام متتالية تمرين" : "Most consecutive days training" },
  ];

  const ctaEnabled = step === 1 ? canCreate : !!metric;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={handleBack} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حلقة جديدة" : "New Circle"}</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}>
        {step === 1 && (
          <>
            <View style={{ marginBottom: 24 }}>
              <AppText style={{ fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, color: colors.inkMuted48, marginBottom: 8, textAlign: label, fontFamily: ff(isArabic, 600) }}>{isArabic ? "اسم الحلقة" : "Circle name"}</AppText>
              <TextInput
                value={circleName}
                onChangeText={(t) => t.length <= 30 && setCircleName(t)}
                placeholder={isArabic ? "مثلاً: شلة الجيم" : "e.g. Gym Squad"}
                placeholderTextColor={colors.inkMuted48}
                style={{ height: 48, borderRadius: 14, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 16, fontSize: 15, color: colors.ink, textAlign: label, fontFamily: ff(isArabic) }}
              />
              <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 4, textAlign: isArabic ? "left" : "right", fontVariant: ["tabular-nums"] }}>{circleName.length} / 30</AppText>
            </View>

            <View>
              <AppText style={{ fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, color: colors.inkMuted48, marginBottom: 8, textAlign: label, fontFamily: ff(isArabic, 600) }}>
                {isArabic ? `الأعضاء${selected.length > 0 ? ` · ${selected.length}` : ""}` : `Members${selected.length > 0 ? ` · ${selected.length}` : ""}`}
              </AppText>
              <View style={{ justifyContent: "center", marginBottom: 12 }}>
                <SearchIcon size={16} color={colors.inkMuted48} style={{ position: "absolute", top: 12, [isArabic ? "right" : "left"]: 12, zIndex: 1 }} />
                <TextInput value={query} onChangeText={setQuery} placeholder={isArabic ? "ابحث في أصدقائك…" : "Search your friends…"} placeholderTextColor={colors.inkMuted48} style={{ height: 40, borderRadius: 9999, backgroundColor: tile1, borderWidth: 1, borderColor: colors.hairline, fontSize: 14, color: colors.ink, paddingLeft: isArabic ? 16 : 36, paddingRight: isArabic ? 36 : 16, textAlign: label, fontFamily: ff(isArabic) }} />
              </View>
              <View style={{ gap: 8 }}>
                {filtered.map((m) => {
                  const sel = selected.includes(m.id);
                  return (
                    <Pressable key={m.id} onPress={() => toggle(m.id)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, backgroundColor: sel ? primaryFaint : cardBg, borderColor: sel ? selBorder : colors.hairline }}>
                      <Avatar initials={m.initials} size={40} />
                      <AppText style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.ink, textAlign: label, fontFamily: ff(isArabic, 600) }}>{isArabic ? m.arabicName : m.name}</AppText>
                      <View style={{ width: 24, height: 24, borderRadius: 9999, alignItems: "center", justifyContent: "center", backgroundColor: sel ? colors.primary : "transparent", borderWidth: sel ? 0 : 2, borderColor: checkBorder }}>
                        {sel && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {step === 2 && (
          <View style={{ gap: 24 }}>
            <View>
              <AppText style={{ fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: colors.inkMuted48, marginBottom: 8, textAlign: label, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الخطوة ٣ من ٣" : "STEP 3 OF 3"}</AppText>
              <AppText style={{ fontSize: 22, fontWeight: "600", color: colors.ink, lineHeight: 25, letterSpacing: -0.3, marginBottom: 8, textAlign: label, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ايه المنافسة بينكم؟" : "How do you compete?"}</AppText>
              <AppText style={{ fontSize: 15, lineHeight: 22, letterSpacing: -0.2, color: colors.inkMuted48, textAlign: label, fontFamily: ff(isArabic) }}>{isArabic ? "اختار المقياس اللي حلقتك هتتنافس فيه كل أسبوع. مش هتقدر تغيره بعدين." : "Pick the metric your circle will rank by each week. You can't change this later."}</AppText>
            </View>

            <View style={{ gap: 12 }}>
              {metricCards.map((mc) => {
                const sel = metric === mc.id;
                return (
                  <Pressable key={mc.id} onPress={() => setMetric(mc.id)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16, minHeight: 80, padding: 16, borderRadius: 10, borderWidth: 2, backgroundColor: sel ? primaryFaint : cardBg, borderColor: sel ? colors.primary : colors.hairline }}>
                    <View style={{ width: 48, height: 44, borderRadius: 9999, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center" }}>{mc.icon}</View>
                    <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textAlign: label, fontFamily: ff(isArabic, 600) }}>{mc.title}</AppText>
                      <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 4, textAlign: label, fontFamily: ff(isArabic) }}>{mc.subtitle}</AppText>
                    </View>
                    {sel && <Check size={20} color={colors.primary} strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky footer CTA */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.canvas }}>
        <Pressable
          onPress={() => (step === 1 ? setStep(2) : handleCreate())}
          disabled={!ctaEnabled}
          style={{ width: "100%", height: 44, borderRadius: 9999, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: ctaEnabled ? colors.primary : disabledBg }}
        >
          <AppText style={{ fontSize: 14, fontWeight: "600", color: ctaEnabled ? colors.onPrimary : colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{step === 1 ? (isArabic ? "كمل" : "Continue") : isArabic ? "إنشاء الحلقة" : "Create Circle"}</AppText>
          {step === 1 && <ChevronRight size={18} color={ctaEnabled ? colors.onPrimary : colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />}
        </Pressable>
      </View>
    </View>
  );
}
