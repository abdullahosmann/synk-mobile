/**
 * MorningCheckIn — RN port of src/screens/main/MorningCheckIn.tsx.
 *
 * 4-step check-in: hours slept (−/+ and slider), sleep quality, mood, energy.
 * On completion writes todaysLogs.morningCheckIn and, if sleep/energy are low,
 * queues a recovery Adaptation, then returns to the dashboard. Top progress
 * bar tracks the step.
 *
 * Web→RN: navigate → router.replace('/dashboard'); <input range> → PanResponder
 * slider; setPendingAdaptations is array-based in mobile (not an updater).
 */
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Moon, Battery, Smile, ArrowRight, Minus, Plus } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useTheme } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";
import type { Adaptation } from "../src/types";

type Palette = ReturnType<typeof useTheme>["colors"];

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

function HoursSlider({ value, onChange, colors }: { value: number; onChange: (v: number) => void; colors: Palette }) {
  const [w, setW] = useState(0);
  const MIN = 4;
  const MAX = 12;
  const pct = ((value - MIN) / (MAX - MIN)) * 100;
  const set = (x: number) => {
    if (w <= 0) return;
    const raw = MIN + (x / w) * (MAX - MIN);
    onChange(Math.max(MIN, Math.min(MAX, Math.round(raw * 2) / 2)));
  };
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true} onResponderGrant={(e) => set(e.nativeEvent.locationX)} onResponderMove={(e) => set(e.nativeEvent.locationX)} style={{ height: 24, justifyContent: "center" }}>
      <View style={{ height: 8, width: "100%", backgroundColor: colors.hairline, borderRadius: 8, overflow: "hidden" }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: colors.primary }} />
      </View>
      <View style={{ position: "absolute", left: `${pct}%`, marginLeft: -10, width: 20, height: 20, borderRadius: 9999, backgroundColor: colors.primary }} />
    </View>
  );
}

export default function MorningCheckIn() {
  const router = useRouter();
  const { user, todaysLogs, setTodaysLogs, pendingAdaptations, setPendingAdaptations } = useAppContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [step, setStep] = useState(1);
  const [hoursSlept, setHoursSlept] = useState(7.5);
  const [selections, setSelections] = useState<{ sleepQuality: number; mood: string; energy: number }>({ sleepQuality: 0, mood: "", energy: 0 });

  const handleComplete = () => {
    setTodaysLogs((prev) => ({ ...prev, morningCheckIn: { hoursSlept, sleepQuality: selections.sleepQuality as any, moodLabel: selections.mood, energy: selections.energy as any } }));

    if (hoursSlept < 6 || selections.sleepQuality <= 2 || selections.energy === 1) {
      const type = hoursSlept < 6 || selections.energy === 1 ? "sleep" : "mood_low";
      const adaptation: Adaptation = {
        id: `morning-${Date.now()}`,
        type: type as any,
        title: isArabic ? "تعديل صباحي" : "Morning Adjustment",
        eventText: isArabic ? `لقد نمت ${hoursSlept} ساعات وأبلغت عن طاقة ${selections.energy === 1 ? "منخفضة" : "متوسطة"}.` : `You slept ${hoursSlept}h and reported ${selections.energy === 1 ? "low" : "medium"} energy.`,
        coachMessage: isArabic ? "لقد قمت بتعديل شدة تمرينك اليوم لضمان تعافيك بشكل أفضل. ركز على التغذية والراحة." : "I've adjusted your intensity for today to ensure better recovery. Focus on nutrition and rest.",
        coachId: user.coach || "khaled",
        createdAt: new Date().toISOString(),
        originalPlan: { icon: "target", label: isArabic ? "تمرين عالي الشدة" : "High Intensity", headline: isArabic ? "الخطة الأصلية" : "Original Plan", sub: isArabic ? "١٠٠٪ من الحمولة" : "100% Load" },
        adaptedPlan: { icon: "battery-low", label: isArabic ? "تمرين استشفائي" : "Recovery Session", headline: isArabic ? "تم التعديل" : "Adapted", sub: isArabic ? "٧٠٪ من الحمولة" : "70% Load" },
      };
      setPendingAdaptations([...pendingAdaptations, adaptation]);
    }

    router.replace("/dashboard");
  };

  const nextStep = () => (step < 4 ? setStep(step + 1) : handleComplete());

  const steps = [
    { id: 1, type: "value", title: isArabic ? "كم ساعة نمت؟" : "How many hours did you sleep?", Icon: Moon },
    { id: 2, type: "choice", key: "sleepQuality", title: isArabic ? "كيف كانت جودة نومك؟" : "How was your sleep?", Icon: Moon, options: [{ label: isArabic ? "سيء" : "Poor", value: 1 }, { label: isArabic ? "عادي" : "Okay", value: 2 }, { label: isArabic ? "جيد" : "Good", value: 3 }, { label: isArabic ? "ممتاز" : "Great", value: 4 }] },
    { id: 3, type: "choice", key: "mood", title: isArabic ? "ما هو مزاجك اليوم؟" : "What is your mood today?", Icon: Smile, options: [{ label: isArabic ? "متعب" : "Tired", value: "tired" }, { label: isArabic ? "سعيد" : "Happy", value: "happy" }, { label: isArabic ? "هادئ" : "Calm", value: "calm" }, { label: isArabic ? "متحمس" : "Excited", value: "excited" }] },
    { id: 4, type: "choice", key: "energy", title: isArabic ? "مستوى الطاقة لديك؟" : "Your energy level?", Icon: Battery, options: [{ label: isArabic ? "منخفض" : "Low", value: 1 }, { label: isArabic ? "متوسط" : "Medium", value: 2 }, { label: isArabic ? "مرتفع" : "High", value: 3 }] },
  ] as const;

  const handleSelection = (key: string, value: any) => {
    setSelections((prev) => ({ ...prev, [key]: value }));
    if (step < 4) setStep(step + 1);
    else {
      // ensure final selection is included before completing
      const finalSel = { ...selections, [key]: value };
      setSelections(finalSel);
      setTodaysLogs((prev) => ({ ...prev, morningCheckIn: { hoursSlept, sleepQuality: finalSel.sleepQuality as any, moodLabel: finalSel.mood, energy: finalSel.energy as any } }));
      if (hoursSlept < 6 || finalSel.sleepQuality <= 2 || finalSel.energy === 1) {
        const type = hoursSlept < 6 || finalSel.energy === 1 ? "sleep" : "mood_low";
        const adaptation: Adaptation = {
          id: `morning-${Date.now()}`,
          type: type as any,
          title: isArabic ? "تعديل صباحي" : "Morning Adjustment",
          eventText: isArabic ? `لقد نمت ${hoursSlept} ساعات وأبلغت عن طاقة ${finalSel.energy === 1 ? "منخفضة" : "متوسطة"}.` : `You slept ${hoursSlept}h and reported ${finalSel.energy === 1 ? "low" : "medium"} energy.`,
          coachMessage: isArabic ? "لقد قمت بتعديل شدة تمرينك اليوم لضمان تعافيك بشكل أفضل. ركز على التغذية والراحة." : "I've adjusted your intensity for today to ensure better recovery. Focus on nutrition and rest.",
          coachId: user.coach || "khaled",
          createdAt: new Date().toISOString(),
          originalPlan: { icon: "target", label: isArabic ? "تمرين عالي الشدة" : "High Intensity", headline: isArabic ? "الخطة الأصلية" : "Original Plan", sub: isArabic ? "١٠٠٪ من الحمولة" : "100% Load" },
          adaptedPlan: { icon: "battery-low", label: isArabic ? "تمرين استشفائي" : "Recovery Session", headline: isArabic ? "تم التعديل" : "Adapted", sub: isArabic ? "٧٠٪ من الحمولة" : "70% Load" },
        };
        setPendingAdaptations([...pendingAdaptations, adaptation]);
      }
      router.replace("/dashboard");
    }
  };

  const currentStep = steps[step - 1];
  const StepIcon = currentStep.Icon;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 24, paddingBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", maxWidth: 448, width: "100%", alignSelf: "center" }}>
        <Pressable onPress={() => router.replace("/dashboard")} accessibilityRole="button" accessibilityLabel={isArabic ? "إغلاق" : "Close"} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
          <X size={24} strokeWidth={2.5} color={colors.ink} />
        </Pressable>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={{ height: 6, borderRadius: 9999, width: s <= step ? 32 : 8, backgroundColor: s <= step ? colors.primary : colors.hairline }} />
          ))}
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Body */}
      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: "center", maxWidth: 448, width: "100%", alignSelf: "center", paddingBottom: 48 }}>
        <View style={{ gap: 48 }}>
          <View style={{ alignItems: "center", gap: 24 }}>
            <View style={{ width: 80, height: 80, backgroundColor: colors.canvas, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.hairline }}>
              <StepIcon size={36} color={colors.primary} />
            </View>
            <AppText style={{ fontSize: 28, fontWeight: "600", letterSpacing: -0.5, color: colors.ink, lineHeight: 34, textAlign: "center", fontFamily: ff(isArabic, 600) }}>{currentStep.title}</AppText>
          </View>

          {currentStep.type === "value" ? (
            <View style={{ gap: 48 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 40 }}>
                <Pressable onPress={() => setHoursSlept((p) => Math.max(4, p - 0.5))} style={{ width: 56, height: 52, borderRadius: 9999, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                  <Minus size={24} color={colors.ink} />
                </Pressable>
                <View style={{ alignItems: "center" }}>
                  <AppText style={{ fontSize: 60, fontWeight: "600", color: colors.ink, fontVariant: ["tabular-nums"], lineHeight: 64, fontFamily: ff(isArabic, 600) }}>{hoursSlept}</AppText>
                  <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1, marginTop: 8, fontFamily: ff(isArabic, 600) }}>{isArabic ? "ساعة" : "HOURS"}</AppText>
                </View>
                <Pressable onPress={() => setHoursSlept((p) => Math.min(12, p + 0.5))} style={{ width: 56, height: 52, borderRadius: 9999, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                  <Plus size={24} color={colors.ink} />
                </Pressable>
              </View>
              <View style={{ paddingHorizontal: 16 }}>
                <HoursSlider value={hoursSlept} onChange={setHoursSlept} colors={colors} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingHorizontal: 4 }}>
                  <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1.5 }}>4H</AppText>
                  <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1.5 }}>12H</AppText>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              {currentStep.options?.map((opt) => (
                <Pressable key={String(opt.value)} onPress={() => handleSelection(currentStep.key!, opt.value)} style={{ width: "48%", paddingVertical: 40, backgroundColor: colors.canvas, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                  <AppText style={{ fontSize: 15, fontWeight: "600", letterSpacing: -0.3, color: colors.ink, fontFamily: ff(isArabic, 600) }}>{opt.label}</AppText>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, alignItems: "center", maxWidth: 448, width: "100%", alignSelf: "center" }}>
        {currentStep.type === "value" ? (
          <>
            <AppText style={{ fontSize: 12, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, marginBottom: 24, fontFamily: ff(isArabic) }}>{isArabic ? "استمر للإكمال" : "Continue to complete"}</AppText>
            <Pressable onPress={nextStep} style={{ width: "100%", height: 64, backgroundColor: colors.primary, borderRadius: 9999, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <AppText style={{ fontSize: 17, fontWeight: "600", letterSpacing: -0.22, color: colors.onPrimary, textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "التالي" : "Next Step"}</AppText>
              <ArrowRight size={22} strokeWidth={2.5} color={colors.onPrimary} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
            </Pressable>
          </>
        ) : (
          <AppText style={{ fontSize: 11, color: colors.inkMuted48, opacity: 0.4, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: ff(isArabic) }}>{isArabic ? "اختر خياراً للمتابعة" : "Select an option to continue"}</AppText>
        )}
      </View>
    </View>
  );
}
