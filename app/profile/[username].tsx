/**
 * UserProfile — RN port of src/screens/main/UserProfile.tsx.
 *
 * Profile header (avatar, name, bio, gym, mutuals, streak pill), stats row,
 * action row (Edit for own; Follow/Follow-back + Challenge otherwise), and 3
 * tabs: Posts (3-col grid), Workouts (cards), PRs (cards). More menu opens
 * Report/Block sheets; mutuals opens a list sheet. Mock data keyed by username.
 *
 * Web→RN: useParams → useLocalSearchParams; navigate(-1) → router.back();
 * shared Avatar/BottomSheet/ReportSheet/BlockConfirmSheet.
 */
import React, { useState } from "react";
import { Dimensions, Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MoreVertical, Trophy as TrophyIcon, MapPin, Dumbbell, Flame, Flag, Ban } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import BottomSheet from "../../src/components/BottomSheet";
import ReportSheet from "../../src/components/ReportSheet";
import BlockConfirmSheet from "../../src/components/BlockConfirmSheet";
import Avatar from "../../src/components/Avatar";
import { useTheme } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

type ProfileTab = "posts" | "workouts" | "prs";

const RED = "#ff3b30";

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

const GRID_ICON = (i: number, color: string) => (i % 3 === 0 ? <Dumbbell size={24} color={color} /> : i % 3 === 1 ? <TrophyIcon size={24} color={color} /> : <Flame size={24} color={color} />);

export default function UserProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const isOwnProfile = username === "me" || username === user.handle || username === user.username;

  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsYou] = useState(true);
  const [mutualsSheetOpen, setMutualsSheetOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const profile = isOwnProfile
    ? { name: user.name || "User", arabicName: user.name || "مستخدم", initials: (user.name || "U").charAt(0).toUpperCase(), bio: user.bio || "", arabicBio: user.bio || "", gym: "Global Gym", arabicGym: "جيم", workouts: 142, streak: 12, followers: 248, following: 89, mutuals: 0, avatarUrl: user.avatarUrl }
    : {
        name: username === "yousef" ? "Yousef Adel" : username === "mariam" ? "Mariam Hassan" : "Salma Tarek",
        arabicName: username === "yousef" ? "يوسف عادل" : username === "mariam" ? "مريم حسن" : "سلمى طارق",
        initials: (username || "U").charAt(0).toUpperCase(),
        bio: "Coach in training. 5 days a week. Pull > push.",
        arabicBio: "بتدرب ٥ أيام في الأسبوع. السحب أحسن من الدفع.",
        gym: "Gold's Gym Maadi",
        arabicGym: "جولدز جيم المعادي",
        workouts: 142,
        streak: 12,
        followers: 248,
        following: 89,
        mutuals: 4,
        avatarUrl: undefined,
      };

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;
  const tile1 = isDark ? colors.surfaceTile1 : colors.canvasParchment;
  const gridSize = (Dimensions.get("window").width - 32 - 8) / 3;
  const align = isArabic ? "right" : "left";

  const stats = [
    { value: profile.workouts, label: isArabic ? "تمارين" : "Workouts" },
    { value: profile.followers, label: isArabic ? "متابعين" : "Followers" },
    { value: profile.following, label: isArabic ? "بيتابع" : "Following" },
  ];

  const tabs: ProfileTab[] = ["posts", "workouts", "prs"];
  const tabLabel = (t: ProfileTab) => (t === "posts" ? (isArabic ? "منشورات" : "Posts") : t === "workouts" ? (isArabic ? "تمارين" : "Workouts") : isArabic ? "أرقام" : "PRs");

  const workouts = [
    { name: "Push Day", arabicName: "تمرين الدفع", time: { en: "Today", ar: "اليوم" }, vol: "4,250", min: "55", ex: "6" },
    { name: "Pull Day", arabicName: "تمرين السحب", time: { en: "2 days ago", ar: "منذ يومين" }, vol: "3,800", min: "48", ex: "5" },
    { name: "Leg Day", arabicName: "تمرين الرجل", time: { en: "5 days ago", ar: "منذ ٥ أيام" }, vol: "5,100", min: "65", ex: "7" },
    { name: "Upper Body", arabicName: "جزء علوي", time: { en: "1 week ago", ar: "منذ أسبوع" }, vol: "3,400", min: "45", ex: "5" },
  ];
  const prs = [
    { name: "Bench Press", arabicName: "بنش", pr: "80 × 5", time: { en: "2 weeks ago", ar: "منذ أسبوعين" } },
    { name: "Deadlift", arabicName: "ديدليفت", pr: "120 × 3", time: { en: "1 month ago", ar: "منذ شهر" } },
    { name: "Squat", arabicName: "سكوات", pr: "100 × 5", time: { en: "3 weeks ago", ar: "منذ ٣ أسابيع" } },
    { name: "Overhead Press", arabicName: "كتف", pr: "55 × 5", time: { en: "1 week ago", ar: "منذ أسبوع" } },
  ];

  const mutuals = [
    { name: "Omar Sherif", arabicName: "عمر شريف", initials: "OS" },
    { name: "Khaled Hassan", arabicName: "خالد حسن", initials: "KH" },
    { name: "Nour Ibrahim", arabicName: "نور إبراهيم", initials: "NI" },
    { name: "Ahmed Nabil", arabicName: "أحمد نبيل", initials: "AN" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Top bar */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={22} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? profile.arabicName : profile.name}</AppText>
        {isOwnProfile ? (
          <View style={{ width: 40, height: 40 }} />
        ) : (
          <Pressable onPress={() => setMoreOpen(true)} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
            <MoreVertical size={22} color={colors.ink} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24, paddingBottom: insets.bottom + 96 }}>
        {/* Header block */}
        <View style={{ alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Avatar initials={profile.initials} photoUrl={profile.avatarUrl} size={96} />
          <View style={{ alignItems: "center" }}>
            <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, marginTop: 12, textAlign: "center", fontFamily: ff(isArabic, 600) }}>{isArabic ? profile.arabicName : profile.name}</AppText>
            {!!(isArabic ? profile.arabicBio : profile.bio) && (
              <AppText style={{ fontSize: 14, color: colors.inkMuted48, marginTop: 4, lineHeight: 19, maxWidth: 280, textAlign: "center", fontFamily: ff(isArabic) }}>{isArabic ? profile.arabicBio : profile.bio}</AppText>
            )}
          </View>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
            <MapPin size={12} color={colors.inkMuted48} />
            <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? profile.arabicGym : profile.gym}</AppText>
          </View>
          {profile.mutuals > 0 && !isOwnProfile && (
            <Pressable onPress={() => setMutualsSheetOpen(true)}>
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, fontFamily: ff(isArabic, 600) }}>{isArabic ? `${profile.mutuals} مشتركين` : `${profile.mutuals} mutuals`}</AppText>
            </Pressable>
          )}
          {isFollowing && followsYou && !isOwnProfile && (
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: tile1 }}>
              <Flame size={14} color={colors.primary} />
              <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "سلسلة ١٢ يوم مع " : "12-day streak with "}{isArabic ? profile.arabicName.split(" ")[0] : profile.name.split(" ")[0]}</AppText>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-around", alignItems: "center", backgroundColor: tile1, borderRadius: 10, paddingVertical: 16, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={{ width: 1, height: 32, backgroundColor: colors.hairline }} />}
              <View style={{ alignItems: "center", gap: 4 }}>
                <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 600) }}>{s.value}</AppText>
                <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.8, fontFamily: ff(isArabic) }}>{s.label}</AppText>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Action row */}
        {isOwnProfile ? (
          <Pressable onPress={() => router.push("/settings/profile-edit")} style={{ height: 40, borderRadius: 9999, backgroundColor: tile1, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "تعديل الملف الشخصي" : "Edit profile"}</AppText>
          </Pressable>
        ) : (
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <Pressable
              onPress={() => { const ns = !isFollowing; setIsFollowing(ns); showToast(isArabic ? (ns ? "تمت المتابعة" : "تم إلغاء المتابعة") : ns ? "Following" : "Unfollowed", "success"); }}
              style={{ flex: 1, height: 40, borderRadius: 9999, alignItems: "center", justifyContent: "center", backgroundColor: isFollowing ? tile1 : colors.primary, borderWidth: isFollowing ? 1 : 0, borderColor: colors.hairline }}
            >
              <AppText style={{ fontSize: 13, fontWeight: "600", color: isFollowing ? colors.ink : colors.onPrimary, fontFamily: ff(isArabic, 600) }}>
                {isFollowing ? (isArabic ? "بتابع" : "Following") : !isFollowing && followsYou ? (isArabic ? "تابعه مرة أخرى" : "Follow back") : isArabic ? "تابع" : "Follow"}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => isFollowing && router.push(`/challenges/create?opponent=${username}`)}
              disabled={!isFollowing}
              style={{ flex: 1, height: 40, borderRadius: 9999, backgroundColor: tile1, borderWidth: 1, borderColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8, opacity: isFollowing ? 1 : 0.4 }}
            >
              <TrophyIcon size={16} color={colors.ink} />
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "تحدى" : "Challenge"}</AppText>
            </Pressable>
          </View>
        )}

        {/* Tab bar */}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.hairline, marginBottom: 16 }}>
          {tabs.map((t) => {
            const active = activeTab === t;
            return (
              <Pressable key={t} onPress={() => setActiveTab(t)} style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
                <AppText style={{ fontSize: 13, fontWeight: active ? "600" : "400", color: active ? colors.ink : colors.inkMuted48, fontFamily: ff(isArabic, active ? 600 : 400) }}>{tabLabel(t)}</AppText>
                {active && <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary }} />}
              </Pressable>
            );
          })}
        </View>

        {/* Tab content */}
        {activeTab === "posts" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Pressable key={i} onPress={() => showToast("Post detail coming soon", "info")} style={{ width: gridSize, height: gridSize, borderRadius: 8, backgroundColor: tile1, alignItems: "center", justifyContent: "center" }}>
                {GRID_ICON(i, colors.inkMuted48)}
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === "workouts" && (
          <View style={{ gap: 12 }}>
            {workouts.map((w, i) => (
              <View key={i} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 16 }}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                    <Dumbbell size={16} color={colors.primary} />
                    <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? w.arabicName : w.name}</AppText>
                  </View>
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? w.time.ar : w.time.en}</AppText>
                </View>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", marginTop: 12 }}>
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontVariant: ["tabular-nums"] }}>{w.vol} kg</AppText>
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontVariant: ["tabular-nums"] }}>{w.min} min</AppText>
                  <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontVariant: ["tabular-nums"] }}>{w.ex} exercises</AppText>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "prs" && (
          <View style={{ gap: 12 }}>
            {prs.map((pr, i) => (
              <View key={i} style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? pr.arabicName : pr.name}</AppText>
                <View style={{ alignItems: isArabic ? "flex-start" : "flex-end" }}>
                  <AppText style={{ fontSize: 16, fontWeight: "700", color: colors.primary, fontVariant: ["tabular-nums"], fontFamily: ff(isArabic, 700) }}>{pr.pr}</AppText>
                  <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>{isArabic ? pr.time.ar : pr.time.en}</AppText>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Mutuals sheet */}
      <BottomSheet isOpen={mutualsSheetOpen} onClose={() => setMutualsSheetOpen(false)} title={isArabic ? "متابعين مشتركين" : "Mutual followers"}>
        <View style={{ paddingTop: 8, paddingBottom: 24, gap: 8 }}>
          {mutuals.map((m) => (
            <Pressable key={m.name} onPress={() => { setMutualsSheetOpen(false); router.push(`/profile/${m.name.toLowerCase().replace(/\s+/g, "-")}`); }} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: tile1, borderRadius: 10 }}>
              <Avatar initials={m.initials} size={40} />
              <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? m.arabicName : m.name}</AppText>
              </View>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* More sheet */}
      <BottomSheet isOpen={moreOpen} onClose={() => setMoreOpen(false)} title={isArabic ? profile.arabicName : profile.name}>
        <View style={{ paddingTop: 8, paddingBottom: 24, gap: 8 }}>
          <Pressable onPress={() => { setMoreOpen(false); setReportOpen(true); }} style={{ padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            <Flag size={20} color={colors.inkMuted48} />
            <AppText style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.ink, textAlign: align, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إبلاغ" : "Report"}</AppText>
          </Pressable>
          <Pressable onPress={() => { setMoreOpen(false); setBlockOpen(true); }} style={{ padding: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            <Ban size={20} color={RED} />
            <AppText style={{ flex: 1, fontSize: 14, fontWeight: "600", color: RED, textAlign: align, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حظر" : "Block"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>

      <ReportSheet isOpen={reportOpen} onClose={() => setReportOpen(false)} targetType="profile" targetName={isArabic ? profile.arabicName : profile.name} />
      <BlockConfirmSheet isOpen={blockOpen} onClose={() => setBlockOpen(false)} targetName={isArabic ? profile.arabicName : profile.name} onBlocked={() => { setIsFollowing(false); router.back(); }} />
    </View>
  );
}
