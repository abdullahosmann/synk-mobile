/**
 * ImportRoutine — RN port of src/screens/main/ImportRoutine.tsx.
 *
 * Paste a SYNK code/link (or arrive via /r/:encoded) → decode → preview →
 * add to the user's custom routines, then a RoutineReplacementSheet asks how
 * to apply it. Rendered by both app/workout/import.tsx and app/r/[encoded].tsx.
 *
 * Web→RN: `navigator.clipboard.readText()` → RN core `Clipboard.getString()`
 * (avoids a native rebuild vs expo-clipboard); `<textarea>` → multiline
 * TextInput; `navigate('/workout')` → router.push('/fitness').
 */
import React, { useEffect, useState } from "react";
import { Clipboard, Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, ArrowLeft, Check, Clipboard as ClipboardIcon, Dumbbell } from "lucide-react-native";
import { useAppContext } from "../AppContext";
import { useToast } from "../components/ToastProvider";
import { useColors } from "../theme/ThemeProvider";
import { AppText } from "../components/ui/Typography";
import { Btn } from "../components/ui/Btn";
import RoutineReplacementSheet, { ReplacementChoice } from "../components/RoutineReplacementSheet";
import { decodeRoutine, ShareableRoutine } from "../lib/routineSharing";
import { CustomRoutine } from "../types";

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

const ImportRoutine: React.FC<{ encoded?: string }> = ({ encoded }) => {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [pasteValue, setPasteValue] = useState("");
  const [decoded, setDecoded] = useState<ShareableRoutine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [savedRoutine, setSavedRoutine] = useState<CustomRoutine | null>(null);

  // If we came in via /r/:encoded, auto-decode
  useEffect(() => {
    if (encoded) {
      const result = decodeRoutine(encoded);
      if (result) setDecoded(result);
      else setError(isArabic ? "الرابط ده مش صحيح" : "This link is invalid");
    }
  }, [encoded, isArabic]);

  // Accept: raw base64 payload / a SYNK link / a pasted share block.
  const handleOpen = (value?: string) => {
    setError(null);
    const raw = (value ?? pasteValue).trim();
    if (!raw) return;

    let payload = raw;
    const urlMatch = raw.match(/\/r\/([A-Za-z0-9_-]+)/);
    if (urlMatch) {
      payload = urlMatch[1];
    } else {
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const last = lines[lines.length - 1];
        if (last.length > 20 && /^[A-Za-z0-9_-]+$/.test(last)) payload = last;
      }
    }

    const result = decodeRoutine(payload);
    if (!result) {
      setError(
        isArabic
          ? "الكود ده مش صحيح. اتأكد إنك نسخت كل الكود."
          : "This code is invalid. Make sure you copied the full code.",
      );
      return;
    }
    setDecoded(result);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) setPasteValue(text);
      else showToast(isArabic ? "الحافظة فاضية" : "Clipboard is empty", "info");
    } catch {
      showToast(isArabic ? "مش قادر أقرا من الحافظة" : "Could not read clipboard", "info");
    }
  };

  const handleImport = () => {
    if (!decoded) return;
    const newRoutine: CustomRoutine = {
      id: `routine-${Date.now()}`,
      name: decoded.n,
      arabicName: decoded.n,
      exercises: decoded.e.map((ex, idx) => ({
        id: `${Date.now()}-${idx}`,
        name: ex.n,
        sets: ex.s,
        reps: ex.r,
        weight: ex.w,
        muscleGroup: ex.m,
        equipment: ex.eq,
      })),
      createdAt: new Date().toISOString(),
    };
    setUser({ ...user, customWorkouts: [...(user.customWorkouts || []), newRoutine] });
    setImported(true);
    showToast(isArabic ? `تم استيراد "${decoded.n}"` : `Imported "${decoded.n}"`, "success");
    setTimeout(() => setSavedRoutine(newRoutine), 600);
  };

  const handleReplacementChoice = (choice: ReplacementChoice) => {
    const routine = savedRoutine;
    if (!routine) return;
    const todayISO = new Date().toISOString().split("T")[0];

    if (choice === "just-today") {
      setUser({ ...user, planOverride: { routineId: routine.id, appliesTo: "just-today", date: todayISO } });
    } else if (choice === "replace-today") {
      setUser({ ...user, planOverride: { routineId: routine.id, appliesTo: "replace-today", date: todayISO } });
    } else if (choice === "save-as-default") {
      setUser({ ...user, defaultRoutineId: routine.id });
    }

    setSavedRoutine(null);
    router.push("/fitness");
  };

  const handleSheetClose = () => {
    setSavedRoutine(null);
    router.push("/fitness");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 8,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.canvasParchment,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: colors.ink,
            letterSpacing: -0.3,
            fontFamily: fontFamily(isArabic, 600),
          }}
        >
          {isArabic ? "استيراد روتين" : "Import routine"}
        </AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingVertical: 24,
          paddingBottom: insets.bottom + 48,
          maxWidth: 448,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {!decoded ? (
          <>
            <AppText
              style={{
                fontSize: 15,
                color: colors.ink,
                lineHeight: 22,
                marginBottom: 24,
                textAlign: isArabic ? "right" : "left",
                fontFamily: fontFamily(isArabic),
              }}
            >
              {isArabic
                ? "الصق كود سينك أو الرابط اللي شاركه معاك صديقك، وهنضيف الروتين لمكتبتك."
                : "Paste a SYNK code or link your friend shared with you, and we'll add the routine to your library."}
            </AppText>

            <AppText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: colors.inkMuted48,
                marginBottom: 8,
                textTransform: isArabic ? "none" : "uppercase",
                letterSpacing: isArabic ? 0 : 0.5,
                textAlign: isArabic ? "right" : "left",
                fontFamily: fontFamily(isArabic, 600),
              }}
            >
              {isArabic ? "الكود أو الرابط" : "Code or link"}
            </AppText>

            <TextInput
              value={pasteValue}
              onChangeText={setPasteValue}
              placeholder={isArabic ? "الصق هنا..." : "Paste here..."}
              placeholderTextColor={colors.inkMuted48}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
              style={{
                minHeight: 120,
                backgroundColor: colors.canvas,
                borderWidth: 1,
                borderColor: error ? colors.semanticRed : colors.hairline,
                borderRadius: 14,
                padding: 16,
                fontSize: 14,
                color: colors.ink,
                fontFamily: "Inter_400Regular",
              }}
            />

            {!!error && (
              <View
                style={{
                  marginTop: 12,
                  flexDirection: isArabic ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} color={colors.semanticRed} style={{ marginTop: 2 }} />
                <AppText
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: colors.semanticRed,
                    textAlign: isArabic ? "right" : "left",
                    fontFamily: fontFamily(isArabic),
                  }}
                >
                  {error}
                </AppText>
              </View>
            )}

            <Pressable
              onPress={handlePasteFromClipboard}
              style={({ pressed }) => ({
                marginTop: 16,
                backgroundColor: colors.canvas,
                borderWidth: 1,
                borderColor: colors.hairline,
                borderRadius: 14,
                paddingVertical: 12,
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <ClipboardIcon size={16} color={colors.ink} />
              <AppText
                style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: fontFamily(isArabic, 600) }}
              >
                {isArabic ? "الصق من الحافظة" : "Paste from clipboard"}
              </AppText>
            </Pressable>

            <Btn
              variant="primary"
              fullWidth
              disabled={!pasteValue.trim()}
              onPress={() => handleOpen()}
              style={{ marginTop: 12 }}
              label={isArabic ? "افتح الروتين" : "Open routine"}
            />
          </>
        ) : (
          <>
            {/* Preview */}
            <View
              style={{
                backgroundColor: colors.canvas,
                borderWidth: 1,
                borderColor: colors.hairline,
                borderRadius: 14,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: isArabic ? 0 : 0.5,
                  color: colors.primary,
                  textTransform: isArabic ? "none" : "uppercase",
                  marginBottom: 4,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: fontFamily(isArabic, 600),
                }}
              >
                {isArabic ? "معاينة" : "Preview"}
              </AppText>
              <AppText
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: colors.ink,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: fontFamily(isArabic, 600),
                }}
              >
                {decoded.n}
              </AppText>
              <AppText
                style={{
                  fontSize: 13,
                  color: colors.inkMuted48,
                  marginTop: 4,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: fontFamily(isArabic),
                }}
              >
                {decoded.e.length} {isArabic ? "تمرين" : "exercises"}
              </AppText>

              <View
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.hairline,
                  gap: 12,
                }}
              >
                {decoded.e.slice(0, 6).map((ex, i) => (
                  <View
                    key={i}
                    style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: colors.canvasParchment,
                        borderWidth: 1,
                        borderColor: colors.hairline,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Dumbbell size={16} color={colors.inkMuted48} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        numberOfLines={1}
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.ink,
                          textAlign: isArabic ? "right" : "left",
                          fontFamily: fontFamily(isArabic, 600),
                        }}
                      >
                        {ex.n}
                      </AppText>
                      <AppText
                        style={{
                          fontSize: 12,
                          color: colors.inkMuted48,
                          textAlign: isArabic ? "right" : "left",
                          fontFamily: fontFamily(isArabic),
                        }}
                      >
                        {ex.s} × {ex.r}
                        {ex.w > 0 ? ` · ${ex.w} kg` : ""}
                      </AppText>
                    </View>
                  </View>
                ))}
                {decoded.e.length > 6 && (
                  <AppText
                    style={{
                      fontSize: 12,
                      color: colors.inkMuted48,
                      textAlign: "center",
                      fontFamily: fontFamily(isArabic),
                    }}
                  >
                    {isArabic ? `+${decoded.e.length - 6} تاني` : `+${decoded.e.length - 6} more`}
                  </AppText>
                )}
              </View>
            </View>

            <Btn variant="primary" fullWidth disabled={imported} onPress={handleImport}>
              {imported ? (
                <>
                  <Check size={16} color={colors.onPrimary} />
                  <AppText variant="body-strong" style={{ color: colors.onPrimary }}>
                    {isArabic ? "تم الإضافة" : "Added"}
                  </AppText>
                </>
              ) : (
                <AppText variant="body-strong" style={{ color: colors.onPrimary }}>
                  {isArabic ? "أضف لروتيناتي" : "Add to my routines"}
                </AppText>
              )}
            </Btn>

            <Pressable
              onPress={() => {
                setDecoded(null);
                setPasteValue("");
                setError(null);
                setImported(false);
              }}
              style={{ marginTop: 12, paddingVertical: 8 }}
            >
              <AppText
                style={{
                  fontSize: 13,
                  color: colors.inkMuted48,
                  textAlign: "center",
                  fontFamily: fontFamily(isArabic),
                }}
              >
                {isArabic ? "استيراد روتين تاني" : "Import a different routine"}
              </AppText>
            </Pressable>
          </>
        )}
      </ScrollView>

      <RoutineReplacementSheet
        isOpen={!!savedRoutine}
        onClose={handleSheetClose}
        onChoose={handleReplacementChoice}
        routineName={savedRoutine?.name}
      />
    </View>
  );
};

export default ImportRoutine;
