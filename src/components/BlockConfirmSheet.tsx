/**
 * BlockConfirmSheet — RN port of src/components/BlockConfirmSheet.tsx.
 * Confirmation BottomSheet: warning glyph + copy + Cancel/Block actions.
 */
import React from "react";
import { Pressable, View } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import BottomSheet from "./BottomSheet";
import { useAppContext } from "../AppContext";
import { useToast } from "./ToastProvider";
import { useTheme } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

interface BlockConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  onBlocked?: () => void;
}

const RED = "#ff3b30";

function ff(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

const BlockConfirmSheet: React.FC<BlockConfirmSheetProps> = ({ isOpen, onClose, targetName, onBlocked }) => {
  const { user } = useAppContext();
  const { showToast } = useToast();
  const { theme, colors } = useTheme();
  const isArabic = user?.language === "ar";
  const isDark = theme === "dark";

  const handleBlock = () => {
    onClose();
    showToast(isArabic ? `تم حظر ${targetName}` : `${targetName} blocked`, "success");
    onBlocked?.();
  };

  const tile1 = isDark ? colors.surfaceTile1 : colors.canvasParchment;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={isArabic ? "حظر المستخدم" : "Block user"}>
      <View style={{ paddingTop: 8, paddingBottom: 24, gap: 16 }}>
        <View style={{ alignItems: "center", gap: 12 }}>
          <View style={{ width: 48, height: 44, borderRadius: 9999, backgroundColor: RED + "1A", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={24} color={RED} />
          </View>
          <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textAlign: "center", fontFamily: ff(isArabic, 600) }}>{isArabic ? `حظر ${targetName}؟` : `Block ${targetName}?`}</AppText>
          <AppText style={{ fontSize: 13, color: colors.inkMuted48, lineHeight: 18, maxWidth: 280, textAlign: "center", fontFamily: ff(isArabic) }}>
            {isArabic ? "مش هيقدر يشوف ملفك أو منشوراتك. ومش هتشوف بتاعه. ولو في متابعة بينكم هتتلغي." : "They won't be able to see your profile or posts. You won't see theirs. Any follows between you will be removed."}
          </AppText>
        </View>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
          <Pressable onPress={onClose} style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: tile1, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
          </Pressable>
          <Pressable onPress={handleBlock} style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: RED, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ fontSize: 14, fontWeight: "600", color: "#ffffff", fontFamily: ff(isArabic, 600) }}>{isArabic ? "حظر" : "Block"}</AppText>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
};

export default BlockConfirmSheet;
