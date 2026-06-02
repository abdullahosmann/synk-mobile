/**
 * LanguageToggle — RN port of src/components/LanguageToggle.tsx.
 * Pill + segmented variants. Sets user.language (persisted) + synk:language.
 * Per-component RTL — no document.dir (handled across components via useIsArabic).
 */
import React from "react";
import { Pressable, View } from "react-native";
import { useAppContext } from "../AppContext";
import { setItem, KEY_LANGUAGE } from "../lib/storage";
import { AppText } from "./ui/Typography";

interface LanguageToggleProps {
  variant?: "pill" | "segmented";
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = "pill",
}) => {
  const { user, setUser } = useAppContext();

  const handleToggle = (lang: "en" | "ar") => {
    if (user.language === lang) return;
    setUser({ ...user, language: lang });
    setItem(KEY_LANGUAGE, lang);
  };

  if (variant === "segmented") {
    return (
      <View className="bg-canvas-parchment dark:bg-canvas-parchment-dark p-[4px] rounded-lg border border-black/[0.07] dark:border-hairline-dark flex-row items-center w-full max-w-[280px]">
        {(["en", "ar"] as const).map((lang) => {
          const active = user.language === lang;
          return (
            <Pressable
              key={lang}
              onPress={() => handleToggle(lang)}
              className={`flex-1 h-10 rounded-md items-center justify-center ${
                active ? "bg-white dark:bg-surface-tile-2 border border-black/[0.07] dark:border-hairline-dark" : ""
              }`}
            >
              <AppText
                variant="caption-strong"
                className={active ? "text-ink dark:text-ink-dark" : "text-ink-muted-48 dark:text-ink-dark-muted-48"}
              >
                {lang === "en" ? "English" : "العربية"}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View className="bg-canvas-parchment dark:bg-canvas-parchment-dark p-1 rounded-pill flex-row gap-1 border border-black/5 dark:border-hairline-dark">
      {(["en", "ar"] as const).map((lang) => {
        const active = user.language === lang;
        return (
          <Pressable
            key={lang}
            onPress={() => handleToggle(lang)}
            className={`px-4 py-1.5 rounded-pill ${active ? "bg-canvas dark:bg-surface-tile-2" : ""}`}
          >
            <AppText
              variant="fine-print"
              className={`uppercase ${active ? "text-ink dark:text-ink-dark" : "text-ink-muted-48 dark:text-ink-dark-muted-48"}`}
              style={{ fontSize: 12, fontWeight: "600" }}
            >
              {lang === "en" ? "EN" : "AR"}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

export default LanguageToggle;
