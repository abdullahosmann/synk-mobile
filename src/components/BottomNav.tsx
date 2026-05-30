/**
 * BottomNav — RN port of src/components/BottomNav.tsx.
 * Rendered as a custom tab bar for the (tabs) group. 4 tabs + center FAB.
 * Reproduces: apple-backdrop bar, lucide icons (stroke 2.5 active / 2 idle),
 * primary/ink-muted-48 colors, 10px uppercase labels, RTL ordering, raised FAB.
 */
import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { Home, Dumbbell, Users, User, Plus } from "lucide-react-native";
import { useAppContext } from "../AppContext";
import { useColors } from "../theme/ThemeProvider";
import { AppleBackdrop } from "./ui/AppleBackdrop";
import { AppText } from "./ui/Typography";

interface TabDef {
  route: string;
  icon: React.ComponentType<{ size: number; strokeWidth: number; color: string }>;
  en: string;
  ar: string;
  isActive: (path: string) => boolean;
}

const TABS: TabDef[] = [
  {
    route: "/dashboard",
    icon: Home,
    en: "Home",
    ar: "الرئيسية",
    isActive: (p) =>
      ["/dashboard", "/analytics", "/morning-checkin", "/adaptive-insights", "/plan-details"].includes(p),
  },
  {
    route: "/fitness",
    icon: Dumbbell,
    en: "Plan",
    ar: "الخطة",
    isActive: (p) =>
      ["/fitness", "/workout", "/nutrition"].includes(p) ||
      p.startsWith("/workout/") ||
      p.startsWith("/nutrition/") ||
      p.startsWith("/plan/") ||
      p.startsWith("/history") ||
      p.startsWith("/muscle-recovery") ||
      p.startsWith("/exercise/"),
  },
  {
    route: "/community",
    icon: Users,
    en: "Community",
    ar: "المجتمع",
    isActive: (p) =>
      ["/community", "/inbox", "/search", "/coach"].includes(p) ||
      p.startsWith("/challenges") ||
      p.startsWith("/circles") ||
      (p.startsWith("/profile/") && p !== "/profile"),
  },
  {
    route: "/me",
    icon: User,
    en: "Me",
    ar: "أنا",
    isActive: (p) =>
      ["/me", "/profile", "/settings", "/measurements", "/photos", "/premium"].includes(p) ||
      p.startsWith("/settings/"),
  },
];

const FabButton: React.FC<{ onPress: () => void; bg: string }> = ({
  onPress,
  bg,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: -12 }],
  }));
  return (
    <View style={{ width: 56, alignItems: "center" }}>
      <Pressable
        onPressIn={() => (scale.value = withTiming(0.95, { duration: 80 }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
        onPress={onPress}
      >
        <Animated.View
          style={[
            animStyle,
            {
              backgroundColor: bg,
              width: 56,
              height: 56,
              borderRadius: 9999,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Plus size={28} strokeWidth={2.5} color="#ffffff" />
        </Animated.View>
      </Pressable>
    </View>
  );
};

export const BottomNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAppContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";

  const ordered = isArabic ? [...TABS].reverse() : TABS;
  const left = ordered.slice(0, 2);
  const right = ordered.slice(2);

  const renderTab = (tab: TabDef) => {
    const active = tab.isActive(pathname);
    const color = active ? colors.primary : colors.inkMuted48;
    const Icon = tab.icon;
    return (
      <Pressable
        key={tab.route}
        onPress={() => router.push(tab.route as any)}
        className="flex-1 items-center justify-center"
      >
        <Icon size={22} strokeWidth={active ? 2.5 : 2} color={color} />
        <AppText
          variant="fine-print"
          style={{ color, marginTop: 4, fontSize: 10 }}
          className="uppercase tracking-[0.4px]"
        >
          {isArabic ? tab.ar : tab.en}
        </AppText>
      </Pressable>
    );
  };

  const onFab = () => {
    if (pathname === "/community") router.push("/community?compose=true" as any);
    else router.push("/fab-menu" as any);
  };

  return (
    <AppleBackdrop
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
        paddingTop: 12,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 14,
        paddingHorizontal: 8,
      }}
    >
      <View
        style={{
          flexDirection: isArabic ? "row-reverse" : "row",
          alignItems: "flex-end",
          justifyContent: "space-around",
        }}
      >
        {left.map(renderTab)}
        <FabButton onPress={onFab} bg={colors.primary} />
        {right.map(renderTab)}
      </View>
    </AppleBackdrop>
  );
};

export default BottomNav;
