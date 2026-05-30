import React from "react";
import { View } from "react-native";
import { Screen } from "../../src/components/ui/Screen";
import { ScreenTitle, AppText } from "../../src/components/ui/Typography";
import { useIsArabic } from "../../src/lib/i18n";

export default function Me() {
  const isArabic = useIsArabic();
  return (
    <Screen tabBarSpacing parchment>
      <View className="px-6 pt-4 gap-2">
        <ScreenTitle>{isArabic ? "أنا" : "Me"}</ScreenTitle>
        <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48">
          {isArabic ? "تُبنى في المرحلة الثانية." : "Profile screen — ported in Phase 2."}
        </AppText>
      </View>
    </Screen>
  );
}
