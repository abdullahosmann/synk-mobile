/**
 * BodyComposition — RN port of src/screens/onboarding/BodyComposition.tsx.
 * A vertical list of body-fat range options (male/female sets) each with a
 * body-type SVG, range %, label, and a check when selected.
 */
import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { useColors } from "../../src/theme/ThemeProvider";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";

import Male1 from "../../src/assets/body-types/male-1.svg";
import Male2 from "../../src/assets/body-types/male-2.svg";
import Male3 from "../../src/assets/body-types/male-3.svg";
import Male4 from "../../src/assets/body-types/male-4.svg";
import Male5 from "../../src/assets/body-types/male-5.svg";
import Female1 from "../../src/assets/body-types/female-1.svg";
import Female2 from "../../src/assets/body-types/female-2.svg";
import Female3 from "../../src/assets/body-types/female-3.svg";
import Female4 from "../../src/assets/body-types/female-4.svg";
import Female5 from "../../src/assets/body-types/female-5.svg";

type Opt = {
  range: string;
  labelEn: string;
  labelAr: string;
  display: string;
  Img: React.FC<{ width: number; height: number }>;
};

const maleOptions: Opt[] = [
  { range: "10-14", labelEn: "Lean / Athletic", labelAr: "نحيف / رياضي", display: "10–14%", Img: Male1 },
  { range: "15-19", labelEn: "Fit", labelAr: "لائق", display: "15–19%", Img: Male2 },
  { range: "20-24", labelEn: "Average", labelAr: "متوسط", display: "20–24%", Img: Male3 },
  { range: "25-29", labelEn: "Above Average", labelAr: "فوق المتوسط", display: "25–29%", Img: Male4 },
  { range: "30+", labelEn: "Higher", labelAr: "أعلى", display: "30%+", Img: Male5 },
];

const femaleOptions: Opt[] = [
  { range: "15-19", labelEn: "Lean / Athletic", labelAr: "نحيفة / رياضية", display: "15–19%", Img: Female1 },
  { range: "20-24", labelEn: "Fit", labelAr: "لائقة", display: "20–24%", Img: Female2 },
  { range: "25-29", labelEn: "Average", labelAr: "متوسطة", display: "25–29%", Img: Female3 },
  { range: "30-34", labelEn: "Above Average", labelAr: "فوق المتوسط", display: "30–34%", Img: Female4 },
  { range: "35+", labelEn: "Higher", labelAr: "أعلى", display: "35%+", Img: Female5 },
];

export default function BodyComposition() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";
  const options = user.gender === "female" ? femaleOptions : maleOptions;
  const [selectedRange, setSelectedRange] = useState<string | null>(user.bodyFatRange || null);

  const handleContinue = () => {
    if (!selectedRange) return;
    setUser({ ...user, bodyFatRange: selectedRange });
    router.push("/onboarding/injuries");
  };

  return (
    <OnboardingLayout
      step={4}
      title="What's your current body type?"
      arabicTitle="إيه شكل جسمك دلوقتي؟"
      subtitle="This helps us set realistic targets for you."
      arabicSubtitle="ده يساعدنا نحط أهداف واقعية ليك."
      footer={
        <View style={{ gap: 16, width: "100%" }}>
          <AppText
            variant="fine-print"
            className="text-ink-muted-48 dark:text-ink-dark-muted-48"
            style={{ textAlign: "center", fontSize: 12 }}
          >
            {isArabic
              ? "تقدير تقريبي كفاية — تقدر تغيره في أي وقت."
              : "Estimate is fine — you can update it anytime."}
          </AppText>
          <ContinueButton onPress={handleContinue} disabled={!selectedRange} label="Continue" arabicLabel="التالي" />
        </View>
      }
    >
      <View style={{ paddingBottom: 16 }}>
        <AppText
          variant="fine-print"
          className="text-ink-muted-48 dark:text-ink-dark-muted-48"
          style={{ marginBottom: 16, textAlign: "center", fontSize: 12 }}
        >
          {isArabic
            ? "الصور التوضيحية تقريبية. اختار الأقرب ليك."
            : "Visual references are approximate. Choose the option closest to you."}
        </AppText>

        <View style={{ gap: 8 }}>
          {options.map((opt) => {
            const sel = selectedRange === opt.range;
            const Img = opt.Img;
            return (
              <Pressable
                key={opt.range}
                onPress={() => setSelectedRange(opt.range)}
                style={{
                  flexDirection: isArabic ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: colors.canvas,
                  borderRadius: 8,
                  padding: 12,
                  borderWidth: sel ? 2 : 1,
                  borderColor: sel ? colors.primary : colors.hairline,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 60,
                    borderRadius: 6,
                    overflow: "hidden",
                    backgroundColor: colors.canvasParchment,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Img width={44} height={60} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    style={{ fontSize: 16, fontWeight: "700", color: colors.ink, textAlign: isArabic ? "right" : "left" }}
                  >
                    {opt.display}
                  </AppText>
                  <AppText
                    variant="caption"
                    className="text-ink-muted-48 dark:text-ink-dark-muted-48"
                    style={{ textAlign: isArabic ? "right" : "left" }}
                  >
                    {isArabic ? opt.labelAr : opt.labelEn}
                  </AppText>
                </View>
                {sel && <Check size={18} strokeWidth={3} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
}
