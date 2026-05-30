/**
 * CoachIcon — RN adaptation of src/components/CoachIcon.tsx.
 * The web version is a draggable, viewport-positioned floating avatar. Here it
 * renders as a fixed floating coach-avatar button (drag-to-reposition can be
 * added in the polish pass); tapping opens the coach chat.
 */
import React from "react";
import { Pressable } from "react-native";
import { useColors } from "../theme/ThemeProvider";
import CoachAvatar from "./CoachAvatar";

interface CoachIconProps {
  coachId: string;
  onPress: () => void;
}

export const CoachIcon: React.FC<CoachIconProps> = ({ coachId, onPress }) => {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.canvas,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <CoachAvatar coachId={coachId} size={48} verified />
    </Pressable>
  );
};

export default CoachIcon;
