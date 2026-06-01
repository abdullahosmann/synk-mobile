/**
 * Settings — RN port of src/screens/main/Settings.tsx.
 *
 * The full settings list: community banner, the grouped sections (AI coach,
 * personalization w/ profile row + coach, account, privacy toggles, app
 * settings w/ time pickers + unit/theme pills + many toggles, connected
 * integrations, help/legal links, sign-out / delete), social + branding
 * footer, and the sheets (time picker, country, disconnect, sign-out, water
 * target).
 *
 * Web→RN: navigate(...) → router.push/replace; localStorage.clear() preserving
 * lang+theme → manual read/clear/re-set (mobile clear() doesn't auto-preserve);
 * window.location.href='/' → router.replace('/'); <input type=checkbox> →
 * <Toggle>; <img> → expo-image; external links toast (no web nav target yet).
 */
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  Users,
  ChevronRight,
  ExternalLink,
  Copy,
  Sparkles,
  ChevronLeft,
  // lucide-react-native v1 has no brand glyphs — use the nearest metaphors for
  // the social footer (Instagram→Camera, Facebook→Users, YouTube→Play).
  Camera,
  Play,
} from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { showPermissionDeniedAlert } from "../../src/lib/permissions";
import LanguageToggle from "../../src/components/LanguageToggle";
import BottomSheet from "../../src/components/BottomSheet";
import CoachAvatar from "../../src/components/CoachAvatar";
import { Toggle } from "../../src/components/ui/Toggle";
import { detectPlatform, getAvailableIntegrations } from "../../src/lib/platform";
import { connectIntegrationStub, disconnectIntegrationStub } from "../../src/lib/integrationActions";
import type { ConnectedIntegration } from "../../src/types";
import { COACHES } from "../../src/constants";
import { getItem, setItem, clear as clearStorage, KEY_LANGUAGE, KEY_THEME } from "../../src/lib/storage";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";

const ALL_COUNTRIES: any[] = [
  { name: "Egypt", arabicName: "مصر", emoji: "🇪🇬" },
  { name: "Saudi Arabia", arabicName: "السعودية", emoji: "🇸🇦" },
  { name: "UAE", arabicName: "الإمارات", emoji: "🇦🇪" },
  { name: "Kuwait", arabicName: "الكويت", emoji: "🇰🇼" },
  { name: "Qatar", arabicName: "قطر", emoji: "🇶🇦" },
  { name: "Jordan", arabicName: "الأردن", emoji: "🇯🇴" },
  { name: "Lebanon", arabicName: "لبنان", emoji: "🇱🇧" },
  { name: "Morocco", arabicName: "المغرب", emoji: "🇲🇦" },
  { name: "Tunisia", arabicName: "تونس", emoji: "🇹🇳" },
  { name: "Algeria", arabicName: "الجزائر", emoji: "🇩🇿" },
  { name: "Bahrain", arabicName: "البحرين", emoji: "🇧🇭" },
  { name: "Oman", arabicName: "عمان", emoji: "🇴🇲" },
  { divider: true },
  { name: "United States", arabicName: "الولايات المتحدة", emoji: "🇺🇸" },
  { name: "United Kingdom", arabicName: "المملكة المتحدة", emoji: "🇬🇧" },
  { name: "Canada", arabicName: "كندا", emoji: "🇨🇦" },
  { name: "Australia", arabicName: "أستراليا", emoji: "🇦🇺" },
  { name: "Germany", arabicName: "ألمانيا", emoji: "🇩🇪" },
  { name: "France", arabicName: "فرنسا", emoji: "🇫🇷" },
  { name: "Spain", arabicName: "إسبانيا", emoji: "🇪🇸" },
  { name: "Italy", arabicName: "إيطاليا", emoji: "🇮🇹" },
  { name: "Netherlands", arabicName: "هولندا", emoji: "🇳🇱" },
  { name: "Sweden", arabicName: "السويد", emoji: "🇸🇪" },
  { name: "Switzerland", arabicName: "سويسرا", emoji: "🇨🇭" },
  { name: "Turkey", arabicName: "تركيا", emoji: "🇹🇷" },
  { name: "India", arabicName: "الهند", emoji: "🇮🇳" },
  { name: "Japan", arabicName: "اليابان", emoji: "🇯🇵" },
  { name: "Brazil", arabicName: "البرازيل", emoji: "🇧🇷" },
];

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

export default function Settings() {
  const router = useRouter();
  const { user, setUser, theme, setTheme } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [waterTargetSheet, setWaterTargetSheet] = useState(false);
  const [countrySheet, setCountrySheet] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [disconnectSheetFor, setDisconnectSheetFor] = useState<ConnectedIntegration["id"] | null>(null);
  const [timePicker, setTimePicker] = useState<{ type: "morning" | "streak" | "workout" | null; hour: number; minute: number }>({ type: null, hour: 8, minute: 0 });

  const platform = detectPlatform();
  const availableIds = getAvailableIntegrations(platform);
  const userIntegrations = user.connectedIntegrations ?? [];
  const integrationRows = availableIds.map((id) => {
    const existing = userIntegrations.find((i) => i.id === id);
    return existing ?? { id, status: "available" as const };
  });

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "";
    const diff = Date.now() - new Date(isoString).getTime();
    if (diff < 60000) return isArabic ? "الآن" : "just now";
    if (diff < 3600000) {
      const m = Math.floor(diff / 60000);
      return isArabic ? `منذ ${m} دقيقة` : `${m} min ago`;
    }
    if (diff < 86400000) {
      const h = Math.floor(diff / 3600000);
      return isArabic ? `منذ ${h} ساعة` : `${h} hours ago`;
    }
    const d = Math.floor(diff / 86400000);
    if (d === 1) return isArabic ? "أمس" : "yesterday";
    return isArabic ? `منذ ${d} أيام` : `${d} days ago`;
  };

  const getIntegrationDetails = (id: string) => {
    switch (id) {
      case "apple-health": return { name: "Apple Health", icon: "♥", color: "#ef4444" };
      case "apple-watch": return { name: "Apple Watch", icon: "⌚", color: colors.ink };
      case "google-fit": return { name: "Google Fit", icon: "🟢", color: "#22c55e" };
      case "health-connect": return { name: "Health Connect", icon: "H", color: "#22c55e" };
      case "garmin": return { name: "Garmin", icon: "G", color: colors.primary };
      case "whoop": return { name: "WHOOP", icon: "W", color: colors.ink };
      case "strava": return { name: "Strava", icon: "S", color: "#f97316" };
      case "fitbit": return { name: "Fitbit", icon: "F", color: "#06b6d4" };
      default: return { name: id, icon: "🔗", color: colors.primary };
    }
  };

  const toggleWeightUnit = () => setUser({ ...user, weightUnit: user.weightUnit === "kg" ? "lb" : "kg" });

  const handleSignOut = () => {
    setConfirmSignOut(false);
    const lang = getItem(KEY_LANGUAGE);
    const savedTheme = getItem(KEY_THEME);
    clearStorage();
    if (lang) setItem(KEY_LANGUAGE, lang);
    if (savedTheme) setItem(KEY_THEME, savedTheme);
    showToast(isArabic ? "تم تسجيل الخروج" : "Signed out", "info");
    setTimeout(() => router.replace("/"), 500);
  };

  const formatDisplayTime = (timeStr: string) => {
    const [h, m] = (timeStr || "08:00").split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? (isArabic ? "م" : "PM") : isArabic ? "ص" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const openTimePicker = (type: "morning" | "streak" | "workout", currentVal: string) => {
    const [h, m] = (currentVal || "08:00").split(":");
    setTimePicker({ type, hour: parseInt(h), minute: parseInt(m) });
  };

  const saveTime = () => {
    const newTime = `${timePicker.hour.toString().padStart(2, "0")}:${timePicker.minute.toString().padStart(2, "0")}`;
    if (timePicker.type === "morning") setUser({ ...user, morningCheckInTime: newTime });
    if (timePicker.type === "streak") setUser({ ...user, streakReminderTime: newTime });
    if (timePicker.type === "workout") setUser({ ...user, workoutReminderTime: newTime });
    setTimePicker({ ...timePicker, type: null });
  };

  const sections: any[] = useMemo(() => [
    { title: isArabic ? "المدرب الذكي" : "AI COACH", items: [{ label: isArabic ? "صلاحيات الـ AI" : "AI Permissions", path: "/settings/ai-permissions" }] },
    {
      title: isArabic ? "التخصيص" : "PERSONALIZATION",
      items: [
        { type: "profile", name: user.name || (isArabic ? "مستخدم جديد" : "New User"), sub: isArabic ? "تعديل الملف الشخصي" : "Edit profile", img: user.avatarUrl, onPress: () => router.push("/settings/profile-edit") },
        { label: isArabic ? "إعدادات الخطة" : "Plan Settings", path: "/settings/plan" },
        { label: isArabic ? "الكوتش" : "Coach", value: (() => { const c = COACHES.find((x) => x.id === user.coach) ?? COACHES[0]; return isArabic ? `مدرب ${c.arabicName}` : `Coach ${c.name}`; })(), leftIcon: <CoachAvatar coachId={user.coach || "khaled"} size={28} />, icon: true, onPress: () => router.push("/coach-swap") },
      ],
    },
    {
      title: isArabic ? "الحساب" : "ACCOUNT",
      items: [
        { label: isArabic ? "الحساب" : "Account", value: "a...n@icloud.com" },
        { label: isArabic ? "الدولة" : "Country", value: user.country || (isArabic ? "غير محدد" : "Not set"), icon: true, onPress: () => setCountrySheet(true) },
        { label: isArabic ? "إدارة الاشتراك" : "Manage Subscription", path: "/settings/subscription" },
      ],
    },
    {
      title: isArabic ? "الخصوصية والمجتمع" : "PRIVACY & COMMUNITY",
      items: [
        { label: isArabic ? "حساب خاص" : "Private account", toggle: true, checked: user.profileVisibility === "private", sub: isArabic ? "لو خاص، لازم تقبل طلبات المتابعة. مجتمعك بس يشوف منشوراتك." : "If private, follow requests require approval. Only followers see your posts.", onToggle: () => setUser({ ...user, profileVisibility: user.profileVisibility === "private" ? "public" : "private" }) },
        { label: isArabic ? "اظهرني في المتصدرين" : "Show me on leaderboards", toggle: true, checked: user.leaderboardOptIn !== false, sub: isArabic ? "تقدر تستخدم التحديات حتى لو الخيار ده مقفول." : "You can still use challenges if this is off.", onToggle: () => setUser({ ...user, leaderboardOptIn: user.leaderboardOptIn === false ? true : false }) },
        { label: isArabic ? "مشاركة صور التقدم مع الأصدقاء" : "Share progress photos with friends", toggle: true, checked: user.shareProgressPhotos === true, sub: isArabic ? "مقفول افتراضيًا. أنت بتتحكم في كل صورة قبل مشاركتها." : "Off by default. You control every photo before sharing.", onToggle: () => setUser({ ...user, shareProgressPhotos: !user.shareProgressPhotos }) },
        { label: isArabic ? "الحسابات المحظورة" : "Blocked accounts", value: "3", onPress: () => router.push("/settings/blocked") },
      ],
    },
    {
      title: isArabic ? "إعدادات التطبيق" : "APP SETTINGS",
      items: [
        { label: isArabic ? "التنبيهات" : "Notifications", toggle: true, checked: user.notificationPermission === "granted", sub: user.notificationPermission === "denied" ? (isArabic ? "قم بالتمكين في إعدادات الجهاز" : "Enable in device settings") : undefined, onToggle: () => { if (user.notificationPermission === "denied") { showPermissionDeniedAlert("notifications", isArabic); return; } setUser({ ...user, notificationPermission: user.notificationPermission === "granted" ? "default" : "granted" }); } },
        { label: isArabic ? "تسجيل الصباح" : "Morning Check-in", time: formatDisplayTime(user.morningCheckInTime), toggle: true, checked: true, onToggle: () => {}, onTimeClick: () => openTimePicker("morning", user.morningCheckInTime) },
        { label: isArabic ? "تذكيرات السلسلة" : "Streak Reminders", time: formatDisplayTime(user.streakReminderTime), toggle: true, checked: false, onToggle: () => {}, onTimeClick: () => openTimePicker("streak", user.streakReminderTime) },
        { label: isArabic ? "تذكيرات التمرين" : "Workout Reminders", time: formatDisplayTime(user.workoutReminderTime), toggle: true, checked: true, onToggle: () => {}, onTimeClick: () => openTimePicker("workout", user.workoutReminderTime) },
        { label: isArabic ? "لغة التطبيق" : "App Language", pill: true, isLanguage: true },
        { label: isArabic ? "وحدة الوزن" : "Weight units", pill: true, options: ["kg", "lb"], active: user.weightUnit, onPillClick: toggleWeightUnit },
        { label: isArabic ? "وحدة الطول" : "Height units", pill: true, options: ["cm", "ft"], active: user.heightUnit, onPillClick: () => { const u = user.heightUnit === "cm" ? "ft" : "cm"; setUser({ ...user, heightUnit: u }); showToast(isArabic ? "تم التحديث لـ " + u : "Updated to " + u, "success"); } },
        { label: isArabic ? "مظهر التطبيق" : "App Theme", pill: true, options: [isArabic ? "فاتح" : "Light", isArabic ? "داكن" : "Dark"], active: theme === "light" ? (isArabic ? "فاتح" : "Light") : isArabic ? "داكن" : "Dark", onPillClick: (opt: string) => setTheme(opt === "Light" || opt === "فاتح" ? "light" : "dark") },
        { label: isArabic ? "التنبيه التلقائي للمشاركة" : "Auto-prompt share after workout", toggle: true, checked: user.preferences?.autoShareDisabled !== true, sub: isArabic ? "يطلب منك مشاركة التمرين عند الانتهاء" : "Auto-opens share sheet when a workout is completed", onToggle: () => { const p = user.preferences || {}; setUser({ ...user, preferences: { ...p, autoShareDisabled: p.autoShareDisabled === undefined ? true : !p.autoShareDisabled } }); } },
        { label: isArabic ? "إظهار حلقة السعرات" : "Show calorie ring", toggle: true, checked: user.showCalorieRing !== false, sub: isArabic ? "إظهار حلقة الماكروز في شاشة التغذية" : "Display the macro ring on the Nutrition screen", onToggle: () => setUser({ ...user, showCalorieRing: user.showCalorieRing === false ? true : false }) },
        { label: isArabic ? "إظهار تفاصيل الماكروز" : "Show macro breakdown", toggle: true, checked: user.showMacroBreakdown !== false, sub: isArabic ? "إظهار البروتين والكربوهيدرات والدهون تحت حلقة السعرات" : "Show protein, carbs, fats below the calorie ring", onToggle: () => setUser({ ...user, showMacroBreakdown: user.showMacroBreakdown === false ? true : false }) },
        { label: isArabic ? "تذكير الماء" : "Water reminders", toggle: true, checked: !!user.waterReminders, sub: isArabic ? "تذكير على مدار اليوم للوصول لهدف الماء" : "Reminders throughout the day to hit your hydration target", onToggle: () => setUser({ ...user, waterReminders: !user.waterReminders }) },
        { label: isArabic ? "هدف الماء اليومي" : "Daily water target", value: isArabic ? `${user.dailyWaterTarget || 2000} مل` : `${user.dailyWaterTarget || 2000} ml`, onPress: () => setWaterTargetSheet(true) },
      ],
    },
    { title: isArabic ? "أجهزة وتطبيقات متصلة" : "CONNECTED DEVICES & APPS", type: "integrations", items: [] },
    { title: isArabic ? "المساعدة" : "HELP", items: [
      { label: isArabic ? "اتصل بالدعم" : "Contact Support", external: true },
      { label: isArabic ? "الأسئلة الشائعة" : "FAQs", external: true },
      { label: isArabic ? "اطلب ميزة" : "Request a Feature", external: true },
    ] },
    { title: isArabic ? "القانوني" : "LEGAL", items: [
      { label: isArabic ? "شروط الخدمة" : "Terms of Service", external: true, onPress: () => router.push("/settings/legal/terms") },
      { label: isArabic ? "سياسة الخصوصية" : "Privacy Policy", external: true, onPress: () => router.push("/settings/legal/privacy") },
    ] },
    { title: "", items: [
      { label: isArabic ? "تسجيل الخروج" : "Sign Out", danger: true, onPress: () => setConfirmSignOut(true) },
      { label: isArabic ? "حذف الحساب" : "Delete Account", danger: true, onPress: () => router.push("/settings/delete-account") },
    ] },
  ], [user, theme, isArabic, colors]);

  const handleRowPress = (item: any) => {
    if (item.onPress) item.onPress();
    else if (item.path) router.push(item.path);
    else if (item.external) showToast(isArabic ? "قريباً" : "Coming soon", "info");
  };

  // ---- Row renderer ----
  const renderRow = (item: any, j: number, last: boolean) => {
    if (item.type === "profile") {
      const initials = (item.name || "U").split(" ").map((n: string) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
      return (
        <View key={j}>
          <Pressable onPress={() => handleRowPress(item)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", padding: 20 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                {item.img ? <Image source={{ uri: item.img }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <AppText style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>{initials}</AppText>}
              </View>
              <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: "uppercase", fontFamily: ff(isArabic, 600) }}>{item.name}</AppText>
                <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>{item.sub}</AppText>
              </View>
            </View>
            <ChevronRight size={18} strokeWidth={2.5} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
          </Pressable>
          {!last && <View style={{ height: 1, backgroundColor: colors.hairline, marginHorizontal: 20 }} />}
        </View>
      );
    }
    return (
      <View key={j}>
        <Pressable onPress={() => handleRowPress(item)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", padding: 20 }}>
          <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
            <AppText style={{ fontSize: 17, color: item.danger ? colors.semanticRed : colors.ink, fontFamily: ff(isArabic) }}>{item.label}</AppText>
            {item.sub && <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{item.sub}</AppText>}
          </View>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            {item.time && (
              <Pressable onPress={() => item.onTimeClick?.()} style={{ backgroundColor: "rgba(0,102,204,0.1)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}>
                <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>{item.time}</AppText>
              </Pressable>
            )}
            {item.toggle !== undefined ? (
              <Toggle value={!!item.checked} onValueChange={() => item.onToggle?.()} />
            ) : item.pill ? (
              item.isLanguage ? (
                <LanguageToggle variant="pill" />
              ) : (
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 4, padding: 4, borderRadius: 9999, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline }}>
                  {item.options.map((opt: string) => {
                    const active = item.active === opt;
                    return (
                      <Pressable key={opt} onPress={() => item.onPillClick?.(opt)} style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 9999, backgroundColor: active ? colors.canvas : "transparent" }}>
                        <AppText style={{ fontSize: 12, fontWeight: "600", textTransform: "uppercase", color: active ? colors.ink : colors.inkMuted48 }}>{opt}</AppText>
                      </Pressable>
                    );
                  })}
                </View>
              )
            ) : (
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                {item.value && <AppText style={{ fontSize: 14, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{item.value}</AppText>}
                {item.icon && (
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: "rgba(0,102,204,0.1)", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={14} color={colors.primary} fill={colors.primary} />
                  </View>
                )}
                {item.external ? (
                  <ExternalLink size={16} strokeWidth={2.5} color={colors.inkMuted48} />
                ) : (
                  <ChevronRight size={18} strokeWidth={2.5} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
                )}
              </View>
            )}
          </View>
        </Pressable>
        {!last && <View style={{ height: 1, backgroundColor: colors.hairline, marginHorizontal: 20 }} />}
      </View>
    );
  };

  const cardStyle = { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, overflow: "hidden" as const };

  const filteredCountries = ALL_COUNTRIES.filter((c) => c.divider || c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.arabicName.toLowerCase().includes(countrySearch.toLowerCase()));
  const disconnectName = disconnectSheetFor ? getIntegrationDetails(disconnectSheetFor).name : "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 24, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvasParchment, zIndex: 50 }}>
        <Pressable onPress={() => router.push("/me")} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={24} strokeWidth={2} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الإعدادات" : "Settings"}</AppText>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 48, maxWidth: 448, width: "100%", alignSelf: "center" }}>
        {/* Community banner */}
        <View style={{ ...cardStyle, padding: 20, marginBottom: 32, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
            <View style={{ backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
              <Users size={20} fill="#fff" color="#fff" />
            </View>
            <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "انضم إلى المجتمع" : "JOIN THE COMMUNITY"}</AppText>
              <AppText style={{ fontSize: 12, color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 6 }}>SYNK FITNESS CLUB</AppText>
            </View>
          </View>
          <ChevronRight size={18} strokeWidth={2.5} color={colors.primary} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </View>

        {sections.map((section, i) => (
          <View key={i} style={{ marginBottom: 32 }}>
            {section.title ? <AppText style={{ fontSize: 12, color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 8, marginBottom: 12, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{section.title}</AppText> : null}

            {section.type === "integrations" ? (
              <View>
                <View style={cardStyle}>
                  {integrationRows.length === 0 ? (
                    <AppText style={{ paddingVertical: 24, fontSize: 13, color: colors.inkMuted48, textAlign: "center", fontFamily: ff(isArabic) }}>{isArabic ? "مفيش تطبيقات متاحة على الجهاز ده" : "No integrations available on this device"}</AppText>
                  ) : (
                    integrationRows.map((row, idx) => {
                      const details = getIntegrationDetails(row.id);
                      const isConnected = row.status === "connected";
                      return (
                        <View key={row.id} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: idx !== integrationRows.length - 1 ? 1 : 0, borderBottomColor: colors.hairline }}>
                          <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                            <AppText style={{ fontSize: 18, color: details.color, fontWeight: "700" }}>{details.icon}</AppText>
                          </View>
                          <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                            <AppText style={{ fontSize: 15, fontWeight: "500", color: colors.ink, fontFamily: ff(isArabic) }}>{details.name}</AppText>
                            <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginTop: 2, fontFamily: ff(isArabic) }}>{isConnected ? (isArabic ? `متصل · آخر مزامنة ${formatRelativeTime((row as any).lastSyncAt)}` : `Connected · Last synced ${formatRelativeTime((row as any).lastSyncAt)}`) : isArabic ? "غير متصل" : "Not connected"}</AppText>
                          </View>
                          <Pressable
                            onPress={() => isConnected ? setDisconnectSheetFor(row.id) : connectIntegrationStub(row.id, user, setUser).then(() => showToast(isArabic ? `اتربط ${details.name}` : `${details.name} connected`, "success")).catch(() => showToast(isArabic ? "مقدرناش نوصله. جرب تاني." : "Couldn't connect. Try again.", "error"))}
                            style={isConnected ? { paddingHorizontal: 12, paddingVertical: 6 } : { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 }}
                          >
                            <AppText style={{ fontSize: 13, fontWeight: "600", color: isConnected ? colors.inkMuted48 : "#fff", fontFamily: ff(isArabic, 600) }}>{isConnected ? (isArabic ? "إلغاء الاتصال" : "Disconnect") : isArabic ? "اربط" : "Connect"}</AppText>
                          </Pressable>
                        </View>
                      );
                    })
                  )}
                </View>
                <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 8, paddingHorizontal: 4, lineHeight: 16, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "الاتصالات بتزامن التمارين، النبض، النوم، والوزن. تقدر تتحكم في إيه اللي كل تطبيق بيشاركه من إعدادات جهازك." : "Connections sync workouts, heart rate, sleep, and weight. You can control what each app shares from your device settings."}</AppText>
              </View>
            ) : (
              <View style={cardStyle}>
                {section.items.map((item: any, j: number) => renderRow(item, j, j === section.items.length - 1))}
              </View>
            )}
          </View>
        ))}

        {/* Social footer */}
        <View style={{ marginTop: 16, marginBottom: 32, alignItems: "center", gap: 24 }}>
          <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary, letterSpacing: 1, textTransform: "uppercase", fontStyle: "italic", fontFamily: ff(isArabic, 600) }}>{isArabic ? "تابعنا @synk.app" : "FOLLOW US @synk.app"}</AppText>
          <View style={{ flexDirection: "row", gap: 16 }}>
            {[Camera, Users, Play].map((Icon, i) => (
              <Pressable key={i} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                <Icon size={22} strokeWidth={2} color={colors.ink} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Branding */}
        <View style={{ marginTop: 16, alignItems: "center", gap: 16 }}>
          <AppText style={{ fontSize: 30, fontWeight: "600", color: "rgba(29,29,31,0.1)", textTransform: "uppercase", fontStyle: "italic", letterSpacing: -1 }}>SYNK</AppText>
          <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 2, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الإصدار ١.٠.٠ (بناء ١)" : "Version 1.0.0 (Build 1)"}</AppText>
          <Pressable onPress={() => showToast(isArabic ? "تم النسخ" : "Copied", "success")} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.canvas, borderRadius: 9999, marginTop: 8 }}>
            <AppText style={{ fontSize: 11, color: colors.inkMuted48, fontFamily: "Inter_400Regular" }}>8829-1029-X</AppText>
            <Copy size={12} color={colors.inkMuted48} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Time Picker Sheet */}
      <BottomSheet isOpen={!!timePicker.type} onClose={() => setTimePicker({ ...timePicker, type: null })} title={isArabic ? "اختر الوقت" : "Select Time"}>
        <View style={{ paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 32, paddingVertical: 24 }}>
            <View style={{ alignItems: "center", gap: 16 }}>
              <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الساعة" : "HOUR"}</AppText>
              <ScrollView style={{ height: 192 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 72 }}>
                {Array.from({ length: 24 }).map((_, h) => {
                  const active = timePicker.hour === h;
                  return (
                    <Pressable key={h} onPress={() => setTimePicker({ ...timePicker, hour: h })} style={{ height: 48, alignItems: "center", justifyContent: "center" }}>
                      <AppText style={{ fontSize: 24, fontWeight: "600", color: active ? colors.primary : colors.inkMuted48, opacity: active ? 1 : 0.3, transform: [{ scale: active ? 1.25 : 1 }] }}>{h.toString().padStart(2, "0")}</AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <AppText style={{ fontSize: 36, fontWeight: "600", color: colors.inkMuted48 }}>:</AppText>
            <View style={{ alignItems: "center", gap: 16 }}>
              <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: ff(isArabic, 600) }}>{isArabic ? "الدقيقة" : "MINUTE"}</AppText>
              <View style={{ height: 192, justifyContent: "center" }}>
                {[0, 15, 30, 45].map((m) => {
                  const active = timePicker.minute === m;
                  return (
                    <Pressable key={m} onPress={() => setTimePicker({ ...timePicker, minute: m })} style={{ height: 48, alignItems: "center", justifyContent: "center" }}>
                      <AppText style={{ fontSize: 24, fontWeight: "600", color: active ? colors.primary : colors.inkMuted48, opacity: active ? 1 : 0.3, transform: [{ scale: active ? 1.25 : 1 }] }}>{m.toString().padStart(2, "0")}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
          <Pressable onPress={saveTime} style={{ height: 56, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 8 }}>
            <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>{isArabic ? "تم" : "Done"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Country Sheet */}
      <BottomSheet isOpen={countrySheet} onClose={() => setCountrySheet(false)} title={isArabic ? "اختر دولتك" : "Select country"}>
        <View style={{ paddingVertical: 8, height: 420 }}>
          <TextInput value={countrySearch} onChangeText={setCountrySearch} placeholder={isArabic ? "بحث..." : "Search..."} placeholderTextColor={colors.inkMuted48} style={{ height: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.canvasParchment, paddingHorizontal: 16, marginBottom: 16, fontSize: 15, color: colors.ink, textAlign: isArabic ? "right" : "left" }} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {filteredCountries.map((c, i) => {
              if (c.divider) return <View key={`d${i}`} style={{ height: 1, backgroundColor: colors.hairline, marginVertical: 12, marginHorizontal: 12 }} />;
              const selected = user.country === c.name;
              return (
                <Pressable key={i} onPress={() => { setUser({ ...user, country: c.name }); setCountrySheet(false); showToast(isArabic ? "تم تحديث الدولة" : "Country updated", "success"); }} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", padding: 12, borderRadius: 10 }}>
                  <AppText style={{ fontSize: 24, minWidth: 40, textAlign: "center" }}>{c.emoji}</AppText>
                  <AppText style={{ fontSize: 16, color: colors.ink, marginHorizontal: 12, fontFamily: ff(isArabic) }}>{isArabic ? c.arabicName : c.name}</AppText>
                  {selected && <View style={{ marginLeft: isArabic ? 0 : "auto", marginRight: isArabic ? "auto" : 0 }}><Sparkles size={20} color={colors.primary} /></View>}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </BottomSheet>

      {/* Disconnect Sheet */}
      <BottomSheet isOpen={disconnectSheetFor !== null} onClose={() => setDisconnectSheetFor(null)} title={isArabic ? `إلغاء اتصال ${disconnectName}؟` : `Disconnect ${disconnectName}?`}>
        <View style={{ gap: 24, paddingVertical: 8 }}>
          <AppText style={{ fontSize: 15, color: colors.inkMuted48, lineHeight: 22, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "سنك هيوقف يجيب بيانات من التطبيق ده. تقدر توصله تاني في أي وقت." : "Synk will stop pulling data from this app. You can reconnect anytime."}</AppText>
          <View style={{ gap: 12 }}>
            <Pressable onPress={() => { if (disconnectSheetFor) disconnectIntegrationStub(disconnectSheetFor, user, setUser).then(() => { const name = getIntegrationDetails(disconnectSheetFor).name; setDisconnectSheetFor(null); showToast(isArabic ? `اتقطع اتصال ${name}` : `${name} disconnected`, "success"); }); }} style={{ height: 56, borderRadius: 9999, borderWidth: 1, borderColor: colors.semanticRed, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.semanticRed, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء الاتصال" : "Disconnect"}</AppText>
            </Pressable>
            <Pressable onPress={() => setDisconnectSheetFor(null)} style={{ height: 48, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Sign Out Sheet */}
      <BottomSheet isOpen={confirmSignOut} onClose={() => setConfirmSignOut(false)} title={isArabic ? "تسجيل الخروج؟" : "Sign out?"}>
        <View style={{ gap: 24, paddingVertical: 8 }}>
          <AppText style={{ fontSize: 15, color: colors.inkMuted48, lineHeight: 22, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? "هتحتاج تسجل دخول تاني للوصول لحسابك." : "You'll need to log in again to access your account."}</AppText>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
            <Pressable onPress={() => setConfirmSignOut(false)} style={{ flex: 1, height: 56, borderRadius: 9999, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
            </Pressable>
            <Pressable onPress={handleSignOut} style={{ flex: 1, height: 56, borderRadius: 9999, backgroundColor: colors.semanticRed, alignItems: "center", justifyContent: "center" }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", fontFamily: ff(isArabic, 600) }}>{isArabic ? "تسجيل الخروج" : "Sign out"}</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Water Target Sheet */}
      <BottomSheet isOpen={waterTargetSheet} onClose={() => setWaterTargetSheet(false)} title={isArabic ? "هدف الماء اليومي" : "Daily Water Target"}>
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {[1500, 2000, 2500, 3000, 3500].map((amount) => {
            const active = user.dailyWaterTarget === amount;
            return (
              <Pressable key={amount} onPress={() => { setUser({ ...user, dailyWaterTarget: amount }); setWaterTargetSheet(false); }} style={{ height: 56, borderRadius: 10, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", paddingHorizontal: 20, borderWidth: 1, backgroundColor: active ? "rgba(0,102,204,0.2)" : colors.canvasParchment, borderColor: active ? colors.primary : colors.hairline }}>
                <AppText style={{ fontSize: 15, fontWeight: "600", color: active ? colors.primary : colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? `${amount} مل` : `${amount} ml`}</AppText>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}
