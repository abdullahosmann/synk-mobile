/**
 * TopBar — RN port of src/components/TopBar.tsx.
 * Blurred sticky header: optional profile avatar + title, bell/settings actions.
 */
import React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Settings } from "lucide-react-native";
import { useAppContext } from "../AppContext";
import { useToast } from "./ToastProvider";
import { useColors } from "../theme/ThemeProvider";
import { AppleBackdrop } from "./ui/AppleBackdrop";
import Avatar from "./Avatar";
import { AppText } from "./ui/Typography";

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
              accessibilityRole="button"
              accessibilityLabel={isArabic ? "الملف الشخصي" : "Profile"}
            >
              <Avatar
                initials={(user?.name || (isArabic ? "م" : "U")).trim().split(/\s+/).map((n) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "?"}
                photoUrl={user?.avatarUrl}
                size={40}
              />
            </Pressable>
          )}
          <AppText style={{ fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold", fontSize: 21, letterSpacing: 0.231, color: colors.ink }}>
            {title === "SYNK" && isArabic ? "سينك" : title}
          </AppText>
        </View>

        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
          {showNotifications && (
            <Pressable onPress={() => showToast(isArabic ? "لا توجد إشعارات جديدة" : "No new notifications", "info")} accessibilityRole="button" accessibilityLabel={isArabic ? "الإشعارات" : "Notifications"} style={{ padding: 8 }}>
              <Bell size={24} color={colors.ink} />
            </Pressable>
          )}
          {showSettings && (
            <Pressable onPress={() => router.push("/settings")} accessibilityRole="button" accessibilityLabel={isArabic ? "الإعدادات" : "Settings"} style={{ padding: 8 }}>
              <Settings size={22} color={colors.ink} />
            </Pressable>
          )}
        </View>
      </View>
    </AppleBackdrop>
  );
};

export default TopBar;
