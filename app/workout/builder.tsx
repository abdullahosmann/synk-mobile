/**
 * RoutineBuilder — RN port of src/screens/main/RoutineBuilder.tsx.
 *
 * Create/edit a custom routine: name field + a reorderable list of selected
 * exercises (sets/reps/weight inputs each), plus a near-fullscreen library
 * sheet (search + muscle/equipment chips) to add more.
 *
 * Web→RN notes:
 *  - `useSearchParams().get('id')` → `useLocalSearchParams().id` (edit mode).
 *  - motion `Reorder` drag-to-reorder → react-native-gesture-handler Pan on the
 *    grip handle + reanimated absolute layout (fixed, measured row height).
 *  - The `AnimatePresence` library modal (backdrop fade + panel slide from
 *    bottom, top-[72px]) → reanimated `progress` shared value (spring in,
 *    timing out) inside a transparent <Modal>, mirroring BottomSheet.tsx.
 *  - Data model: web stored a `Workout` (duration/calories/tags); mobile's
 *    `user.customWorkouts` is `CustomRoutine[]` (exercises = CustomRoutineExercise,
 *    + createdAt). The builder keeps full Exercise objects (with images) while
 *    editing for visual fidelity, then maps down to CustomRoutineExercise on save.
 */
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ArrowLeft, GripVertical, Plus, Search, SearchX, Trash2, X } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { useColors, useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import EmptyState from "../../src/components/EmptyState";
import { EXERCISE_LIBRARY } from "../../src/data/exercises";
import { Exercise, CustomRoutine, CustomRoutineExercise } from "../../src/types";

const GAP = 12;
const ROW_FALLBACK = 168; // pre-measure estimate so the list doesn't collapse

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

/** Recover a full Exercise (with image) for an edit-prefilled stored exercise. */
function hydrateExercise(stored: CustomRoutineExercise): Exercise {
  const lib = EXERCISE_LIBRARY.find(
    (l) => l.name.toLowerCase() === stored.name.toLowerCase(),
  );
  return {
    id: stored.id,
    name: stored.name,
    arabicName: stored.arabicName,
    sets: stored.sets,
    reps: stored.reps,
    weight: stored.weight,
    muscleGroup: stored.muscleGroup ?? lib?.muscleGroup,
    equipment: stored.equipment ?? lib?.equipment,
    image: lib?.image ?? "",
  };
}

// ---------------------------------------------------------------------------
// Reorderable selected-exercise row
// ---------------------------------------------------------------------------
function SelectedExerciseRow({
  ex,
  positions,
  rowH,
  count,
  isArabic,
  colors,
  onMeasure,
  removeExercise,
  updateExercise,
  commitOrder,
}: {
  ex: Exercise;
  positions: { value: Record<string, number> };
  rowH: { value: number };
  count: number;
  isArabic: boolean;
  colors: ReturnType<typeof useColors>;
  onMeasure: (h: number) => void;
  removeExercise: (id: string) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  commitOrder: () => void;
}) {
  const isActive = useSharedValue(false);
  const top = useSharedValue(0);
  const startTop = useSharedValue(0);

  // Follow slot changes (driven by other rows' drags) when not the active row.
  // First run (prev == null) snaps without animation; later runs spring.
  useAnimatedReaction(
    () => positions.value[ex.id],
    (slot, prev) => {
      if (slot == null) return;
      if (prev == null) {
        top.value = slot * rowH.value;
      } else if (!isActive.value) {
        top.value = withSpring(slot * rowH.value, { damping: 30, stiffness: 350 });
      }
    },
  );

  const pan = Gesture.Pan()
    .onStart(() => {
      isActive.value = true;
      startTop.value = top.value;
    })
    .onUpdate((e) => {
      top.value = startTop.value + e.translationY;
      const newSlot = Math.max(0, Math.min(Math.round(top.value / rowH.value), count - 1));
      const oldSlot = positions.value[ex.id];
      if (newSlot !== oldSlot) {
        const swapId = Object.keys(positions.value).find((k) => positions.value[k] === newSlot);
        const next = { ...positions.value };
        next[ex.id] = newSlot;
        if (swapId) next[swapId] = oldSlot;
        positions.value = next;
      }
    })
    .onEnd(() => {
      top.value = withSpring((positions.value[ex.id] ?? 0) * rowH.value, { damping: 30, stiffness: 350 });
      isActive.value = false;
      runOnJS(commitOrder)();
    });

  const containerStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: 0,
    right: 0,
    top: top.value,
    zIndex: isActive.value ? 100 : 1,
    transform: [{ scale: withTiming(isActive.value ? 1.02 : 1, { duration: 120 }) }],
    shadowColor: "#000",
    shadowOpacity: withTiming(isActive.value ? 0.08 : 0, { duration: 120 }),
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  }));

  return (
    <Animated.View style={containerStyle}>
      <View
        onLayout={(e) => onMeasure(e.nativeEvent.layout.height)}
        style={{
          backgroundColor: colors.canvas,
          borderRadius: 14,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.hairline,
          gap: 16,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, flex: 1 }}>
            <GestureDetector gesture={pan}>
              <View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
                <GripVertical size={18} color={colors.inkMuted24} />
              </View>
            </GestureDetector>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: colors.canvas,
                borderWidth: 1,
                borderColor: colors.hairline,
              }}
            >
              {!!ex.image && (
                <Image source={{ uri: ex.image }} style={{ width: "100%", height: "100%", opacity: 0.9 }} contentFit="cover" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText
                variant="body-strong"
                numberOfLines={1}
                style={{ color: colors.ink, textTransform: isArabic ? "none" : "uppercase", textAlign: isArabic ? "right" : "left" }}
              >
                {ex.name}
              </AppText>
              <AppText
                variant="fine-print"
                style={{ color: colors.primary, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}
              >
                {ex.muscleGroup}
              </AppText>
            </View>
          </View>
          <Pressable
            onPress={() => removeExercise(ex.id)}
            hitSlop={8}
            style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}
          >
            <Trash2 size={18} color={colors.hairline} />
          </Pressable>
        </View>

        {/* Sets / Reps / Weight */}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
          {[
            { key: "sets", label: isArabic ? "الجولات" : "Sets", value: String(ex.sets ?? ""), keyboard: "number-pad" as const },
            { key: "reps", label: isArabic ? "التكرارات" : "Reps", value: String(ex.reps ?? ""), keyboard: "default" as const },
            { key: "weight", label: isArabic ? "الوزن" : "Weight", value: String(ex.weight ?? ""), keyboard: "numeric" as const },
          ].map((field) => (
            <View key={field.key} style={{ flex: 1, gap: 4 }}>
              <AppText
                variant="fine-print"
                numberOfLines={1}
                style={{
                  color: colors.inkMuted48,
                  fontWeight: "600",
                  textTransform: isArabic ? "none" : "uppercase",
                  letterSpacing: 0.5,
                  paddingHorizontal: 4,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: fontFamily(isArabic, 600),
                }}
              >
                {field.label}
              </AppText>
              <TextInput
                value={field.value}
                keyboardType={field.keyboard}
                onChangeText={(text) => {
                  if (field.key === "sets") updateExercise(ex.id, { sets: parseInt(text) || 0 });
                  else if (field.key === "reps") updateExercise(ex.id, { reps: text });
                  else updateExercise(ex.id, { weight: parseFloat(text) || 0 });
                }}
                style={{
                  height: 40,
                  backgroundColor: colors.canvasParchment,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: 15,
                  color: colors.ink,
                  fontFamily: fontFamily(isArabic, 600),
                }}
              />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

export default function RoutineBuilder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ?? null;
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const isArabic = user.language === "ar";
  // Web: `border-dashed border-black/20 dark:border-hairline`.
  const dashedBorder = theme === "dark" ? colors.hairline : "rgba(0,0,0,0.2)";

  const [routineName, setRoutineName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(() => {
    if (user.trainingLocation === "bodyweight-only") return "bodyweight";
    if (user.trainingLocation === "home-equipment") return "dumbbell";
    return null;
  });

  // Reorder shared state
  const positions = useSharedValue<Record<string, number>>({});
  const rowH = useSharedValue(ROW_FALLBACK + GAP);
  const [measuredRowH, setMeasuredRowH] = useState(ROW_FALLBACK);

  // Keep positions in sync with the array order.
  useEffect(() => {
    const map: Record<string, number> = {};
    selectedExercises.forEach((ex, i) => {
      map[ex.id] = i;
    });
    positions.value = map;
  }, [selectedExercises]);

  useEffect(() => {
    rowH.value = measuredRowH + GAP;
  }, [measuredRowH]);

  // Prefill for edit mode
  useEffect(() => {
    if (editId && user.customWorkouts) {
      const routine = user.customWorkouts.find((w) => w.id === editId);
      if (routine) {
        setRoutineName(routine.name);
        setSelectedExercises(routine.exercises.map(hydrateExercise));
      }
    }
  }, [editId]);

  const muscleGroups = Array.from(new Set(EXERCISE_LIBRARY.map((ex) => ex.muscleGroup).filter(Boolean))) as string[];
  const equipmentTypes = Array.from(new Set(EXERCISE_LIBRARY.map((ex) => ex.equipment).filter(Boolean))) as string[];

  const filteredLibrary = EXERCISE_LIBRARY.filter((ex) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = ex.name.toLowerCase().includes(q) || ex.muscleGroup?.toLowerCase().includes(q);
    const matchesMuscle = !selectedMuscle || ex.muscleGroup === selectedMuscle;
    const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) => [...prev, { ...exercise, id: `${exercise.id}-${Date.now()}` }]);
    closeLibrary();
    setSearchQuery("");
  };

  const removeExercise = (id: string) => {
    setSelectedExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const updateExercise = (id: string, updates: Partial<Exercise>) => {
    setSelectedExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)));
  };

  // Commit the gesture-driven order (positions shared value) back to the array.
  const commitOrder = () => {
    const map = positions.value;
    setSelectedExercises((prev) => {
      const next = [...prev];
      next.sort((a, b) => (map[a.id] ?? 0) - (map[b.id] ?? 0));
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMuscle(null);
    setSelectedEquipment(null);
  };

  const canSave = routineName.trim().length > 0 && selectedExercises.length > 0;

  const handleSave = () => {
    if (!canSave) return;

    const exercises: CustomRoutineExercise[] = selectedExercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      arabicName: ex.arabicName,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
    }));

    if (editId) {
      setUser((prev) => ({
        ...prev,
        customWorkouts: (prev.customWorkouts || []).map((w) =>
          w.id === editId ? { ...w, name: routineName, exercises } : w,
        ),
      }));
    } else {
      const newRoutine: CustomRoutine = {
        id: `custom-${Date.now()}`,
        name: routineName,
        exercises,
        createdAt: new Date().toISOString(),
      };
      setUser((prev) => ({
        ...prev,
        customWorkouts: [...(prev.customWorkouts || []), newRoutine],
      }));
    }

    showToast(isArabic ? "تم حفظ الروتين" : "Routine saved", "success");
    router.push("/fitness");
  };

  // ---- Library modal animation (backdrop fade + panel slide) ----
  const progress = useSharedValue(0);
  const openLibrary = () => setIsAddingExercise(true);
  const closeLibrary = () => {
    progress.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(setIsAddingExercise)(false);
    });
  };
  useEffect(() => {
    if (isAddingExercise) progress.value = withSpring(1, { damping: 30, stiffness: 350 });
  }, [isAddingExercise]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * screenH }],
  }));

  const headerHeight = insets.top + 56;

  const filterChip = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: selected ? colors.primary : colors.canvas,
        borderColor: selected ? colors.primary : colors.hairline,
      }}
    >
      <AppText
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: selected ? "#ffffff" : colors.ink,
          textTransform: isArabic ? "none" : "uppercase",
          fontFamily: fontFamily(isArabic, 600),
        }}
      >
        {label}
      </AppText>
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
          backgroundColor: colors.canvas,
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
          <ArrowLeft size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
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
          {editId
            ? isArabic
              ? "تعديل الروتين"
              : "Edit Routine"
            : isArabic
              ? "إنشاء روتين"
              : "Create Routine"}
        </AppText>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={8} style={{ opacity: canSave ? 1 : 0.3 }}>
          <AppText
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.primary,
              textTransform: isArabic ? "none" : "uppercase",
              letterSpacing: 1,
              fontFamily: fontFamily(isArabic, 600),
            }}
          >
            {isArabic ? "حفظ" : "Save"}
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 28,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 24,
          maxWidth: 512,
          width: "100%",
          alignSelf: "center",
          gap: 32,
        }}
      >
        {/* Routine name */}
        <View style={{ gap: 16 }}>
          <View style={{ gap: 8 }}>
            <AppText
              variant="fine-print"
              style={{
                color: colors.inkMuted48,
                fontWeight: "600",
                textTransform: isArabic ? "none" : "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 4,
                textAlign: isArabic ? "right" : "left",
                fontFamily: fontFamily(isArabic, 600),
              }}
            >
              {isArabic ? "اسم الروتين" : "Routine Name"}
            </AppText>
            <TextInput
              value={routineName}
              onChangeText={setRoutineName}
              placeholder={isArabic ? "مثال: تمارين الصدر" : "e.g. Chest Day"}
              placeholderTextColor={colors.hairline}
              style={{
                height: 56,
                backgroundColor: colors.canvas,
                borderWidth: 1,
                borderColor: colors.hairline,
                borderRadius: 14,
                paddingHorizontal: 20,
                fontSize: 17,
                color: colors.ink,
                textAlign: isArabic ? "right" : "left",
                fontFamily: fontFamily(isArabic),
              }}
            />
          </View>

          {!canSave && (
            <View style={{ paddingHorizontal: 4, gap: 4 }}>
              {!routineName.trim() && (
                <AppText
                  variant="fine-print"
                  style={{ color: colors.inkMuted48, fontStyle: "italic", textAlign: isArabic ? "right" : "left" }}
                >
                  {isArabic ? "أضف اسم الروتين" : "Add a routine name"}
                </AppText>
              )}
              {selectedExercises.length === 0 && (
                <AppText
                  variant="fine-print"
                  style={{ color: colors.inkMuted48, fontStyle: "italic", textAlign: isArabic ? "right" : "left" }}
                >
                  {isArabic ? "أضف تمريناً واحداً على الأقل" : "Add at least one exercise"}
                </AppText>
              )}
            </View>
          )}
        </View>

        {/* Selected exercises */}
        <View style={{ gap: 16 }}>
          <View
            style={{
              flexDirection: isArabic ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 4,
            }}
          >
            <AppText
              variant="fine-print"
              style={{
                color: colors.inkMuted48,
                fontWeight: "600",
                textTransform: isArabic ? "none" : "uppercase",
                letterSpacing: 0.5,
                fontFamily: fontFamily(isArabic, 600),
              }}
            >
              {isArabic ? "التمارين المختارة" : "Selected Exercises"}
            </AppText>
            <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary, fontFamily: fontFamily(isArabic, 600) }}>
              {selectedExercises.length}
            </AppText>
          </View>

          <View style={{ gap: 12 }}>
            {/* Reorderable list (absolute layout, fixed measured row height) */}
            {selectedExercises.length > 0 && (
              <View style={{ height: selectedExercises.length * (measuredRowH + GAP) - GAP }}>
                {selectedExercises.map((ex) => (
                  <SelectedExerciseRow
                    key={ex.id}
                    ex={ex}
                    positions={positions}
                    rowH={rowH}
                    count={selectedExercises.length}
                    isArabic={isArabic}
                    colors={colors}
                    onMeasure={(h) => {
                      if (Math.abs(h - measuredRowH) > 1) setMeasuredRowH(h);
                    }}
                    removeExercise={removeExercise}
                    updateExercise={updateExercise}
                    commitOrder={commitOrder}
                  />
                ))}
              </View>
            )}

            {/* Add exercise */}
            <Pressable
              onPress={openLibrary}
              style={{
                paddingVertical: 40,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: dashedBorder,
                backgroundColor: colors.canvas,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={20} color={colors.inkMuted48} />
              </View>
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: colors.inkMuted48,
                  textTransform: isArabic ? "none" : "uppercase",
                  letterSpacing: isArabic ? 0 : 2,
                  fontFamily: fontFamily(isArabic, 600),
                }}
              >
                {isArabic ? "إضافة تمرين" : "Add Exercise"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Exercise library modal */}
      <Modal visible={isAddingExercise} transparent animationType="none" onRequestClose={closeLibrary}>
        <View style={{ flex: 1 }}>
          <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)" }, backdropStyle]}>
            <Pressable style={{ flex: 1 }} onPress={closeLibrary} />
          </Animated.View>

          <Animated.View
            style={[
              {
                position: "absolute",
                top: headerHeight,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colors.canvasParchment,
                borderTopLeftRadius: 14,
                borderTopRightRadius: 14,
                borderTopWidth: 1,
                borderColor: colors.hairline,
                overflow: "hidden",
              },
              panelStyle,
            ]}
          >
            {/* Grabber */}
            <View style={{ width: 36, height: 6, borderRadius: 9999, backgroundColor: colors.hairline, alignSelf: "center", marginVertical: 12 }} />

            {/* Title row */}
            <View
              style={{
                paddingHorizontal: 24,
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
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
                {isArabic ? "مكتبة التمارين" : "Library"}
              </AppText>
              <Pressable
                onPress={closeLibrary}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} color={colors.ink} />
              </Pressable>
            </View>

            {/* Search + filters */}
            <View style={{ paddingHorizontal: 24, marginBottom: 24, gap: 20 }}>
              <View style={{ justifyContent: "center" }}>
                <Search size={16} color={colors.hairline} style={{ position: "absolute", left: 16, zIndex: 1 }} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={isArabic ? "ابحث عن تمرين..." : "Search exercises..."}
                  placeholderTextColor={colors.hairline}
                  style={{
                    height: 48,
                    backgroundColor: colors.canvas,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    borderRadius: 14,
                    paddingLeft: 44,
                    paddingRight: 20,
                    fontSize: 15,
                    color: colors.ink,
                    textAlign: isArabic ? "right" : "left",
                    fontFamily: fontFamily(isArabic),
                  }}
                />
              </View>

              {/* Muscle filter */}
              <View style={{ gap: 8 }}>
                <AppText
                  variant="fine-print"
                  style={{
                    color: colors.inkMuted48,
                    fontWeight: "600",
                    textTransform: isArabic ? "none" : "uppercase",
                    letterSpacing: 0.5,
                    paddingHorizontal: 4,
                    textAlign: isArabic ? "right" : "left",
                    fontFamily: fontFamily(isArabic, 600),
                  }}
                >
                  {isArabic ? "العضلة" : "Muscle"}
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, flexDirection: isArabic ? "row-reverse" : "row" }}
                >
                  {filterChip(isArabic ? "الكل" : "All", !selectedMuscle, () => setSelectedMuscle(null))}
                  {muscleGroups.map((m) => filterChip(m, selectedMuscle === m, () => setSelectedMuscle(m === selectedMuscle ? null : m)))}
                </ScrollView>
              </View>

              {/* Equipment filter */}
              <View style={{ gap: 8 }}>
                <AppText
                  variant="fine-print"
                  style={{
                    color: colors.inkMuted48,
                    fontWeight: "600",
                    textTransform: isArabic ? "none" : "uppercase",
                    letterSpacing: 0.5,
                    paddingHorizontal: 4,
                    textAlign: isArabic ? "right" : "left",
                    fontFamily: fontFamily(isArabic, 600),
                  }}
                >
                  {isArabic ? "الأدوات" : "Equipment"}
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, flexDirection: isArabic ? "row-reverse" : "row" }}
                >
                  {filterChip(isArabic ? "الكل" : "All", !selectedEquipment, () => setSelectedEquipment(null))}
                  {equipmentTypes.map((eq) => filterChip(eq, selectedEquipment === eq, () => setSelectedEquipment(eq === selectedEquipment ? null : eq)))}
                </ScrollView>
              </View>
            </View>

            {/* Results */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 48, gap: 12 }}
            >
              {filteredLibrary.length === 0 ? (
                <View style={{ paddingVertical: 48 }}>
                  <EmptyState
                    icon={<SearchX />}
                    title={isArabic ? "لا توجد تمارين تطابق بحثك" : "No exercises match"}
                    body={isArabic ? "جرب تغيير العضلة أو الأدوات المستخدمة" : "Try clear filters or different search"}
                    ctaLabel={isArabic ? "مسح التصفية" : "Clear filters"}
                    onCta={clearFilters}
                  />
                </View>
              ) : (
                filteredLibrary.map((ex) => (
                  <Pressable
                    key={ex.id}
                    onPress={() => addExercise(ex)}
                    style={{
                      backgroundColor: colors.canvas,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      padding: 12,
                      borderRadius: 14,
                      flexDirection: isArabic ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 8,
                        overflow: "hidden",
                        backgroundColor: colors.canvas,
                        borderWidth: 1,
                        borderColor: colors.hairline,
                      }}
                    >
                      {!!ex.image && (
                        <Image source={{ uri: ex.image }} style={{ width: "100%", height: "100%", opacity: 0.9 }} contentFit="cover" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        variant="body-strong"
                        numberOfLines={1}
                        style={{ color: colors.ink, textTransform: isArabic ? "none" : "uppercase", textAlign: isArabic ? "right" : "left", marginBottom: 2 }}
                      >
                        {ex.name}
                      </AppText>
                      <AppText
                        variant="fine-print"
                        style={{ color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", textAlign: isArabic ? "right" : "left" }}
                      >
                        {ex.muscleGroup} • {ex.equipment}
                      </AppText>
                    </View>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={20} color="#ffffff" />
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
