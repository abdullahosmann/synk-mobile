/**
 * NotificationsOptIn — RN port of src/screens/onboarding/NotificationsOptIn.tsx.
 * Bell hero + 3 benefit rows. "Turn on" requests OS permission via
 * expo-notifications (replaces the web Notification.requestPermission()).
 */
import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Bell, Check } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useColors } from "../../src/theme/ThemeProvider";
import { withAlpha } from "../../src/theme/tint";
import { AppText } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";

export default function NotificationsOptIn() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";

  const handleNext = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setUser((prev) => ({ ...prev, notificationsGranted: status === "granted" }));
    } catch {
      setUser((prev) => ({ ...prev, notificationsGranted: false }));
    }
    router.push("/onboarding/health-sync");
  };

  const handleSkip = () => {
    setUser((prev) => ({ ...prev, notificationsGranted: false }));
    router.push("/onboarding/health-sync");
  };

  const benefit = (text: string) => (
    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
      <Check size={16} color={colors.primary} />
      <AppText variant="body-strong" style={{ color: colors.ink, flex: 1, textAlign: isArabic ? "right" : "left" }}>
        {text}
      </AppText>
    </View>
  );

  return (
    <OnboardingLayout
      step={12}
      title="Let's keep you on track"
      arabicTitle="خلينا نخليك ماشي"
      subtitle="We'll only nudge you for things that actually matter."
      arabicSubtitle="هنبعتلك فقط للحاجات اللي بتفرق فعلاً."
      onBack={() => router.replace("/onboarding/plan-preview")}
      footer={
        <View style={{ gap: 16 }}>
          <Btn variant="primary" fullWidth onPress={handleNext} label={isArabic ? "فعّل الإشعارات" : "Turn on notifications"} />
          <AppText onPress={handleSkip} variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: "center", fontWeight: "500" }}>
            {isArabic ? "بعدين يمكن" : "Maybe later"}
          </AppText>
        </View>
      }
    >
      <View style={{ alignItems: "center" }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: withAlpha(colors.primary, 0.08), alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 40 }}>
          <Bell size={56} color={colors.primary} />
        </View>
        <View style={{ width: "100%", gap: 16, paddingHorizontal: 8 }}>
          {benefit(isArabic ? "تذكير بالتمرين في اليوم نفسه" : "Workout reminders the day-of")}
          {benefit(isArabic ? "حماية السلسلة — متفقدش تقدمك" : "Streak protection — never lose your progress")}
          {benefit(isArabic ? "تحديثات المدرب لما الخطة تتعدل" : "Coach updates when your plan adapts")}
        </View>
      </View>
    </OnboardingLayout>
  );
}
