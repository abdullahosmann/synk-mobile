/**
 * Community — RN port of src/screens/main/Community.tsx.
 *
 * Premium-gated: when subscriptionStatus !== "active" it shows the "Community
 * Locked" state (the default experience). When active, it shows the social
 * surface: header (avatar/search/title/bell), Friends/Circles/Challenges
 * segment control, the friends feed (cheer + share), and a circles starter.
 * Full challenge/circle detail screens land in Phase 2.5.
 */
import React, { useState } from "react";
import { FlatList, Pressable, ScrollView, Share, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Users, Star, Search, Bell, Heart, Share2, MoreHorizontal,
  Trophy, Flame, Dumbbell, Plus, ChevronRight,
} from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import Avatar from "../../src/components/Avatar";
import { ShareCardRenderer, ShareCardPayload } from "../../src/components/ShareCardRenderer";
import { useColors, useTheme } from "../../src/theme/ThemeProvider";
import { withAlpha } from "../../src/theme/tint";
import { AppText, ScreenTitle } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";

type FeedType = "pr" | "streak" | "workout";
interface FeedItem {
  id: string;
  user: { name: string; arabicName: string; initials: string };
  type: FeedType;
  timeAgo: string; arabicTimeAgo: string;
  headline: string; arabicHeadline: string;
  detail?: string; arabicDetail?: string;
  cheers: number;
}

const MOCK_FEED: FeedItem[] = [
  { id: "f1", user: { name: "Yousef", arabicName: "يوسف", initials: "Y" }, type: "pr", timeAgo: "12m ago", arabicTimeAgo: "منذ ١٢ د", headline: "Hit a new PR on Bench Press", arabicHeadline: "حقق رقم شخصي جديد في البنش", detail: "80 kg × 5", arabicDetail: "٨٠ كجم × ٥", cheers: 14 },
  { id: "f2", user: { name: "Mariam", arabicName: "مريم", initials: "M" }, type: "streak", timeAgo: "1h ago", arabicTimeAgo: "منذ ساعة", headline: "Reached a 30-day streak", arabicHeadline: "وصلت لسلسلة ٣٠ يوم", detail: "30 days", arabicDetail: "٣٠ يوم", cheers: 27 },
  { id: "f3", user: { name: "Omar", arabicName: "عمر", initials: "O" }, type: "workout", timeAgo: "3h ago", arabicTimeAgo: "منذ ٣ س", headline: "Completed Push Day", arabicHeadline: "خلّص يوم الدفع", detail: "Chest & Shoulders · 52 min", arabicDetail: "صدر وأكتاف · ٥٢ د", cheers: 8 },
  { id: "f4", user: { name: "Layla", arabicName: "ليلى", initials: "L" }, type: "pr", timeAgo: "5h ago", arabicTimeAgo: "منذ ٥ س", headline: "Hit a new PR on Squat", arabicHeadline: "حققت رقم شخصي في السكوات", detail: "100 kg × 3", arabicDetail: "١٠٠ كجم × ٣", cheers: 41 },
];

export default function Community() {
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";

  const [segment, setSegment] = useState<"friends" | "circles" | "challenges">("friends");
  const [feed, setFeed] = useState(MOCK_FEED.map((f) => ({ ...f, cheered: false })));

  const toggleCheer = (id: string) =>
    setFeed((prev) => prev.map((f) => (f.id === id ? { ...f, cheered: !f.cheered, cheers: f.cheers + (f.cheered ? -1 : 1) } : f)));

  // ---- Achievement share cards (pr / streak) ----
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const sharingPost = feed.find((p) => p.id === sharingPostId);

  const getSharingPayload = (post: FeedItem): ShareCardPayload => {
    if (post.type === "pr") {
      const m = post.detail ? post.detail.match(/(\d+)\s*(kg|lb)\s*(?:×|x)\s*(\d+)/i) : null;
      return {
        exerciseName: post.headline || "NEW PR",
        weight: m ? parseInt(m[1]) : 80,
        unit: m ? (m[2].toLowerCase() as "kg" | "lb") : "kg",
        reps: m ? parseInt(m[3]) : 5,
        previousWeight: 75,
        previousReps: 5,
      };
    }
    if (post.type === "streak") {
      const m = (post.headline || post.detail || "").match(/(\d+)/);
      return { streakDays: m ? parseInt(m[1]) : 30 };
    }
    return {};
  };

  const onShareCardReady = async (uri: string) => {
    try {
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
      else showToast(isArabic ? "تم حفظ الصورة" : "Image saved", "success");
    } catch {
      /* user cancelled */
    } finally {
      setSharingPostId(null);
    }
  };

  const handleShareClick = (item: FeedItem) => {
    if (item.type === "pr" || item.type === "streak") {
      setSharingPostId(item.id);
      showToast(isArabic ? "بنحضرلك الكارت..." : "Preparing your card...", "info");
    } else {
      Share.share({ message: isArabic ? "شوف تمريني على Synk · synk.app" : "Check out my workout on Synk · synk.app" }).catch(() => {});
    }
  };

  // subscriptionStatus is set loosely by the Paywall (not in the typed profile).
  const subscriptionStatus = (user as { subscriptionStatus?: string })?.subscriptionStatus;

  // ---- Locked state (default) ----
  if (subscriptionStatus !== "active") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
        <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          <Avatar initials={user?.name?.[0]?.toUpperCase() || "?"} photoUrl={user?.avatarUrl} size={36} />
          <ScreenTitle>{isArabic ? "المجتمع" : "Community"}</ScreenTitle>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, marginTop: -40 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Users size={36} color={colors.primary} />
          </View>
          <AppText variant="section-title" style={{ marginBottom: 12, textAlign: "center" }}>
            {isArabic ? "المجتمع مقفول" : "Community Locked"}
          </AppText>
          <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ marginBottom: 32, maxWidth: 280, textAlign: "center", lineHeight: 22 }}>
            {isArabic
              ? "الترقية للبريميوم مطلوبة عشان تشوف وتشارك مع المجتمع وتفتح التحديات."
              : "Upgrade to Premium to see social feeds, join challenges, and climb the PR leaderboards."}
          </AppText>
          <Btn variant="primary" onPress={() => router.push("/premium")} style={{ height: 48, paddingHorizontal: 32 }}>
            <Star size={18} color="#fff" fill="#fff" />
            <AppText variant="body-strong" style={{ color: "#fff" }}>{isArabic ? "افتح المجتمع" : "Unlock Community"}</AppText>
          </Btn>
        </View>
      </View>
    );
  }

  // ---- Unlocked feed ----
  const typeMeta = (t: FeedType) =>
    t === "pr"
      ? { Icon: Trophy, label: isArabic ? "رقم قياسي" : "New PR", ring: withAlpha(colors.primary, 0.4) }
      : t === "streak"
        ? { Icon: Flame, label: isArabic ? "سلسلة" : "Streak", ring: "rgba(251,191,36,0.4)" }
        : { Icon: Dumbbell, label: isArabic ? "تمرين" : "Workout", ring: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" };

  const segTab = (key: typeof segment, label: string) => {
    const active = segment === key;
    return (
      <Pressable key={key} onPress={() => setSegment(key)} style={{ flex: 1, paddingVertical: 12, alignItems: "center" }}>
        <AppText variant="body" style={{ color: active ? colors.ink : colors.inkMuted48, fontWeight: active ? "600" : "400", fontFamily: active ? (isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold") : (isArabic ? "Cairo_400Regular" : "Inter_400Regular") }}>
          {label}
        </AppText>
        {active && <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.primary, borderTopLeftRadius: 9999, borderTopRightRadius: 9999 }} />}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          <Pressable onPress={() => router.push("/me")}>
            <Avatar initials={user?.name?.[0]?.toUpperCase() || "?"} photoUrl={user?.avatarUrl} size={32} />
          </Pressable>
          <Pressable onPress={() => router.push("/search")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <Search size={22} color={colors.ink} />
          </Pressable>
        </View>
        <AppText variant="body-strong">{isArabic ? "المجتمع" : "Community"}</AppText>
        <Pressable onPress={() => router.push("/inbox")} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Bell size={22} color={colors.ink} />
        </Pressable>
      </View>

      {/* Segment control */}
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        {segTab("friends", isArabic ? "الأصدقاء" : "Friends")}
        {segTab("circles", isArabic ? "الحلقات" : "Circles")}
        {segTab("challenges", isArabic ? "التحديات" : "Challenges")}
      </View>

      {segment === "friends" ? (
        // M1 — virtualized feed (FlatList) instead of map()-in-ScrollView; the
        // per-index FadeInDown.delay stagger is dropped (it made row N wait N×40ms).
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 128 + insets.bottom }}
          initialNumToRender={8}
          windowSize={11}
          removeClippedSubviews
          renderItem={({ item }) => {
            const meta = typeMeta(item.type);
            return (
              <Animated.View entering={FadeInDown} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ borderRadius: 9999, borderWidth: 2, borderColor: meta.ring }}>
                    <Avatar initials={item.user.initials} size={40} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>
                      {isArabic ? item.user.arabicName : item.user.name}
                    </AppText>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <meta.Icon size={12} color={colors.inkMuted48} />
                      <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48">{meta.label}</AppText>
                      <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48">·</AppText>
                      <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48">{isArabic ? item.arabicTimeAgo : item.timeAgo}</AppText>
                    </View>
                  </View>
                  <Pressable onPress={() => showToast(isArabic ? "خيارات" : "Options", "info")}>
                    <MoreHorizontal size={18} color={colors.inkMuted48} />
                  </Pressable>
                </View>

                <AppText variant="body" style={{ color: colors.ink, marginTop: 12, textAlign: isArabic ? "right" : "left" }}>
                  {isArabic ? item.arabicHeadline : item.headline}
                  {item.detail ? `  ·  ${isArabic ? item.arabicDetail : item.detail}` : ""}
                </AppText>

                {item.type === "workout" && (
                  <Pressable onPress={() => showToast(isArabic ? "تمت الإضافة لروتيناتي" : "Added to My Routines", "success")} style={{ height: 40, marginTop: 12, borderRadius: 8, backgroundColor: withAlpha(colors.primary, 0.1), flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <Plus size={16} color={colors.primary} />
                    <AppText variant="caption-strong" style={{ color: colors.primary }}>{isArabic ? "جرب التمرين ده" : "Try this workout"}</AppText>
                  </Pressable>
                )}

                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
                  <Pressable onPress={() => toggleCheer(item.id)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
                    <Heart size={18} color={item.cheered ? colors.primary : colors.inkMuted48} fill={item.cheered ? colors.primary : "none"} />
                    {item.cheers > 0 && <AppText variant="caption" style={{ color: item.cheered ? colors.primary : colors.inkMuted48 }}>{String(item.cheers)}</AppText>}
                  </Pressable>
                  <Pressable onPress={() => handleShareClick(item)}>
                    <Share2 size={18} color={colors.inkMuted48} />
                  </Pressable>
                </View>
              </Animated.View>
            );
          }}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 128 + insets.bottom }}>
        {segment === "circles" && (
          <View style={{ paddingTop: 4 }}>
            <Pressable onPress={() => router.push("/circles/create")} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center" }}>
                <Plus size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" style={{ textAlign: isArabic ? "right" : "left" }}>{isArabic ? "ابدأ حلقة" : "Create a circle"}</AppText>
                <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left" }}>
                  {isArabic ? "اتدرب واتنافس مع أقرب صحابك" : "Train and compete with your closest friends"}
                </AppText>
              </View>
              <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
            </Pressable>
          </View>
        )}

        {segment === "challenges" && (
          <View style={{ paddingTop: 4 }}>
            <Pressable onPress={() => router.push("/challenges")} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center" }}>
                <Trophy size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title" style={{ textAlign: isArabic ? "right" : "left" }}>{isArabic ? "التحديات" : "Challenges"}</AppText>
                <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left" }}>
                  {isArabic ? "انضم لتحدي وتسلّق الترتيب" : "Join a challenge and climb the leaderboard"}
                </AppText>
              </View>
              <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
            </Pressable>
          </View>
        )}
        </ScrollView>
      )}

      {/* Off-screen achievement share card (pr / streak) */}
      {sharingPost && (
        <ShareCardRenderer
          type={sharingPost.type as "pr" | "streak"}
          payload={getSharingPayload(sharingPost)}
          user={{ name: user?.name || "User", coachName: user?.coach || undefined, language: isArabic ? "ar" : "en" }}
          onReady={onShareCardReady}
          onError={() => {
            showToast(isArabic ? "مقدرناش نحضّر الكارت. جرب تاني." : "Couldn't prepare card. Try again.", "error");
            setSharingPostId(null);
          }}
        />
      )}
    </View>
  );
}
