/**
 * CoachChat — RN port of src/screens/main/CoachChat.tsx.
 *
 * Coach header (avatar + name + swap), scrolling message thread (coach/user
 * bubbles, optional week-editor action card), premium quick-action chips, and a
 * composer. Free users see an "Unlock CoachChat" CTA instead of the composer.
 * Messages run through interpretWeekMessage for week-edit suggestions.
 *
 * Web→RN: navigate(-1) → router.back(); location.state.contextHint →
 * useLocalSearchParams (contextType/exerciseName/...); <input> → <TextInput>;
 * gate on user.subscriptionTier !== "free" (mobile has no subscriptionStatus
 * field — tier is the 1:1 equivalent, "free" = locked, matching the web default).
 */
import React, { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Send, RefreshCw, Calendar, Battery, Dumbbell } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import CoachAvatar from "../src/components/CoachAvatar";
import { interpretWeekMessage } from "../src/lib/weekInterpreter";
import { COACHES } from "../src/constants";
import { useTheme } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";

interface Message {
  id: string;
  role: "coach" | "user";
  text: string;
  arabicText: string;
  time: string;
  hasWeekEditorCard?: boolean;
}

function ff(isArabic: boolean, weight: 400 | 500 | 600 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

export default function CoachChat() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contextType?: string; exerciseName?: string; arabicExerciseName?: string }>();
  const contextHint = params.contextType === "exercise" ? { type: "exercise", exerciseName: params.exerciseName, arabicExerciseName: params.arabicExerciseName } : undefined;

  const { user } = useAppContext();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";
  const coachId = user.coach || "khaled";
  const coachData = COACHES.find((c) => c.id === coachId) ?? COACHES[0];
  const coachName = coachData.name;
  const arabicCoachName = coachData.arabicName;
  const isPremium = user.subscriptionTier !== "free";

  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", role: "coach", text: "Welcome back. How are you feeling today?", arabicText: "نورت تاني. عامل إيه النهاردة؟", time: "9:42 AM" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const fmtTime = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const send = async (textToSent?: string) => {
    const textMsg = typeof textToSent === "string" ? textToSent : input;
    if (!textMsg.trim()) return;
    setMessages((prev) => [...prev, { id: `u${Date.now()}`, role: "user", text: textMsg, arabicText: textMsg, time: fmtTime() }]);
    if (!textToSent || typeof textToSent !== "string") setInput("");

    const update = await interpretWeekMessage(textMsg, 2, user);
    if (update.overrides.length > 0) {
      setMessages((prev) => [...prev, { id: `c${Date.now()}`, role: "coach", text: update.coachResponse.en, arabicText: update.coachResponse.ar, time: fmtTime(), hasWeekEditorCard: true }]);
    } else {
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: `c${Date.now()}`, role: "coach", text: update.coachResponse.en, arabicText: update.coachResponse.ar, time: fmtTime() }]);
      }, 900);
    }
  };

  const tile1 = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const primary8 = colors.primary + "14";
  const primary10 = colors.primary + "1A";
  const primary20 = colors.primary + "33";
  const disabledBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const swapActive = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  const chips = [
    { label: isArabic ? "عدّل أسبوعي" : "Adjust my week", icon: <Calendar size={14} color={colors.primary} />, route: "/plan/week/2" as const },
    { label: isArabic ? "حاسس بإرهاق النهارده" : "I'm feeling off today", icon: <Battery size={14} color={colors.primary} />, isMsg: true },
    { label: isArabic ? "سجّل تمرين سريع" : "Log a quick workout", icon: <Dumbbell size={14} color={colors.primary} />, route: "/workout/custom-builder" as const },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          <CoachAvatar coachId={coachId} size={36} verified />
          <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? arabicCoachName : coachName}</AppText>
            <AppText style={{ fontSize: 11, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "مدربك" : "Your coach"}</AppText>
          </View>
        </View>
        <Pressable onPress={() => router.push("/coach-swap")} style={{ width: 44, height: 44, borderRadius: 9999, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }}>
          <RefreshCw size={18} color={colors.inkMuted48} />
        </Pressable>
      </View>

      {/* Thread */}
      <ScrollView ref={scrollRef} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24, gap: 12 }}>
        {contextHint?.type === "exercise" && (
          <View style={{ padding: 12, backgroundColor: primary8, borderWidth: 1, borderColor: primary20, borderRadius: 10, alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, marginBottom: 2, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 0.8, fontFamily: ff(isArabic, 600) }}>{isArabic ? "السياق" : "Context"}</AppText>
            <AppText style={{ fontSize: 13, color: colors.ink, fontFamily: ff(isArabic) }}>{isArabic ? `سؤال عن: ${contextHint.arabicExerciseName || contextHint.exerciseName}` : `About: ${contextHint.exerciseName}`}</AppText>
          </View>
        )}
        {messages.map((m) => {
          const isCoach = m.role === "coach";
          const alignSelf = isCoach ? (isArabic ? "flex-end" : "flex-start") : isArabic ? "flex-start" : "flex-end";
          return (
            <View key={m.id} style={{ gap: 4, alignItems: alignSelf }}>
              <View style={{ maxWidth: "78%", backgroundColor: isCoach ? tile1 : colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
                <AppText style={{ fontSize: 14, lineHeight: 19, color: isCoach ? colors.ink : "#ffffff", textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? m.arabicText : m.text}</AppText>
                <AppText style={{ fontSize: 10, marginTop: 4, color: isCoach ? colors.inkMuted48 : "rgba(255,255,255,0.7)", fontVariant: ["tabular-nums"], textAlign: isArabic ? "left" : "right" }}>{m.time}</AppText>
              </View>
              {m.hasWeekEditorCard && (
                <View style={{ maxWidth: "78%", flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  <Pressable onPress={() => router.push("/plan/week/2")} style={{ backgroundColor: primary10, borderWidth: 1, borderColor: primary20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                    <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.primary, fontFamily: ff(isArabic, 500) }}>{isArabic ? "افتح محرر الأسبوع" : "Open week editor"}</AppText>
                  </Pressable>
                  <Pressable onPress={() => setMessages((prev) => prev.map((mm) => (mm.id === m.id ? { ...mm, hasWeekEditorCard: false } : mm)))} style={{ backgroundColor: swapActive, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
                    <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.inkMuted48, fontFamily: ff(isArabic, 500) }}>{isArabic ? "بس كلام عادي" : "Just chatting"}</AppText>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Composer */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.canvas, paddingBottom: insets.bottom }}>
        {isPremium && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
            {chips.map((chip, idx) => (
              <Pressable key={idx} onPress={() => { if (chip.route) router.push(chip.route); else if (chip.isMsg) send(chip.label); }} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, backgroundColor: primary8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}>
                {chip.icon}
                <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.primary, fontFamily: ff(isArabic, 500) }}>{chip.label}</AppText>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <View style={{ paddingHorizontal: 12, paddingVertical: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          {isPremium ? (
            <>
              <TextInput
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send()}
                returnKeyType="send"
                placeholder={isArabic ? "اكتب رسالة…" : "Message…"}
                placeholderTextColor={colors.inkMuted48}
                style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: tile1, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 16, fontSize: 14, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}
              />
              <Pressable onPress={() => send()} disabled={!input.trim()} style={{ width: 44, height: 44, borderRadius: 9999, alignItems: "center", justifyContent: "center", backgroundColor: input.trim() ? colors.primary : disabledBg }}>
                <Send size={18} color={input.trim() ? "#ffffff" : colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => router.push("/premium")} style={{ width: "100%", height: 44, borderRadius: 9999, backgroundColor: primary10, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? "افتح محادثة المدرب" : "Unlock CoachChat"}</AppText>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
