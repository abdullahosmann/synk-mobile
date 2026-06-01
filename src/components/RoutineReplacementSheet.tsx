/**
 * RoutineReplacementSheet — RN port of src/components/RoutineReplacementSheet.tsx.
 *
 * A bottom sheet asking how a just-imported/saved routine should be applied:
 * just today / replace today / use every <weekday>. Web→RN: motion sheet →
 * reanimated translateY (spring in, timing out) inside a transparent <Modal>,
 * mirroring BottomSheet.tsx. No drag-to-dismiss (matches web — dismiss via X /
 * backdrop). Pressable styles use plain objects (function styles don't apply
 * inside a Modal in this Expo SDK 56 / RN 0.85 setup — see RESUME.md).
 */
import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bookmark, Calendar, RefreshCw, X } from "lucide-react-native";
import { useAppContext } from "../AppContext";
import { useColors, useTheme } from "../theme/ThemeProvider";
import { withAlpha } from "../theme/tint";
import { AppText } from "./ui/Typography";

export type ReplacementChoice = "just-today" | "replace-today" | "save-as-default";

interface RoutineReplacementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onChoose: (choice: ReplacementChoice) => void;
  routineName?: string;
}

const SPRING = { damping: 30, stiffness: 300 } as const;

function fontFamily(isArabic: boolean, weight: 400 | 600 = 400) {
  if (weight === 600) return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
  return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
}

const RoutineReplacementSheet: React.FC<RoutineReplacementSheetProps> = ({
  isOpen,
  onClose,
  onChoose,
  routineName,
}) => {
  const { user, selectedDate } = useAppContext();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const isArabic = user.language === "ar";

  const translateY = useSharedValue(screenH);
  const [mounted, setMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      translateY.value = screenH;
      translateY.value = withSpring(0, SPRING);
    } else if (mounted) {
      translateY.value = withTiming(screenH, { duration: 220 }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: translateY.value >= screenH ? 0 : 1 - translateY.value / screenH,
  }));

  const dayOfWeekEn = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
  const dayOfWeekAr = selectedDate.toLocaleDateString("ar-EG", { weekday: "long" });

  const options: Array<{
    id: ReplacementChoice;
    icon: React.ReactNode;
    titleEn: string;
    titleAr: string;
    descEn: string;
    descAr: string;
    accent: boolean;
  }> = [
    {
      id: "just-today",
      icon: <Calendar size={20} color={colors.primary} />,
      titleEn: "Just for today",
      titleAr: "بس النهارده",
      descEn: "Your coach plan continues tomorrow as normal.",
      descAr: "خطة الكوتش بتكمل بكره عادي.",
      accent: true,
    },
    {
      id: "replace-today",
      icon: <RefreshCw size={20} color={colors.inkMuted48} />,
      titleEn: "Replace today's plan",
      titleAr: "استبدل خطة النهارده",
      descEn: "Your coach will rebalance the rest of the week.",
      descAr: "الكوتش هيوازن باقي الأسبوع.",
      accent: false,
    },
    {
      id: "save-as-default",
      icon: <Bookmark size={20} color={colors.inkMuted48} />,
      titleEn: `Use this routine every ${dayOfWeekEn}`,
      titleAr: `استخدم الروتين ده كل ${dayOfWeekAr}`,
      descEn: "Replaces this slot in your weekly plan.",
      descAr: "بيستبدل المكان ده في خطتك الأسبوعية.",
      accent: false,
    },
  ];

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} animationType="none">
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: screenH * 0.85,
            backgroundColor: colors.canvas,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            borderTopWidth: 1,
            borderColor: colors.hairline,
            paddingBottom: insets.bottom + 24,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 9999, backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
        </View>

        {/* Header */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.ink,
                textAlign: isArabic ? "right" : "left",
                fontFamily: fontFamily(isArabic, 600),
              }}
            >
              {isArabic ? "هتستخدم الروتين ده ازاي؟" : "How will you use this routine?"}
            </AppText>
            {!!routineName && (
              <AppText
                style={{
                  fontSize: 13,
                  color: colors.inkMuted48,
                  marginTop: 2,
                  textAlign: isArabic ? "right" : "left",
                  fontFamily: fontFamily(isArabic),
                }}
              >
                {routineName}
              </AppText>
            )}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isArabic ? "إغلاق" : "Close"}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} color={colors.inkMuted48} />
          </Pressable>
        </View>

        {/* Options */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 12 }}>
          {options.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => onChoose(opt.id)}
              style={{
                backgroundColor: colors.canvasParchment,
                borderWidth: 1,
                borderColor: opt.accent ? withAlpha(colors.primary, 0.3) : colors.hairline,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: opt.accent ? withAlpha(colors.primary, 0.15) : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                  }}
                >
                  {opt.icon}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: colors.ink,
                      textAlign: isArabic ? "right" : "left",
                      fontFamily: fontFamily(isArabic, 600),
                    }}
                  >
                    {isArabic ? opt.titleAr : opt.titleEn}
                  </AppText>
                  <AppText
                    style={{
                      fontSize: 13,
                      color: colors.inkMuted48,
                      marginTop: 4,
                      lineHeight: 18,
                      textAlign: isArabic ? "right" : "left",
                      fontFamily: fontFamily(isArabic),
                    }}
                  >
                    {isArabic ? opt.descAr : opt.descEn}
                  </AppText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
};

export default RoutineReplacementSheet;
