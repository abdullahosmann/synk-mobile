/**
 * BottomSheet — RN port of src/components/BottomSheet.tsx.
 *
 * Web behaviour reproduced 1:1:
 *  - spring in from bottom (damping 30, stiffness 350)
 *  - backdrop fades in/out (bg-black/40)
 *  - drag-to-dismiss when dragged > 120px
 *  - localized "Done" / "تم" action
 *  - rounded-t-[32px], drag handle, safe-area-aware bottom padding
 *  - max height 85% of screen, scrollable content
 */
import React, { useCallback, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "../AppContext";
import { useColors } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  doneLabel?: string;
  children: React.ReactNode;
}

const SPRING = { damping: 30, stiffness: 350 } as const;
const DISMISS_THRESHOLD = 120;

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  doneLabel,
  children,
}) => {
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const isArabic = user.language === "ar";

  const defaultDoneLabel = isArabic ? "تم" : "Done";
  const displayDoneLabel = doneLabel || defaultDoneLabel;

  // translateY: 0 = fully open, sheetHeight = fully off-screen.
  const translateY = useSharedValue(screenH);
  const [mounted, setMounted] = React.useState(isOpen);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

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

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, screenH],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(
          screenH,
          { duration: 200 },
          (finished) => {
            if (finished) runOnJS(close)();
          },
        );
      } else {
        translateY.value = withSpring(0, SPRING);
      }
    });

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} onRequestClose={close} animationType="none">
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }]}
          onPress={close}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: screenH * 0.85,
            backgroundColor: colors.canvas,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 32,
            paddingTop: 40,
            paddingBottom: insets.bottom + 48,
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle (gesture target) */}
        <GestureDetector gesture={pan}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 56 }}>
            <View
              style={{
                position: "absolute",
                top: 12,
                alignSelf: "center",
                width: 40,
                height: 4,
                borderRadius: 9999,
                backgroundColor: isDarkRgba(colors.ink),
              }}
            />
          </View>
        </GestureDetector>

        {/* Header */}
        <View
          style={{
            flexDirection: isArabic ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <AppText
            variant="screen-title"
            style={{ textAlign: isArabic ? "right" : "left", flex: 1 }}
          >
            {title}
          </AppText>
          <Pressable onPress={close} hitSlop={8}>
            <AppText
              variant="title"
              className="text-primary dark:text-primary-dark"
            >
              {displayDoneLabel}
            </AppText>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </Animated.View>
    </Modal>
  );
};

// The web handle was bg-ink/10 — a 10% ink tint. Approximate per theme.
function isDarkRgba(ink: string): string {
  // ink is #1d1d1f (light) or #F5F7FA (dark); render at ~10% opacity.
  if (ink.startsWith("#")) {
    const r = parseInt(ink.slice(1, 3), 16);
    const g = parseInt(ink.slice(3, 5), 16);
    const b = parseInt(ink.slice(5, 7), 16);
    return `rgba(${r},${g},${b},0.10)`;
  }
  return "rgba(0,0,0,0.10)";
}

export default BottomSheet;
