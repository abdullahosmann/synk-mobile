/**
 * WorkoutShareTemplates — RN port of src/components/share-templates/
 * WorkoutShareTemplates.tsx. Five 1080×1920 workout-summary share cards
 * (Bold / Minimal / Stats / Map / Quote) + a before/after ProgressComparison.
 *
 * Each template is a presentational 1080×1920 <View>; capture them off-screen
 * with the ShareCardRenderer pattern (react-native-view-shot). Templates 1 & 4
 * use the ported BodySVG muscle map.
 *
 * Web→RN: CSS gradients → expo-linear-gradient; <img> → expo-image; font-mono →
 * Courier, font-serif → Georgia; "black" weights → system heavy (EN) / Cairo
 * (AR). toLocaleString → a manual thousands formatter (Hermes lacks Intl NF).
 */
import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BodySVG } from "../BodySVG";
import { AppText } from "../ui/Typography";

const W = 1080;
const H = 1920;

export interface ShareTemplateProps {
  workout: {
    name: string;
    muscleGroups: string[];
    durationMin: number;
    totalVolumeKg: number;
    setsCompleted: number;
    bestLift?: { exercise: string; weight: number; reps: number; unit: "kg" | "lb" };
    isPR?: boolean;
    date?: Date;
  };
  user: { name: string; avatarUrl?: string; coachName?: string };
  isArabic: boolean;
  hideNumbers: boolean;
}

const hidden = "—";
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function disp(isArabic: boolean, weight: "700" | "800" | "900" = "900") {
  return isArabic ? { fontFamily: "Cairo_600SemiBold" as const } : { fontWeight: weight };
}
function body(isArabic: boolean, semibold = false) {
  if (isArabic) return { fontFamily: semibold ? "Cairo_600SemiBold" : "Cairo_400Regular" } as const;
  return { fontFamily: semibold ? "Inter_600SemiBold" : "Inter_400Regular" } as const;
}

function Avatar({ uri, initial, size, bg, color, fontSize, square }: { uri?: string; initial: string; size: number; bg: string; color: string; fontSize: number; square?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: square ? 0 : size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {uri ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : <AppText style={{ fontSize, color, fontWeight: "800" }}>{initial}</AppText>}
    </View>
  );
}

// --------------------------------------------------------------------------
export const Template1Bold: React.FC<ShareTemplateProps> = ({ workout, user, isArabic, hideNumbers }) => (
  <LinearGradient colors={["#0066cc", "#0f346b"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ width: W, height: H, alignItems: "center", overflow: "hidden" }}>
    <View style={{ width: 600, height: 700, marginTop: 150 }}>
      <BodySVG view="front" highlightedMuscles={workout.muscleGroups} />
    </View>
    <View style={{ marginTop: 32, paddingHorizontal: 100, width: "100%", alignItems: "center" }}>
      <AppText style={{ fontSize: 96, color: "#ffffff", textTransform: isArabic ? "none" : "uppercase", letterSpacing: -1, textAlign: "center", ...disp(isArabic) }}>{workout.name}</AppText>
      {workout.isPR && workout.bestLift && (
        <View style={{ marginTop: 32, backgroundColor: "rgba(245,158,11,0.2)", borderWidth: 1, borderColor: "rgba(245,158,11,0.4)", paddingHorizontal: 32, paddingVertical: 16, borderRadius: 9999 }}>
          <AppText style={{ fontSize: 32, color: "#fbbf24", letterSpacing: 2, textTransform: isArabic ? "none" : "uppercase", ...disp(isArabic, "700") }}>
            🏆 {isArabic ? "أعلى وزن قياسي" : "PR"} · {workout.bestLift.exercise} · {hideNumbers ? hidden : `${workout.bestLift.weight}${workout.bestLift.unit} × ${workout.bestLift.reps}`}
          </AppText>
        </View>
      )}
    </View>
    <View style={{ position: "absolute", top: 1300, width: "100%", flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "center", alignItems: "center", gap: 60 }}>
      {[
        { label: isArabic ? "الوقت" : "Duration", value: hideNumbers ? hidden : `${workout.durationMin}${isArabic ? "د" : "m"}` },
        { label: isArabic ? "الحجم" : "Volume", value: hideNumbers ? hidden : `${fmt(workout.totalVolumeKg)}${isArabic ? "كجم" : "kg"}` },
        { label: isArabic ? "المجموعات" : "Sets", value: hideNumbers ? hidden : `${workout.setsCompleted}` },
      ].map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <View style={{ width: 2, height: 120, backgroundColor: "rgba(255,255,255,0.3)" }} />}
          <View style={{ alignItems: "center" }}>
            <AppText style={{ fontSize: 28, color: "rgba(255,255,255,0.7)", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 2, marginBottom: 16, ...body(isArabic) }}>{s.label}</AppText>
            <AppText style={{ fontSize: 72, color: "#ffffff", ...disp(isArabic, "700") }}>{s.value}</AppText>
          </View>
        </React.Fragment>
      ))}
    </View>
    <View style={{ position: "absolute", bottom: 100, width: "100%", flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 32 }}>
      <View style={{ borderWidth: 4, borderColor: "#ffffff", borderRadius: 52 }}>
        <Avatar uri={user.avatarUrl} initial={user.name[0]?.toUpperCase() || "?"} size={96} bg="rgba(255,255,255,0.2)" color="#ffffff" fontSize={40} />
      </View>
      <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
        <AppText style={{ fontSize: 44, color: "#ffffff", marginBottom: 4, ...body(isArabic, true) }}>{user.name}</AppText>
        <AppText style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", ...body(isArabic) }}>{isArabic ? "مع سنك · synk.app" : "with Synk · synk.app"}</AppText>
      </View>
    </View>
  </LinearGradient>
);

// --------------------------------------------------------------------------
export const Template2Minimal: React.FC<ShareTemplateProps> = ({ workout, user, isArabic, hideNumbers }) => (
  <View style={{ width: W, height: H, backgroundColor: "#f5f5f7", paddingHorizontal: 80, overflow: "hidden" }}>
    <AppText style={{ marginTop: 120, width: "100%", textAlign: "center", letterSpacing: 24, fontSize: 48, color: "#000", fontWeight: "900" }}>SYNK</AppText>
    <View style={{ marginTop: 400, width: "100%", alignItems: "center" }}>
      <AppText style={{ fontSize: 88, color: "#000", textAlign: "center", ...disp(isArabic) }}>{workout.name}</AppText>
      <View style={{ width: "100%", height: 4, backgroundColor: "#0066cc", marginTop: 80 }} />
      <View style={{ marginTop: 100, width: "100%", flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", paddingHorizontal: 60 }}>
        {[
          { label: isArabic ? "الوقت" : "Duration", value: hideNumbers ? hidden : `${workout.durationMin}` },
          { label: isArabic ? "مجموع الرفع" : "Volume", value: hideNumbers ? hidden : fmt(workout.totalVolumeKg) },
          { label: isArabic ? "المجموعات" : "Sets", value: hideNumbers ? hidden : `${workout.setsCompleted}` },
        ].map((s) => (
          <View key={s.label} style={{ alignItems: "center" }}>
            <AppText style={{ fontSize: 32, color: "rgba(0,0,0,0.5)", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 2, marginBottom: 16, ...body(isArabic) }}>{s.label}</AppText>
            <AppText style={{ fontSize: 80, color: "#000", letterSpacing: -2, ...disp(isArabic, "700") }}>{s.value}</AppText>
          </View>
        ))}
      </View>
    </View>
    <View style={{ position: "absolute", bottom: 400, width: W, left: 0, flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "center", flexWrap: "wrap", gap: 16, paddingHorizontal: 100 }}>
      {workout.muscleGroups.map((m) => (
        <View key={m} style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999, borderWidth: 2, borderColor: "#0066cc" }}>
          <AppText style={{ color: "#0066cc", fontSize: 24, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, ...disp(isArabic, "700") }}>{m.replace("_", " ")}</AppText>
        </View>
      ))}
    </View>
    <View style={{ position: "absolute", bottom: 100, width: W, left: 0, flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "center", alignItems: "center", gap: 24 }}>
      <Avatar uri={user.avatarUrl} initial={user.name[0]?.toUpperCase() || "?"} size={80} bg="rgba(0,0,0,0.1)" color="#000" fontSize={32} />
      <AppText style={{ fontSize: 36, color: "#000", ...body(isArabic, true) }}>{user.name}</AppText>
    </View>
  </View>
);

// --------------------------------------------------------------------------
export const Template3Stats: React.FC<ShareTemplateProps> = ({ workout, user, isArabic, hideNumbers }) => {
  const cell = (label: string, big: React.ReactNode) => (
    <View style={{ width: (W - 160 - 40) / 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", padding: 60 }}>
      <AppText style={{ fontSize: 28, color: "#0066cc", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 2, marginBottom: 20, ...body(isArabic) }}>{label}</AppText>
      {big}
    </View>
  );
  const dateStr = (workout.date || new Date()).toISOString().split("T")[0];
  return (
    <View style={{ width: W, height: H, backgroundColor: "#0F1115", padding: 80, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 24, marginBottom: 150 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#0066cc" }} />
        <AppText style={{ fontSize: 40, color: "#0066cc", textTransform: "uppercase", letterSpacing: 8, fontFamily: "Courier", fontWeight: "700" }}>SYNK_TERMINAL</AppText>
      </View>
      <AppText style={{ fontSize: 72, color: "#fff", marginBottom: 120, textTransform: isArabic ? "none" : "uppercase", ...disp(isArabic, "700") }}>{workout.name}</AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 40 }}>
        {cell(isArabic ? "الوقت" : "Duration", <AppText style={{ fontSize: 96, color: "#fff", fontFamily: "Courier" }}>{hideNumbers ? hidden : workout.durationMin}<AppText style={{ fontSize: 40, color: "rgba(255,255,255,0.5)" }}>{isArabic ? " د" : "m"}</AppText></AppText>)}
        {cell(isArabic ? "الحجم" : "Volume", <AppText style={{ fontSize: 96, color: "#fff", fontFamily: "Courier" }}>{hideNumbers ? hidden : fmt(workout.totalVolumeKg)}<AppText style={{ fontSize: 40, color: "rgba(255,255,255,0.5)" }}>{isArabic ? " كجم" : "kg"}</AppText></AppText>)}
        {cell(isArabic ? "المجموعات" : "Sets", <AppText style={{ fontSize: 96, color: "#fff", fontFamily: "Courier" }}>{hideNumbers ? hidden : workout.setsCompleted}</AppText>)}
        {cell(
          isArabic ? "أعلى رفع" : "Best Lift",
          <>
            <AppText numberOfLines={1} style={{ fontSize: 56, color: "#fff", marginBottom: 4, ...disp(isArabic, "700") }}>{workout.bestLift ? workout.bestLift.exercise : "—"}</AppText>
            {workout.bestLift && (
              <AppText style={{ fontSize: 64, color: "#fff", fontFamily: "Courier" }}>{hideNumbers ? hidden : workout.bestLift.weight}<AppText style={{ fontSize: 40, color: "rgba(255,255,255,0.5)" }}>{workout.bestLift.unit}</AppText></AppText>
            )}
          </>,
        )}
      </View>
      <View style={{ position: "absolute", bottom: 100, left: 80, flexDirection: "row", alignItems: "center", gap: 24 }}>
        <Avatar uri={user.avatarUrl} initial={user.name[0]?.toUpperCase() || "?"} size={80} bg="rgba(255,255,255,0.1)" color="#fff" fontSize={32} square />
        <AppText style={{ fontSize: 36, color: "rgba(255,255,255,0.8)", fontFamily: "Courier" }}>{user.name} // {dateStr}</AppText>
      </View>
    </View>
  );
};

// --------------------------------------------------------------------------
export const Template4Map: React.FC<ShareTemplateProps> = ({ workout, user, isArabic, hideNumbers }) => (
  <View style={{ width: W, height: H, backgroundColor: "#fff", overflow: "hidden" }}>
    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", backgroundColor: "#000", paddingHorizontal: 80, paddingVertical: 60, alignItems: "center", justifyContent: "space-between" }}>
      <AppText numberOfLines={1} style={{ fontSize: 64, color: "#fff", maxWidth: 700, ...disp(isArabic, "700") }}>{workout.name}</AppText>
      <AppText style={{ fontSize: 48, color: "#fff", letterSpacing: 2, fontWeight: "900" }}>SYNK</AppText>
    </View>
    <View style={{ flex: 1 }}>
      <View style={{ position: "absolute", top: 50, left: 0, width: W, height: 1400, alignItems: "center", opacity: 0.9 }}>
        <View style={{ width: 600, height: 1400 }}>
          <BodySVG view="front" highlightedMuscles={workout.muscleGroups} />
        </View>
      </View>
      <View style={{ position: "absolute", top: 100, left: 80, width: 400, gap: 60 }}>
        {workout.muscleGroups.slice(0, 4).map((m, i) => (
          <View key={i}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <View style={{ width: 20, height: 4, backgroundColor: "#0066cc" }} />
              <AppText style={{ fontSize: 40, color: "#000", textTransform: isArabic ? "none" : "uppercase", ...disp(isArabic, "700") }}>{m.replace("_", " ")}</AppText>
            </View>
            <AppText style={{ fontSize: 28, color: "rgba(0,0,0,0.6)", paddingLeft: 36, ...body(isArabic, true) }}>{hideNumbers ? hidden : "Targeted sets"}</AppText>
          </View>
        ))}
      </View>
    </View>
    <View style={{ width: "100%", padding: 80, backgroundColor: "#f9fafb", flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.1)" }}>
      <AppText style={{ fontSize: 40, color: "#000", ...disp(isArabic, "700") }}>{user.name}</AppText>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 40 }}>
        <View style={{ alignItems: "center" }}>
          <AppText style={{ fontSize: 24, color: "rgba(0,0,0,0.5)", textTransform: isArabic ? "none" : "uppercase", marginBottom: 8, ...body(isArabic) }}>{isArabic ? "الحجم" : "Vol"}</AppText>
          <AppText style={{ fontSize: 48, color: "#000", ...disp(isArabic, "700") }}>{hideNumbers ? hidden : fmt(workout.totalVolumeKg)}</AppText>
        </View>
        <View style={{ alignItems: "center" }}>
          <AppText style={{ fontSize: 24, color: "rgba(0,0,0,0.5)", textTransform: isArabic ? "none" : "uppercase", marginBottom: 8, ...body(isArabic) }}>{isArabic ? "الوقت" : "Time"}</AppText>
          <AppText style={{ fontSize: 48, color: "#000", ...disp(isArabic, "700") }}>{hideNumbers ? hidden : workout.durationMin}</AppText>
        </View>
      </View>
    </View>
  </View>
);

// --------------------------------------------------------------------------
const quotesEn = [
  "Showing up is the whole game.",
  "Discipline beats motivation. Always.",
  "One good session at a time.",
  "Your future self is thanking you.",
  "Keep showing up. The results will follow.",
  "No zero days. Just consistency.",
  "Embrace the discomfort. That's growth.",
  "You are stronger than your excuses.",
];
const quotesAr = [
  "الحضور هو اللعبة كلها.",
  "الانضباط بيكسب الحماس. دايمًا.",
  "تمرين كويس واحد في كل مرة.",
  "نفسك في المستقبل بتشكرك دلوقتي.",
  "استمر في الحضور. النتايج هتيجي.",
  "مفيش أيام صفرية. بس استمرارية.",
  "تقبل التعب. ده هو النمو.",
  "أنت أقوى من أعذارك.",
];

export const Template5Quote: React.FC<ShareTemplateProps> = ({ workout, user, isArabic }) => {
  const seed = workout.date ? workout.date.getDate() : new Date().getDate();
  const quote = isArabic ? quotesAr[seed % quotesAr.length] : quotesEn[seed % quotesEn.length];
  const dateStr = (workout.date || new Date()).toISOString().split("T")[0];
  return (
    <LinearGradient colors={["#1E3A8A", "#9333EA", "#F97316"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={{ width: W, height: H, padding: 100, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <AppText style={{ position: "absolute", top: 360, left: 100, fontSize: 200, lineHeight: 200, color: "rgba(255,255,255,0.3)", fontFamily: "Georgia" }}>“</AppText>
      <AppText style={{ fontSize: 72, fontStyle: "italic", color: "#fff", fontFamily: isArabic ? "Cairo_400Regular" : "Georgia", textAlign: "center", marginHorizontal: 40, marginBottom: 150, lineHeight: 88 }}>{quote}</AppText>
      <AppText style={{ position: "absolute", bottom: 560, right: 100, fontSize: 200, lineHeight: 200, color: "rgba(255,255,255,0.3)", fontFamily: "Georgia", transform: [{ rotate: "180deg" }] }}>“</AppText>
      <View style={{ position: "absolute", bottom: 200, width: "100%", alignItems: "center" }}>
        <AppText style={{ fontSize: 36, color: "#fff", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 2, marginBottom: 24, textAlign: "center", ...disp(isArabic, "700") }}>{workout.name} · {dateStr}</AppText>
        <View style={{ width: 120, height: 4, backgroundColor: "rgba(255,255,255,0.4)", marginBottom: 40 }} />
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 24 }}>
          <Avatar initial={user.coachName ? user.coachName[0]?.toUpperCase() : "C"} size={80} bg="rgba(255,255,255,0.2)" color="#fff" fontSize={32} />
          <AppText style={{ fontSize: 40, color: "rgba(255,255,255,0.9)", ...body(isArabic) }}>— {user.coachName || "SYNK Coach"}</AppText>
        </View>
      </View>
    </LinearGradient>
  );
};

// --------------------------------------------------------------------------
export interface ProgressComparisonProps {
  user: any;
  isArabic: boolean;
  setA: any;
  setB: any;
  urls: Record<string, string>;
  hideNumbers?: boolean;
}

export const TemplateProgressComparison: React.FC<ProgressComparisonProps> = ({ user, isArabic, setA, setB, urls, hideNumbers }) => {
  const pA = setA.photos.find((p: any) => p.angle === "front") || setA.photos[0];
  const pB = setB.photos.find((p: any) => p.angle === "front") || setB.photos[0];
  const dA = new Date(setA.date).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  const dB = new Date(setB.date).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });

  const toUnit = (kg: number) => (user.weightUnit === "lb" ? kg * 2.20462 : kg);
  const delta = setA.weight && setB.weight ? toUnit(setB.weight) - toUnit(setA.weight) : 0;

  const photoTile = (photo: any, label: string, date: string, accent: boolean) => (
    <View style={{ flex: 1, backgroundColor: "#1A1A1A", borderRadius: 32, overflow: "hidden", borderWidth: 4, borderColor: accent ? "#0066cc" : "rgba(255,255,255,0.05)" }}>
      {photo && urls[photo.photoId] ? <Image source={{ uri: urls[photo.photoId] }} style={{ width: "100%", height: "100%" }} contentFit="cover" /> : null}
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 150, padding: 40 }}>
        <AppText style={{ fontSize: 48, color: "#fff", marginBottom: 8, ...disp(isArabic, "700") }}>{label}</AppText>
        <AppText style={{ fontSize: 32, color: "rgba(255,255,255,0.7)", ...body(isArabic, true) }}>{date}</AppText>
      </LinearGradient>
    </View>
  );

  return (
    <View style={{ width: W, height: H, backgroundColor: "#000", paddingTop: 150, paddingHorizontal: 80, overflow: "hidden" }}>
      <View style={{ alignItems: "center", marginBottom: 60 }}>
        <AppText style={{ fontSize: 72, color: "#fff", textTransform: "uppercase", letterSpacing: 2, marginBottom: 4, ...disp(isArabic, "700") }}>{isArabic ? "صناعة بطل" : "BUILDING GREATNESS"}</AppText>
        <AppText style={{ fontSize: 36, color: "rgba(255,255,255,0.5)", ...body(isArabic) }}>{user.name}</AppText>
      </View>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 16, flex: 1, marginBottom: 100 }}>
        {photoTile(pA, isArabic ? "قبل" : "BEFORE", dA, false)}
        {photoTile(pB, isArabic ? "بعد" : "AFTER", dB, true)}
      </View>
      {setA.weight && setB.weight && !hideNumbers && (
        <View style={{ position: "absolute", bottom: 200, alignSelf: "center", backgroundColor: "#fff", paddingHorizontal: 80, paddingVertical: 40, borderRadius: 40, alignItems: "center" }}>
          <AppText style={{ fontSize: 28, color: "rgba(0,0,0,0.4)", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 2, marginBottom: 8, ...disp(isArabic, "700") }}>{isArabic ? "تغير الوزن" : "WEIGHT DELTA"}</AppText>
          <AppText style={{ fontSize: 64, color: delta < 0 ? "#34c759" : "#0066cc", ...disp(isArabic, "700") }}>
            {delta > 0 ? "+" : ""}{delta.toFixed(1)} {user.weightUnit || "kg"}
          </AppText>
        </View>
      )}
      <AppText style={{ position: "absolute", bottom: 80, width: W, left: 0, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 24, letterSpacing: 8, fontWeight: "700" }}>S Y N K</AppText>
    </View>
  );
};
