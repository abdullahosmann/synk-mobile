/**
 * Permission recovery helper (audit M6). When a permission is denied, a
 * transient toast dead-ends the user — every subsequent tap just re-fires the
 * toast with no way forward. Instead show a persistent native alert that
 * explains why the permission is needed and offers an "Open Settings" CTA
 * (Linking.openSettings) so the user can actually recover.
 */
import { Alert, Linking } from "react-native";

type Feature = "camera" | "photos" | "notifications";

const LABELS: Record<Feature, { en: string; ar: string }> = {
  camera: { en: "Camera access", ar: "الوصول للكاميرا" },
  photos: { en: "Photo access", ar: "الوصول للصور" },
  notifications: { en: "Notifications", ar: "التنبيهات" },
};

export function showPermissionDeniedAlert(feature: Feature, isArabic: boolean) {
  const label = LABELS[feature];
  Alert.alert(
    isArabic ? "الإذن مطلوب" : "Permission needed",
    isArabic
      ? `فعّل ${label.ar} من إعدادات الجهاز عشان تقدر تستخدم الميزة دي.`
      : `Enable ${label.en} in Settings to use this feature.`,
    [
      { text: isArabic ? "مش دلوقتي" : "Not now", style: "cancel" },
      { text: isArabic ? "فتح الإعدادات" : "Open Settings", onPress: () => Linking.openSettings() },
    ],
  );
}
