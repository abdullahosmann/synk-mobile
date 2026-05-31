/**
 * CoachIcon — RN port of src/components/CoachIcon.tsx.
 *
 * A draggable, self-positioning floating coach avatar (restores the web's
 * drag-to-reposition, deferred during the initial port). Drag snaps to the
 * nearest screen edge and persists {side, y} to storage; a tap opens the chat.
 *
 * Web→RN: motion drag + useAnimation → gesture-handler Pan (raced with Tap) +
 * reanimated; window.innerWidth/Height → Dimensions; localStorage → storage.ts.
 * Self-positions absolutely, so parents render it directly (no wrapper View).
 */
import React, { useMemo } from "react";
import { Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getItem, setItem } from "../lib/storage";
import { useColors } from "../theme/ThemeProvider";
import CoachAvatar from "./CoachAvatar";

const SIZE = 56;
const MARGIN = 16;
const KEY = "synk:coachIconPosition";

interface CoachIconProps {
  coachId: string;
  onPress: () => void;
}

export const CoachIcon: React.FC<CoachIconProps> = ({ coachId, onPress }) => {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: vw, height: vh } = Dimensions.get("window");

  const initial = useMemo(() => {
    let side: "left" | "right" = "right";
    let y = vh - 200;
    const stored = getItem(KEY);
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (p.side === "left" || p.side === "right") side = p.side;
        if (typeof p.y === "number") y = p.y;
      } catch {
        /* ignore */
      }
    }
    return { x: side === "left" ? MARGIN : vw - SIZE - MARGIN, y };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vw, vh]);

  const tx = useSharedValue(initial.x);
  const ty = useSharedValue(initial.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);

  const minY = insets.top + 60;
  const maxY = vh - insets.bottom - 120;

  const persist = (side: "left" | "right", y: number) => setItem(KEY, JSON.stringify({ side, y }));

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
      scale.value = withTiming(1.1, { duration: 120 });
    })
    .onUpdate((e) => {
      tx.value = startX.value + e.translationX;
      ty.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      scale.value = withTiming(1, { duration: 120 });
      const side = tx.value + SIZE / 2 < vw / 2 ? "left" : "right";
      const newX = side === "left" ? MARGIN : vw - SIZE - MARGIN;
      const newY = Math.min(Math.max(ty.value, minY), maxY);
      tx.value = withTiming(newX, { duration: 200 });
      ty.value = withTiming(newY, { duration: 200 });
      runOnJS(persist)(side, newY);
    });

  const tap = Gesture.Tap().maxDistance(8).onEnd(() => runOnJS(onPress)());
  const gesture = Gesture.Race(pan, tap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: colors.canvas,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 8,
            zIndex: 100,
          },
          animStyle,
        ]}
      >
        <CoachAvatar coachId={coachId} size={48} verified />
      </Animated.View>
    </GestureDetector>
  );
};

export default CoachIcon;
