/**
 * Inbox — RN port of src/screens/main/Inbox.tsx.
 *
 * Two segmented tabs: Requests (follow requests + challenge invites with
 * Accept/Decline) and Activity (likes/follows/challenge notifications with a
 * type-icon badge on the avatar). Both seeded with mock data; empty states when
 * a list is cleared.
 *
 * Web→RN: navigate(-1) → router.back(); <Avatar>/<EmptyState> shared components.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Heart, UserPlus, Trophy, Inbox as InboxIcon, Bell } from "lucide-react-native";
import { useAppContext } from "../src/AppContext";
import { useToast } from "../src/components/ToastProvider";
import Avatar from "../src/components/Avatar";
import EmptyState from "../src/components/EmptyState";
import { useTheme } from "../src/theme/ThemeProvider";
import { AppText } from "../src/components/ui/Typography";

type InboxTab = "requests" | "activity";

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function Inbox() {
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const [activeTab, setActiveTab] = useState<InboxTab>("requests");

  const mockRequests = [
    { id: "rq1", type: "follow", name: "Ahmed Nabil", arabicName: "أحمد نبيل", initials: "AN" },
    { id: "rq2", type: "follow", name: "Nour Ibrahim", arabicName: "نور إبراهيم", initials: "NI" },
    { id: "rq3", type: "challenge", name: "Khaled", arabicName: "خالد", initials: "K", detail: "Challenged you: 5 workouts this week", arabicDetail: "تحداك: ٥ تمارين الأسبوع ده" },
  ];

  const mockActivity = [
    { id: "a1", type: "like", name: "Yousef", arabicName: "يوسف", initials: "Y", text: "liked your PR", arabicText: "أعجب برقمك", time: "5m" },
    { id: "a3", type: "follow", name: "Salma", arabicName: "سلمى", initials: "S", text: "started following you", arabicText: "بدأت تتابعك", time: "1h" },
    { id: "a4", type: "challenge", name: "SYNK", arabicName: "SYNK", initials: "S", text: "May Movement Challenge starts tomorrow", arabicText: "تحدي حركة مايو يبدأ بكرة", time: "3h" },
  ];

  const tabs: { id: InboxTab; label: string; arabicLabel: string }[] = [
    { id: "requests", label: "Requests", arabicLabel: "طلبات" },
    { id: "activity", label: "Activity", arabicLabel: "نشاط" },
  ];

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const declineBg = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const backChipBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: colors.canvas,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: backChipBg, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 16, fontWeight: "600", letterSpacing: -0.3, color: colors.ink, fontFamily: ff(isArabic, 600) }}>
          {isArabic ? "الوارد" : "Inbox"}
        </AppText>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
              <AppText style={{ fontSize: 13, fontWeight: active ? "600" : "400", color: active ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, active ? 600 : 400) }}>
                {isArabic ? t.arabicLabel : t.label}
              </AppText>
              {active && <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary }} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 96 }}>
        {activeTab === "requests" &&
          (mockRequests.length === 0 ? (
            <EmptyState icon={<InboxIcon />} title={isArabic ? "مفيش طلبات" : "No requests"} body={isArabic ? "هتبقى هنا لما حد يبعتلك طلب." : "Requests will appear here."} />
          ) : (
            <View style={{ gap: 8 }}>
              {mockRequests.map((r) => (
                <View
                  key={r.id}
                  style={{
                    flexDirection: isArabic ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    borderRadius: 10,
                  }}
                >
                  <Avatar initials={r.initials} size={40} />
                  <View style={{ flex: 1, minWidth: 0, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>
                      {isArabic ? r.arabicName : r.name}
                    </AppText>
                    <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>
                      {r.type === "follow" ? (isArabic ? "طلب متابعة" : "Wants to follow you") : isArabic ? r.arabicDetail : r.detail}
                    </AppText>
                  </View>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                    <Pressable
                      onPress={() => showToast(isArabic ? "تم القبول" : "Accepted", "success")}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: colors.primary }}
                    >
                      <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.onPrimary, fontFamily: ff(isArabic, 600) }}>
                        {isArabic ? "قبول" : "Accept"}
                      </AppText>
                    </Pressable>
                    <Pressable
                      onPress={() => showToast(isArabic ? "تم الرفض" : "Declined", "info")}
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: declineBg }}
                    >
                      <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>
                        {isArabic ? "رفض" : "Decline"}
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ))}

        {activeTab === "activity" &&
          (mockActivity.length === 0 ? (
            <EmptyState icon={<Bell />} title={isArabic ? "مفيش نشاط" : "Nothing new"} body={isArabic ? "الإعجابات هتبان هنا." : "Likes will appear here."} />
          ) : (
            <View style={{ gap: 8 }}>
              {mockActivity.map((a) => {
                const icon =
                  a.type === "like" ? <Heart size={14} color={colors.primary} fill={colors.primary} /> : a.type === "follow" ? <UserPlus size={14} color={colors.primary} /> : <Trophy size={14} color={colors.primary} />;
                return (
                  <View
                    key={a.id}
                    style={{
                      flexDirection: isArabic ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      backgroundColor: cardBg,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      borderRadius: 10,
                    }}
                  >
                    <View style={{ position: "relative" }}>
                      <Avatar initials={a.initials} size={40} />
                      <View
                        style={{
                          position: "absolute",
                          bottom: -4,
                          right: -4,
                          width: 20,
                          height: 20,
                          borderRadius: 9999,
                          backgroundColor: colors.canvas,
                          borderWidth: 2,
                          borderColor: colors.canvas,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {icon}
                      </View>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText style={{ fontSize: 13, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>
                        <AppText style={{ fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? a.arabicName : a.name}</AppText>
                        <AppText style={{ color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{" "}{isArabic ? a.arabicText : a.text}</AppText>
                      </AppText>
                      <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, fontVariant: ["tabular-nums"] }}>{a.time}</AppText>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}
