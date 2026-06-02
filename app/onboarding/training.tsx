/**
 * TrainingSetup — RN port of src/screens/onboarding/TrainingSetup.tsx.
 * Location segmented chips, days/week 7-grid, session-length 3-grid + an
 * "auto" option.
 */
import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { TrainingLocationV2, SessionLength } from "../../src/types";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";

const LOCATIONS: { id: TrainingLocationV2; en: string; ar: string }[] = [
  { id: "gym", en: "Gym", ar: "جيم" },
  { id: "home", en: "Home", ar: "بيت" },
  { id: "mix", en: "Mix", ar: "مزيج" },
];

const SESSION_LENGTHS: Exclude<SessionLength, "auto" | undefined>[] = [20, 30, 45, 60, 75, 90];

function SectionLabel({
  children,
  isArabic,
  trailing,
}: {
  children: string;
  isArabic: boolean;
  trailing?: string;
}) {
  return (
    <View
      style={{
        flexDirection: isArabic ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: trailing ? "space-between" : "flex-start",
        paddingHorizontal: 4,
        marginBottom: 8,
      }}
    >
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
        {children}
      </AppText>
      {trailing && (
        <AppText className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 11 }}>
          {trailing}
        </AppText>
      )}
    </View>
  );
}

export default function TrainingSetup() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";

  const selectLocation = (id: TrainingLocationV2) =>
    setUser({
      ...user,
      trainingLocationV2: id,
      trainingLocation: id === "gym" ? "full-gym" : "home-equipment",
    });

  const canContinue =
    !!user.trainingLocationV2 && !!user.daysPerWeek && user.sessionLength !== undefined;

  const cellStyle = (sel: boolean) => ({
    borderRadius: 8,
    borderWidth: 1,
    borderColor: sel ? colors.primary : colors.hairline,
    backgroundColor: colors.canvas,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  });
  const cellText = (sel: boolean) => ({ color: sel ? colors.primary : colors.ink });

  return (
    <OnboardingLayout
      step={9}
      title="Training setup"
      arabicTitle="إعداد التدريب"
      subtitle="How should your training fit your life?"
      arabicSubtitle="تدريبك يتأقلم مع حياتك إزاي؟"
      footer={
        <ContinueButton onPress={() => router.push("/onboarding/health")} disabled={!canContinue} />
      }
    >
      <View style={{ paddingBottom: 16, gap: 16 }}>
        {/* Location */}
        <View>
          <SectionLabel isArabic={isArabic}>{isArabic ? "مكان التدريب" : "LOCATION"}</SectionLabel>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
            {LOCATIONS.map((loc) => {
              const sel = user.trainingLocationV2 === loc.id;
              return (
                <Pressable key={loc.id} onPress={() => selectLocation(loc.id)} style={[cellStyle(sel), { flex: 1, paddingVertical: 12 }]}>
                  <AppText variant="body-strong" style={cellText(sel)}>
                    {isArabic ? loc.ar : loc.en}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Days / week */}
        <View>
          <SectionLabel isArabic={isArabic}>{isArabic ? "أيام في الأسبوع" : "DAYS / WEEK"}</SectionLabel>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const sel = user.daysPerWeek === day;
              return (
                <Pressable
                  key={day}
                  onPress={() => setUser({ ...user, daysPerWeek: day })}
                  style={[cellStyle(sel), { flex: 1, aspectRatio: 1 }]}
                >
                  <AppText variant="body-strong" style={cellText(sel)}>
                    {String(day)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Session length */}
        <View>
          <SectionLabel isArabic={isArabic} trailing={isArabic ? "اختياري" : "Optional"}>
            {isArabic ? "مدة الجلسة" : "SESSION LENGTH"}
          </SectionLabel>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
            {SESSION_LENGTHS.map((len) => {
              const sel = user.sessionLength === len;
              return (
                <Pressable
                  key={len}
                  onPress={() => setUser({ ...user, sessionLength: len })}
                  style={[cellStyle(sel), { width: "31.5%", paddingVertical: 10 }]}
                >
                  <AppText variant="body-strong" style={cellText(sel)}>
                    {isArabic ? `${len} دقيقة` : `${len} min`}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => setUser({ ...user, sessionLength: "auto" })}
            style={[cellStyle(user.sessionLength === "auto"), { marginTop: 8, paddingVertical: 10 }]}
          >
            <AppText style={{ fontSize: 13, fontWeight: "500", color: user.sessionLength === "auto" ? colors.primary : colors.ink, fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
              {isArabic ? "مش متأكد - سيب المدرب يقرر" : "Not sure — let coach decide"}
            </AppText>
          </Pressable>
        </View>
      </View>
    </OnboardingLayout>
  );
}
