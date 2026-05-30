/**
 * GoalPacePicker — RN port of src/components/GoalPacePicker.tsx.
 * Three pace options (0.25 / 0.5-recommended / 0.75 kg/week) with a projected
 * goal date and an amber warning for the aggressive pace.
 */
import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { computeGoalEndDate } from "../lib/planUtils";
import { useColors } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

interface GoalPacePickerProps {
  currentWeight: number;
  targetWeight: number;
  selectedRate: number;
  onSelect: (rate: number) => void;
  isArabic: boolean;
}

export const GoalPacePicker: React.FC<GoalPacePickerProps> = ({
  currentWeight,
  targetWeight,
  selectedRate,
  onSelect,
  isArabic,
}) => {
  const colors = useColors();
  const isCut = targetWeight < currentWeight;

  const dateStr = useMemo(() => {
    const d = computeGoalEndDate(currentWeight, targetWeight, selectedRate);
    if (!d) return "";
    return d.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [currentWeight, targetWeight, selectedRate, isArabic]);

  const maxSafeCut = currentWeight * 0.01;
  const maxSafeBulk = currentWeight * 0.005;
  const showWarning =
    selectedRate === 0.75 &&
    ((isCut && 0.75 > maxSafeCut) || (!isCut && 0.75 > maxSafeBulk));

  const options = [
    {
      id: 0.25,
      labelEn: isCut ? "Steady" : "Slow & lean",
      labelAr: isCut ? "هادي" : "بطيئة ونظيفة",
      subEn: "0.25 kg/week",
      subAr: "٠.٢٥ كجم/أسبوع",
    },
    {
      id: 0.5,
      labelEn: "Balanced",
      labelAr: "متوازنة",
      subEn: "0.5 kg/week",
      subAr: "٠.٥ كجم/أسبوع",
      isRecommended: true,
    },
    {
      id: 0.75,
      labelEn: isCut ? "Aggressive" : "Fast bulk",
      labelAr: isCut ? "سريعة" : "تضخيم سريع",
      subEn: "0.75 kg/week",
      subAr: "٠.٧٥ كجم/أسبوع",
    },
  ];

  return (
    <View style={{ width: "100%" }}>
      <AppText
        variant="caption"
        className="text-ink-muted-48 dark:text-ink-dark-muted-48"
        style={{ marginBottom: 12, textAlign: isArabic ? "right" : "left" }}
      >
        {isArabic
          ? `هتروح من ${currentWeight} كجم لـ ${targetWeight} كجم. بأي سرعة؟`
          : `You want to go from ${currentWeight} kg to ${targetWeight} kg. At what pace?`}
      </AppText>

      <View
        style={{
          flexDirection: isArabic ? "row-reverse" : "row",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {options.map((opt) => {
          const sel = selectedRate === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
                paddingTop: opt.isRecommended ? 16 : 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: sel ? colors.primary : colors.hairline,
                backgroundColor: sel ? colors.canvas : "transparent",
              }}
            >
              {opt.isRecommended && (
                <View
                  style={{
                    position: "absolute",
                    top: -8,
                    backgroundColor: colors.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 1,
                    borderRadius: 9999,
                  }}
                >
                  <AppText style={{ color: "#fff", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {isArabic ? "مُوصى به" : "Recommended"}
                  </AppText>
                </View>
              )}
              <AppText
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  marginBottom: 4,
                  color: sel ? colors.primary : colors.ink,
                  textAlign: "center",
                  fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular",
                }}
              >
                {isArabic ? opt.labelAr : opt.labelEn}
              </AppText>
              <AppText
                style={{
                  fontSize: 11,
                  color: sel ? colors.primary : colors.inkMuted48,
                  textAlign: "center",
                }}
              >
                {isArabic ? opt.subAr : opt.subEn}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: colors.primary,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {isArabic ? `هتوصل لهدفك تقريبًا في ${dateStr}` : `You'll reach your target around ${dateStr}`}
      </AppText>

      {showWarning && (
        <View
          style={{
            marginTop: 8,
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            gap: 8,
            padding: 8,
            backgroundColor: "rgba(255,149,0,0.10)",
            borderRadius: 6,
          }}
        >
          <AlertCircle size={16} color={colors.semanticOrange} />
          <AppText
            style={{ fontSize: 12, color: colors.semanticOrange, flex: 1, textAlign: isArabic ? "right" : "left" }}
          >
            {isArabic
              ? "السرعة دي صعبة — الأبطأ بيثبت أكتر."
              : "This pace is demanding — slower usually sticks better."}
          </AppText>
        </View>
      )}
    </View>
  );
};
