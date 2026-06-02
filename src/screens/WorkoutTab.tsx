/**
 * WorkoutTab — RN port of the WORKOUT content from src/screens/main/Workout.tsx.
 * Rendered inside the Fitness tab's WORKOUT segment. Week strip + today's
 * workout card (rest-day Active Recovery / active-day hero) + custom routines.
 */
import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Coffee, Play, Dumbbell, ChevronRight, Plus, Download } from "lucide-react-native";
import { useAppContext } from "../AppContext";
import { getWorkoutForDate } from "../lib/workoutSelection";
import { useColors, useTheme } from "../theme/ThemeProvider";
import { withAlpha } from "../theme/tint";
import { AppText, SectionTitle } from "../components/ui/Typography";
import { Btn } from "../components/ui/Btn";
import DateNavigator from "../components/DateNavigator";

export default function WorkoutTab() {
  const router = useRouter();
  const { user, selectedDate, setSelectedDate } = useAppContext();
  const colors = useColors();
  const softFill = useTheme().theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const isArabic = user.language === "ar";

  const todayZero = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const isTodaySelected = selectedDate.getTime() === todayZero.getTime();

  const todaysWorkout = getWorkoutForDate(user, selectedDate);
  const isRestDay = isTodaySelected && todaysWorkout.isRestDay;

  const cardStyle = { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14 };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 160 }}>
      {/* Date navigator (shared with the Nutrition page — audit F5) */}
      <View style={{ marginBottom: 24 }}>
        <DateNavigator date={selectedDate} onChange={(d) => { const z = new Date(d); z.setHours(0, 0, 0, 0); setSelectedDate(z); }} isArabic={isArabic} />
      </View>

      {/* Today's workout card */}
      {isRestDay ? (
        <View style={[cardStyle, { padding: 32, alignItems: "center", gap: 16 }]}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: withAlpha(colors.primary, 0.05), alignItems: "center", justifyContent: "center" }}>
            <Coffee size={32} color={colors.primary} />
          </View>
          <View style={{ alignItems: "center", gap: 4 }}>
            <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 2, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
              {isArabic ? "يوم راحة" : "REST DAY"}
            </AppText>
            <SectionTitle style={{ textTransform: isArabic ? "none" : "uppercase" }}>{isArabic ? "استشفاء نشط" : "Active Recovery"}</SectionTitle>
          </View>
          <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ fontStyle: "italic", textAlign: "center", lineHeight: 22 }}>
            {isArabic
              ? '"تم بناء العضلات أثناء الراحة وليس التمرين. ركز اليوم على الاستشفاء والترطيب."'
              : '"Muscles are built during rest, not workouts. Focus on recovery and hydration today."'}
          </AppText>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12, width: "100%", marginTop: 8 }}>
            {[isArabic ? "تسجيل نشاط" : "Log Activity", isArabic ? "إطالة" : "Stretch Routine"].map((label, i) => (
              <Pressable key={i} onPress={() => router.push("/voice-log")} style={{ flex: 1, backgroundColor: softFill, borderRadius: 8, paddingVertical: 12, alignItems: "center" }}>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{label}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={[cardStyle, { overflow: "hidden" }]}>
          <View style={{ height: 200 }}>
            <Image source={{ uri: todaysWorkout.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", padding: 20, alignItems: isArabic ? "flex-end" : "flex-start" }}>
              <AppText style={{ fontSize: 22, fontWeight: "600", color: "#fff", textTransform: isArabic ? "none" : "uppercase", fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
                {isArabic ? todaysWorkout.arabicName : todaysWorkout.name}
              </AppText>
            </View>
          </View>
          <View style={{ padding: 20 }}>
            <Btn variant="primary" fullWidth onPress={() => router.push("/workout/preview")} style={{ borderRadius: 8 }}>
              <Play size={18} color="#fff" fill="#fff" />
              <AppText variant="body-strong" style={{ color: "#fff", textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5 }}>
                {isArabic ? "حضّر التمرين" : "Prepare Workout"}
              </AppText>
            </Btn>
          </View>
        </View>
      )}

      {/* Custom routines */}
      <View style={{ marginTop: 32 }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 12 }}>
          <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>
            {isArabic ? "روتينات مخصصة" : "CUSTOM ROUTINES"}
          </AppText>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
            <Pressable onPress={() => router.push("/workout/import")} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
              <Download size={14} strokeWidth={2.5} color={colors.primary} />
              <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "استيراد" : "IMPORT"}</AppText>
            </Pressable>
            <Pressable onPress={() => router.push("/workout/builder")} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
              <Plus size={14} strokeWidth={2.5} color={colors.primary} />
              <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1.5, fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold" }}>{isArabic ? "إنشاء جديد" : "CREATE NEW"}</AppText>
            </Pressable>
          </View>
        </View>

        {user.customWorkouts && user.customWorkouts.length > 0 ? (
          <View style={{ gap: 12 }}>
            {user.customWorkouts.map((w) => (
              <Pressable key={w.id} onPress={() => router.push("/workout/preview")} style={[cardStyle, { padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }]}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: softFill, alignItems: "center", justifyContent: "center" }}>
                    <Dumbbell size={18} color={colors.ink} />
                  </View>
                  <View>
                    <AppText variant="body-strong" style={{ color: colors.ink, textAlign: isArabic ? "right" : "left" }}>{w.name}</AppText>
                    <AppText variant="caption" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: isArabic ? "right" : "left" }}>
                      {w.exercises.length} {isArabic ? "تمارين" : "exercises"}
                    </AppText>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.inkMuted24} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={[cardStyle, { padding: 32, alignItems: "center", gap: 12 }]}>
            <Dumbbell size={28} color={colors.inkMuted24} />
            <AppText variant="body" className="text-ink-muted-48 dark:text-ink-dark-muted-48" style={{ textAlign: "center" }}>
              {isArabic ? "لم تقم بإنشاء أي روتينات مخصصة بعد." : "You haven't created any custom routines yet."}
            </AppText>
            <Btn variant="secondary" onPress={() => router.push("/workout/builder")} style={{ height: 36, paddingHorizontal: 20, marginTop: 4 }} label={isArabic ? "إنشاء الروتين الأول" : "Create First Routine"} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
