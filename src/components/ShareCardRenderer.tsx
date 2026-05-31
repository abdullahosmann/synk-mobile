/**
 * ShareCardRenderer — RN port of src/components/ShareCardRenderer.tsx.
 *
 * The dedicated 1080×1920 achievement share cards (pr / streak / perfect_week).
 * `ShareCard` is the presentational 1080×1920 view; `ShareCardRenderer` mounts
 * it off-screen and captures it to a PNG file URI via react-native-view-shot
 * (replacing the web html-to-image flow), then calls onReady(uri)/onError.
 *
 * Web→RN: html-to-image.toPng → captureRef({width:1080,height:1920}); CSS
 * gradients → expo-linear-gradient; only Inter/Cairo 300/400/600 are loaded, so
 * "black" display text uses the system font at a heavy numeric weight (EN) or
 * Cairo_600SemiBold (AR).
 */
import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { captureRef } from "react-native-view-shot";
import { CheckCircle2, Flame } from "lucide-react-native";
import { AppText } from "./ui/Typography";

const W = 1080;
const H = 1920;

export interface ShareCardPayload {
  // PR
  exerciseName?: string;
  weight?: number;
  reps?: number;
  unit?: "kg" | "lb";
  previousWeight?: number;
  previousReps?: number;
  // Streak
  streakDays?: number;
  // Perfect week
  workoutsCompleted?: number;
  weekStartDate?: Date;
}

export interface ShareCardUser {
  name: string;
  coachName?: string;
  avatarUrl?: string;
  language?: "ar" | "en";
}

export interface ShareCardRendererProps {
  type: "pr" | "streak" | "perfect_week";
  payload: ShareCardPayload;
  user: ShareCardUser;
  onReady: (uri: string) => void;
  onError: (err: any) => void;
}

/** Heavy display text: system heavy weight (EN) / Cairo semibold (AR). */
function display(isArabic: boolean, weight: "800" | "900" = "900"): { fontFamily: "Cairo_600SemiBold" } | { fontWeight: "800" | "900" } {
  return isArabic ? { fontFamily: "Cairo_600SemiBold" } : { fontWeight: weight };
}
function body(isArabic: boolean, semibold = false) {
  if (isArabic) return { fontFamily: semibold ? "Cairo_600SemiBold" : "Cairo_400Regular" } as const;
  return { fontFamily: semibold ? "Inter_600SemiBold" : "Inter_400Regular" } as const;
}

const formatDate = (isArabic: boolean, date?: Date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", { day: "numeric", month: "short" }).format(date);
};

function SynkHeader() {
  return (
    <View style={{ position: "absolute", top: 200, left: 0, right: 0, alignItems: "center" }}>
      <AppText style={{ fontSize: 64, color: "#ffffff", letterSpacing: -1, fontWeight: "900" }}>SYNK</AppText>
    </View>
  );
}

function AvatarFooter({ user, isArabic }: { user: ShareCardUser; isArabic: boolean }) {
  return (
    <>
      <View style={{ position: "absolute", top: 1400, left: 0, right: 0, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#ffffff", borderWidth: 4, borderColor: "#ffffff", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <AppText style={{ fontSize: 36, color: "#0066cc", ...display(false, "800") }}>{user.name.charAt(0).toUpperCase()}</AppText>
          )}
        </View>
        <AppText style={{ fontSize: 44, color: "#ffffff", ...body(isArabic, true) }}>{user.name}</AppText>
      </View>
      <View style={{ position: "absolute", top: 1750, left: 0, right: 0, alignItems: "center" }}>
        <AppText style={{ fontSize: 32, color: "rgba(255,255,255,0.7)", letterSpacing: 1, ...body(isArabic) }}>
          {isArabic ? "كسرها مع سنك · synk.app" : "Crushed it with Synk · synk.app"}
        </AppText>
      </View>
    </>
  );
}

export const ShareCard: React.FC<{ type: ShareCardRendererProps["type"]; payload: ShareCardPayload; user: ShareCardUser }> = ({
  type,
  payload,
  user,
}) => {
  const isArabic = user.language === "ar";

  return (
    <View style={{ width: W, height: H, overflow: "hidden", backgroundColor: "#000" }}>
      {type === "pr" && (
        <LinearGradient colors={["#0066cc", "#0f346b"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ width: W, height: H }}>
          <SynkHeader />
          <View style={{ position: "absolute", top: 500, left: 0, right: 0, alignItems: "center", paddingHorizontal: 90 }}>
            <View style={{ backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 9999 }}>
              <AppText style={{ fontSize: 64, color: "#ffffff", letterSpacing: 12, textAlign: "center", ...display(isArabic) }}>
                {isArabic ? "رقم قياسي جديد" : "NEW PR"}
              </AppText>
            </View>
            <AppText style={{ fontSize: 80, color: "#ffffff", marginTop: 80, textAlign: "center", ...display(isArabic) }}>
              {payload.exerciseName || (isArabic ? "تمرين" : "Exercise")}
            </AppText>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 32 }}>
              <AppText style={{ fontSize: 180, color: "#ffffff", fontWeight: "900", lineHeight: 180 }}>{payload.weight}</AppText>
              <AppText style={{ fontSize: 100, color: "#ffffff", fontWeight: "900", lineHeight: 180 }}> {payload.unit || "kg"}</AppText>
              <AppText style={{ fontSize: 140, color: "rgba(255,255,255,0.7)", fontWeight: "900", lineHeight: 180, paddingHorizontal: 16 }}>×</AppText>
              <AppText style={{ fontSize: 180, color: "#ffffff", fontWeight: "900", lineHeight: 180 }}>{payload.reps || 1}</AppText>
            </View>
            {payload.previousWeight !== undefined && (
              <AppText style={{ fontSize: 36, color: "rgba(255,255,255,0.7)", marginTop: 64, textAlign: "center", ...body(isArabic) }}>
                {isArabic ? `السابق: ${payload.previousWeight} ${payload.unit || "kg"}` : `Previous: ${payload.previousWeight} ${payload.unit || "kg"}`}
                {payload.previousReps ? ` × ${payload.previousReps}` : ""}
              </AppText>
            )}
          </View>
          <AvatarFooter user={user} isArabic={isArabic} />
        </LinearGradient>
      )}

      {type === "streak" && (
        <LinearGradient colors={["#ff9500", "#d97706"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ width: W, height: H }}>
          <SynkHeader />
          <View style={{ position: "absolute", top: 550, left: 0, right: 0, alignItems: "center" }}>
            <Flame size={200} fill="#ffffff" strokeWidth={0} color="#ffffff" />
            <AppText style={{ fontSize: 280, color: "#ffffff", fontWeight: "900", lineHeight: 238, marginTop: 32, letterSpacing: -4 }}>
              {payload.streakDays || 30}
            </AppText>
            <AppText style={{ fontSize: 64, color: "#ffffff", letterSpacing: 1, marginTop: 24, textAlign: "center", ...display(isArabic) }}>
              {isArabic ? "يوم متواصل" : "DAY STREAK"}
            </AppText>
            <AppText style={{ fontSize: 40, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginTop: 64, textAlign: "center", ...body(isArabic) }}>
              {isArabic ? "الاستمرارية بتكسب." : "Consistency wins."}
            </AppText>
          </View>
          <AvatarFooter user={user} isArabic={isArabic} />
        </LinearGradient>
      )}

      {type === "perfect_week" && (
        <LinearGradient colors={["#0066cc", "#34c759"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: W, height: H }}>
          <SynkHeader />
          <View style={{ position: "absolute", top: 550, left: 0, right: 0, alignItems: "center", paddingHorizontal: 48 }}>
            <View style={{ backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 40, paddingVertical: 20, borderRadius: 40 }}>
              <AppText style={{ fontSize: 72, color: "#ffffff", letterSpacing: 1, textAlign: "center", ...display(isArabic) }}>
                {isArabic ? "أسبوع كامل" : "PERFECT WEEK"}
              </AppText>
            </View>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 128, flexWrap: "wrap" }}>
              {[...Array(7)].map((_, i) => (
                <View key={i} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={64} color="#34c759" strokeWidth={3} />
                </View>
              ))}
            </View>
            <AppText style={{ fontSize: 40, color: "rgba(255,255,255,0.8)", marginTop: 80, textAlign: "center", ...body(isArabic) }}>
              {isArabic
                ? `${payload.workoutsCompleted || 0} تمرين · ${formatDate(isArabic, payload.weekStartDate)}`
                : `${payload.workoutsCompleted || 0} workouts · week of ${formatDate(isArabic, payload.weekStartDate)}`}
            </AppText>
          </View>
          <AvatarFooter user={user} isArabic={isArabic} />
        </LinearGradient>
      )}
    </View>
  );
};

export const ShareCardRenderer: React.FC<ShareCardRendererProps> = ({ type, payload, user, onReady, onError }) => {
  const ref = useRef<View>(null);
  const captured = useRef(false);
  // Keep latest callbacks without retriggering the one-shot capture.
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  // Capture once, after the off-screen card has had a frame to lay out.
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (captured.current || !ref.current) return;
      captured.current = true;
      try {
        const uri = await captureRef(ref, { format: "png", quality: 1, width: W, height: H });
        onReadyRef.current(uri);
      } catch (err) {
        onErrorRef.current(err);
      }
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rendered off-screen; still laid out so view-shot can capture it.
  return (
    <View style={{ position: "absolute", left: -100000, top: -100000 }} pointerEvents="none">
      <View ref={ref} collapsable={false}>
        <ShareCard type={type} payload={payload} user={user} />
      </View>
    </View>
  );
};

export default ShareCardRenderer;
