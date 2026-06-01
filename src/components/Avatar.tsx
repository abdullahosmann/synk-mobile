/**
 * Avatar — RN port of src/components/Avatar.tsx.
 * Photo (expo-image) or initials on a primary circle, optional ring.
 */
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { useColors } from "../theme/ThemeProvider";
import { AppText } from "./ui/Typography";

interface AvatarProps {
  initials: string;
  photoUrl?: string | null;
  size?: number;
  ring?: boolean;
}

const fontForSize = (size: number) => {
  if (size <= 28) return 11;
  if (size <= 36) return 13;
  if (size <= 44) return 14;
  if (size <= 56) return 16;
  if (size <= 72) return 20;
  return 28;
};

const Avatar: React.FC<AvatarProps> = ({
  initials,
  photoUrl,
  size = 40,
  ring = false,
}) => {
  const colors = useColors();
  const [hasError, setHasError] = useState(false);
  // reset the error flag if the URL changes (e.g. user updates their photo)
  useEffect(() => setHasError(false), [photoUrl]);
  const ringStyle = ring
    ? { borderWidth: 2, borderColor: "rgba(0,102,204,0.2)" }
    : {};

  if (photoUrl && !hasError) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[
          { width: size, height: size, borderRadius: 9999, backgroundColor: colors.canvasParchment },
          ringStyle,
        ]}
        contentFit="cover"
        transition={150}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 9999,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        ringStyle,
      ]}
    >
      <AppText
        variant="body-strong"
        style={{ color: "#fff", fontSize: fontForSize(size) }}
      >
        {initials}
      </AppText>
    </View>
  );
};

export default Avatar;
