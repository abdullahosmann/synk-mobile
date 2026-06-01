/**
 * CoachAvatar — RN port of src/components/CoachAvatar.tsx.
 * Circular coach photo (expo-image) with grayscale tint + optional verified
 * badge; falls back to initials on a primary circle on load error.
 */
import React, { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Verified } from "lucide-react-native";
import { COACHES } from "../constants";
import { useAppContext } from "../AppContext";
import { useColors } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

interface CoachAvatarProps {
  coachId: string;
  size?: number;
  verified?: boolean;
  /** 0..1 grayscale amount (matches web filter: grayscale()). */
  grayscale?: number;
}

const CoachAvatar: React.FC<CoachAvatarProps> = ({
  coachId,
  size = 48,
  verified = false,
  grayscale = 0.3,
}) => {
  const { user } = useAppContext();
  const colors = useColors();
  const isArabic = user.language === "ar";
  const [hasError, setHasError] = useState(false);

  const coach = COACHES.find((c) => c.id === coachId);
  const initials = coach ? (isArabic ? coach.arabicName[0] : coach.name[0]) : "?";

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.07)",
      }}
    >
      <View
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 9999,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.canvasParchment,
        }}
      >
        {!hasError && coach?.image ? (
          <Image
            source={{ uri: coach.image }}
            // expo-image has no grayscale filter; approximate web's desaturated
            // "idle" coaches by dimming opacity proportional to the grayscale
            // amount (P3 — was a no-op `tintColor: undefined`).
            style={{ width: "100%", height: "100%", opacity: grayscale > 0 ? 1 - grayscale * 0.55 : 1 }}
            contentFit="cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText
              variant="body-strong"
              style={{ color: "#fff", fontSize: size * 0.45 }}
            >
              {initials}
            </AppText>
          </View>
        )}
      </View>

      {verified && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            backgroundColor: colors.primary,
            padding: 4,
            borderRadius: 9999,
            borderWidth: 2,
            borderColor: "#fff",
            transform: [{ translateX: size * 0.15 }, { translateY: size * 0.15 }],
          }}
        >
          <Verified size={size * 0.25} color="#fff" fill="#fff" />
        </View>
      )}
    </View>
  );
};

export default CoachAvatar;
