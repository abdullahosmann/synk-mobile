/**
 * BlockedAccounts — RN port of src/screens/main/BlockedAccounts.tsx.
 *
 * Lists blocked users (seeded mock) with Unblock buttons; empty state when the
 * list is cleared. Unblock opens a confirmation BottomSheet that removes the
 * user and toasts.
 *
 * Web→RN: navigate(-1) → router.back(); <Avatar>/<EmptyState> are the ported
 * shared components.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Ban, UserX } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import BottomSheet from "../../src/components/BottomSheet";
import Avatar from "../../src/components/Avatar";
import EmptyState from "../../src/components/EmptyState";
import { useColors } from "../../src/theme/ThemeProvider";
import { withAlpha } from "../../src/theme/tint";
import { AppText } from "../../src/components/ui/Typography";

type Blocked = { id: string; name: string; arabicName: string; handle: string; initials: string };

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function BlockedAccounts() {
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";

  const [blocked, setBlocked] = useState<Blocked[]>([
    { id: "u_blocked_1", name: "Ahmed Hassan", arabicName: "أحمد حسن", handle: "ahmed_h", initials: "AH" },
    { id: "u_blocked_2", name: "Sara Mostafa", arabicName: "سارة مصطفى", handle: "sara_m", initials: "SM" },
    { id: "u_blocked_3", name: "Karim Yousef", arabicName: "كريم يوسف", handle: "karim_y", initials: "KY" },
  ]);
  const [confirmTarget, setConfirmTarget] = useState<Blocked | null>(null);

  const handleUnblockConfirm = () => {
    if (!confirmTarget) return;
    setBlocked((prev) => prev.filter((b) => b.id !== confirmTarget.id));
    const displayName = isArabic ? confirmTarget.arabicName : confirmTarget.name;
    showToast(isArabic ? `تم إلغاء حظر ${displayName}` : `${displayName} unblocked`, "success");
    setConfirmTarget(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 8, paddingHorizontal: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", backgroundColor: colors.canvasParchment, zIndex: 50 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: colors.ink, marginRight: isArabic ? 0 : 40, marginLeft: isArabic ? 40 : 0, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الحسابات المحظورة" : "Blocked accounts"}</AppText>
      </View>

      {blocked.length === 0 ? (
        <View style={{ flex: 1, paddingTop: 64 }}>
          <EmptyState icon={<Ban size={32} color={colors.inkMuted48} />} title={isArabic ? "مفيش حسابات محظورة" : "No blocked accounts"} body={isArabic ? "اليوزرز اللي تحظرهم هيظهروا هنا" : "Users you block will appear here"} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 48, gap: 8, maxWidth: 448, width: "100%", alignSelf: "center" }}>
          <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginBottom: 12, paddingHorizontal: 4, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "اليوزرز المحظورين مش هيشوفوا ملفك أو منشوراتك ولا يقدروا يتابعوك." : "Blocked users can't see your profile or posts and can't follow you."}</AppText>
          {blocked.map((u) => {
            const displayName = isArabic ? u.arabicName : u.name;
            return (
              <View key={u.id} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                <Avatar initials={u.initials} size={40} />
                <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                  <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{displayName}</AppText>
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48 }}>@{u.handle}</AppText>
                </View>
                <Pressable onPress={() => setConfirmTarget(u)} style={{ backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, height: 36, paddingHorizontal: 16, borderRadius: 9999, alignItems: "center", justifyContent: "center" }}>
                  <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء الحظر" : "Unblock"}</AppText>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Unblock confirmation */}
      <BottomSheet isOpen={confirmTarget !== null} onClose={() => setConfirmTarget(null)} title={isArabic ? "إلغاء حظر المستخدم" : "Unblock user"}>
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <UserX size={24} color={colors.primary} />
          </View>
          <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textAlign: "center", marginBottom: 8, fontFamily: ff(isArabic, 600) }}>{isArabic ? `إلغاء حظر ${confirmTarget?.arabicName}؟` : `Unblock ${confirmTarget?.name}?`}</AppText>
          <AppText style={{ fontSize: 13, color: colors.inkMuted48, maxWidth: 280, textAlign: "center", marginBottom: 32, fontFamily: ff(isArabic) }}>{isArabic ? "هيقدر يشوف ملفك ومنشوراتك تاني، ويمكنه يبعتلك طلب متابعة." : "They'll be able to see your profile and posts again, and may send you a follow request."}</AppText>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, width: "100%" }}>
            <Pressable onPress={() => setConfirmTarget(null)} style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
            </Pressable>
            <Pressable onPress={handleUnblockConfirm} style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء الحظر" : "Unblock"}</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
