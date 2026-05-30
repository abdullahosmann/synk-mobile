/**
 * Attribution — RN port of src/screens/onboarding/Attribution.tsx.
 * "How did you find us?" single-select list with icon chips.
 */
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
// lucide-react-native v1 has no Instagram glyph; Camera is the closest social-photo metaphor.
import { Camera, Music, Users, Dumbbell, Search, HelpCircle } from "lucide-react-native";
import { useAppContext } from "../../src/AppContext";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";

export default function Attribution() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (!selected) return;
    setUser((prev) => ({ ...prev, attributionSource: selected }));
    router.push("/onboarding/paywall");
  };

  const options = [
    { id: "instagram", icon: Camera, label: "Instagram", labelAr: "إنستجرام" },
    { id: "tiktok", icon: Music, label: "TikTok", labelAr: "تيك توك" },
    { id: "friend", icon: Users, label: "A friend told me", labelAr: "صاحب قالي" },
    { id: "gym", icon: Dumbbell, label: "At the gym", labelAr: "في الجيم" },
    { id: "search", icon: Search, label: "Google / search", labelAr: "جوجل / بحث" },
    { id: "other", icon: HelpCircle, label: "Other", labelAr: "غير ده" },
  ];

  return (
    <OnboardingLayout
      step={14}
      title="How did you find us?"
      arabicTitle="عرفت سنك إزاي؟"
      subtitle="Helps us know what works."
      arabicSubtitle="بيساعدنا نعرف إيه اللي شغّال."
      onBack={() => router.replace("/onboarding/health-sync")}
      footer={<ContinueButton onPress={handleNext} disabled={!selected} />}
    >
      <View style={{ gap: 8, marginTop: 16, paddingBottom: 16 }}>
        {options.map((opt) => {
          const sel = selected === opt.id;
          const Icon = opt.icon;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setSelected(opt.id)}
              style={{
                flexDirection: isArabic ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                padding: 16,
                borderRadius: 8,
                backgroundColor: colors.canvas,
                borderWidth: sel ? 2 : 1,
                borderColor: sel ? colors.primary : colors.hairline,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: sel ? "rgba(0,102,204,0.1)" : colors.surfacePearl,
                }}
              >
                <Icon size={20} strokeWidth={2} color={sel ? colors.primary : colors.inkMuted48} />
              </View>
              <AppText
                variant="title"
                style={{ flex: 1, fontSize: 16, color: sel ? colors.primary : colors.ink, textAlign: isArabic ? "right" : "left" }}
              >
                {isArabic ? opt.labelAr : opt.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </OnboardingLayout>
  );
}
