/**
 * PreSession — RN port of src/screens/main/PreSession.tsx (today prep flow).
 * Gradient header (duration/focus/save/share), coach note, equipment, the
 * warm-up/cooldown collapsibles, the exercise list, the front/back muscle map
 * (BodySVG), and the sticky START WORKOUT footer.
 * Past/future logging + the adapt sheet are simplified in this pass.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Clipboard, Pressable, ScrollView, Share, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { X, Sparkles, BookmarkPlus, Share2, Dumbbell, ChevronDown, Plus, ChevronRight, Hash, Copy, Link as LinkIcon, MoreHorizontal, Info, RefreshCw, Trash2 } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { COACHES } from "../../src/constants";
import { getWorkoutForDate } from "../../src/lib/workoutSelection";
import { buildSharePackage } from "../../src/lib/routineSharing";
import { CustomRoutine } from "../../src/types";
import { BodySVG } from "../../src/components/BodySVG";
import BottomSheet from "../../src/components/BottomSheet";
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
  const { user, setUser, selectedDate } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const coach = COACHES.find((c) => c.id === user.coach) ?? COACHES[0];

  const workout = useMemo(() => getWorkoutForDate(user, selectedDate), [user, selectedDate]);
  const [exercises, setExercises] = useState<any[]>(() => (workout as any).exercises || []);
  // Resync the editable list when the underlying workout (day) changes.
  useEffect(() => {
    setExercises((workout as any).exercises || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(workout as any).id, (workout as any).name]);
  const [exerciseMenuOpen, setExerciseMenuOpen] = useState<string | null>(null);
  const [confirmRemoveExercise, setConfirmRemoveExercise] = useState<any | null>(null);
  const [confirmDontRecommend, setConfirmDontRecommend] = useState<any | null>(null);
  const workoutName = (isArabic ? (workout as any).arabicName : workout.name) || (workout as any).name || "Workout";
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const sharePackage = useMemo(() => buildSharePackage(workoutName, exercises), [workoutName, exercises]);

  const handleSaveRoutine = () => {
    if (!routineName.trim()) {
      showToast(isArabic ? "لازم تكتب اسم" : "Please enter a name", "info");
      return;
    }
    const newRoutine: CustomRoutine = {
      id: `routine-${Date.now()}`,
      name: routineName.trim(),
      arabicName: routineName.trim(),
      exercises: exercises.map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        arabicName: ex.arabicName,
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        weight: ex.weight || 0,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
      })),
      createdAt: new Date().toISOString(),
      sourceWorkoutId: (workout as any).id,
    };
    setUser({ ...user, customWorkouts: [...(user.customWorkouts || []), newRoutine] });
    setShowSaveSheet(false);
    setRoutineName("");
    showToast(isArabic ? `تم حفظ "${newRoutine.name}" في روتيناتك` : `Saved "${newRoutine.name}" to your routines`, "success");
  };

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
            <Pressable onPress={() => setShowSaveSheet(true)} style={{ alignItems: "center", gap: 6 }}>
              <BookmarkPlus size={24} color="#fff" />
              <AppText style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: "500", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>{isArabic ? "احفظ" : "Save"}</AppText>
            </Pressable>
            <View style={{ width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <Pressable onPress={() => setShowShareSheet(true)} style={{ alignItems: "center", gap: 6 }}>
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
                    <Pressable onPress={() => setExerciseMenuOpen(ex.id)} hitSlop={8} style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }}>
                      <MoreHorizontal size={18} color={colors.inkMuted48} />
                    </Pressable>
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

      {/* Save-as-routine sheet */}
      <BottomSheet isOpen={showSaveSheet} onClose={() => setShowSaveSheet(false)} title={isArabic ? "احفظ كروتين" : "Save as routine"}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <AppText style={{ fontSize: 14, color: colors.inkMuted48, lineHeight: 20, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
            {isArabic ? "هنحفظ التمارين والجولات والتكرارات والأوزان كروتين تقدر تستخدمه بعدين." : "We'll save the exercises, sets, reps, and weights as a routine you can reuse."}
          </AppText>
          <View style={{ gap: 8 }}>
            <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
              {isArabic ? "اسم الروتين" : "Routine name"}
            </AppText>
            <TextInput
              value={routineName}
              onChangeText={setRoutineName}
              placeholder={isArabic ? "مثال: تمارين الصدر" : "e.g. Chest Day"}
              placeholderTextColor={colors.inkMuted48}
              maxLength={40}
              style={{ height: 48, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}
            />
          </View>
          <Pressable onPress={handleSaveRoutine} style={{ height: 48, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", textTransform: isArabic ? "none" : "uppercase", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "احفظ الروتين" : "Save routine"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Share-workout sheet */}
      <BottomSheet isOpen={showShareSheet} onClose={() => setShowShareSheet(false)} title={isArabic ? "شارك التمرين" : "Share workout"}>
        <View style={{ gap: 12, paddingBottom: 8 }}>
          <AppText style={{ fontSize: 14, color: colors.inkMuted48, lineHeight: 20, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
            {isArabic ? "شارك تمرينك مع أصحابك. اللي عندهم سينك يقدروا يفتحوه ويضيفوه لخطتهم." : "Share your workout with friends. Other SYNK users can open it and add it to their plan."}
          </AppText>
          {([
            { icon: Hash, title: isArabic ? "نسخ كود" : "Copy code", sub: sharePackage.code, onPress: () => { Clipboard.setString(`SYNK Routine ${sharePackage.code}\n\nPaste this in SYNK → Workouts → Import:\n${sharePackage.payload}`); showToast(isArabic ? `الكود ${sharePackage.code} اتنسخ` : `Code ${sharePackage.code} copied`, "success"); } },
            { icon: LinkIcon, title: isArabic ? "نسخ الرابط" : "Copy link", sub: sharePackage.url, onPress: () => { Clipboard.setString(sharePackage.url); showToast(isArabic ? "الرابط اتنسخ" : "Link copied", "success"); } },
          ] as const).map((opt) => (
            <Pressable key={opt.title} onPress={opt.onPress} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center" }}>
                <opt.icon size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{opt.title}</AppText>
                <AppText numberOfLines={1} style={{ fontSize: 13, color: colors.inkMuted48, marginTop: 2 }}>{opt.sub}</AppText>
              </View>
              <Copy size={18} color={colors.inkMuted48} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              const text = isArabic ? `جربت تمرين رهيب على سينك! كود: ${sharePackage.code}\n${sharePackage.url}` : `Just crushed this SYNK workout! Code: ${sharePackage.code}\n${sharePackage.url}`;
              Share.share({ message: text }).catch(() => {});
            }}
            style={{ height: 52, borderRadius: 9999, backgroundColor: colors.primary, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}
          >
            <Share2 size={16} color="#fff" />
            <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", textTransform: isArabic ? "none" : "uppercase", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "مشاركة" : "Share"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Exercise context menu */}
      <BottomSheet isOpen={!!exerciseMenuOpen} onClose={() => setExerciseMenuOpen(null)} title="">
        {(() => {
          const sel = exercises.find((e: any) => e.id === exerciseMenuOpen);
          if (!sel) return <View />;
          const row = (Icon: any, label: string, onPress: () => void, danger?: boolean) => (
            <Pressable onPress={onPress} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, height: 56, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
              <Icon size={20} color={danger ? colors.semanticRed : colors.inkMuted48} />
              <AppText style={{ flex: 1, fontSize: 15, fontWeight: "500", color: danger ? colors.semanticRed : colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>{label}</AppText>
            </Pressable>
          );
          return (
            <View>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16, paddingBottom: 12 }}>
                <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                  <Dumbbell size={24} color={colors.inkMuted48} />
                </View>
                <AppText style={{ flex: 1, fontSize: 17, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? sel.arabicName || sel.name : sel.name}</AppText>
              </View>
              {row(Info, isArabic ? "تفاصيل التمرين" : "Exercise Details", () => { setExerciseMenuOpen(null); router.push(`/workout/exercise/${sel.id}`); })}
              {row(RefreshCw, isArabic ? "بدّل التمرين" : "Replace Exercise", () => { setExerciseMenuOpen(null); showToast(isArabic ? "بدور على بدائل..." : "Finding alternatives...", "success"); })}
              {row(X, isArabic ? "متقترحش تاني" : "Don't Recommend Again", () => { setExerciseMenuOpen(null); setConfirmDontRecommend(sel); })}
              {row(Trash2, isArabic ? "احذف من التمرين" : "Remove from Workout", () => { setExerciseMenuOpen(null); setConfirmRemoveExercise(sel); }, true)}
              <Pressable onPress={() => setExerciseMenuOpen(null)} style={{ marginTop: 16, height: 48, borderRadius: 14, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "إغلاق" : "Close"}</AppText>
              </Pressable>
            </View>
          );
        })()}
      </BottomSheet>

      {/* Confirm remove */}
      <BottomSheet isOpen={!!confirmRemoveExercise} onClose={() => setConfirmRemoveExercise(null)} title={isArabic ? "إزالة هذا التمرين؟" : "Remove this exercise?"}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <AppText style={{ fontSize: 15, color: colors.ink, lineHeight: 22, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
            {isArabic ? "سيؤدي هذا إلى إزالة التمرين من تدريب اليوم فقط. لن يتم تغيير خطتك المستقبلية." : "This will remove the exercise from today's workout only. Your future plan will not be changed."}
          </AppText>
          <Pressable onPress={() => { if (confirmRemoveExercise) setExercises((p) => p.filter((e) => e.id !== confirmRemoveExercise.id)); showToast(isArabic ? "اتشال" : "Removed", "success"); setConfirmRemoveExercise(null); }} style={{ height: 52, borderRadius: 14, backgroundColor: colors.semanticRed, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "إزالة التمرين" : "Remove Exercise"}</AppText>
          </Pressable>
          <Pressable onPress={() => setConfirmRemoveExercise(null)} style={{ height: 52, borderRadius: 14, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Confirm don't-recommend */}
      <BottomSheet isOpen={!!confirmDontRecommend} onClose={() => setConfirmDontRecommend(null)} title={isArabic ? "عدم اقتراح هذا التمرين مرة أخرى؟" : "Don't recommend this again?"}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <AppText style={{ fontSize: 15, color: colors.ink, lineHeight: 22, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular" }}>
            {isArabic ? `سيتجنب ${coach.arabicName} اقتراح هذا التمرين في الخطط المستقبلية كلما أمكن. تقدر تضيفه يدويًا لاحقًا.` : `${coach.name} will avoid suggesting this exercise in future plans when possible. You can still add it manually later.`}
          </AppText>
          <Pressable
            onPress={() => {
              if (confirmDontRecommend) {
                setExercises((p) => p.filter((e) => e.id !== confirmDontRecommend.id));
                setUser({ ...user, excludedExercises: [...(user.excludedExercises || []), { exerciseId: confirmDontRecommend.id, exerciseName: confirmDontRecommend.name, arabicName: confirmDontRecommend.arabicName, excludedAt: new Date().toISOString() }] });
              }
              showToast(isArabic ? "مش هقترحه تاني" : "Won't recommend this again", "success");
              setConfirmDontRecommend(null);
            }}
            style={{ height: 52, borderRadius: 14, backgroundColor: colors.semanticRed, alignItems: "center", justifyContent: "center" }}
          >
            <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "عدم الاقتراح" : "Don't Recommend"}</AppText>
          </Pressable>
          <Pressable onPress={() => setConfirmDontRecommend(null)} style={{ height: 52, borderRadius: 14, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
