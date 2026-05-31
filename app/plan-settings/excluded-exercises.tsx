/**
 * ExcludedExercises — RN port of src/screens/main/ExcludedExercises.tsx.
 *
 * Lists exercises the user excluded from coach suggestions, each with a Restore
 * button; "Restore all" in the header opens a confirm BottomSheet. Empty state
 * when nothing is excluded. Reads/writes user.excludedExercises via setUser.
 *
 * Web→RN: navigate(-1) → router.back(); <EmptyState>/<BottomSheet> are the
 * ported shared components; date via toLocaleDateString (same as web).
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Ban, RotateCcw } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import BottomSheet from "../../src/components/BottomSheet";
import EmptyState from "../../src/components/EmptyState";
import { Btn } from "../../src/components/ui/Btn";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function ExcludedExercises() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const excluded = user.excludedExercises || [];
  const [confirmRestoreAll, setConfirmRestoreAll] = useState(false);

  const restoreOne = (exerciseId: string) => {
    const name = excluded.find((e) => e.exerciseId === exerciseId)?.exerciseName;
    setUser({
      ...user,
      excludedExercises: excluded.filter((e) => e.exerciseId !== exerciseId),
    });
    showToast(isArabic ? `رجعت "${name}" للاقتراحات` : `Restored "${name}" to suggestions`, "success");
  };

  const restoreAll = () => {
    setUser({ ...user, excludedExercises: [] });
    showToast(isArabic ? "تم استعادة كل التمارين" : "All exercises restored", "success");
    setConfirmRestoreAll(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { day: "numeric", month: "short" });
  };

  const align = isArabic ? "right" : "left";
  const chipBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.canvasParchment,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ flex: 1, fontSize: 17, fontWeight: "600", letterSpacing: -0.3, color: colors.ink, textAlign: align, fontFamily: ff(isArabic, 600) }}>
          {isArabic ? "التمارين المستبعدة" : "Excluded exercises"}
        </AppText>
        {excluded.length > 0 && (
          <Pressable onPress={() => setConfirmRestoreAll(true)}>
            <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>
              {isArabic ? "استعد الكل" : "Restore all"}
            </AppText>
          </Pressable>
        )}
      </View>

      {excluded.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <EmptyState
            icon={<Ban size={32} />}
            title={isArabic ? "مفيش تمارين مستبعدة" : "No excluded exercises"}
            body={
              isArabic
                ? 'لما تختار "ما تقترحش تاني" على تمرين، هتلاقيه هنا.'
                : 'When you choose "Don\'t recommend again" on an exercise, it shows up here.'
            }
          />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 80, maxWidth: 448, width: "100%", alignSelf: "center" }}
        >
          <AppText style={{ fontSize: 13, color: colors.inkMuted48, marginBottom: 16, lineHeight: 19, textAlign: align, fontFamily: ff(isArabic) }}>
            {isArabic
              ? `${excluded.length} تمرين مش هيقترحه الكوتش. ممكن ترجع أي منهم في أي وقت.`
              : `${excluded.length} ${excluded.length === 1 ? "exercise" : "exercises"} your coach won't suggest. You can restore any of them anytime.`}
          </AppText>
          <View style={{ gap: 8 }}>
            {excluded.map((item) => (
              <View
                key={item.exerciseId + item.excludedAt}
                style={{
                  backgroundColor: colors.canvas,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: 10,
                  padding: 12,
                  flexDirection: isArabic ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: chipBg, alignItems: "center", justifyContent: "center" }}>
                  <Ban size={18} color={colors.inkMuted48} />
                </View>
                <View style={{ flex: 1, minWidth: 0, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                  <AppText numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>
                    {isArabic && item.arabicName ? item.arabicName : item.exerciseName}
                  </AppText>
                  <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>
                    {isArabic ? `استبعدته في ${formatDate(item.excludedAt)}` : `Excluded on ${formatDate(item.excludedAt)}`}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => restoreOne(item.exerciseId)}
                  style={{
                    paddingHorizontal: 12,
                    height: 36,
                    borderRadius: 9999,
                    backgroundColor: colors.primary + "1A",
                    flexDirection: isArabic ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <RotateCcw size={14} color={colors.primary} />
                  <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>
                    {isArabic ? "استعد" : "Restore"}
                  </AppText>
                </Pressable>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Confirm restore all */}
      <BottomSheet
        isOpen={confirmRestoreAll}
        onClose={() => setConfirmRestoreAll(false)}
        title={isArabic ? "استعادة كل التمارين؟" : "Restore all exercises?"}
      >
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <AppText style={{ fontSize: 14, color: colors.ink, lineHeight: 22, textAlign: align, fontFamily: ff(isArabic) }}>
            {isArabic
              ? `${excluded.length} تمرين هيرجعوا للاقتراحات. ممكن تستبعد أي تاني تحب.`
              : `${excluded.length} exercises will be eligible for suggestions again. You can re-exclude any later.`}
          </AppText>
          <View style={{ gap: 12 }}>
            <Btn variant="primary" fullWidth label={isArabic ? "استعد الكل" : "Restore all"} onPress={restoreAll} />
            <Btn variant="ghost" fullWidth onPress={() => setConfirmRestoreAll(false)}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>
                {isArabic ? "إلغاء" : "Cancel"}
              </AppText>
            </Btn>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
