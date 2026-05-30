/**
 * InjuriesLevel — RN port of src/screens/onboarding/InjuriesLevel.tsx.
 * Experience radio list + injury/limitation chips (with "none" exclusivity and
 * an "other" free-text field) + a coach note.
 */
import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { FitnessLevel } from "../../src/types";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";

const LEVEL_OPTIONS: { id: FitnessLevel; enTitle: string; arTitle: string; enSub: string; arSub: string }[] = [
  { id: "beginner", enTitle: "Beginner", arTitle: "مبتدئ", enSub: "0–6 months of consistent training", arSub: "من ٠ لـ ٦ شهور تدريب منتظم" },
  { id: "intermediate", enTitle: "Intermediate", arTitle: "متوسط", enSub: "6 months–2 years of consistent training", arSub: "٦ شهور لـ سنتين تدريب منتظم" },
  { id: "advanced", enTitle: "Advanced", arTitle: "متقدم", enSub: "2+ years of consistent training", arSub: "أكتر من سنتين تدريب منتظم" },
];

const INJURY_OPTIONS: { id: string; en: string; ar: string }[] = [
  { id: "none", en: "No issues", ar: "لا توجد" },
  { id: "back", en: "Back", ar: "ظهر" },
  { id: "knees", en: "Knees", ar: "ركبة" },
  { id: "shoulders", en: "Shoulders", ar: "كتف" },
  { id: "wrists", en: "Wrists", ar: "معصم" },
  { id: "ankles", en: "Ankles", ar: "كاحل" },
  { id: "other", en: "Other", ar: "أخرى" },
];

export default function InjuriesLevel() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";

  const toggleInjury = (id: string) => {
    let next = [...user.injuries];
    if (id === "none") {
      next = next.includes("none") ? [] : ["none"];
    } else {
      next = next.filter((i) => i !== "none");
      next = next.includes(id) ? next.filter((i) => i !== id) : [...next, id];
    }
    setUser({ ...user, injuries: next });
  };

  return (
    <OnboardingLayout
      step={6}
      title="Train safely"
      arabicTitle="تدريب آمن"
      subtitle="How should I train you safely?"
      arabicSubtitle="أدربك إزاي بأمان؟"
      footer={
        <ContinueButton
          onPress={() => router.push("/onboarding/training")}
          disabled={!user.fitnessLevel}
        />
      }
    >
      <View style={{ paddingBottom: 16 }}>
        {/* Experience */}
        <AppText
          className="text-ink-muted-48 dark:text-ink-dark-muted-48"
          style={{
            paddingHorizontal: 4,
            marginBottom: 12,
            fontSize: isArabic ? 13 : 12,
            fontWeight: "600",
            letterSpacing: isArabic ? 0 : 0.48,
            textTransform: isArabic ? "none" : "uppercase",
            textAlign: isArabic ? "right" : "left",
            fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold",
          }}
        >
          {isArabic ? "الخبرة" : "EXPERIENCE"}
        </AppText>
        <View style={{ gap: 8 }}>
          {LEVEL_OPTIONS.map((opt) => {
            const sel = user.fitnessLevel === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setUser({ ...user, fitnessLevel: opt.id })}
                style={{
                  flexDirection: isArabic ? "row-reverse" : "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.canvas,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? colors.primary : colors.hairline,
                  borderRadius: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="body-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>
                    {isArabic ? opt.arTitle : opt.enTitle}
                  </AppText>
                  <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 2, textAlign: isArabic ? "right" : "left" }}>
                    {isArabic ? opt.arSub : opt.enSub}
                  </AppText>
                </View>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.25)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: sel ? colors.primary : "transparent" }} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Injuries */}
        <View style={{ marginTop: 32 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 8 }}>
            <AppText
              className="text-ink-muted-48 dark:text-ink-dark-muted-48"
              style={{
                fontSize: isArabic ? 12 : 11,
                fontWeight: "600",
                letterSpacing: isArabic ? 0 : 0.44,
                textTransform: isArabic ? "none" : "uppercase",
                fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold",
              }}
            >
              {isArabic ? "أي إصابات أو محدوديات؟" : "ANY INJURIES OR LIMITATIONS?"}
            </AppText>
            <AppText className="text-ink-muted-24 dark:text-ink-dark-muted-24" style={{ fontSize: 10, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1 }}>
              {isArabic ? "اختياري" : "OPTIONAL"}
            </AppText>
          </View>

          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
            {INJURY_OPTIONS.map((opt) => {
              const sel = user.injuries.includes(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => toggleInjury(opt.id)}
                  style={{
                    minHeight: 40,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: sel ? colors.primary : colors.hairline,
                    backgroundColor: colors.canvas,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText variant="caption-strong" style={{ color: sel ? colors.primary : colors.ink }}>
                    {isArabic ? opt.ar : opt.en}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {user.injuries.includes("other") && (
            <View style={{ marginTop: 12, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 8, padding: 12 }}>
              <TextInput
                multiline
                numberOfLines={2}
                value={user.injuriesOther || ""}
                onChangeText={(t) => setUser({ ...user, injuriesOther: t })}
                placeholder={isArabic ? "قولي إصابة، ألم، أو حركة لازم نتجنبها" : "Tell me which injury, pain, or movement to avoid"}
                placeholderTextColor={colors.inkMuted48}
                style={{
                  fontSize: 14,
                  color: colors.ink,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular",
                  minHeight: 40,
                  textAlignVertical: "top",
                }}
              />
            </View>
          )}
        </View>

        <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginTop: 32, lineHeight: 22, textAlign: isArabic ? "right" : "left" }}>
          {isArabic
            ? "هتجنّب الحركات اللي ممكن تأذيك وهظبط الشدة على مستواك."
            : "I'll avoid risky movements and adjust intensity around your level."}
        </AppText>
      </View>
    </OnboardingLayout>
  );
}
