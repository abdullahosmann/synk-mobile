/**
 * PreSessionExerciseDetail — RN port of src/screens/main/PreSessionExerciseDetail.tsx.
 *
 * Per-exercise detail shown from the pre-session list: hero image, editable
 * reps×weight rounds (+ add round), correct-form steps, common mistake, pro
 * tips, a "view progression" link, and a coach Q&A card.
 *
 * Web→RN: useParams → useLocalSearchParams; navigate(-1) → router.back();
 * navigate("/coach",{state}) → router.push({params}); <input>/<img> → TextInput
 * / expo-image.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Activity,
  Plus,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  ChevronRight,
} from "lucide-react-native";
import { useAppContext } from "../../../src/AppContext";
import { useToast } from "../../../src/components/ToastProvider";
import CoachAvatar from "../../../src/components/CoachAvatar";
import { EXERCISE_LIBRARY } from "../../../src/data/exercises";
import { useColors } from "../../../src/theme/ThemeProvider";
import { AppText } from "../../../src/components/ui/Typography";

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function PreSessionExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const exercise =
    (EXERCISE_LIBRARY.find((e) => e.id === id) as any) || {
      id: "default",
      name: isArabic ? "تمرين" : "Exercise",
      sets: 3,
      reps: 12,
      weight: 10,
      muscleGroup: "chest",
      equipment: "dumbbell",
      image:
        "https://images.unsplash.com/photo-1541534741688-6078c65b5a33?auto=format&fit=crop&q=80&w=800",
    };

  const [sets, setSets] = useState<{ reps: number | string; weight: number | string }[]>(
    Array.from({ length: exercise.sets || 3 }).map(() => ({
      reps: exercise.reps || 12,
      weight: exercise.weight || 10,
    })),
  );

  const addRound = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, lastSet ? { ...lastSet } : { reps: 12, weight: 10 }]);
  };

  const instructions: string[] = exercise.instructions || [
    isArabic ? "قف مستقيماً مع شد عضلات الجذع." : "Stand tall with your core engaged.",
    isArabic ? "تحكم في الحركة أثناء النزول (العد السلبي)." : "Control the eccentric (lowering) phase.",
    isArabic ? "توقف قليلاً في أقصى نقطة من الحركة." : "Pause briefly at the bottom of the movement.",
    isArabic ? "ادفع بقوة للعودة إلى وضع البداية." : "Push explosively back to the starting position.",
  ];

  const commonMistake: string =
    exercise.commonMistake ||
    (isArabic
      ? "تجنب استخدام قوة الدفع (المرجحة) لرفع الوزن. حافظ على ثبات جسمك وركز على العضلة المستهدفة."
      : "Avoid using momentum to swing the weight up. Keep your body stable and rely entirely on the target muscle.");

  const proTips: string[] = exercise.proTip
    ? Array.isArray(exercise.proTip)
      ? exercise.proTip
      : [exercise.proTip]
    : [
        isArabic
          ? "تنفس بانتظام: شهيق أثناء النزول وزفير أثناء الدفع."
          : "Breathe rhythmically: inhale on the way down, exhale as you push.",
        isArabic
          ? "ركز على الاتصال العضلي العصبي (Mind-muscle connection)."
          : "Focus on the mind-muscle connection.",
      ];

  const handleUpdateSet = (index: number, field: "reps" | "weight", value: string) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const sectionTitle = (text: string, marginBottom = 16) => (
    <AppText
      variant="section-title"
      style={{
        color: colors.ink,
        marginBottom,
        textTransform: "uppercase",
        textAlign: isArabic ? "right" : "left",
      }}
    >
      {text}
    </AppText>
  );

  const circleBtn = {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.canvasParchment,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const coachQuestion = (label: string, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={{
        backgroundColor: colors.canvas,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: isArabic ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <AppText
        style={{
          flex: 1,
          fontSize: 15,
          color: colors.primary,
          textAlign: isArabic ? "right" : "left",
          fontFamily: fontFamily(isArabic),
        }}
      >
        {label}
      </AppText>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "rgba(0,102,204,0.1)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ArrowRight size={14} color={colors.primary} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
      </View>
    </Pressable>
  );

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
        <Pressable onPress={() => router.back()} style={circleBtn}>
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
          {isArabic ? "تفاصيل التمرين" : "Exercise Details"}
        </AppText>
        <Pressable
          onPress={() =>
            showToast(isArabic ? "بدور على بدائل..." : "Finding alternatives...", "success")
          }
          style={circleBtn}
        >
          <RefreshCw size={18} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 48 }}
      >
        {/* Hero image */}
        <View style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.canvasParchment }}>
          <Image source={{ uri: exercise.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={48} color="#fff" fill="#fff" style={{ marginLeft: 8 }} />
          </View>
        </View>

        {/* Title row */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: colors.canvasParchment,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText
              variant="section-title"
              style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}
            >
              {exercise.name}
            </AppText>
            <AppText
              style={{
                fontSize: 13,
                color: colors.inkMuted48,
                marginTop: 4,
                textAlign: isArabic ? "right" : "left",
                fontFamily: fontFamily(isArabic),
              }}
            >
              {sets.length} {isArabic ? "جولة" : sets.length === 1 ? "round" : "rounds"}
            </AppText>
          </View>
        </View>

        {/* Sets */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {sets.map((set, index) => (
            <View
              key={index}
              style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.canvasParchment,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: isArabic ? "row-reverse" : "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <TextInput
                  value={String(set.reps)}
                  keyboardType="number-pad"
                  onChangeText={(t) => handleUpdateSet(index, "reps", t)}
                  style={{
                    width: 48,
                    fontSize: 20,
                    fontWeight: "600",
                    color: colors.ink,
                    textAlign: "center",
                    padding: 0,
                  }}
                />
                <AppText
                  style={{
                    fontSize: 11,
                    color: colors.inkMuted48,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontFamily: fontFamily(isArabic),
                  }}
                >
                  {isArabic ? "تكرار" : "reps"}
                </AppText>
              </View>
              <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.inkMuted48 }}>×</AppText>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.canvasParchment,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: isArabic ? "row-reverse" : "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <TextInput
                  value={String(set.weight)}
                  keyboardType="numeric"
                  onChangeText={(t) => handleUpdateSet(index, "weight", t)}
                  style={{
                    width: 48,
                    fontSize: 20,
                    fontWeight: "600",
                    color: colors.ink,
                    textAlign: "center",
                    padding: 0,
                  }}
                />
                <AppText
                  style={{
                    fontSize: 11,
                    color: colors.inkMuted48,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    fontFamily: fontFamily(isArabic),
                  }}
                >
                  {user.weightUnit}
                </AppText>
              </View>
            </View>
          ))}

          <Pressable
            onPress={addRound}
            style={({ pressed }) => ({
              maxWidth: 200,
              width: "100%",
              height: 48,
              borderRadius: 14,
              backgroundColor: colors.canvasParchment,
              borderWidth: 1,
              borderColor: colors.hairline,
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 8,
              alignSelf: isArabic ? "flex-end" : "flex-start",
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <Plus size={18} color={colors.primary} />
            <AppText
              style={{ fontSize: 15, fontWeight: "600", color: colors.primary, fontFamily: fontFamily(isArabic, 600) }}
            >
              {isArabic ? "أضف جولة" : "Add Round"}
            </AppText>
          </Pressable>
        </View>

        {/* Correct form */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
          {sectionTitle(isArabic ? "الفورم الصح" : "CORRECT FORM")}
          <View style={{ gap: 12 }}>
            {instructions.map((inst, idx) => (
              <View
                key={idx}
                style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}
              >
                <AppText
                  style={{ fontSize: 15, fontWeight: "600", color: colors.inkMuted48, width: 24, marginTop: 1 }}
                >
                  {idx + 1}.
                </AppText>
                <AppText
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: colors.ink,
                    lineHeight: 22,
                    textAlign: isArabic ? "right" : "left",
                    fontFamily: fontFamily(isArabic),
                  }}
                >
                  {inst}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* Common mistake */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
          {sectionTitle(isArabic ? "غلطة شائعة" : "COMMON MISTAKE", 12)}
          <AppText
            style={{
              fontSize: 15,
              color: colors.ink,
              lineHeight: 22,
              textAlign: isArabic ? "right" : "left",
              fontFamily: fontFamily(isArabic),
            }}
          >
            {commonMistake}
          </AppText>
        </View>

        {/* Pro tips */}
        <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
          {sectionTitle(isArabic ? "نصايح من الكوتش" : "PRO TIPS", 12)}
          <View style={{ gap: 8 }}>
            {proTips.map((tip, idx) => (
              <View
                key={idx}
                style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink, marginTop: 8 }} />
                <AppText
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: colors.ink,
                    lineHeight: 22,
                    textAlign: isArabic ? "right" : "left",
                    fontFamily: fontFamily(isArabic),
                  }}
                >
                  {tip}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* View progression */}
        <View style={{ marginHorizontal: 20, marginTop: 32, marginBottom: 12 }}>
          <Pressable
            onPress={() => router.push(`/exercise/${id}`)}
            style={({ pressed }) => ({
              backgroundColor: colors.canvas,
              borderRadius: 14,
              padding: 16,
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <TrendingUp size={16} color={colors.primary} />
              <AppText
                style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: fontFamily(isArabic, 600) }}
              >
                {isArabic ? "شوف تقدمك" : "View progression"}
              </AppText>
            </View>
            <ChevronRight size={16} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Pressable>
        </View>

        {/* Coach Q&A */}
        <View style={{ marginHorizontal: 20, marginBottom: 48 }}>
          <View style={{ backgroundColor: "rgba(0,102,204,0.05)", borderRadius: 14, padding: 20, gap: 12 }}>
            <View
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <CoachAvatar coachId={user.coach || "khaled"} size={32} />
              <AppText
                style={{
                  flex: 1,
                  fontSize: 17,
                  fontWeight: "600",
                  color: colors.ink,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: fontFamily(isArabic, 600),
                }}
              >
                {isArabic ? "أسئلة للكوتش" : "QUESTIONS FOR YOUR COACH"}
              </AppText>
            </View>

            {[
              { en: "Can it improve my core strength?", ar: "هيحسن ايه فيا؟" },
              { en: "How often should I include this exercise?", ar: "أعمله كام مرة في الأسبوع؟" },
              { en: "What common mistakes should I avoid?", ar: "أتجنب إيه من الأخطاء؟" },
              { en: `What are the benefits of ${exercise.name}?`, ar: `إيه فوائد ${exercise.name}؟` },
            ].map((q, i) =>
              coachQuestion(
                isArabic ? q.ar : q.en,
                () => showToast(isArabic ? "بسأل الكوتش..." : "Asking your coach...", "success"),
                `q${i}`,
              ),
            )}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/coach",
                  params: {
                    contextHint: JSON.stringify({
                      type: "exercise",
                      exerciseName: exercise?.name,
                      arabicExerciseName: exercise?.arabicName,
                    }),
                  },
                })
              }
              style={{
                backgroundColor: colors.canvas,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                <HelpCircle size={18} color={colors.primary} />
                <AppText style={{ fontSize: 15, color: colors.primary, fontFamily: fontFamily(isArabic) }}>
                  {isArabic ? "عندي سؤال تاني" : "I have another question."}
                </AppText>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "rgba(0,102,204,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={14} color={colors.primary} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
