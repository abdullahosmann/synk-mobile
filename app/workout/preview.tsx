/**
 * PreSession — RN port of src/screens/main/PreSession.tsx (today prep flow).
 * Gradient header (duration/focus/save/share), coach note, equipment, the
 * warm-up/cooldown collapsibles, the exercise list, the front/back muscle map
 * (BodySVG), and the sticky START WORKOUT footer.
 * Past/future logging + the adapt sheet are simplified in this pass.
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { X, Sparkles, BookmarkPlus, Share2, Dumbbell, ChevronDown, Plus, ChevronRight } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { COACHES } from "../../src/constants";
import { getWorkoutForDate } from "../../src/lib/workoutSelection";
import { BodySVG } from "../../src/components/BodySVG";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { Toggle } from "../../src/components/ui/Toggle";
import { AppleBackdrop } from "../../src/components/ui/AppleBackdrop";

const WARMUPS = [
  { name: "High Knees", duration: "20 sec" },
  { name: "Knee Rotations", duration: "20 sec" },
  { name: "Thoracic Flexion & Extension", duration: "20 sec" },
];
const COOLDOWNS = [
  { name: "Upper Back Foam Roll", duration: "20 sec" },
  { name: "Reach-up Back Stretch", duration: "20 sec" },
  { name: "Puppy Stretch", duration: "20 sec" },
];

const FRONT = new Set(["chest", "shoulders", "biceps", "abs", "quadriceps", "triceps"]);
const BACK = new Set(["back", "lower_back", "glutes", "hamstrings", "triceps", "calves"]);

export default function PreSession() {
  const router = useRouter();
  const { user, selectedDate } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const coach = COACHES.find((c) => c.id === user.coach) ?? COACHES[0];

  const workout = useMemo(() => getWorkoutForDate(user, selectedDate), [user, selectedDate]);
  const exercises = (workout as any).exercises || [];
  const [warmupOn, setWarmupOn] = useState(true);
  const [warmupExpanded, setWarmupExpanded] = useState(false);
  const [cooldownOn, setCooldownOn] = useState(true);
  const [cooldownExpanded, setCooldownExpanded] = useState(false);

  const equipment = useMemo(
    () => Array.from(new Set(exercises.map((e: any) => e.equipment).filter(Boolean))) as string[],
    [exercises],
  );
  const muscles = useMemo(() => exercises.map((e: any) => e.muscleGroup).filter(Boolean), [exercises]);
  const frontMuscles = muscles.filter((m: string) => FRONT.has(m));
  const backMuscles = muscles.filter((m: string) => BACK.has(m));

  const duration = (workout as any).estimatedMinutes || 55;
  const focus = isArabic ? workout.arabicCategory : workout.category;

  const startWorkout = () => router.push("/workout/active");

  const sectionLabel = (text: string) => (
    <AppText className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 13, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 12, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
      {text}
    </AppText>
  );

  const collapsible = (
    title: string,
    extra: string,
    on: boolean,
    setOn: (v: boolean) => void,
    expanded: boolean,
    setExpanded: (v: boolean) => void,
    items: { name: string; duration: string }[],
  ) => (
    <View>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          <AppText variant="title" style={{ color: colors.ink }}>{title}</AppText>
          <AppText style={{ fontSize: 13, color: colors.primary }}>{extra}</AppText>
        </View>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
          <Toggle value={on} onValueChange={() => setOn(!on)} />
          <Pressable onPress={() => setExpanded(!expanded)} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
            <ChevronDown size={20} color={colors.inkMuted48} style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }} />
          </Pressable>
        </View>
      </View>
      {expanded && on && (
        <View style={{ paddingBottom: 8 }}>
          {items.map((it, i) => (
            <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingVertical: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                <Dumbbell size={24} color={colors.inkMuted48} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>{it.name}</AppText>
                <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left" }}>{it.duration}</AppText>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Gradient header */}
        <LinearGradient colors={[colors.primary, "rgba(0,102,204,0.7)"]} style={{ paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, backgroundColor: colors.canvas, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 9999 }}>
              <Sparkles size={14} color={colors.primary} />
              <AppText style={{ color: colors.primary, fontSize: 11, fontWeight: "700", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                {isArabic ? "تمرين اليوم" : "TODAY'S WORKOUT"}
              </AppText>
            </View>
            <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
              <X size={20} color="#fff" />
            </Pressable>
          </View>

          <View style={{ alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              <AppText style={{ fontSize: 56, fontWeight: "600", color: "#fff", letterSpacing: -1 }}>{duration}</AppText>
              <AppText style={{ fontSize: 20, color: "rgba(255,255,255,0.9)", marginLeft: 4, marginBottom: 8 }}>{isArabic ? "د" : "min"}</AppText>
            </View>
            <AppText style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, marginTop: 4, marginBottom: 24 }}>{focus}</AppText>
          </View>

          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <Pressable onPress={() => showToast(isArabic ? "تم الحفظ" : "Saved", "success")} style={{ alignItems: "center", gap: 6 }}>
              <BookmarkPlus size={24} color="#fff" />
              <AppText style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "500", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>{isArabic ? "احفظ" : "Save"}</AppText>
            </Pressable>
            <View style={{ width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <Pressable onPress={() => showToast(isArabic ? "مشاركة" : "Share", "info")} style={{ alignItems: "center", gap: 6 }}>
              <Share2 size={24} color="#fff" />
              <AppText style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "500", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>{isArabic ? "مشاركة" : "Share"}</AppText>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 32 }}>
          {/* Coach note */}
          <View style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 16 }}>
            <Image source={{ uri: coach.image }} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <AppText variant="body-strong" style={{ color: colors.ink, marginBottom: 4, textAlign: isArabic ? "right" : "left" }}>{isArabic ? coach.arabicName : coach.name}</AppText>
              <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ lineHeight: 19, textAlign: isArabic ? "right" : "left" }}>
                {isArabic ? coach.arabicSpeech : coach.speech}
              </AppText>
            </View>
          </View>

          {/* Equipment */}
          {equipment.length > 0 && (
            <View>
              {sectionLabel(isArabic ? `اللي هتحتاجه (${equipment.length})` : `WHAT YOU'LL NEED (${equipment.length})`)}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, flexDirection: isArabic ? "row-reverse" : "row" }}>
                {equipment.map((eq) => (
                  <View key={eq} style={{ backgroundColor: colors.canvas, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 16, paddingVertical: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                      <Dumbbell size={20} color={colors.inkMuted48} />
                    </View>
                    <AppText variant="body-strong" style={{ color: colors.ink, textTransform: "capitalize" }}>{eq}</AppText>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* What you'll do */}
          <View>
            {sectionLabel(isArabic ? "اللي هتعمله" : "WHAT YOU'LL DO")}

            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingBottom: 8, marginBottom: 8 }}>
              {collapsible(isArabic ? "إحماء" : "Warm-Up", isArabic ? "(+2 د)" : "(+2 min)", warmupOn, setWarmupOn, warmupExpanded, setWarmupExpanded, WARMUPS)}
            </View>

            {/* Exercises */}
            <View style={{ marginVertical: 8 }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <AppText variant="title" style={{ color: colors.ink }}>{isArabic ? `${exercises.length} تمارين` : `${exercises.length} exercises`}</AppText>
                <Pressable onPress={() => router.push("/workout/builder")} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={14} color={colors.primary} />
                  </View>
                  <AppText variant="body-strong" style={{ color: colors.primary }}>{isArabic ? "أضف" : "Add"}</AppText>
                </Pressable>
              </View>
              <View style={{ gap: 12 }}>
                {exercises.map((ex: any) => (
                  <Pressable key={ex.id} onPress={() => router.push(`/workout/exercise/${ex.id}`)} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 14, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                      <Dumbbell size={32} color={colors.inkMuted48} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="body-strong" style={{ color: colors.ink, marginBottom: 4, textAlign: isArabic ? "right" : "left" }}>{isArabic ? ex.arabicName : ex.name}</AppText>
                      <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left" }}>
                        {ex.sets} × {ex.reps}{ex.weight ? ` × ${ex.weight} ${user.weightUnit}` : ""}
                      </AppText>
                    </View>
                    <ChevronRight size={18} color={colors.inkMuted24} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 8 }}>
              {collapsible(isArabic ? "تبريد" : "Cooldown", isArabic ? "(+5 د)" : "(+5 min)", cooldownOn, setCooldownOn, cooldownExpanded, setCooldownExpanded, COOLDOWNS)}
            </View>
          </View>

          {/* Muscles */}
          <View>
            {sectionLabel(isArabic ? "العضلات" : "MUSCLES")}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 16 }}>
              {([["front", frontMuscles, isArabic ? "أمام" : "FRONT"], ["back", backMuscles, isArabic ? "خلف" : "BACK"]] as const).map(([view, ms, label]) => (
                <View key={view} style={{ flex: 1, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 16, padding: 16, alignItems: "center" }}>
                  <View style={{ width: "100%", aspectRatio: 0.5, maxHeight: 220 }}>
                    <BodySVG view={view} highlightedMuscles={(ms as string[]).length ? (ms as string[]) : view === "front" ? ["chest", "shoulders"] : ["back", "lower_back"]} animateHighlight />
                  </View>
                  <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, marginTop: 16, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{label}</AppText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <AppleBackdrop style={{ position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: colors.hairline, paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 16 }}>
        <Pressable onPress={startWorkout} style={{ height: 52, backgroundColor: colors.ink, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
          <AppText style={{ color: colors.canvas, fontSize: 15, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
            {isArabic ? "ابدأ التمرين" : "START WORKOUT"}
          </AppText>
        </Pressable>
      </AppleBackdrop>
    </View>
  );
}
