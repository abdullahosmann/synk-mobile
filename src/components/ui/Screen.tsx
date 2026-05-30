/**
 * Screen — standard page container: canvas background + top safe-area padding.
 * Bottom padding leaves room for the floating BottomNav on tab screens.
 */
import React from "react";
import { ScrollView, View, ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "../../lib/cn";

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  /** parchment uses canvas-parchment bg (onboarding); default uses canvas. */
  parchment?: boolean;
  /** Leave space for the floating tab bar. */
  tabBarSpacing?: boolean;
  className?: string;
  contentClassName?: string;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  parchment = false,
  tabBarSpacing = false,
  className,
  contentClassName,
  ...rest
}) => {
  const insets = useSafeAreaInsets();
  const bg = parchment
    ? "bg-canvas-parchment dark:bg-canvas-dark"
    : "bg-canvas dark:bg-canvas-dark";
  const bottomPad = tabBarSpacing ? 96 + insets.bottom : insets.bottom;

  if (scroll) {
    return (
      <View className={cn("flex-1", bg, className)} {...rest}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottomPad }}
          className={contentClassName}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      className={cn("flex-1", bg, className)}
      style={{ paddingTop: insets.top, paddingBottom: bottomPad }}
      {...rest}
    >
      {children}
    </View>
  );
};
