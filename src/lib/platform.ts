import { Platform } from "react-native";
import { ConnectedIntegration } from "../types";

export function detectPlatform(): "ios" | "android" | "web" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

export function getAvailableIntegrations(
  platform: ReturnType<typeof detectPlatform>,
): ConnectedIntegration["id"][] {
  // What CAN be shown to the user on this platform
  const ios = [
    "apple-health",
    "apple-watch",
    "garmin",
    "whoop",
    "strava",
    "fitbit",
  ] as const;
  const android = [
    "google-fit",
    "health-connect",
    "garmin",
    "whoop",
    "strava",
    "fitbit",
  ] as const;
  const web = ["strava"] as const;
  if (platform === "ios") return [...ios];
  if (platform === "android") return [...android];
  return [...web];
}
