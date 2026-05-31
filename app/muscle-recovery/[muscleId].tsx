/**
 * MuscleDetail — RN port of src/screens/main/MuscleDetail.tsx.
 *
 * Per-muscle page: highlighted BodySVG, recovery-status card, "about the muscle"
 * copy, and a list of common exercises filtered by training location. Tapping an
 * exercise opens a BottomSheet (image, coach tip, add/view actions).
 *
 * Web→RN: useParams → useLocalSearchParams; navigate(-1) → router.back();
 * BodySVG animateHighlight omitted (static); <img> → expo-image.
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Activity, Target, Dumbbell, ExternalLink } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { BodySVG } from "../../src/components/BodySVG";
import BottomSheet from "../../src/components/BottomSheet";
import { useToast } from "../../src/components/ToastProvider";
import { EXERCISE_LIBRARY } from "../../src/data/exercises";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

const MUSCLE_DETAILS: Record<string, { description: string; descriptionAr: string; exercises: string[]; exercisesAr: string[] }> = {
  shoulders: { description: "The deltoid muscle is the main muscle of the shoulder. It helps you lift your arms in all directions.", descriptionAr: "العضلة الدالية هي العضلة الرئيسية في الكتف. تساعدك على رفع ذراعيك في جميع الاتجاهات.", exercises: ["Overhead Press", "Lateral Raises", "Front Raises", "Face Pulls", "Arnold Press", "Reverse Flyes"], exercisesAr: ["ضغط الكتف العلوي", "رفرفة جانبية", "رفرفة أمامية", "سحب الوجه", "ضغط أرنولد", "رفرفة خلفية"] },
  chest: { description: "The pectoralis major is the large muscle that makes up most of the chest. It's responsible for pushing movements.", descriptionAr: "العضلة الصدرية الكبرى هي العضلة الكبيرة التي تشكل معظم الصدر. وهي مسؤولة عن حركات الدفع.", exercises: ["Bench Press", "Push-ups", "Chest Flys", "Chest Dips", "Machine Chest Press", "Cable Flyes"], exercisesAr: ["بنش برس", "تمرين الضغط", "تفتيح الصدر", "تغطيس الصدر", "جهاز ضغط الصدر", "تفتيح بالكابل"] },
  biceps: { description: "The biceps brachii is located on the front of the upper arm. It helps bend the elbow and rotate the forearm.", descriptionAr: "توجد عضلة البايسبس في مقدمة الذراع العلوي. تساعد في ثني الكوع وتدوير الساعد.", exercises: ["Barbell Curls", "Hammer Curls", "Preacher Curls", "Concentration Curls", "Incline Curls", "Chin-ups"], exercisesAr: ["تبادل بالبار", "هامر كيرل", "بريتشر كيرل", "تبادل ارتكاز", "تبادل مائل", "عقلة قبضة ضيقة"] },
  abs: { description: "The rectus abdominis and obliques make up the core. They stabilize the spine and help with trunk rotation.", descriptionAr: "تشكل العضلة المستقيمة البطنية والعضلات المائلة الجذع. فهي تثبت العمود الفقري وتساعد في دوران الجذع.", exercises: ["Plank", "Crunches", "Leg Raises", "Russian Twists", "Bicycle Crunches", "Hanging Leg Raises"], exercisesAr: ["بلانك", "طحن البطن", "رفع الأرجل", "لف روسي", "طحن الدراجة", "رفع الأرجل بالتعليق"] },
  quadriceps: { description: "The quadriceps are a group of four muscles on the front of the thigh. They are essential for extending the knee.", descriptionAr: "عضلة الكوادريسيبس هي مجموعة من أربع عضلات في مقدمة الفخذ. وهي ضرورية لمد الركبة.", exercises: ["Squats", "Leg Press", "Lunges", "Leg Extensions", "Bulgarian Split Squats", "Step-ups"], exercisesAr: ["سكوات", "دفع الأرجل", "طعن", "مد الأرجل", "سكوات بلغاري", "صعود الصندوق"] },
  back: { description: "The back includes the latissimus dorsi, rhomboids, and trapezius. These muscles are key for pulling movements.", descriptionAr: "يشمل الظهر العضلة الظهرية العريضة، والعضلات المعينية، وعضلة الترابيس. هذه العضلات أساسية لحركات السحب.", exercises: ["Pull-ups", "Bent Over Rows", "Lat Pulldowns", "Deadlifts", "Seated Cable Rows", "Single Arm DB Row"], exercisesAr: ["عقلة", "تجذيف بالبار", "سحب الظهر", "ديدليفت", "سحب أرضي", "تجذيف بالدمبل"] },
  triceps: { description: "The triceps brachii is on the back of the upper arm. It's the primary muscle for extending the elbow.", descriptionAr: "توجد عضلة الترايسبس في الجزء الخلفي من الذراع العلوي. وهي العضلة الأساسية لمد الكوع.", exercises: ["Tricep Pushdowns", "Skull Crushers", "Overhead Extensions", "Dips", "Cable Pushdowns", "Close Grip Bench"], exercisesAr: ["سحب ترايسبس", "سكول كراشرز", "مد الترايسبس العلوي", "ديبس", "سحب تراي بالكابل", "بنش ضيق"] },
  lower_back: { description: "The erector spinae muscles support the spine and help with back extension and stability.", descriptionAr: "تدعم عضلات الناصبة للفقار العمود الفقري وتساعد في مد الظهر واستقراره.", exercises: ["Back Extensions", "Good Mornings", "Deadlifts", "Bird Dog", "Supermans", "Kettlebell Swings"], exercisesAr: ["مد الظهر", "جود مورنينج", "ديدليفت", "بيرد دوج", "سوبرمان", "مرجحة كيتل بيل"] },
  glutes: { description: "The gluteus maximus is the largest muscle in the body. It's responsible for hip extension and stability.", descriptionAr: "عضلة الجلوتس هي أكبر عضلة في الجسم. وهي مسؤولة عن مد الورك واستقراره.", exercises: ["Hip Thrusts", "Glute Bridges", "Squats", "Deadlifts", "Romanian Deadlifts", "Clamshells"], exercisesAr: ["هيب ثرست", "جلوت بريدج", "سكوات", "ديدليفت", "روماني ديدليفت", "تمرين الصدفة"] },
  hamstrings: { description: "The hamstrings are on the back of the thigh. They help with knee flexion and hip extension.", descriptionAr: "توجد عضلات الهامسترينج في الجزء الخلفي من الفخذ. تساعد في ثني الركبة ومد الورك.", exercises: ["Romanian Deadlifts", "Leg Curls", "Glute-Ham Raises", "Lying Leg Curls", "Nordic Curls", "Good Mornings"], exercisesAr: ["ديدليفت روماني", "مرجحة الأرجل", "جلوت هام رايز", "مرجحة الأرجل استلقاء", "نورديك كيرل", "جود مورنينج"] },
};

const MUSCLE_NAMES: Record<string, { en: string; ar: string }> = {
  shoulders: { en: "Shoulders", ar: "الأكتاف" },
  chest: { en: "Chest", ar: "الصدر" },
  biceps: { en: "Biceps", ar: "البايسبس" },
  abs: { en: "Abs", ar: "البطن" },
  quadriceps: { en: "Quadriceps", ar: "الأفخاذ الأمامية" },
  back: { en: "Back", ar: "الظهر" },
  triceps: { en: "Triceps", ar: "الترايسبس" },
  lower_back: { en: "Lower Back", ar: "أسفل الظهر" },
  glutes: { en: "Glutes", ar: "الأرداف" },
  hamstrings: { en: "Hamstrings", ar: "الأفخاذ الخلفية" },
};

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

export default function MuscleDetail() {
  const { muscleId } = useLocalSearchParams<{ muscleId: string }>();
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const isDark = theme === "dark";

  const [openExercise, setOpenExercise] = useState<string | null>(null);

  const muscle = MUSCLE_DETAILS[muscleId || ""];
  const name = MUSCLE_NAMES[muscleId || ""];
  const recovery = user.muscleRecovery?.[muscleId || ""] ?? 100;

  const filteredExercises = useMemo(() => {
    if (!muscle) return [];
    const rawList = isArabic ? muscle.exercisesAr : muscle.exercises;
    return rawList.filter((ex) => {
      const exLower = ex.toLowerCase();
      if (user.trainingLocation === "bodyweight-only") return !exLower.includes("machine") && !exLower.includes("cable") && !exLower.includes("barbell") && !exLower.includes("db") && !exLower.includes("dumbbell") && !exLower.includes("bench press");
      if (user.trainingLocation === "home-equipment") return !exLower.includes("machine");
      return true;
    });
  }, [muscle, isArabic, user.trainingLocation]);

  const view = ["back", "triceps", "lower_back", "glutes", "hamstrings"].includes(muscleId || "") ? "back" : "front";
  const selectedExerciseData = useMemo(() => (openExercise ? EXERCISE_LIBRARY.find((ex) => ex.name.toLowerCase() === openExercise.toLowerCase()) : null), [openExercise]);

  const cardBg = colors.canvas;
  const primaryTint = colors.primary + "1A";
  const align = isArabic ? "right" : "left";

  if (!muscle || !name) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <AppText style={{ color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "العضلة غير موجودة" : "Muscle not found"}</AppText>
      </View>
    );
  }

  const recoveryBadge = recovery > 80 ? { bg: colors.primary, fg: colors.onPrimary, label: isArabic ? "مستعد" : "Fresh" } : recovery > 40 ? { bg: primaryTint, fg: colors.primary, label: isArabic ? "يتعافى" : "Recovering" } : { bg: colors.inkMuted48 + "1A", fg: colors.inkMuted48, label: isArabic ? "مجهد" : "Sore" };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvasParchment, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={24} strokeWidth={2.5} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ position: "absolute", left: 0, right: 0, top: insets.top + 18, textAlign: "center", fontSize: 17, fontWeight: "600", letterSpacing: 0.5, textTransform: isArabic ? "none" : "uppercase", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? name.ar : name.en}</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 48, maxWidth: 448, width: "100%", alignSelf: "center" }}>
        {/* Visualization */}
        <View style={{ alignItems: "center", marginBottom: 40, paddingTop: 32 }}>
          <View style={{ width: 112, height: 256 }}>
            <BodySVG view={view} recoveryData={user.muscleRecovery || {}} highlightedId={muscleId} />
          </View>
        </View>

        {/* Recovery status card */}
        <View style={{ backgroundColor: cardBg, borderRadius: 10, padding: 32, marginBottom: 32, borderWidth: 1, borderColor: colors.primary + "33" }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center" }}>
                <Activity size={22} color={colors.primary} />
              </View>
              <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 12, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: colors.inkMuted48, marginBottom: 4, fontFamily: ff(isArabic) }}>{isArabic ? "حالة الاستشفاء" : "Recovery Status"}</AppText>
                <AppText style={{ fontSize: 32, fontWeight: "600", letterSpacing: -0.5, color: colors.ink, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 600) }}>{recovery}%</AppText>
              </View>
            </View>
            <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 9999, backgroundColor: recoveryBadge.bg }}>
              <AppText style={{ fontSize: 11, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: recoveryBadge.fg, fontFamily: ff(isArabic, 600) }}>{recoveryBadge.label}</AppText>
            </View>
          </View>
          <View style={{ height: 6, width: "100%", backgroundColor: colors.hairline, borderRadius: 9999, overflow: "hidden" }}>
            <View style={{ height: "100%", width: `${recovery}%`, backgroundColor: colors.primary }} />
          </View>
        </View>

        {/* About */}
        <View style={{ marginBottom: 40, paddingHorizontal: 4 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Target size={18} strokeWidth={2.5} color={colors.primary} />
            <AppText style={{ fontSize: 12, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: colors.primary, fontFamily: ff(isArabic) }}>{isArabic ? "حول العضلة" : "About the Muscle"}</AppText>
          </View>
          <AppText style={{ fontSize: 15, color: colors.inkMuted48, lineHeight: 23, textAlign: align, fontFamily: ff(isArabic) }}>{isArabic ? muscle.descriptionAr : muscle.description}</AppText>
        </View>

        {/* Exercises */}
        <View style={{ paddingHorizontal: 4 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Dumbbell size={18} strokeWidth={2.5} color={colors.primary} />
            <AppText style={{ fontSize: 12, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: colors.primary, fontFamily: ff(isArabic) }}>{isArabic ? "تمارين شائعة" : "Common Exercises"}</AppText>
          </View>
          <View style={{ gap: 12 }}>
            {filteredExercises.map((exercise, index) => (
              <Pressable key={index} onPress={() => setOpenExercise(exercise)} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 20, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, letterSpacing: -0.3, fontFamily: ff(isArabic, 600) }}>{exercise}</AppText>
                <View style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                  <ChevronLeft size={20} strokeWidth={2.5} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? 1 : -1 }] }} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Exercise sheet */}
      <BottomSheet isOpen={!!openExercise} onClose={() => setOpenExercise(null)} title={openExercise || ""}>
        <View style={{ gap: 24, paddingTop: 8, paddingBottom: 24 }}>
          <View style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 10, overflow: "hidden", backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.hairline }}>
            {selectedExerciseData?.image ? (
              <Image source={{ uri: selectedExerciseData.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            ) : (
              <Dumbbell size={48} color={colors.inkMuted48} style={{ opacity: 0.2 }} />
            )}
          </View>

          <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, marginBottom: 8, fontFamily: ff(isArabic, 600) }}>{isArabic ? name.ar : name.en}</AppText>
            <AppText style={{ fontSize: 15, color: colors.inkMuted48, lineHeight: 22, marginBottom: 24, textAlign: align, fontFamily: ff(isArabic) }}>{isArabic ? `يستهدف عضلة ${name.ar}. ركز على الحركة المحكومة لضمان أقصى تفعيل للعضلة.` : `Targets the ${name.en}. Focus on controlled movement and full range of motion for maximum muscle engagement.`}</AppText>

            <View style={{ width: "100%", backgroundColor: colors.canvasParchment, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.primary + "1A" }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Activity size={16} color={colors.primary} />
                <AppText style={{ fontSize: 12, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "نصيحة المدرب" : "Coach Pro Tip"}</AppText>
              </View>
              <AppText style={{ fontSize: 14, color: colors.inkMuted48, fontStyle: "italic", lineHeight: 19, textAlign: align, fontFamily: ff(isArabic) }}>{isArabic ? "حافظ على استقامة ظهرك وتجنب التأرجح للحصول على أفضل النتائج." : "Keep your core tight and avoid using momentum to lift; focus on the mind-muscle connection."}</AppText>
            </View>
          </View>

          <View style={{ gap: 12, paddingTop: 4 }}>
            <Pressable onPress={() => { showToast(isArabic ? "تمت الإضافة للجلسة القادمة" : "Added to next session", "success"); setOpenExercise(null); }} style={{ width: "100%", height: 54, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 16, fontWeight: "600", letterSpacing: 0.5, color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إضافة للتمرين القادم" : "Add to next workout"}</AppText>
            </Pressable>
            <Pressable onPress={() => setOpenExercise(null)} style={{ width: "100%", height: 54, borderRadius: 9999, borderWidth: 1, borderColor: colors.primary, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <ExternalLink size={18} color={colors.inkMuted48} />
              <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, fontFamily: ff(isArabic, 600) }}>{isArabic ? "عرض في المكتبة" : "View in library"}</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
