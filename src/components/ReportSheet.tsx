/**
 * ReportSheet — RN port of src/components/ReportSheet.tsx.
 * BottomSheet listing report reasons; any choice closes + toasts.
 */
import React from "react";
import { Pressable, View } from "react-native";
import BottomSheet from "./BottomSheet";
import { useAppContext } from "../AppContext";
import { useToast } from "./ToastProvider";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

interface ReportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "profile" | "post" | "comment";
  targetName?: string;
}

const REASONS = [
  { id: "spam", en: "Spam", ar: "محتوى مزعج" },
  { id: "harassment", en: "Harassment or bullying", ar: "تحرش أو تنمر" },
  { id: "hate", en: "Hate speech", ar: "خطاب كراهية" },
  { id: "nudity", en: "Nudity or sexual content", ar: "محتوى جنسي أو إباحي" },
  { id: "violence", en: "Violence or dangerous content", ar: "عنف أو محتوى خطر" },
  { id: "self_harm", en: "Self-harm or suicide", ar: "إيذاء النفس" },
  { id: "scam", en: "Scam or fraud", ar: "احتيال" },
  { id: "other", en: "Something else", ar: "حاجة تانية" },
];

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

const ReportSheet: React.FC<ReportSheetProps> = ({ isOpen, onClose, targetType }) => {
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const title = targetType === "profile" ? (isArabic ? "إبلاغ عن المستخدم" : "Report user") : targetType === "post" ? (isArabic ? "إبلاغ عن منشور" : "Report post") : isArabic ? "إبلاغ عن تعليق" : "Report comment";

  const handleReport = () => {
    onClose();
    showToast(isArabic ? "تم الإبلاغ. شكراً لمساعدتك." : "Reported. Thanks for keeping SYNK safe.", "success");
  };

  const cardBg = isDark ? colors.surfaceTile2 : colors.canvas;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <View style={{ paddingTop: 8, paddingBottom: 24, gap: 8 }}>
        <AppText style={{ fontSize: 12, color: colors.inkMuted48, marginBottom: 4, paddingHorizontal: 4, lineHeight: 17, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>
          {isArabic ? "بنراجع البلاغات بسرية تامة. هتفضل تشوف المحتوى ده لحد ما نشيله." : "Reports are reviewed confidentially. You'll continue to see this content until it's removed."}
        </AppText>
        {REASONS.map((r) => (
          <Pressable key={r.id} onPress={handleReport} style={{ padding: 12, backgroundColor: cardBg, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10 }}>
            <AppText style={{ fontSize: 14, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? r.ar : r.en}</AppText>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
};

export default ReportSheet;
