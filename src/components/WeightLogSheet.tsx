/**
 * WeightLogSheet — RN port of src/components/WeightLogSheet.tsx.
 * Bottom sheet with a large weight input (kg/lb aware) + save. The web's
 * date picker defaults to today; we keep today's date (date editing lands with
 * a native date picker in a later pass).
 */
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { useAppContext } from "../AppContext";
import { useToast } from "./ToastProvider";
import { WeightEntry } from "../types";
import { useColors } from "../theme/ThemeProvider";
import BottomSheet from "./BottomSheet";
import { AppText } from "./ui/Typography";
import { Btn } from "./ui/Btn";

interface WeightLogSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const WeightLogSheet: React.FC<WeightLogSheetProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const isArabic = user.language === "ar";
  const unit = user.weightUnit || "kg";

  const lastEntry = user.weightLog?.[0];
  const defaultWeight = lastEntry ? lastEntry.weightKg : user.currentWeight || 75;
  const displayDefault = unit === "lb" ? +(defaultWeight * 2.20462).toFixed(1) : defaultWeight;
  const [weightInput, setWeightInput] = useState(String(displayDefault));

  const handleSave = () => {
    const num = parseFloat(weightInput.replace(",", "."));
    if (isNaN(num) || num <= 0 || num > 500) {
      showToast(isArabic ? "وزن غير صحيح" : "Invalid weight", "info");
      return;
    }
    const weightKg = unit === "lb" ? +(num / 2.20462).toFixed(2) : num;
    const date = new Date().toISOString().split("T")[0];
    const filtered = (user.weightLog || []).filter((e) => e.date !== date);
    const newEntry: WeightEntry = { id: `w-${Date.now()}`, weightKg, date, createdAt: new Date().toISOString() };
    const updatedLog = [newEntry, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setUser({ ...user, weightLog: updatedLog, currentWeight: weightKg });
    showToast(isArabic ? `تم تسجيل ${num} ${unit === "lb" ? "رطل" : "كجم"}` : `Logged ${num} ${unit}`, "success");
    onClose();
  };

  const unitLabel = unit === "lb" ? (isArabic ? "رطل" : "lb") : isArabic ? "كجم" : "kg";

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={isArabic ? "سجّل وزنك" : "Log your weight"}>
      <View style={{ gap: 16 }}>
        <View>
          <AppText
            className="text-ink-muted-48 dark:text-ink-dark-muted-48"
            style={{ marginBottom: 8, fontSize: 12, fontWeight: "600", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, textAlign: isArabic ? "right" : "left", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}
          >
            {isArabic ? `الوزن (${unitLabel})` : `Weight (${unit})`}
          </AppText>
          <TextInput
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.canvasParchment,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 8,
              padding: 16,
              fontSize: 24,
              fontWeight: "600",
              color: colors.ink,
              textAlign: "center",
              fontFamily: "Inter_600SemiBold",
            }}
          />
        </View>

        {lastEntry && (
          <AppText variant="fine-print" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontSize: 12, textAlign: isArabic ? "right" : "left" }}>
            {isArabic
              ? `آخر تسجيل: ${(unit === "lb" ? lastEntry.weightKg * 2.20462 : lastEntry.weightKg).toFixed(1)} ${unitLabel}`
              : `Last logged: ${(unit === "lb" ? lastEntry.weightKg * 2.20462 : lastEntry.weightKg).toFixed(1)} ${unit}`}
          </AppText>
        )}

        <Btn variant="primary" fullWidth onPress={handleSave} label={isArabic ? "احفظ" : "Save"} />
      </View>
    </BottomSheet>
  );
};

export default WeightLogSheet;
