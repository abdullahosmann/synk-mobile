/**
 * LegalScreen — RN port of src/screens/main/LegalScreen.tsx.
 *
 * One screen renders both Terms of Service and Privacy Policy, chosen by the
 * `type` route param (/settings/legal/terms | /settings/legal/privacy). Header,
 * "last updated" line, then numbered section titles each followed by two
 * placeholder (lorem) paragraphs — matches the web 1:1 (the copy is a launch
 * placeholder, kept identical to source).
 *
 * Web→RN: useParams docType / window.location.pathname → useLocalSearchParams
 * `type`; navigate(-1) → router.back().
 */
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useAppContext } from "../../../src/AppContext";
import { useColors } from "../../../src/theme/ThemeProvider";
import { AppText } from "../../../src/components/ui/Typography";

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

const loremEn =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";
const loremAr =
  "هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولد النص العربى، حيث يمكنك أن تولد مثل هذا النص أو العديد من النصوص الأخرى إضافة إلى زيادة عدد الحروف التى يولدها التطبيق. إذا كنت تحتاج إلى عدد أكبر من الفقرات يتيح لك مولد النص العربى زيادة عدد الفقرات كما تريد.";

const termsSections = [
  { titleEn: "1. Acceptance", titleAr: "١. القبول" },
  { titleEn: "2. Account", titleAr: "٢. الحساب" },
  { titleEn: "3. Subscriptions", titleAr: "٣. الاشتراكات" },
  { titleEn: "4. Acceptable use", titleAr: "٤. الاستخدام المقبول" },
  { titleEn: "5. Termination", titleAr: "٥. الإنهاء" },
  { titleEn: "6. Disclaimers", titleAr: "٦. إخلاء المسؤولية" },
  { titleEn: "7. Limitation of liability", titleAr: "٧. الحد من المسؤولية" },
  { titleEn: "8. Changes to terms", titleAr: "٨. التغييرات على الشروط" },
];

const privacySections = [
  { titleEn: "1. Information we collect", titleAr: "١. المعلومات التي نجمعها" },
  { titleEn: "2. How we use it", titleAr: "٢. كيف نستخدمها" },
  { titleEn: "3. Sharing", titleAr: "٣. المشاركة" },
  { titleEn: "4. Storage", titleAr: "٤. التخزين" },
  { titleEn: "5. Your rights", titleAr: "٥. حقوقك" },
  { titleEn: "6. Cookies", titleAr: "٦. ملفات تعريف الارتباط" },
  { titleEn: "7. Children's privacy", titleAr: "٧. خصوصية الأطفال" },
  { titleEn: "8. Contact us", titleAr: "٨. اتصل بنا" },
];

export default function LegalScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user?.language === "ar";
  const docType = (type || "").includes("terms") ? "terms" : "privacy";

  const titleText =
    docType === "terms"
      ? isArabic
        ? "شروط الخدمة"
        : "Terms of Service"
      : isArabic
        ? "سياسة الخصوصية"
        : "Privacy Policy";

  const lastUpdated = isArabic ? "آخر تحديث: ٢٢ مايو ٢٠٢٦" : "Last updated: May 22, 2026";
  const sections = docType === "terms" ? termsSections : privacySections;
  const lorem = isArabic ? loremAr : loremEn;
  const align = isArabic ? "right" : "left";

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 8,
          paddingHorizontal: 16,
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "center",
          backgroundColor: colors.canvasParchment,
          zIndex: 50,
        }}
      >
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={isArabic ? "رجوع" : "Back"} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={24} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
        </Pressable>
        <AppText
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 17,
            fontWeight: "600",
            color: colors.ink,
            marginRight: isArabic ? 0 : 40,
            marginLeft: isArabic ? 40 : 0,
            fontFamily: ff(isArabic, 600),
          }}
        >
          {titleText}
        </AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 48,
          maxWidth: 448,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginBottom: 24, textAlign: align, fontFamily: ff(isArabic) }}>
          {lastUpdated}
        </AppText>

        {sections.map((section, index) => (
          <View key={index} style={{ marginBottom: 24 }}>
            <AppText style={{ fontSize: 16, fontWeight: "600", color: colors.ink, marginTop: 24, marginBottom: 8, textAlign: align, fontFamily: ff(isArabic, 600) }}>
              {isArabic ? section.titleAr : section.titleEn}
            </AppText>
            <AppText style={{ fontSize: 14, color: colors.ink, opacity: 0.8, lineHeight: 23, marginBottom: 12, textAlign: align, fontFamily: ff(isArabic) }}>
              {lorem}
            </AppText>
            <AppText style={{ fontSize: 14, color: colors.ink, opacity: 0.8, lineHeight: 23, marginBottom: 12, textAlign: align, fontFamily: ff(isArabic) }}>
              {lorem}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
