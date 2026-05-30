/**
 * HealthSync — RN port of src/screens/onboarding/HealthSync.tsx.
 * Heart hero + a 2x2 grid of metrics (steps/heart/sleep/weight). The connect
 * button names the platform (Apple Health on iOS, Google Fit on Android).
 */
import React from "react";
import { Platform, View } from "react-native";
import { useRouter } from "expo-router";
import { Heart, Footprints, Moon, Scale } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";

export default function HealthSync() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";

  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";
  const platformName = isIOS ? "Apple Health" : isAndroid ? "Google Fit" : "Apple Health / Google Fit";
  const platformNameAr = isIOS ? "أبل هيلث" : isAndroid ? "جوجل فيت" : "أبل هيلث / جوجل فيت";

  const handleNext = () => {
    // TODO: wire to expo-health / react-native-health when the native bridge lands.
    setUser((prev) => ({ ...prev, healthSyncEnabled: true }));
    router.push("/onboarding/attribution");
  };
  const handleSkip = () => {
    setUser((prev) => ({ ...prev, healthSyncEnabled: false }));
    router.push("/onboarding/attribution");
  };

  const metric = (Icon: any, label: string) => (
    <View style={{ width: "48%", flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
      <Icon size={20} color={colors.primary} style={{ opacity: 0.8 }} />
      <AppText variant="body-strong" style={{ color: colors.ink }}>{label}</AppText>
    </View>
  );

  return (
    <OnboardingLayout
      step={13}
      title="Sync your steps, sleep, and weight"
      arabicTitle="زامِن خطواتك، نومك، ووزنك"
      subtitle="So Synk adapts to your real life, not just the gym."
      arabicSubtitle="عشان سنك يتأقلم مع حياتك الحقيقية، مش بس الجيم."
      onBack={() => router.replace("/onboarding/notifications")}
      footer={
        <View style={{ gap: 16 }}>
          <Btn variant="primary" fullWidth onPress={handleNext} label={isArabic ? `وصّل ${platformNameAr}` : `Connect ${platformName}`} />
          <AppText onPress={handleSkip} variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: "center", fontWeight: "500" }}>
            {isArabic ? "تجاوز دلوقتي" : "Skip for now"}
          </AppText>
        </View>
      }
    >
      <View style={{ alignItems: "center" }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(0,102,204,0.08)", alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 40 }}>
          <Heart size={56} color={colors.primary} />
        </View>
        <View style={{ width: "100%", backgroundColor: colors.canvas, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.hairline }}>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", rowGap: 24, columnGap: 16 }}>
            {metric(Footprints, isArabic ? "الخطوات" : "Steps")}
            {metric(Heart, isArabic ? "النبض" : "Heart rate")}
            {metric(Moon, isArabic ? "النوم" : "Sleep")}
            {metric(Scale, isArabic ? "الوزن" : "Weight")}
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}
