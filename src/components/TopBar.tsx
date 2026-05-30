/**
 * TopBar — RN port of src/components/TopBar.tsx.
 * Blurred sticky header: optional profile avatar + title, bell/settings actions.
 */
import React from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Settings } from "lucide-react-native";
import { useAppContext } from "../AppContext";
import { useToast } from "./ToastProvider";
import { useColors } from "../theme/ThemeProvider";
import { AppleBackdrop } from "./ui/AppleBackdrop";
import { AppText } from "./ui/Typography";

const PROFILE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXlCLNkX3disW4T9j8vvhRRQM4iVL9Vf-3FltInhixWg2FV_xXf2dBD9t_uBwS8588yqgDyFnN1n-n1qwJ-QmANlqUiR_w8enQfBNC8utdc-4RRwBG8dw67KZgoihINi6R37zemqJXisT8RXShbQUQNaXv-yQq7RTbubIsLD3ydhwE82YLaQeVf4HSMVGcHen0ZsN7auijGok-1Zq3jxARCF4v4w2zY1UOlW3mMMMLx1wE5oW7_dUe6dvSedM78PW2jXiPZ9uvLFE";

interface TopBarProps {
  title?: string;
  showProfile?: boolean;
  showSettings?: boolean;
  showNotifications?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  title = "SYNK",
  showProfile = true,
  showSettings = false,
  showNotifications = true,
}) => {
  const router = useRouter();
  const { user } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  return (
    <AppleBackdrop
      style={{
        paddingTop: insets.top,
        paddingBottom: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.hairline,
      }}
    >
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
          {showProfile && (
            <Pressable
              onPress={() => router.push("/me")}
              style={{ width: 40, height: 40, borderRadius: 20, overflow: "hidden", backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline }}
            >
              <Image source={{ uri: PROFILE_IMG }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
            </Pressable>
          )}
          <AppText style={{ fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold", fontSize: 21, letterSpacing: 0.231, color: colors.ink }}>
            {title === "SYNK" && isArabic ? "سينك" : title}
          </AppText>
        </View>

        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          {showNotifications && (
            <Pressable onPress={() => showToast(isArabic ? "لا توجد إشعارات جديدة" : "No new notifications", "info")} style={{ padding: 8 }}>
              <Bell size={24} color={colors.ink} />
            </Pressable>
          )}
          {showSettings && (
            <Pressable onPress={() => router.push("/settings")} style={{ padding: 8 }}>
              <Settings size={22} color={colors.ink} />
            </Pressable>
          )}
        </View>
      </View>
    </AppleBackdrop>
  );
};

export default TopBar;
