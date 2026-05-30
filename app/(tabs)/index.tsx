/**
 * Phase 1 verification screen.
 * Exercises: design tokens, typography presets, Btn variants, Card, InputPill,
 * theme toggle, language/RTL toggle, and the BottomSheet (drag-to-dismiss).
 * This is a scaffold harness — real Dashboard lands in Phase 2.
 */
import React, { useState } from "react";
import { View } from "react-native";
import { Moon, Sun, Sparkles } from "lucide-react-native";
import { Screen } from "../../src/components/ui/Screen";
import {
  AppText,
  ScreenTitle,
  SectionTitle,
  StatValue,
} from "../../src/components/ui/Typography";
import { Btn } from "../../src/components/ui/Btn";
import { Card } from "../../src/components/ui/Card";
import { InputPill } from "../../src/components/ui/Input";
import { LanguageToggle } from "../../src/components/LanguageToggle";
import BottomSheet from "../../src/components/BottomSheet";
import { useTheme, useColors } from "../../src/theme/ThemeProvider";
import { useToast } from "../../src/components/ToastProvider";
import { useIsArabic } from "../../src/lib/i18n";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const colors = useColors();
  const { showToast } = useToast();
  const isArabic = useIsArabic();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <Screen scroll tabBarSpacing parchment>
      <View className="px-6 pt-4 gap-5">
        <View
          style={{ flexDirection: isArabic ? "row-reverse" : "row" }}
          className="items-center justify-between"
        >
          <ScreenTitle>{isArabic ? "نظام التصميم" : "Design System"}</ScreenTitle>
          <Btn variant="circle" onPress={toggleTheme}>
            {theme === "dark" ? (
              <Sun size={20} color={colors.ink} />
            ) : (
              <Moon size={20} color={colors.ink} />
            )}
          </Btn>
        </View>

        <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48">
          {isArabic
            ? "هذه شاشة التحقق من المرحلة الأولى."
            : "Phase 1 verification harness for the SYNK → React Native port."}
        </AppText>

        {/* Language / RTL toggle */}
        <Card className="gap-3">
          <SectionTitle>{isArabic ? "اللغة" : "Language & RTL"}</SectionTitle>
          <LanguageToggle variant="segmented" />
        </Card>

        {/* Typography scale */}
        <Card className="gap-2">
          <SectionTitle>{isArabic ? "الخطوط" : "Typography"}</SectionTitle>
          <ScreenTitle>Screen Title 28</ScreenTitle>
          <SectionTitle>Section Title 22</SectionTitle>
          <AppText variant="title">Title 17</AppText>
          <AppText variant="body">Body 15 — the quick brown fox.</AppText>
          <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48">
            Caption 13 — muted secondary text.
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
            <StatValue>1,240</StatValue>
            <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48">
              kcal
            </AppText>
          </View>
        </Card>

        {/* Buttons */}
        <Card className="gap-3">
          <SectionTitle>{isArabic ? "الأزرار" : "Buttons"}</SectionTitle>
          <Btn variant="primary" fullWidth label={isArabic ? "ابدأ" : "Primary"} onPress={() => showToast(isArabic ? "تم!" : "Primary pressed", "success")} />
          <Btn variant="secondary" fullWidth label="Secondary" onPress={() => showToast("Secondary", "info")} />
          <Btn variant="ghost" fullWidth label="Ghost" onPress={() => showToast("Ghost")} />
          <Btn variant="utility-dark" fullWidth label="Utility Dark" onPress={() => showToast("Utility", "default")} />
          <Btn variant="pearl" fullWidth label="Pearl" onPress={() => showToast("Pearl")} />
        </Card>

        {/* Input */}
        <Card className="gap-3">
          <SectionTitle>{isArabic ? "الإدخال" : "Input"}</SectionTitle>
          <InputPill placeholder={isArabic ? "اكتب هنا..." : "Type here..."} />
        </Card>

        {/* Bottom sheet trigger */}
        <Btn
          variant="primary"
          fullWidth
          onPress={() => setSheetOpen(true)}
        >
          <Sparkles size={18} color="#fff" />
          <AppText variant="body-strong" style={{ color: "#fff" }}>
            {isArabic ? "افتح الورقة السفلية" : "Open Bottom Sheet"}
          </AppText>
        </Btn>
      </View>

      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={isArabic ? "الورقة السفلية" : "Bottom Sheet"}
      >
        <View className="gap-3">
          <AppText variant="body" className="text-ink-muted-80 dark:text-ink-dark-muted-80">
            {isArabic
              ? "اسحب لأسفل لإغلاق هذه الورقة، أو اضغط تم."
              : "Drag down past 120px to dismiss, or tap Done. Spring physics match the web (damping 30, stiffness 350)."}
          </AppText>
          <Card className="gap-2">
            <AppText variant="body-strong">{isArabic ? "بطاقة داخل الورقة" : "A card inside the sheet"}</AppText>
            <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48">
              Safe-area aware bottom padding included.
            </AppText>
          </Card>
          <Btn variant="primary" fullWidth label={isArabic ? "تم" : "Looks good"} onPress={() => setSheetOpen(false)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}
