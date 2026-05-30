/**
 * Lightweight RTL/i18n helpers.
 *
 * The web app relied on `dir="rtl"` cascading from <html>. React Native has no
 * cascade, so direction is applied per-component. We deliberately avoid
 * `I18nManager.forceRTL()` (which requires an app reload) and instead mirror
 * layout manually so the EN/AR toggle is seamless — exactly matching how the
 * web used per-element `flex-row-reverse` and conditional `font-arabic`.
 */
import { useAppContext } from "../AppContext";

export function useIsArabic(): boolean {
  const { user } = useAppContext();
  return user.language === "ar";
}

/** Returns the right font-family class for the active language. */
export function fontClass(isArabic: boolean, weight?: "light" | "semibold") {
  if (isArabic) {
    if (weight === "semibold") return "font-arabic-semibold";
    if (weight === "light") return "font-arabic-light";
    return "font-arabic";
  }
  if (weight === "semibold") return "font-body-semibold";
  if (weight === "light") return "font-body-light";
  return "font-body";
}

/** Row direction for a given language. */
export function rowDir(isArabic: boolean): "row" | "row-reverse" {
  return isArabic ? "row-reverse" : "row";
}

/** Text alignment for a given language. */
export function textAlign(isArabic: boolean): "left" | "right" {
  return isArabic ? "right" : "left";
}
