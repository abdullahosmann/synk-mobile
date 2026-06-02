/**
 * DateNavigator — shared `‹ TODAY / Wed, Jun 4 ›` day stepper used by the
 * Nutrition page and the Workout (Fitness → Workout) header so both halves of
 * the Fitness tab pick the day the same way (audit F5). Prev/next arrows step
 * one day; the label reads "TODAY" for the current day, otherwise a localized
 * weekday/month/day. Mirrored for RTL.
 */
import React from "react";
import { Pressable, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useColors } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function DateNavigator({
  date,
  onChange,
  isArabic,
}: {
  date: Date;
  onChange: (d: Date) => void;
  isArabic: boolean;
}) {
  const colors = useColors();

  const today = startOfDay(new Date());
  const isToday = startOfDay(date).getTime() === today.getTime();

  const step = (days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    onChange(next);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", paddingHorizontal: 8 }}>
      <Pressable onPress={() => step(-1)} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
        {isArabic ? <ChevronRight size={24} color={colors.ink} /> : <ChevronLeft size={24} color={colors.ink} />}
      </Pressable>
      <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 0.5 }} numberOfLines={1}>
        {isToday
          ? isArabic ? "اليوم" : "TODAY"
          : date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric" })}
      </AppText>
      <Pressable onPress={() => step(1)} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
        {isArabic ? <ChevronLeft size={24} color={colors.ink} /> : <ChevronRight size={24} color={colors.ink} />}
      </Pressable>
    </View>
  );
}
