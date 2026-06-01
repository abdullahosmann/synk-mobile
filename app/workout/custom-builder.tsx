/**
 * CustomSessionBuilder — RN port of src/screens/main/CustomSessionBuilder.tsx.
 *
 * A single-screen form: pick workout focus / available time / location &
 * equipment / readiness / intensity (each as selectable chips, pre-seeded from
 * the user's onboarding profile), with an injury banner and a sticky
 * "Create new session" CTA that generates a mock workout and routes to preview.
 *
 * Web→RN: navigate(-1) → router.back(); navigate("/workout/preview",{state}) →
 * router.push({params}); the IntensityIcon <svg> bars → react-native-svg.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";
import { ArrowLeft } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

function fontFamily(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

type ChipSize = "md" | "sm";

function IntensityBars({ level, color }: { level: "basic" | "moderate" | "high"; color: string }) {
  const y0 = level === "basic" ? 16 : level === "moderate" ? 12 : 8;
  const h0 = level === "basic" ? 4 : level === "moderate" ? 8 : 12;
  const y1 = level === "basic" ? 12 : level === "moderate" ? 8 : 4;
  const h1 = level === "basic" ? 8 : level === "moderate" ? 12 : 16;
  const y2 = level === "basic" ? 8 : level === "moderate" ? 4 : 0;
  const h2 = level === "basic" ? 12 : level === "moderate" ? 16 : 20;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Rect x={2} y={y0} width={5} height={h0} rx={1} fill={color} />
      <Rect x={9} y={y1} width={5} height={h1} rx={1} fill={color} />
      <Rect x={16} y={y2} width={5} height={h2} rx={1} fill={color} />
    </Svg>
  );
}

export default function CustomSessionBuilder() {
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [workoutFocus, setWorkoutFocus] = useState<string | null>(() => {
    const primaryGoal: string = (user.goals?.[0] as string) || (user as any).goal;
    switch (primaryGoal) {
      case "build-strength":
        return "strength";
      case "gain-muscle":
        return "muscle_gain";
      case "lose-body-fat":
        return "fat_loss";
      case "improve-cardio":
        return "cardio";
      case "sport-performance":
        return "strength";
      case "stay-consistent":
        return "cardio";
      case "lose-weight":
        return "fat_loss";
      case "build-muscle":
        return "muscle_gain";
      case "stay-fit":
        return "cardio";
      case "athletic-performance":
        return "strength";
      case "strength":
        return "strength";
      case "muscle":
        return "muscle_gain";
      case "weight_loss":
        return "fat_loss";
      case "endurance":
        return "cardio";
      default:
        return null;
    }
  });
  const [duration, setDuration] = useState<number | null>(() => {
    if ((user as any).preferredDuration === "short") return 25;
    if ((user as any).preferredDuration === "long") return 60;
    return 45;
  });
  const [locationEquipment, setLocationEquipment] = useState<string | null>(() => {
    if (user.trainingLocation === "home-equipment") return "home_dumbbells";
    if ((user.trainingLocation as any) === "gym") return "full_gym";
    if (user.trainingLocation === "bodyweight-only") return "home_bodyweight";
    return null;
  });
  const [readiness, setReadiness] = useState<string | null>("normal");
  const [intensity, setIntensity] = useState<string | null>(() => {
    if ((user as any).fitnessLevel === "beginner") return "easy";
    if ((user as any).fitnessLevel === "intermediate") return "moderate";
    if ((user as any).fitnessLevel === "advanced") return "hard";
    return null;
  });

  const hasInjuries = user.injuries && user.injuries.length > 0;
  const isValid = workoutFocus && duration && locationEquipment && readiness && intensity;

  const handleCreate = () => {
    if (!isValid) return;
    showToast(isArabic ? "بصمم جلستك..." : "Generating mock workout...", "success");
    setTimeout(() => {
      let genExercises: any[] = [];
      if (workoutFocus === "strength" || workoutFocus === "muscle_gain") {
        genExercises = [
          { id: "u1", name: "Bench Press", sets: "3", reps: "12", rest: "60s", completed: false, equipment: "Barbell" },
          { id: "u2", name: "Pull Ups", sets: "3", reps: "10", rest: "60s", completed: false, equipment: "Bodyweight" },
        ];
      } else {
        genExercises = [
          { id: "f1", name: "Burpees", sets: "3", reps: "12", rest: "60s", completed: false, equipment: "Bodyweight" },
          { id: "f2", name: "Push Ups", sets: "3", reps: "15", rest: "60s", completed: false, equipment: "Bodyweight" },
        ];
      }
      router.push({
        pathname: "/workout/preview",
        params: { exercises: JSON.stringify(genExercises) },
      });
    }, 1200);
  };

  // ---- Chip ----
  const chip = (
    key: string,
    label: React.ReactNode,
    selected: boolean,
    onPress: () => void,
    opts: { size?: ChipSize; fullWidth?: boolean; align?: "start" | "center"; height?: number; column?: boolean } = {},
  ) => {
    const { size = "md", fullWidth, align = "center", height, column } = opts;
    const textColor = selected ? colors.canvas : colors.ink;
    return (
      <Pressable
        key={key}
        onPress={onPress}
        style={{
          height: height ?? (size === "md" ? 56 : 44),
          paddingHorizontal: size === "md" ? 20 : 16,
          borderRadius: 14,
          alignItems: column ? "center" : align === "start" ? (isArabic ? "flex-end" : "flex-start") : "center",
          justifyContent: "center",
          flexDirection: column ? "column" : "row",
          gap: column ? 8 : 0,
          width: fullWidth ? "100%" : undefined,
          backgroundColor: selected ? colors.ink : colors.canvasParchment,
          borderWidth: 1,
          borderColor: selected ? "transparent" : colors.hairline,
        }}
      >
        {typeof label === "string" ? (
          <AppText
            style={{
              fontSize: size === "md" ? 15 : 13,
              fontWeight: "600",
              color: textColor,
              fontFamily: fontFamily(isArabic, 600),
              textAlign: align === "start" ? (isArabic ? "right" : "left") : "center",
            }}
          >
            {label}
          </AppText>
        ) : (
          label
        )}
      </Pressable>
    );
  };

  const sectionTitle = (text: string) => (
    <AppText
      variant="section-title"
      style={{ color: colors.ink, marginBottom: 16, textAlign: isArabic ? "right" : "left" }}
    >
      {text}
    </AppText>
  );

  const FOCUS = [
    { id: "strength", labelEn: "Strength", labelAr: "قوة" },
    { id: "muscle_gain", labelEn: "Muscle gain", labelAr: "زيادة العضلات" },
    { id: "fat_loss", labelEn: "Fat loss support", labelAr: "دعم حرق الدهون" },
    { id: "cardio", labelEn: "Cardio", labelAr: "كارديو" },
    { id: "mobility", labelEn: "Mobility", labelAr: "حركة ومرونة" },
    { id: "recovery", labelEn: "Recovery", labelAr: "استشفاء" },
    { id: "sport", labelEn: "Sport performance", labelAr: "أداء رياضي" },
  ];
  const LOCATIONS = [
    { id: "home_bodyweight", labelEn: "Home bodyweight", labelAr: "في البيت (وزن الجسم)" },
    { id: "home_dumbbells", labelEn: "Home dumbbells", labelAr: "في البيت (دمبلز)" },
    { id: "full_gym", labelEn: "Full gym", labelAr: "جيم كامل" },
    { id: "limited_equipment", labelEn: "Limited equipment", labelAr: "معدات محدودة" },
    { id: "outdoor", labelEn: "Outdoor", labelAr: "في الخارج" },
  ];
  const READINESS = [
    { id: "low", labelEn: "Low energy", labelAr: "طاقة منخفضة" },
    { id: "normal", labelEn: "Normal", labelAr: "عادي" },
    { id: "high", labelEn: "High energy", labelAr: "طاقة عالية" },
  ];
  const INTENSITY = [
    { id: "easy", labelEn: "Easy", labelAr: "سهل", level: "basic" as const },
    { id: "moderate", labelEn: "Moderate", labelAr: "متوسط", level: "moderate" as const },
    { id: "hard", labelEn: "Hard", labelAr: "صعب", level: "high" as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.canvasParchment,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
          zIndex: 50,
        }}
      >
        <Pressable
          onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.canvasParchment,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={18} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: colors.ink,
            textTransform: isArabic ? "none" : "uppercase",
            letterSpacing: 0.5,
            fontFamily: fontFamily(isArabic, 600),
          }}
        >
          {isArabic ? "تمرين مخصص" : "Custom Workout"}
        </AppText>
        <View style={{ width: 40, height: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
          maxWidth: 448,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {/* Intro */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <AppText
            style={{
              fontSize: 34,
              fontWeight: "700",
              color: colors.ink,
              lineHeight: 40,
              textAlign: isArabic ? "right" : "left",
              fontFamily: fontFamily(isArabic, 700),
            }}
          >
            {isArabic ? "تمرين مخصص" : "Custom Workout"}
          </AppText>
          <AppText
            style={{
              fontSize: 17,
              color: colors.inkMuted48,
              lineHeight: 24,
              marginTop: 8,
              textAlign: isArabic ? "right" : "left",
              fontFamily: fontFamily(isArabic),
            }}
          >
            {isArabic ? "إيه اللي تحب نعمله النهاردة؟" : "What would you like to do in our session?"}
          </AppText>
          {hasInjuries && (
            <View
              style={{
                marginTop: 16,
                backgroundColor: "rgba(255,149,0,0.1)",
                borderWidth: 1,
                borderColor: "rgba(255,149,0,0.3)",
                padding: 12,
                borderRadius: 8,
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <AppText style={{ fontSize: 20 }}>⚠️</AppText>
              <AppText
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: colors.ink,
                  lineHeight: 18,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: fontFamily(isArabic),
                }}
              >
                {isArabic
                  ? "سيتم تعديل التمارين لتجنب إجهاد المناطق المصابة بناءً على ملفك الشخصي."
                  : "We'll modify exercises to avoid stressing injured areas based on your profile."}
              </AppText>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 32, gap: 32 }}>
          {/* Workout Focus */}
          <View>
            {sectionTitle(isArabic ? "الهدف من التمرين" : "Workout Focus")}
            <View
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              {FOCUS.map((t) =>
                chip(t.id, isArabic ? t.labelAr : t.labelEn, workoutFocus === t.id, () => setWorkoutFocus(t.id)),
              )}
            </View>
          </View>

          {/* Available Time */}
          <View>
            {sectionTitle(isArabic ? "الوقت المتاح" : "Available Time")}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {[15, 25, 35, 45, 60, 90].map((t) => (
                <View key={t} style={{ width: "30.5%" }}>
                  {chip(`t${t}`, isArabic ? `${t} د` : `${t} min`, duration === t, () => setDuration(t), {
                    fullWidth: true,
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Location & Equipment */}
          <View>
            {sectionTitle(isArabic ? "المكان والمعدات" : "Location & Equipment")}
            <View style={{ gap: 12 }}>
              {LOCATIONS.map((loc) =>
                chip(loc.id, isArabic ? loc.labelAr : loc.labelEn, locationEquipment === loc.id, () => setLocationEquipment(loc.id), {
                  fullWidth: true,
                  align: "start",
                }),
              )}
            </View>
          </View>

          {/* Readiness */}
          <View>
            {sectionTitle(isArabic ? "طاقة الجسم اليوم" : "Readiness / Energy")}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
              {READINESS.map((rd) => (
                <View key={rd.id} style={{ flex: 1 }}>
                  {chip(rd.id, isArabic ? rd.labelAr : rd.labelEn, readiness === rd.id, () => setReadiness(rd.id), {
                    fullWidth: true,
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Intensity */}
          <View style={{ paddingBottom: 16 }}>
            {sectionTitle(isArabic ? "الشدّة المفضلة" : "Intensity Preference")}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
              {INTENSITY.map((lvl) => {
                const selected = intensity === lvl.id;
                return (
                  <View key={lvl.id} style={{ flex: 1 }}>
                    {chip(
                      lvl.id,
                      <>
                        <IntensityBars level={lvl.level} color={selected ? colors.canvas : colors.ink} />
                        <AppText
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: selected ? colors.canvas : colors.ink,
                            fontFamily: fontFamily(isArabic, 600),
                          }}
                        >
                          {isArabic ? lvl.labelAr : lvl.labelEn}
                        </AppText>
                      </>,
                      selected,
                      () => setIntensity(lvl.id),
                      { fullWidth: true, height: 80, column: true },
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: colors.canvasParchment,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          zIndex: 50,
        }}
      >
        <View style={{ maxWidth: 448, width: "100%", alignSelf: "center" }}>
          <Pressable
            disabled={!isValid}
            onPress={handleCreate}
            style={{
              width: "100%",
              height: 52,
              backgroundColor: colors.ink,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              opacity: !isValid ? 0.4 : 1,
            }}
          >
            <AppText
              style={{
                color: colors.canvas,
                fontSize: 15,
                fontWeight: "600",
                textTransform: isArabic ? "none" : "uppercase",
                letterSpacing: 2,
                fontFamily: fontFamily(isArabic, 600),
              }}
            >
              {isArabic ? "اعمل جلسة جديدة" : "CREATE NEW SESSION"}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
