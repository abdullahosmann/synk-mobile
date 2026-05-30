/**
 * VoiceLog — RN port of src/screens/main/VoiceLog.tsx.
 *
 * A press-and-hold voice-logging mock: idle → recording (60s cap) → processing
 * → confirm (or error). The recognition is mocked (web used getUserMedia only
 * as a permission gate, then hardcoded the result); this port keeps the same UI
 * states and the hardcoded "grilled chicken with rice" result. No audio
 * package is installed, so there is no permission gate to fail — the error
 * card is still reachable via the same code path if a gate is added later.
 *
 * Web→RN: navigate(-1) → router.back(); navigate("/nutrition?openSearch=1") →
 * router.push; onMouseDown/Up + onTouchStart/End → Pressable onPressIn/Out;
 * motion pulse rings / spin → reanimated withRepeat; bottom cards → reanimated
 * SlideInDown.
 */
import React, { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { X, Mic, Check, Edit2, AlertCircle, RefreshCw, Utensils } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import CoachAvatar from "../src/components/CoachAvatar";
import { useToast } from "../src/components/ToastProvider";
import { useColors } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";

type VoicePhase = "idle" | "recording" | "processing" | "confirm" | "error";

const RED = "#ff3b30";

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

/** Expanding ring that fades as it grows (the recording pulse). */
function PulseRing({ maxScale, delay }: { maxScale: number; delay: number }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(0.8, { duration: 0 }), withTiming(maxScale, { duration: 1500, easing: Easing.out(Easing.ease) })), -1);
    opacity.value = withRepeat(withSequence(withTiming(0.5, { duration: 0 }), withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) })), -1);
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: `rgba(255,59,48,${delay > 0 ? 0.2 : 0.3})` }, style]}
    />
  );
}

export default function VoiceLog() {
  const router = useRouter();
  const { user, isPremium, setTodaysLogs } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [timer, setTimer] = useState(0);
  const [permissionError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hints = isArabic
    ? ["أكلت كشري", "٣ مجموعات بنش برس ٦٠ كجم", "أشعر بالتعب اليوم"]
    : ["I ate koshary", "3 sets bench at 60kg", "feeling tired today"];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStopRecording = () => {
    setPhase((p) => {
      if (p !== "recording") return p;
      setTimeout(() => setPhase("confirm"), 2000);
      return "processing";
    });
  };

  useEffect(() => {
    if (phase === "recording") {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev >= 59) {
            handleStopRecording();
            showToast(isArabic ? "توقف التسجيل عند ٦٠ ثانية" : "Recording stopped at 60s", "info");
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimer(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleStartRecording = () => {
    if (permissionError) return;
    setPhase("recording");
  };

  const handleConfirm = () => {
    setTodaysLogs((prev) => ({
      ...prev,
      foods: [
        ...prev.foods,
        {
          id: Date.now().toString(),
          name: isArabic ? "فراخ مشوية مع رز" : "Grilled chicken with rice",
          calories: 450,
          protein: 25,
          carbs: 60,
          fat: 12,
          portion: isArabic ? "حصة واحدة" : "1 serving",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          loggedAt: new Date().toISOString(),
        } as any,
      ],
    }));
    showToast(isArabic ? "تم حفظ السجل" : "Log saved successfully", "success");
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Idle breathing + processing spin (shared values).
  const breathe = useSharedValue(1);
  const spin = useSharedValue(0);
  useEffect(() => {
    if (phase === "idle") {
      breathe.value = withRepeat(withSequence(withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })), -1);
    } else {
      cancelAnimation(breathe);
      breathe.value = withTiming(1, { duration: 150 });
    }
    if (phase === "processing") {
      spin.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1);
    } else {
      cancelAnimation(spin);
      spin.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const micStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));
  const ringSpinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const iconSpinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${-spin.value}deg` }] }));

  // ---- Permission error full screen ----
  if (permissionError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,59,48,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <AlertCircle size={40} color={RED} />
        </View>
        <AppText style={{ fontSize: 24, fontWeight: "600", color: colors.ink, marginBottom: 16, textAlign: "center", fontFamily: ff(isArabic, 600) }}>
          {isArabic ? "الميكروفون مطلوب" : "Microphone Required"}
        </AppText>
        <AppText style={{ fontSize: 15, color: colors.inkMuted48, marginBottom: 40, lineHeight: 22, textAlign: "center", fontFamily: ff(isArabic) }}>
          {isArabic ? "نحتاج الوصول للميكروفون لتحويل صوتك إلى بيانات. يرجى تفعيل الإذن من إعدادات جهازك." : "We need microphone access to turn your voice into data. Please enable permissions in your device settings."}
        </AppText>
        <Pressable onPress={() => router.back()} style={{ width: "100%", maxWidth: 320, height: 56, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
          <AppText style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>{isArabic ? "العودة" : "Go Back"}</AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header (close) */}
      <View style={{ position: "absolute", top: insets.top + 8, right: 24, zIndex: 50 }}>
        <Pressable onPress={() => router.back()} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
          <X size={24} strokeWidth={2.5} color={colors.ink} />
        </Pressable>
      </View>

      {/* Main */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 32 }}>
        <View style={{ alignItems: "center", gap: 16 }}>
          <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1.5, fontFamily: ff(isArabic, 600) }}>
            {isArabic ? "تسجيل صوتي" : "Voice Log"}
          </AppText>
          {!isPremium && (
            <View style={{ backgroundColor: colors.canvas, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 9999, borderWidth: 1, borderColor: colors.hairline }}>
              <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>{isArabic ? "٣ / ٥ اليوم" : "3 / 5 today"}</AppText>
            </View>
          )}
        </View>

        {/* Mic button + rings */}
        <View style={{ width: 140, height: 140, alignItems: "center", justifyContent: "center" }}>
          {phase === "recording" && (
            <>
              <PulseRing maxScale={2.2} delay={0} />
              <PulseRing maxScale={1.8} delay={0.5} />
            </>
          )}
          {phase === "processing" && (
            <Animated.View
              pointerEvents="none"
              style={[{ position: "absolute", width: 124, height: 124, borderRadius: 62, borderWidth: 3, borderColor: colors.primary, borderTopColor: "transparent" }, ringSpinStyle]}
            />
          )}
          <Pressable onPressIn={handleStartRecording} onPressOut={handleStopRecording}>
            <Animated.View style={[{ width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", backgroundColor: phase === "recording" ? RED : colors.primary }, micStyle]}>
              {phase === "processing" ? (
                <Animated.View style={iconSpinStyle}>
                  <RefreshCw size={40} color="#fff" />
                </Animated.View>
              ) : (
                <Mic size={40} color="#fff" />
              )}
            </Animated.View>
          </Pressable>
        </View>

        {/* Status line */}
        <View style={{ height: 48, alignItems: "center", justifyContent: "center" }}>
          {phase === "idle" && (
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>
              {isArabic ? "اضغط وتكلم" : "Tap and hold to speak"}
            </AppText>
          )}
          {phase === "recording" && <AppText style={{ fontSize: 20, fontWeight: "600", color: RED }}>{formatTime(timer)}</AppText>}
          {phase === "processing" && (
            <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "بستمع..." : "Listening..."}</AppText>
          )}
        </View>

        {/* Hint chips */}
        {phase === "idle" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, maxWidth: 360, paddingHorizontal: 16 }}>
            {hints.map((hint, i) => (
              <View key={i} style={{ backgroundColor: colors.canvas, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: colors.hairline }}>
                <AppText style={{ fontSize: 13, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>"{hint}"</AppText>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Confirmation card */}
      {phase === "confirm" && (
        <Animated.View
          entering={SlideInDown.springify().damping(25).stiffness(200)}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.canvas, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderTopWidth: 1, borderTopColor: colors.hairline, paddingHorizontal: 32, paddingTop: 32, paddingBottom: insets.bottom + 32, zIndex: 100 }}
        >
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <CoachAvatar coachId={user.coach || "khaled"} size={48} />
            <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
              <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1.5, fontFamily: ff(isArabic, 600) }}>
                {isArabic ? "سمعت:" : "I heard:"}
              </AppText>
              <AppText style={{ fontSize: 18, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600), textAlign: isArabic ? "right" : "left" }}>
                {isArabic ? "فراخ مشوية مع رز" : "Grilled chicken with rice"}
              </AppText>
            </View>
          </View>

          <View style={{ backgroundColor: colors.canvasParchment, borderRadius: 24, padding: 20, marginBottom: 32, borderWidth: 1, borderColor: colors.hairline }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center" }}>
                  <Utensils size={20} color={colors.primary} />
                </View>
                <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                  <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "وجبة" : "Meal Entry"}</AppText>
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48 }}>≈ 450 kcal • 25g protein</AppText>
                </View>
              </View>
              <Pressable onPress={() => showToast(isArabic ? "قريباً" : "Coming soon", "info")} style={{ padding: 8 }}>
                <Edit2 size={20} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <Pressable onPress={handleConfirm} style={{ height: 64, borderRadius: 9999, backgroundColor: colors.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Check size={22} strokeWidth={3} color="#fff" />
              <AppText style={{ color: "#fff", fontSize: 17, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1, fontFamily: ff(isArabic, 600) }}>
                {isArabic ? "تأكيد الحفظ" : "Confirm & Save"}
              </AppText>
            </Pressable>
            <Pressable onPress={() => setPhase("idle")} style={{ height: 56, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 1.5, fontFamily: ff(isArabic, 600) }}>
                {isArabic ? "إلغاء" : "Discard"}
              </AppText>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Error card */}
      {phase === "error" && (
        <Animated.View
          entering={SlideInDown.springify().damping(25).stiffness(200)}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.canvas, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 32, paddingTop: 32, paddingBottom: insets.bottom + 32, alignItems: "center", zIndex: 100 }}
        >
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(255,59,48,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <AlertCircle size={32} color={RED} />
          </View>
          <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, marginBottom: 8, textAlign: "center", fontFamily: ff(isArabic, 600) }}>
            {isArabic ? "لم أستطع فهم ذلك" : "I didn't catch that"}
          </AppText>
          <AppText style={{ fontSize: 15, color: colors.inkMuted48, marginBottom: 32, lineHeight: 22, textAlign: "center", maxWidth: 320, fontFamily: ff(isArabic) }}>
            {isArabic ? "حاول مرة أخرى أو قم بتسجيل الوجبة أو التمرين يدوياً." : "Try again or log your meal or workout manually."}
          </AppText>
          <View style={{ width: "100%", gap: 12 }}>
            <Pressable onPress={() => setPhase("idle")} style={{ height: 56, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "حاول مرة أخرى" : "Try Again"}</AppText>
            </Pressable>
            <Pressable onPress={() => router.push("/fitness?tab=nutrition&openSearch=1")} style={{ height: 56, borderRadius: 9999, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ color: colors.ink, fontSize: 15, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "سجل يدوياً" : "Log Manually"}</AppText>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
