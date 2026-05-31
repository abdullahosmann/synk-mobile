/**
 * WeekEditor — RN port of src/screens/main/WeekEditor.tsx.
 *
 * Per-week plan editor: tell the coach about your week (free text + rotating
 * placeholder + mic) → interpretWeekMessage returns day overrides + a coach
 * reply → preview them on the day list → Apply/Undo via a sticky bar. Week 1
 * is read-only. Same stub data/logic as web (weekInterpreter, adaptationBus).
 *
 * Web→RN: location.state.initialMessage → route param; auto-resize textarea →
 * multiline TextInput; window.history.replaceState → router.setParams (clear
 * initialMessage); animate-pulse skeletons → static placeholder rows.
 */
import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronLeft, ChevronRight, Mic, Sparkles } from "lucide-react-native";
import { useAppContext } from "../../../src/AppContext";
import { useToast } from "../../../src/components/ToastProvider";
import { useColors } from "../../../src/theme/ThemeProvider";
import { AppText } from "../../../src/components/ui/Typography";
import CoachAvatar from "../../../src/components/CoachAvatar";
import { interpretWeekMessage } from "../../../src/lib/weekInterpreter";
import { adaptationBus } from "../../../src/lib/adaptationBus";
import { DayOverride } from "../../../src/types";

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

const AMBER_BG = "rgba(251,191,36,0.1)";
const AMBER_TEXT = "#d97706";
const GREEN = "#22c55e";

export default function WeekEditor() {
  const router = useRouter();
  const params = useLocalSearchParams<{ weekNumber?: string; initialMessage?: string }>();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const num = parseInt(params.weekNumber || "1", 10);
  const isPast = num < 2;

  const [message, setMessage] = useState(params.initialMessage || "");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOverrides, setPendingOverrides] = useState<DayOverride[]>([]);
  const [coachReply, setCoachReply] = useState<{ en: string; ar: string } | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const didInit = useRef(false);

  const placeholdersEn = [
    "Friday and Saturday I'm traveling to Sharm, hotel gym has dumbbells only",
    "Sunday wedding, probably will be exhausted Monday",
    "Slammed at work all week, only have 30 min per session",
    "Sick today, not sure about the rest of the week",
  ];
  const placeholdersAr = [
    "الجمعة والسبت مسافر شرم، الجيم في الفندق دامبل بس",
    "الأحد فرح، الاثنين هكون مرهق غالباً",
    "شغل كتير الأسبوع كله، معايا بس ٣٠ دقيقة لكل تمرين",
    "تعبان النهارده، مش متأكد من باقي الأسبوع",
  ];

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx((p) => (p + 1) % 4), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateWeek = async (msg: string) => {
    if (!msg.trim()) return;
    setIsLoading(true);
    const update = await interpretWeekMessage(msg, num, user);
    setPendingOverrides(update.overrides);
    setCoachReply(update.coachResponse);
    setIsLoading(false);
  };

  useEffect(() => {
    if (params.initialMessage && !didInit.current) {
      didInit.current = true;
      handleUpdateWeek(params.initialMessage);
      router.setParams({ initialMessage: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    const newOverrides = { ...user.weekOverrides };
    pendingOverrides.forEach((o) => {
      newOverrides[o.date] = o;
    });
    setUser({ ...user, weekOverrides: newOverrides });
    adaptationBus.dispatch("week-adapted", pendingOverrides);
    showToast(
      isArabic ? `الأسبوع اتعدل. ${pendingOverrides.length} يوم اتغيروا.` : `Week updated. ${pendingOverrides.length} days adjusted.`,
      "success",
    );
    setPendingOverrides([]);
    setCoachReply(null);
    setMessage("");
  };

  const handleUndo = () => {
    setPendingOverrides([]);
    setCoachReply(null);
  };

  const getSimulatedDateStr = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  };

  const weekDays = [
    { date: getSimulatedDateStr(0), dayEn: "MON", dayAr: "اث", baseWorkout: "Upper Body Power", dur: 45, sets: 18, isToday: true, isDone: false, isRest: false },
    { date: getSimulatedDateStr(1), dayEn: "TUE", dayAr: "ثل", baseWorkout: "Lower Body Strength", dur: 50, sets: 20, isToday: false, isDone: false, isRest: false },
    { date: getSimulatedDateStr(2), dayEn: "WED", dayAr: "أر", baseWorkout: "Rest day", dur: 0, sets: 0, isToday: false, isDone: false, isRest: true },
    { date: getSimulatedDateStr(3), dayEn: "THU", dayAr: "خم", baseWorkout: "Push / Hypertrophy", dur: 45, sets: 18, isToday: false, isDone: false, isRest: false },
    { date: getSimulatedDateStr(4), dayEn: "FRI", dayAr: "جم", baseWorkout: "Pull / Hypertrophy", dur: 45, sets: 18, isToday: false, isDone: false, isRest: false },
    { date: getSimulatedDateStr(5), dayEn: "SAT", dayAr: "سب", baseWorkout: "Legs & Core", dur: 50, sets: 20, isToday: false, isDone: false, isRest: false },
    { date: getSimulatedDateStr(6), dayEn: "SUN", dayAr: "أح", baseWorkout: "Rest day", dur: 0, sets: 0, isToday: false, isDone: false, isRest: true },
  ];

  const cardBase = {
    backgroundColor: colors.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
  } as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.canvasParchment, borderBottomWidth: 1, borderBottomColor: colors.hairline, zIndex: 50 }}>
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 8,
            paddingHorizontal: 16,
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? `الأسبوع ${num}` : `Week ${num}`}
            </AppText>
            <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: fontFamily(isArabic) }}>
              {isArabic ? "٢٦ مايو - ١ يونيو" : "May 26 – June 1"}
            </AppText>
          </View>
          <View style={{ width: 44 }} />
        </View>
        {isPast && (
          <View style={{ width: "100%", backgroundColor: "rgba(0,0,0,0.05)", paddingVertical: 6, paddingHorizontal: 16, alignItems: "center" }}>
            <AppText style={{ fontSize: 11, color: colors.inkMuted48, fontFamily: fontFamily(isArabic) }}>
              {isArabic ? "هذا الأسبوع منتهي ولا يمكن تعديله" : "This week is complete and read-only"}
            </AppText>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + (pendingOverrides.length > 0 ? 96 : 32), maxWidth: 448, width: "100%", alignSelf: "center" }}
      >
        {!isPast && (
          <View style={[cardBase, { padding: 16, marginHorizontal: 16, marginTop: 24 }]}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
              <CoachAvatar coachId={user.coach || "khaled"} size={28} grayscale={0} />
              <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
                  {isArabic ? "كلّم المدرب عن أسبوعك" : "Tell coach about this week"}
                </AppText>
                <AppText style={{ fontSize: 13, color: colors.inkMuted48, lineHeight: 18, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                  {isArabic
                    ? "سفر، مواعيد، طاقة، معدات — أي حاجة هتأثر على أسبوعك."
                    : "Travel, schedule, energy, equipment — anything that affects your week."}
                </AppText>
              </View>
            </View>

            <View style={{ borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, backgroundColor: colors.canvasParchment, padding: 12, marginBottom: 12 }}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={isArabic ? placeholdersAr[placeholderIdx] : placeholdersEn[placeholderIdx]}
                placeholderTextColor={colors.inkMuted24}
                multiline
                maxLength={300}
                textAlignVertical="top"
                style={{ minHeight: 80, fontSize: 15, color: colors.ink, paddingRight: isArabic ? 0 : 40, paddingLeft: isArabic ? 40 : 0, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}
              />
              <View style={{ position: "absolute", bottom: 10, [isArabic ? "left" : "right"]: 10 }}>
                <Pressable
                  onPress={() => router.push("/voice-log")}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center" }}
                >
                  <Mic size={18} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => handleUpdateWeek(message)}
              disabled={!message.trim() || isLoading}
              style={{
                height: 48,
                backgroundColor: colors.primary,
                borderRadius: 9999,
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: !message.trim() || isLoading ? 0.5 : 1,
              }}
            >
              <Sparkles size={18} color={colors.onPrimary} />
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: fontFamily(isArabic, 600) }}>
                {isArabic ? "حدّث أسبوعي" : "Update my week"}
              </AppText>
            </Pressable>
          </View>
        )}

        <View style={{ marginTop: 32 }}>
          <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1.5, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "الأيام" : "DAYS"}
            </AppText>
          </View>

          {coachReply && (
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12, marginBottom: 16, marginHorizontal: 16 }}>
              <CoachAvatar coachId={user.coach || "khaled"} size={32} grayscale={0} />
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  padding: 12,
                  borderRadius: 16,
                  borderTopLeftRadius: isArabic ? 16 : 4,
                  borderTopRightRadius: isArabic ? 4 : 16,
                }}
              >
                <AppText style={{ fontSize: 14, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic) }}>
                  {isArabic ? coachReply.ar : coachReply.en}
                </AppText>
              </View>
            </View>
          )}

          <View style={{ gap: 8, marginHorizontal: 16 }}>
            {isLoading
              ? Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <View key={i} style={[cardBase, { padding: 16, height: 76, flexDirection: "row", gap: 16, alignItems: "center" }]}>
                      <View style={{ width: 40, height: 44, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 6 }} />
                      <View style={{ flex: 1, gap: 8 }}>
                        <View style={{ width: "66%", height: 16, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 4 }} />
                        <View style={{ width: "33%", height: 12, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 4 }} />
                      </View>
                    </View>
                  ))
              : weekDays.map((ds, i) => {
                  const savedOverride = user.weekOverrides?.[ds.date];
                  const pendingOverride = pendingOverrides.find((o) => o.date === ds.date);
                  const override = pendingOverride || savedOverride;

                  const showDate = ds.date.split("-")[2];
                  const dayLabel = isArabic ? ds.dayAr : ds.dayEn;

                  const name = override?.newWorkoutPreview ? override.newWorkoutPreview.name : ds.baseWorkout;
                  const dur = override?.newWorkoutPreview ? override.newWorkoutPreview.duration : ds.dur;
                  const sets = override?.newWorkoutPreview ? override.newWorkoutPreview.sets : ds.sets;
                  const isRest = override?.newWorkoutPreview ? override.newWorkoutPreview.duration === 0 : ds.isRest;

                  return (
                    <View key={i} style={[cardBase, { flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", padding: 12, gap: 12, overflow: "hidden" }]}>
                      {pendingOverride && (
                        <View style={{ position: "absolute", top: 0, bottom: 0, width: 4, backgroundColor: colors.primary, [isArabic ? "right" : "left"]: 0 }} />
                      )}

                      <View style={{ width: 50, alignItems: "center", justifyContent: "center" }}>
                        <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", fontFamily: fontFamily(isArabic, 600) }}>
                          {dayLabel}
                        </AppText>
                        <AppText style={{ fontSize: 18, fontWeight: "700", color: ds.isToday ? colors.primary : colors.ink, fontFamily: fontFamily(isArabic, 600) }}>
                          {showDate}
                        </AppText>
                      </View>

                      <View style={{ flex: 1, gap: 2, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                        <AppText numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: fontFamily(isArabic, 600) }}>
                          {name}
                        </AppText>
                        {!isRest && (
                          <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: fontFamily(isArabic) }}>
                            {dur} {isArabic ? "دقيقة" : "min"} · {sets} {isArabic ? "مجموعات" : "sets"}
                          </AppText>
                        )}
                      </View>

                      <View style={{ alignItems: "center", justifyContent: "center" }}>
                        {ds.isDone ? (
                          <Check size={20} color={GREEN} />
                        ) : override ? (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: AMBER_BG, borderRadius: 6 }}>
                            <AppText style={{ fontSize: 10, fontWeight: "700", color: AMBER_TEXT, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Inter_600SemiBold" }}>
                              {override.kind.replace("-", " ")}
                            </AppText>
                          </View>
                        ) : ds.isToday ? (
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                        ) : isRest ? (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 6 }}>
                            <AppText style={{ fontSize: 10, fontWeight: "700", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "Inter_600SemiBold" }}>
                              REST
                            </AppText>
                          </View>
                        ) : (
                          <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
                        )}
                      </View>
                    </View>
                  );
                })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky apply/undo bar */}
      {pendingOverrides.length > 0 && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.canvasParchment,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: insets.bottom + 12,
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 50,
          }}
        >
          <Pressable onPress={handleUndo} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
            <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.inkMuted48, fontFamily: fontFamily(isArabic) }}>
              {isArabic ? "تراجع" : "Undo changes"}
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleApply}
            style={{
              height: 44,
              paddingHorizontal: 24,
              backgroundColor: colors.primary,
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.onPrimary, fontFamily: fontFamily(isArabic, 600) }}>
              {isArabic ? "حفظ التعديلات" : "Apply changes"}
            </AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}
