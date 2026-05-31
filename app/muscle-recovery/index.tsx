/**
 * MuscleRecovery — RN port of src/screens/main/MuscleRecovery.tsx.
 *
 * Readiness overview: front+back BodySVG maps, a color legend, overall-readiness
 * card (or first-workout empty state), an info box, and a per-muscle list. Edit
 * mode swaps the header to Cancel/Save and turns each muscle row's bar into a
 * draggable slider (PanResponder, no native slider dep); Reset All zeroes to 100.
 *
 * Web→RN: navigate(-1) → router.back(); BodySVG onMuscleClick → onMusclePress;
 * <input range> → PanResponder slider; AnimatePresence header → conditional.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Edit3, X, Info, RotateCcw, Activity } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { BodySVG, getRecoveryColor } from "../../src/components/BodySVG";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

interface MuscleGroup { id: string; name: string; nameAr: string; view: "front" | "back"; }

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "shoulders", name: "Shoulders", nameAr: "الأكتاف", view: "front" },
  { id: "chest", name: "Chest", nameAr: "الصدر", view: "front" },
  { id: "biceps", name: "Biceps", nameAr: "البايسبس", view: "front" },
  { id: "abs", name: "Abs", nameAr: "البطن", view: "front" },
  { id: "quadriceps", name: "Quadriceps", nameAr: "الأفخاذ الأمامية", view: "front" },
  { id: "back", name: "Back", nameAr: "الظهر", view: "back" },
  { id: "triceps", name: "Triceps", nameAr: "الترايسبس", view: "back" },
  { id: "lower_back", name: "Lower Back", nameAr: "أسفل الظهر", view: "back" },
  { id: "glutes", name: "Glutes", nameAr: "الأرداف", view: "back" },
  { id: "hamstrings", name: "Hamstrings", nameAr: "الأفخاذ الخلفية", view: "back" },
];

const ORANGE = "#ff9500";
const RED = "#ff3b30";

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

type Palette = ReturnType<typeof useTheme>["colors"];

function RecoverySlider({ value, onChange, colors }: { value: number; onChange: (v: number) => void; colors: Palette }) {
  const [w, setW] = useState(0);
  const set = (x: number) => {
    if (w <= 0) return;
    onChange(Math.max(0, Math.min(100, Math.round((x / w) * 100))));
  };
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => set(e.nativeEvent.locationX)}
      onResponderMove={(e) => set(e.nativeEvent.locationX)}
      style={{ height: 24, justifyContent: "center" }}
    >
      <View style={{ height: 4, width: "100%", backgroundColor: colors.hairline, borderRadius: 9999, overflow: "hidden" }}>
        <View style={{ height: 4, width: `${value}%`, backgroundColor: colors.primary }} />
      </View>
      <View style={{ position: "absolute", left: `${value}%`, marginLeft: -8, width: 16, height: 16, borderRadius: 9999, backgroundColor: colors.primary }} />
    </View>
  );
}

export default function MuscleRecovery() {
  const router = useRouter();
  const { user, setUser, streaks } = useAppContext();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const isDark = theme === "dark";

  const [isEditing, setIsEditing] = useState(false);
  const [tempRecovery, setTempRecovery] = useState<Record<string, number>>(user.muscleRecovery || {});

  const recoveryData = isEditing ? tempRecovery : user.muscleRecovery || {};
  const hasAnyCompletedWorkout = streaks.some((s) => s.type === "training" && s.count > 0) || Object.values(user.muscleRecovery || {}).some((val) => (val as number) < 100);

  const handleSave = () => { setUser((prev) => ({ ...prev, muscleRecovery: tempRecovery })); setIsEditing(false); };
  const handleCancel = () => { setTempRecovery(user.muscleRecovery || {}); setIsEditing(false); };
  const updateMuscle = (id: string, value: number) => setTempRecovery((prev) => ({ ...prev, [id]: value }));

  const averageRecovery = Object.keys(recoveryData).length === 0 ? 100 : Math.round((Object.values(recoveryData) as number[]).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(recoveryData).length));

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const primaryTint = colors.primary + "1A";
  const primary30 = colors.primary + "4D";
  const orange70 = ORANGE + "B3";
  const align = isArabic ? "right" : "left";

  const readinessBadge = averageRecovery > 80 ? { bg: colors.primary, fg: colors.onPrimary, label: isArabic ? "مستعد" : "Fresh" } : averageRecovery > 40 ? { bg: primaryTint, fg: colors.primary, label: isArabic ? "يتعافى" : "Recovering" } : { bg: colors.inkMuted48 + "1A", fg: colors.inkMuted48, label: isArabic ? "مجهد" : "Sore" };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 24, height: undefined, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvasParchment, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        {isEditing ? (
          <Pressable onPress={handleCancel} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
            <X size={20} color={colors.ink} strokeWidth={2.5} />
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={24} color={colors.ink} strokeWidth={2.5} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Pressable>
        )}
        <AppText style={{ position: "absolute", left: 0, right: 0, top: insets.top + 18, textAlign: "center", fontSize: 17, fontWeight: "600", letterSpacing: 0.5, textTransform: isArabic ? "none" : "uppercase", color: colors.primary, fontFamily: ff(isArabic, 600) }}>
          {isEditing ? (isArabic ? "تعديل التعافي" : "Edit Recovery") : isArabic ? "تحليل التعافي" : "Muscle Health"}
        </AppText>
        {isEditing ? (
          <Pressable onPress={handleSave} style={{ paddingHorizontal: 20, height: 36, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 13, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ" : "Save"}</AppText>
          </Pressable>
        ) : (
          <Pressable onPress={() => setIsEditing(true)} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
            <Edit3 size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 48, maxWidth: 448, width: "100%", alignSelf: "center" }}>
        <View style={{ marginTop: 32, marginBottom: 32, alignItems: isArabic ? "flex-end" : "flex-start" }}>
          <AppText style={{ fontSize: 28, fontWeight: "600", color: colors.ink, letterSpacing: -0.28, marginBottom: 8, fontFamily: ff(isArabic, 600) }}>{isArabic ? "استشفاء العضلات" : "Recovery Status"}</AppText>
          <AppText style={{ fontSize: 12, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, lineHeight: 17, textAlign: align, fontFamily: ff(isArabic) }}>{isArabic ? "تتبع حالة استشفاء عضلاتك بناءً على تمارينك الأخيرة." : "Track your muscle recovery status based on your recent workouts."}</AppText>
        </View>

        {/* Readiness card */}
        <View style={{ backgroundColor: colors.canvas, borderRadius: 28, padding: 32, marginBottom: 32, borderWidth: 1, borderColor: colors.primary + "33" }}>
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 40, marginBottom: 40 }}>
            <View style={{ width: 96, height: 224 }}>
              <BodySVG view="front" recoveryData={recoveryData} onMusclePress={(id) => !isEditing && router.push(`/muscle-recovery/${id}`)} />
            </View>
            <View style={{ width: 1, height: 128, backgroundColor: colors.hairline }} />
            <View style={{ width: 96, height: 224 }}>
              <BodySVG view="back" recoveryData={recoveryData} onMusclePress={(id) => !isEditing && router.push(`/muscle-recovery/${id}`)} />
            </View>
          </View>

          {/* Legend */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, marginBottom: 32, alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, marginBottom: 12, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: ff(isArabic, 600) }}>{isArabic ? "دليل الألوان" : "LEGEND"}</AppText>
            {[
              { c: primary30, t: isArabic ? "جاهز للتدريب (٩٠٪+)" : "Fresh — ready to train (90%+)" },
              { c: orange70, t: isArabic ? "لسه بيتعافى (٥٠-٨٩٪)" : "Recovering (50–89%)" },
              { c: RED, t: isArabic ? "تعبان — يحتاج راحة (أقل من ٥٠٪)" : "Sore — needs rest (below 50%)" },
            ].map((row, i) => (
              <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <View style={{ width: 16, height: 16, borderRadius: 9999, backgroundColor: row.c }} />
                <AppText style={{ fontSize: 13, color: colors.ink, fontFamily: ff(isArabic) }}>{row.t}</AppText>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.hairline, marginTop: 2, paddingTop: 12, width: "100%" }}>
              <AppText style={{ fontSize: 12, color: colors.inkMuted48, lineHeight: 17, textAlign: align, fontFamily: ff(isArabic) }}>{isArabic ? "الكوتش بيقلل الحمل على العضلات اللي لسه بتتعافى." : "Your coach reduces load on muscles still recovering."}</AppText>
            </View>
          </View>

          {!hasAnyCompletedWorkout && averageRecovery === 100 && !isEditing ? (
            <View style={{ backgroundColor: colors.canvasParchment, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", marginTop: 0 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: primaryTint, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Activity size={24} color={colors.primary} />
              </View>
              <AppText style={{ fontSize: 13, color: colors.inkMuted48, lineHeight: 19, textAlign: "center", fontFamily: ff(isArabic) }}>{isArabic ? "بمجرد ما تخلص أول تمرين، هنبدأ نقيس إيه العضلات اللي محتاجة راحة، علشان الكوتش يعدّل التمارين القادمة." : "Once you complete your first workout, we'll start measuring which muscles need rest."}</AppText>
            </View>
          ) : (
            <View style={{ gap: 24 }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-end", justifyContent: "space-between" }}>
                <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                  <AppText style={{ fontSize: 12, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: colors.inkMuted48, marginBottom: 4, fontFamily: ff(isArabic) }}>{isArabic ? "جاهزية الجسم" : "Overall Readiness"}</AppText>
                  <AppText style={{ fontSize: 48, fontWeight: "600", color: colors.ink, letterSpacing: -0.5, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 600) }}>{averageRecovery}%</AppText>
                </View>
                <View style={{ marginBottom: 8, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 9999, backgroundColor: readinessBadge.bg }}>
                  <AppText style={{ fontSize: 11, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, color: readinessBadge.fg, fontFamily: ff(isArabic, 600) }}>{readinessBadge.label}</AppText>
                </View>
              </View>
              <View style={{ gap: 12 }}>
                <View style={{ height: 6, width: "100%", backgroundColor: colors.hairline, borderRadius: 9999, overflow: "hidden" }}>
                  <View style={{ height: "100%", width: `${averageRecovery}%`, backgroundColor: colors.primary }} />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
                  {["0%", "50%", "100% Ready"].map((t) => (
                    <AppText key={t} style={{ fontSize: 10, color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 0.5 }}>{t}</AppText>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Info box */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ backgroundColor: colors.canvas, borderRadius: 22, padding: 20, flexDirection: isArabic ? "row-reverse" : "row", gap: 16, borderWidth: 1, borderColor: colors.hairline }}>
            <Info size={18} strokeWidth={2.5} color={colors.primary} />
            <AppText style={{ flex: 1, fontSize: 13, color: colors.inkMuted48, lineHeight: 19, textAlign: align, fontFamily: ff(isArabic) }}>
              {isEditing ? (isArabic ? "اضبط إذا كنت تشعر أن بعض العضلات أكثر تعباً. يقلل التطبيق الحمل على العضلات التي تقل نسبة استشفائها عن ٧٠٪" : "Adjust if you feel some muscles are more fatigued. SYNK reduces the load on muscles that are recovered by less than 70%") : isArabic ? "يستخدم التطبيق بياناتك لتخصيص تركيز العضلات وصعوبة التمارين المستقبلية. من الأفضل ممارسة التمارين إذا كانت العضلات مستشفاة بنسبة ٧٠٪ على الأقل." : "SYNK uses your data to personalize muscle focus and difficulty of future workouts. It's best to work out if muscles are at least 70% recovered."}
            </AppText>
          </View>
        </View>

        {/* Muscle list */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4, paddingHorizontal: 4 }}>
            <AppText style={{ fontSize: 12, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: ff(isArabic) }}>{isArabic ? "تفاصيل المجموعات" : "Muscle Group Details"}</AppText>
            {isEditing && (
              <Pressable onPress={() => setTempRecovery(MUSCLE_GROUPS.reduce((acc, mg) => ({ ...acc, [mg.id]: 100 }), {}))} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                <RotateCcw size={14} strokeWidth={3} color={colors.primary} />
                <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إعادة تعيين" : "Reset All"}</AppText>
              </Pressable>
            )}
          </View>

          {MUSCLE_GROUPS.map((m) => {
            const value = recoveryData[m.id] ?? 100;
            const color = getRecoveryColor(value);
            const status = value >= 90 ? (isArabic ? "جاهز" : "Fresh") : value >= 50 ? (isArabic ? "يتعافى" : "Recovery") : isArabic ? "مجهد" : "Sore";
            const Row = (
              <View style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 22, padding: 20 }}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
                    <View style={{ width: 48, height: 48, backgroundColor: colors.canvasParchment, borderRadius: 18, alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 6, borderWidth: 1, borderColor: colors.hairline }}>
                      <BodySVG view={m.view} recoveryData={recoveryData} highlightedId={m.id} />
                    </View>
                    <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, letterSpacing: -0.3, fontFamily: ff(isArabic, 600) }}>{isArabic ? m.nameAr : m.name}</AppText>
                      <AppText style={{ fontSize: 10, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginTop: 2, fontFamily: ff(isArabic) }}>{m.view === "front" ? (isArabic ? "أمامي" : "Front") : isArabic ? "خلفي" : "Back"}</AppText>
                    </View>
                  </View>
                  <View style={{ alignItems: isArabic ? "flex-start" : "flex-end" }}>
                    <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, fontVariant: ["tabular-nums"], marginBottom: 4, fontFamily: ff(isArabic, 600) }}>{value}%</AppText>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                      <Activity size={10} strokeWidth={3} color={colors.inkMuted48} />
                      <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: ff(isArabic, 600) }}>{status}</AppText>
                    </View>
                  </View>
                </View>
                {isEditing ? (
                  <RecoverySlider value={value} onChange={(v) => updateMuscle(m.id, v)} colors={colors} />
                ) : (
                  <View style={{ height: 6, width: "100%", backgroundColor: colors.hairline, borderRadius: 9999, overflow: "hidden" }}>
                    <View style={{ height: "100%", width: `${value}%`, backgroundColor: color }} />
                  </View>
                )}
              </View>
            );
            return isEditing ? (
              <View key={m.id}>{Row}</View>
            ) : (
              <Pressable key={m.id} onPress={() => router.push(`/muscle-recovery/${m.id}`)}>{Row}</Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
