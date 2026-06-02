/**
 * DeleteAccount — RN port of src/screens/main/DeleteAccount.tsx.
 *
 * Permanent-deletion flow: red warning banner, optional "why are you leaving?"
 * reason picker, alternatives suggestion (pause / notifications), a sticky
 * "Delete my account" button, and a final confirmation BottomSheet requiring
 * the user to type DELETE / حذف before the (stubbed) deletion.
 *
 * Web→RN: navigate(-1) → router.back(); navigate(...) → router.push;
 * window.location.href='/' → router.replace('/'); <input> → <TextInput>.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, AlertTriangle, Check } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import BottomSheet from "../../src/components/BottomSheet";
import { useColors } from "../../src/theme/ThemeProvider";
import { withAlpha } from "../../src/theme/tint";
import { AppText } from "../../src/components/ui/Typography";

function ff(isArabic: boolean, weight: 400 | 500 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

const RED = "#ff3b30";

export default function DeleteAccount() {
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";

  const [reason, setReason] = useState<string | null>(null);
  const [confirmSheet, setConfirmSheet] = useState(false);
  const [finalConfirmText, setFinalConfirmText] = useState("");

  const reasons = [
    { id: "too-expensive", labelEn: "Too expensive", labelAr: "غالي أوي" },
    { id: "not-using", labelEn: "Not using it enough", labelAr: "مش بستخدمه كفاية" },
    { id: "found-alternative", labelEn: "Found an alternative", labelAr: "لقيت بديل" },
    { id: "missing-features", labelEn: "Missing features", labelAr: "ناقصه مميزات" },
    { id: "privacy", labelEn: "Privacy concerns", labelAr: "مخاوف الخصوصية" },
    { id: "other", labelEn: "Other", labelAr: "سبب تاني" },
  ];

  const handleConfirmDelete = () => {
    const expectedText = isArabic ? "حذف" : "DELETE";
    if (finalConfirmText.trim().toUpperCase() !== expectedText && finalConfirmText.trim() !== "حذف") {
      showToast(isArabic ? 'اكتب "حذف" للتأكيد' : "Type DELETE to confirm", "error");
      return;
    }
    showToast(isArabic ? "تم جدولة حذف الحساب" : "Account deletion scheduled", "success");
    setConfirmSheet(false);
    setTimeout(() => router.replace("/"), 1500);
  };

  const altRow = (emoji: string, label: string, onPress: () => void) => (
    <Pressable onPress={onPress} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center" }}>
        <AppText style={{ fontSize: 16, color: colors.primary }}>{emoji}</AppText>
      </View>
      <AppText style={{ flex: 1, fontSize: 13, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{label}</AppText>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", backgroundColor: colors.canvasParchment, zIndex: 50 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: colors.ink, marginRight: isArabic ? 0 : 40, marginLeft: isArabic ? 40 : 0, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حذف الحساب" : "Delete account"}</AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 32, maxWidth: 448, width: "100%", alignSelf: "center" }}>
        {/* Warning banner */}
        <View style={{ backgroundColor: "rgba(255,59,48,0.08)", borderWidth: 1, borderColor: "rgba(255,59,48,0.25)", borderRadius: 16, padding: 16, marginBottom: 32, flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
          <AlertTriangle size={20} color={RED} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontSize: 14, fontWeight: "700", color: RED, marginBottom: 4, fontFamily: ff(isArabic, 700) }}>{isArabic ? "ده إجراء نهائي" : "This is permanent"}</AppText>
            <AppText style={{ fontSize: 13, color: RED, opacity: 0.8, lineHeight: 19, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "حذف حسابك هيمسح كل بياناتك نهائياً — تمارينك، تقدمك، إنجازاتك، وكل حاجة." : "Deleting your account will permanently erase all your data — workouts, progress, achievements, everything."}</AppText>
          </View>
        </View>

        {/* Reasons */}
        <View style={{ marginBottom: 32 }}>
          <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? "ليه بتمشي؟ (اختياري)" : "Why are you leaving? (optional)"}</AppText>
          <View style={{ gap: 8 }}>
            {reasons.map((r) => {
              const selected = reason === r.id;
              return (
                <Pressable key={r.id} onPress={() => setReason(r.id)} style={{ padding: 16, borderRadius: 12, borderWidth: 1, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: selected ? withAlpha(colors.primary, 0.05) : colors.canvas, borderColor: selected ? colors.primary : colors.hairline }}>
                  <AppText style={{ fontSize: 14, fontWeight: "500", color: selected ? colors.primary : colors.ink, fontFamily: ff(isArabic, 500) }}>{isArabic ? r.labelAr : r.labelEn}</AppText>
                  {selected && <Check size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Alternatives */}
        <View style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 16, padding: 20 }}>
          <AppText style={{ fontSize: 14, fontWeight: "700", color: colors.ink, marginBottom: 12, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 700) }}>{isArabic ? "بدل ما تحذف..." : "Instead of deleting..."}</AppText>
          <View style={{ gap: 12 }}>
            {altRow("⏸", isArabic ? "أوقف اشتراكك مؤقتاً بدل الحذف" : "Pause your subscription instead", () => router.push("/settings/subscription"))}
            {altRow("🔔", isArabic ? "عدّل إعدادات الإشعارات" : "Adjust notification settings", () => router.push("/settings"))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, backgroundColor: colors.canvasParchment, borderTopWidth: 1, borderTopColor: colors.hairline }}>
        <View style={{ maxWidth: 448, width: "100%", alignSelf: "center" }}>
          <Pressable onPress={() => setConfirmSheet(true)} style={{ height: 56, borderRadius: 9999, backgroundColor: RED, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", fontFamily: ff(isArabic, 600) }}>{isArabic ? "حذف حسابي" : "Delete my account"}</AppText>
          </Pressable>
        </View>
      </View>

      {/* Confirmation sheet */}
      <BottomSheet isOpen={confirmSheet} onClose={() => { setConfirmSheet(false); setFinalConfirmText(""); }} title={isArabic ? "تأكيد أخير" : "Final confirmation"}>
        <View style={{ paddingVertical: 8 }}>
          <AppText style={{ fontSize: 14, color: colors.inkMuted48, marginBottom: 20, lineHeight: 20, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? 'اكتب "حذف" تحت عشان تأكد إنك عايز تحذف حسابك نهائياً.' : 'Type "DELETE" below to confirm you want to permanently delete your account.'}</AppText>
          <TextInput value={finalConfirmText} onChangeText={setFinalConfirmText} placeholder={isArabic ? "حذف" : "DELETE"} placeholderTextColor={colors.inkMuted48} autoCapitalize="characters" style={{ height: 56, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, textAlign: "center", fontSize: 16, fontWeight: "700", letterSpacing: 2, color: colors.ink }} />
          <View style={{ gap: 12 }}>
            <Pressable onPress={handleConfirmDelete} style={{ height: 56, borderRadius: 9999, backgroundColor: RED, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", fontFamily: ff(isArabic, 600) }}>{isArabic ? "احذف نهائياً" : "Delete permanently"}</AppText>
            </Pressable>
            <Pressable onPress={() => { setConfirmSheet(false); setFinalConfirmText(""); }} style={{ height: 48, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
