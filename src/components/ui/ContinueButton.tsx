/**
 * ContinueButton — the recurring onboarding footer CTA.
 * Port of the `.btn-primary` Continue/Next button with disabled styling and a
 * trailing arrow that flips for RTL.
 */
import React from "react";
import { ArrowRight } from "lucide-react-native";
import { useIsArabic } from "../../lib/i18n";
import { Btn } from "./Btn";
import { AppText } from "./Typography";

interface ContinueButtonProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
  arabicLabel?: string;
}

export const ContinueButton: React.FC<ContinueButtonProps> = ({
  onPress,
  disabled,
  label = "Continue",
  arabicLabel = "متابعة",
}) => {
  const isArabic = useIsArabic();
  return (
    <Btn variant="primary" fullWidth onPress={onPress} disabled={disabled}>
      <AppText variant="body-strong" style={{ color: "#fff" }}>
        {isArabic ? arabicLabel : label}
      </AppText>
      <ArrowRight
        size={16}
        strokeWidth={2.5}
        color="#fff"
        style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }}
      />
    </Btn>
  );
};
