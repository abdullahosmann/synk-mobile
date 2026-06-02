/**
 * HistoryWorkoutDetail — RN port of src/screens/main/HistoryWorkoutDetail.tsx.
 *
 * Workout summary (name, muscle tags, 2×2 stat grid), per-exercise set tables
 * (top-weight starred, exercise header → progression), notes, and a sticky
 * "Repeat this workout" CTA (saves a temp routine + planOverride, then opens
 * PreSession). Share sheet captures a summary card via react-native-view-shot +
 * expo-sharing, with a hide-numbers toggle.
 *
 * Web→RN: useParams → useLocalSearchParams; navigate(-1) → router.back();
 * html-to-image → captureRef + Sharing. The 5 dedicated 1080×1920 share
 * templates remain the separate ShareCardRenderer task.
 */
import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { ChevronLeft, Share2, Dumbbell, Star, ChevronRight, RotateCcw } from "lucide-react-native";
import { useAppContext } from "../../../src/AppContext";
import { getAllWorkouts } from "../../../src/lib/historyQueries";
import { useToast } from "../../../src/components/ToastProvider";
import BottomSheet from "../../../src/components/BottomSheet";
import {
  Template1Bold,
  Template2Minimal,
  Template3Stats,
  Template4Map,
  Template5Quote,
  ShareTemplateProps,
} from "../../../src/components/share-templates/WorkoutShareTemplates";

const TEMPLATES: React.FC<ShareTemplateProps>[] = [Template1Bold, Template2Minimal, Template3Stats, Template4Map, Template5Quote];
const THUMB_W = 200;
const THUMB_SCALE = THUMB_W / 1080;
import { useTheme } from "../../../src/theme/ThemeProvider";
import { AppText } from "../../../src/components/ui/Typography";
import type { CustomRoutine } from "../../../src/types";
import { muscleLabel } from "../../../src/lib/muscleLabels";

const AMBER = "#f59e0b";
const AMBER_DARK = "#d97706";

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

export default function HistoryWorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const isDark = theme === "dark";

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [hideNumbers, setHideNumbers] = useState(false);
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const shareRef = useRef<View>(null);

  const workout = useMemo(() => getAllWorkouts(user).find((w) => w.id === id), [user, id]);

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const slot = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const primaryTint = colors.primary + "1A";

  if (!workout) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <AppText style={{ color: colors.ink, fontFamily: ff(isArabic) }}>{isArabic ? "التمرين غير موجود." : "Workout not found."}</AppText>
      </View>
    );
  }

  const d = new Date(workout.date);
  const dateStr = isArabic ? d.toLocaleDateString("ar-EG", { weekday: "long", month: "long", day: "numeric" }) : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  let bestW = 0, bestE = "", bestR = 0;
  workout.exercises.forEach((ex) => ex.sets.forEach((s) => { if (s.weight > bestW) { bestW = s.weight; bestE = ex.name; bestR = s.reps; } }));

  const notes = user.exerciseNotes?.[workout.id];

  const workoutData = {
    name: workout.name,
    muscleGroups: workout.muscleGroups || ["chest", "shoulders", "triceps"],
    durationMin: workout.durationMin,
    totalVolumeKg: workout.totalVolumeKg,
    setsCompleted: workout.setsCompleted,
    bestLift: bestW > 0 ? { exercise: bestE, weight: bestW, reps: bestR, unit: user.weightUnit } : undefined,
    isPR: bestW > 0,
    date: new Date(workout.date),
  };
  const ActiveTemplate = TEMPLATES[activeTemplateIdx];

  const handleRepeat = () => {
    if (!workout.exercises || workout.exercises.length === 0) {
      showToast(isArabic ? "مفيش تمارين عشان نكررها" : "No exercises to repeat", "info");
      return;
    }
    const name = isArabic ? `إعادة ${workout.name || "تمرين"}` : `Repeat ${workout.name || "workout"}`;
    const tempRoutine: CustomRoutine = {
      id: `repeat-${Date.now()}`,
      name,
      arabicName: isArabic ? name : undefined,
      exercises: workout.exercises.map((ex, idx) => {
        const top = ex.sets.length > 0 ? ex.sets.reduce((best, s) => ((s.weight || 0) > (best.weight || 0) ? s : best), ex.sets[0]) : null;
        return { id: `${ex.id || ex.name}-${Date.now()}-${idx}`, name: ex.name, sets: ex.sets.length || 3, reps: top?.reps ?? 10, weight: top?.weight ?? 0 };
      }),
      createdAt: new Date().toISOString(),
    };
    setUser({ ...user, customWorkouts: [...(user.customWorkouts || []), tempRoutine], planOverride: { routineId: tempRoutine.id, appliesTo: "just-today", date: new Date().toISOString().split("T")[0] } });
    showToast(isArabic ? `هتعمل ${name} النهارده` : `You'll do ${name} today`, "success");
    setTimeout(() => router.push({ pathname: "/workout/preview", params: { routineId: tempRoutine.id } }), 400);
  };

  const handleShare = async () => {
    if (!shareRef.current) return;
    try {
      const uri = await captureRef(shareRef, { format: "png", quality: 1, width: 1080, height: 1920 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else showToast(isArabic ? "تم حفظ الصورة" : "Image saved", "success");
    } catch {
      /* ignore */
    }
  };

  const stats = [
    { label: isArabic ? "المدة" : "DURATION", value: `${workout.durationMin}`, unit: isArabic ? "د" : "m", primary: true },
    { label: isArabic ? "حجم التمرين" : "TOTAL VOLUME", value: `${(workout.totalVolumeKg / 1000).toFixed(1)}`, unit: `k ${isArabic ? "كجم" : "kg"}`, primary: true },
    { label: isArabic ? "مجموعات" : "SETS", value: `${workout.setsCompleted}`, unit: "", primary: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingTop: insets.top + 8, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", height: 44 + insets.top + 8, paddingHorizontal: 16 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 44, height: 44, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText numberOfLines={1} style={{ flex: 1, textAlign: "center", maxWidth: 200, fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{dateStr}</AppText>
        <Pressable onPress={() => setShowShareSheet(true)} style={{ width: 44, height: 44, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}>
          <Share2 size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: insets.bottom + 96, maxWidth: 512, width: "100%", alignSelf: "center" }}>
        <View style={{ marginBottom: 32, alignItems: isArabic ? "flex-end" : "flex-start" }}>
          <AppText style={{ fontSize: 28, fontWeight: "700", color: colors.ink, letterSpacing: -0.3, marginBottom: 12, textTransform: "capitalize", fontFamily: ff(isArabic, 700) }}>{workout.name}</AppText>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {workout.muscleGroups.map((m) => (
              <View key={m} style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, backgroundColor: primaryTint }}>
                <AppText style={{ fontSize: 11, fontWeight: "700", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.8, fontFamily: ff(isArabic, 700) }}>{muscleLabel(m, isArabic)}</AppText>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, width: "100%" }}>
            {stats.map((s) => (
              <View key={s.label} style={{ width: "48%", backgroundColor: cardBg, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline }}>
                <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "600", marginBottom: 4, fontFamily: ff(isArabic, 600) }}>{s.label}</AppText>
                <AppText style={{ fontSize: 24, fontWeight: "700", color: s.primary ? colors.primary : colors.ink, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 700) }}>{s.value}{s.unit ? <AppText style={{ fontSize: 14, color: colors.inkMuted48 }}> {s.unit}</AppText> : null}</AppText>
              </View>
            ))}
            <View style={{ width: "48%", backgroundColor: cardBg, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline }}>
              <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: "600", marginBottom: 4, fontFamily: ff(isArabic, 600) }}>{isArabic ? "أعلى وزن" : "BEST LIFT"}</AppText>
              <AppText numberOfLines={1} style={{ fontSize: 18, fontWeight: "700", color: colors.ink, fontFamily: ff(isArabic, 700) }}>{bestE || "—"}</AppText>
              <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{bestW}{isArabic ? "كجم" : "kg"} × {bestR}</AppText>
            </View>
          </View>
        </View>

        {/* Exercises */}
        <View style={{ gap: 16 }}>
          {workout.exercises.map((ex, idx) => (
            <View key={idx} style={{ backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, overflow: "hidden" }}>
              <Pressable onPress={() => router.push(`/exercise/${ex.id}`)} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: slot, alignItems: "center", justifyContent: "center" }}>
                    <Dumbbell size={16} color={colors.inkMuted48} />
                  </View>
                  <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{ex.name}</AppText>
                </View>
                <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline, marginBottom: 8 }}>
                  <AppText style={{ width: 48, textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.inkMuted48, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "مج" : "SET"}</AppText>
                  <AppText style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.inkMuted48, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "كجم" : "KG"}</AppText>
                  <AppText style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: "600", color: colors.inkMuted48, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "تكرار" : "REPS"}</AppText>
                  <View style={{ width: 32 }} />
                </View>
                {ex.sets.map((s, sIdx) => {
                  const isTop = s.weight === bestW && ex.name === bestE;
                  return (
                    <View key={sIdx} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", paddingVertical: 8, borderRadius: isTop ? 8 : 0, backgroundColor: isTop ? AMBER + "0D" : "transparent", marginHorizontal: isTop ? -8 : 0, paddingHorizontal: isTop ? 8 : 0 }}>
                      <AppText style={{ width: 48, textAlign: "center", fontSize: 13, fontWeight: "600", color: colors.inkMuted48, fontVariant: ["tabular-nums"] }}>{sIdx + 1}</AppText>
                      <AppText style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: isTop ? AMBER_DARK : colors.ink, fontVariant: ["tabular-nums"] }}>{s.weight}</AppText>
                      <AppText style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: colors.ink, fontVariant: ["tabular-nums"] }}>{s.reps}</AppText>
                      <View style={{ width: 32, alignItems: "center" }}>{isTop && <Star size={14} color={AMBER} fill={AMBER} />}</View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {notes && (
          <View style={{ marginTop: 32, backgroundColor: cardBg, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.hairline }}>
            <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ملاحظات" : "NOTES"}</AppText>
            <AppText style={{ fontSize: 14, lineHeight: 21, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{notes}</AppText>
          </View>
        )}
      </ScrollView>

      {/* Sticky Repeat CTA */}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.canvasParchment, borderTopWidth: 1, borderTopColor: colors.hairline, paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 12, alignItems: "center" }}>
        <Pressable onPress={handleRepeat} style={{ width: "100%", maxWidth: 512, height: 44, borderRadius: 9999, backgroundColor: colors.primary, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <RotateCcw size={18} color={colors.onPrimary} />
          <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "كرر التمرين" : "Repeat this workout"}</AppText>
        </Pressable>
      </View>

      {/* Off-screen full-res capture target (active template at 1080×1920) */}
      <View style={{ position: "absolute", left: -99999, top: -99999 }} pointerEvents="none">
        <View ref={shareRef} collapsable={false}>
          <ActiveTemplate workout={workoutData} user={{ name: user.name || "Athlete", coachName: user.coach || "khaled" }} isArabic={isArabic} hideNumbers={hideNumbers} />
        </View>
      </View>

      {/* Share sheet */}
      <BottomSheet isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} title={isArabic ? "شارك فوزك" : "Share your win"}>
        <View style={{ paddingTop: 4, paddingBottom: 24, gap: 20 }}>
          {/* Template carousel */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingVertical: 4, flexDirection: isArabic ? "row-reverse" : "row" }}>
            {TEMPLATES.map((Temp, idx) => (
              <Pressable
                key={idx}
                onPress={() => setActiveTemplateIdx(idx)}
                style={{ width: THUMB_W, height: THUMB_W * (1920 / 1080), borderRadius: 14, overflow: "hidden", borderWidth: 2, borderColor: activeTemplateIdx === idx ? colors.primary : "transparent" }}
              >
                <View style={{ width: 1080, height: 1920, transform: [{ scale: THUMB_SCALE }], transformOrigin: "top left" }} pointerEvents="none">
                  <Temp workout={workoutData} user={{ name: user.name || "Athlete", coachName: user.coach || "khaled" }} isArabic={isArabic} hideNumbers={hideNumbers} />
                </View>
                {activeTemplateIdx !== idx && <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.1)" }} />}
              </Pressable>
            ))}
          </ScrollView>

          {/* Dots */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
            {TEMPLATES.map((_, idx) => (
              <View key={idx} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeTemplateIdx === idx ? colors.primary : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", transform: [{ scale: activeTemplateIdx === idx ? 1.25 : 1 }] }} />
            ))}
          </View>

          {/* Hide-numbers toggle */}
          <View style={{ width: "100%", flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 }}>
            <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
              <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إخفاء الأرقام والإحصائيات" : "Hide numbers and stats"}</AppText>
              <AppText style={{ fontSize: 12, color: colors.inkMuted48, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "إخفاء الأرقام للخصوصية في المشاركة العامة" : "Hide specific numbers for public sharing"}</AppText>
            </View>
            <Pressable onPress={() => setHideNumbers((v) => !v)} style={{ width: 44, height: 26, borderRadius: 9999, padding: 2, backgroundColor: hideNumbers ? colors.primary : colors.hairline, justifyContent: "center", alignItems: hideNumbers ? (isArabic ? "flex-start" : "flex-end") : isArabic ? "flex-end" : "flex-start" }}>
              <View style={{ width: 20, height: 20, borderRadius: 9999, backgroundColor: "#fff" }} />
            </Pressable>
          </View>

          <Pressable onPress={handleShare} style={{ width: "100%", height: 52, borderRadius: 9999, backgroundColor: colors.primary, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Share2 size={20} color={colors.onPrimary} />
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "مشاركة" : "Share"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
