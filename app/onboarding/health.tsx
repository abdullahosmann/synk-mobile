/**
 * HealthDiet — RN port of src/screens/onboarding/HealthDiet.tsx.
 * Dietary preference chips (with vegan/vegetarian implication logic + toasts),
 * an "other" field, a food-dislikes field, and a meals-per-day 4-grid.
 */
import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import OnboardingLayout from "../../src/components/OnboardingLayout";
import { useAppContext } from "../../src/AppContext";
import { useToast } from "../../src/components/ToastProvider";
import { useColors } from "../../src/theme/ThemeProvider";
import { withAlpha } from "../../src/theme/tint";
import { AppText } from "../../src/components/ui/Typography";
import { ContinueButton } from "../../src/components/ui/ContinueButton";

const DIETARY_OPTIONS: { en: string; ar: string }[] = [
  { en: "No dairy", ar: "بدون ألبان" },
  { en: "Lactose-free", ar: "خالي من اللاكتوز" },
  { en: "No seafood", ar: "بدون مأكولات بحرية" },
  { en: "No nuts", ar: "بدون مكسرات" },
  { en: "No eggs", ar: "بدون بيض" },
  { en: "Gluten-free", ar: "خالي من الجلوتين" },
  { en: "Vegetarian", ar: "نباتي" },
  { en: "Vegan", ar: "نباتي صرف" },
  { en: "Other", ar: "أخرى" },
];

const IMPLIED_BY_VEGAN = ["No dairy", "No eggs", "No seafood", "Lactose-free"];
const IMPLIED_BY_VEGETARIAN = ["No seafood"];

export default function HealthDiet() {
  const router = useRouter();
  const { user, setUser } = useAppContext();
  const { showToast } = useToast();
  const colors = useColors();
  const isArabic = user.language === "ar";

  const hasVegan = user.dietaryPreferences.includes("Vegan");
  const hasVegetarian = user.dietaryPreferences.includes("Vegetarian");

  const toggleDietary = (enId: string) => {
    if (hasVegan && IMPLIED_BY_VEGAN.includes(enId)) {
      showToast(
        isArabic
          ? "النظام النباتي الكامل بيشمل تلقائيًا بدون ألبان أو بيض أو مأكولات بحرية ولاكتوز."
          : "Vegan already includes no dairy, eggs, seafood, and lactose-free.",
      );
      return;
    }
    if (hasVegetarian && IMPLIED_BY_VEGETARIAN.includes(enId)) {
      showToast(isArabic ? "النظام النباتي بيستبعد المأكولات البحرية تلقائيًا." : "Vegetarian already excludes seafood.");
      return;
    }

    let next = [...user.dietaryPreferences];
    if (next.includes(enId)) {
      next = next.filter((p) => p !== enId);
      if (enId === "Vegan") next = next.filter((p) => !IMPLIED_BY_VEGAN.includes(p));
      if (enId === "Vegetarian") next = next.filter((p) => !IMPLIED_BY_VEGETARIAN.includes(p));
    } else if (enId === "Vegan") {
      next = next.filter((p) => p !== "Vegetarian" && !IMPLIED_BY_VEGETARIAN.includes(p));
      next.push("Vegan");
      IMPLIED_BY_VEGAN.forEach((i) => !next.includes(i) && next.push(i));
    } else if (enId === "Vegetarian") {
      next = next.filter((p) => p !== "Vegan" && !IMPLIED_BY_VEGAN.includes(p));
      next.push("Vegetarian");
      IMPLIED_BY_VEGETARIAN.forEach((i) => !next.includes(i) && next.push(i));
    } else {
      next.push(enId);
    }
    setUser({ ...user, dietaryPreferences: next });
  };

  const Label = ({ children }: { children: string }) => (
    <AppText
      className="text-ink-muted-48 dark:text-ink-dark-muted-48"
      style={{
        paddingHorizontal: 4,
        marginBottom: 8,
        fontSize: isArabic ? 12 : 11,
        fontWeight: "600",
        letterSpacing: isArabic ? 0 : 0.44,
        textTransform: isArabic ? "none" : "uppercase",
        textAlign: isArabic ? "right" : "left",
        fontFamily: isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold",
      }}
    >
      {children}
    </AppText>
  );

  const fieldBox = {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    padding: 12,
  };
  const fieldInput = {
    fontSize: 14,
    color: colors.ink,
    textAlign: (isArabic ? "right" : "left") as "right" | "left",
    fontFamily: isArabic ? "Cairo_400Regular" : "Inter_400Regular",
    padding: 0,
  };

  return (
    <OnboardingLayout
      step={7}
      title="Nutrition"
      arabicTitle="التغذية"
      subtitle="Any food rules I should know? I'll use this to avoid meals that don't fit you."
      arabicSubtitle="أي قواعد أكل لازم أعرفها؟ هستخدم ده عشان أتجنب الوجبات اللي مش بتناسبك."
      footer={<ContinueButton onPress={() => router.push("/onboarding/ai-rules")} />}
    >
      <View style={{ paddingBottom: 16, gap: 16 }}>
        {/* Dietary */}
        <View>
          <Label>{isArabic ? "تفضيلات الأكل (اختياري)" : "DIETARY (OPTIONAL)"}</Label>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
            {DIETARY_OPTIONS.map((opt) => {
              const implied =
                (hasVegan && IMPLIED_BY_VEGAN.includes(opt.en)) ||
                (hasVegetarian && IMPLIED_BY_VEGETARIAN.includes(opt.en));
              const sel = user.dietaryPreferences.includes(opt.en);
              return (
                <Pressable
                  key={opt.en}
                  onPress={() => toggleDietary(opt.en)}
                  style={{
                    minHeight: 40,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: sel || implied ? colors.primary : colors.hairline,
                    backgroundColor: colors.canvas,
                    opacity: implied ? 0.5 : 1,
                    flexDirection: isArabic ? "row-reverse" : "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <AppText variant="caption-strong" style={{ color: sel || implied ? colors.primary : colors.ink }}>
                    {isArabic ? opt.ar : opt.en}
                  </AppText>
                  {implied && (
                    <View style={{ backgroundColor: withAlpha(colors.primary, 0.1), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <AppText style={{ fontSize: 9, fontWeight: "700", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5 }}>
                        {isArabic ? "مشمول" : "Inc."}
                      </AppText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {user.dietaryPreferences.includes("Other") && (
            <View style={[fieldBox, { marginTop: 12 }]}>
              <TextInput
                value={user.dietaryOther || ""}
                onChangeText={(t) => setUser({ ...user, dietaryOther: t })}
                placeholder={isArabic ? "اشرحلي باختصار" : "Tell me briefly"}
                placeholderTextColor={colors.inkMuted48}
                style={fieldInput}
              />
            </View>
          )}
        </View>

        {/* Dislikes */}
        <View>
          <Label>{isArabic ? "أكل مش بتحبه (اختياري)" : "FOOD DISLIKES (OPTIONAL)"}</Label>
          <View style={fieldBox}>
            <TextInput
              value={user.dislikedFoods || ""}
              onChangeText={(t) => setUser({ ...user, dislikedFoods: t })}
              placeholder={isArabic ? "مثلاً: تونة، شوفان، بيض، عيش الغراب..." : "e.g. tuna, oats, eggs, mushrooms..."}
              placeholderTextColor={colors.inkMuted48}
              style={fieldInput}
            />
          </View>
        </View>

        {/* Meals per day */}
        <View>
          <Label>{isArabic ? "وجبات في اليوم" : "MEALS PER DAY"}</Label>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
            {[2, 3, 4, 5].map((num) => {
              const sel = user.mealsPerDay === num;
              return (
                <Pressable
                  key={num}
                  onPress={() => setUser({ ...user, mealsPerDay: num })}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: sel ? colors.primary : colors.hairline,
                    backgroundColor: colors.canvas,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText style={{ fontSize: 18, fontWeight: "600", color: sel ? colors.primary : colors.ink }}>
                    {num === 5 ? "5+" : String(num)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}
