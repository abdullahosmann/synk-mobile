/**
 * Nutrition — RN port of src/screens/main/Nutrition.tsx (Fitness NUTRITION segment).
 *
 * This pass ports the core experience faithfully:
 *  - header: daily/weekly toggle, date / week navigation, customize button
 *  - search bar + Quick-add / more-actions row
 *  - the six reorderable cards: coach plan, daily/weekly summary (+ detailed
 *    nutrients), meal sections (add/delete), AI coaching, AI quick-pick
 *    (with like/dislike), hydration tracker
 *  - core sheets: search overlay, portion modal (+ slot picker, edit/delete),
 *    quick-add modal, customize sheet, success toast, adjust-plan sheet
 *
 * Full builders ported: custom food, custom meal, recipe (+ native share),
 * weekly JSON export (expo-file-system/legacy + expo-sharing), and the label
 * scanner (expo-image-picker → mock scanNutritionLabel → prefills the Custom
 * Food builder; the OCR itself is a backend-deferred mock, as in web).
 *
 * Web→RN: useNavigate → useRouter; useSearchParams → useLocalSearchParams;
 * localStorage → sync storage helpers; motion/AnimatePresence → reanimated
 * entering anims + conditional render; <input>/<select> → TextInput / inline
 * slot buttons; fixed overlays → <Modal>.
 */
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  TextInput,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import { scanNutritionLabel } from "../services/nutritionScanner";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Search,
  Camera,
  Info,
  X,
  Utensils,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Mic,
  MoreHorizontal,
  Trash2,
  SlidersHorizontal,
  ThumbsUp,
  ThumbsDown,
  Download,
} from "lucide-react-native";
import CoachIcon from "../components/CoachIcon";
import CoachAvatar from "../components/CoachAvatar";
import BottomSheet from "../components/BottomSheet";
import DateNavigator from "../components/DateNavigator";
import { useToast } from "../components/ToastProvider";
import { useAppContext } from "../AppContext";
import type { FoodItem, LoggedFood, TodaysLogs, Recipe, SuggestedMeal, CoachNutritionPlan } from "../types";
import { computePlanPreview } from "../lib/planUtils";
import { getItem, setItem } from "../lib/storage";
import { useColors, useTheme } from "../theme/ThemeProvider";
import { AppText } from "../components/ui/Typography";

export interface UIDisplayFood extends Omit<FoodItem, "id" | "time"> {
  verified?: boolean;
  brand?: string;
  portionOptions?: {
    label: string;
    multiplier: number;
    isGramBased?: boolean;
  }[];
  nameAr?: string;
  servingAr?: string;
  category?: string;
  region?: string;
}

// Imported after UIDisplayFood is declared (commonFoods imports the type back).
import { ALL_FOODS } from "../data/commonFoods";

function getFoodKey(food: { name: string; brand?: string; isCustom?: boolean; recipeId?: string }): string {
  if (food.recipeId) return `recipe:${food.recipeId}`;
  if (food.isCustom) return `custom:${food.name}`;
  if (food.brand) return `brand:${food.brand}:${food.name}`;
  return `common:${food.name}`;
}

const slotForHour = (h: number, mealsPerDay: number): string => {
  if (h >= 4 && h < 11) return "breakfast";
  if (h >= 11 && h < 15) {
    if (mealsPerDay >= 3) return "lunch";
    if (mealsPerDay >= 5) return "snack1";
    if (mealsPerDay === 4) return "snack";
    return h < 13 ? "breakfast" : "dinner";
  }
  if (h >= 15 && h < 18) {
    if (mealsPerDay >= 5) return "snack2";
    if (mealsPerDay >= 4) return "snack";
    return mealsPerDay >= 3 ? "lunch" : "dinner";
  }
  if (h >= 18 && h < 23) return "dinner";
  if (mealsPerDay >= 5) return "snack1";
  if (mealsPerDay >= 4) return "snack";
  return h >= 23 || h < 2 ? "dinner" : "breakfast";
};

const normalizeSlot = (
  rawSlot: string | undefined,
  loggedAt: string | undefined,
  activeSlots: { id: string }[],
  mealsPerDay: number,
): string => {
  const validIds = activeSlots.map((s) => s.id);
  if (rawSlot && validIds.includes(rawSlot)) return rawSlot;
  if (rawSlot === "snack" || rawSlot === "snack1" || rawSlot === "snack2") {
    const hour = loggedAt ? new Date(loggedAt).getHours() : 12;
    const snackCandidates = validIds.filter((id) => id.startsWith("snack"));
    if (snackCandidates.length === 0) return slotForHour(hour, mealsPerDay);
    if (snackCandidates.length === 1) return snackCandidates[0];
    return hour < 15 ? "snack1" : "snack2";
  }
  const hour = loggedAt ? new Date(loggedAt).getHours() : 12;
  return slotForHour(hour, mealsPerDay);
};

function ff(isArabic: boolean, weight: 400 | 600 | 700 = 400) {
  if (weight === 400) return isArabic ? "Cairo_400Regular" : "Inter_400Regular";
  return isArabic ? "Cairo_600SemiBold" : "Inter_600SemiBold";
}

export default function Nutrition() {
  const router = useRouter();
  const params = useLocalSearchParams<{ openSearch?: string }>();
  const {
    user,
    todaysLogs: contextTodaysLogs,
    setTodaysLogs: contextSetTodaysLogs,
    selectedDate,
    setSelectedDate,
  } = useAppContext();
  const { showToast: showGlobalToast } = useToast();
  const colors = useColors();
  const isDark = useTheme().theme === "dark";
  const insets = useSafeAreaInsets();
  const isArabic = user.language === "ar";
  const lastTapRef = useRef<number>(0);

  const activeDate = selectedDate;
  const setActiveDate = (d: Date) => {
    const normalized = new Date(d);
    normalized.setHours(0, 0, 0, 0);
    setSelectedDate(normalized);
  };
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const activeDateString = activeDate.toISOString().split("T")[0];
  const todayString = new Date().toISOString().split("T")[0];

  const addDays = (d: Date, days: number) => {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return next;
  };

  const [localLogs, setLocalLogs] = useState(contextTodaysLogs);

  useEffect(() => {
    if (activeDateString === todayString) {
      setLocalLogs(contextTodaysLogs);
    } else {
      const saved = getItem(`synk:logs:${activeDateString}`);
      if (saved) {
        try {
          setLocalLogs(JSON.parse(saved));
        } catch {
          setLocalLogs({ date: activeDateString, foods: [], workouts: [], water: 0 } as any);
        }
      } else {
        setLocalLogs({ date: activeDateString, foods: [], workouts: [], water: 0 } as any);
      }
    }
  }, [activeDateString, contextTodaysLogs, todayString]);

  const updateLogs = (updater: React.SetStateAction<TodaysLogs>) => {
    if (activeDateString === todayString) {
      contextSetTodaysLogs(updater);
    } else {
      setLocalLogs((prev) => {
        const next = typeof updater === "function" ? (updater as any)(prev) : updater;
        setItem(`synk:logs:${activeDateString}`, JSON.stringify(next));
        return next;
      });
    }
  };

  const todaysLogs = localLogs;
  const setTodaysLogs = updateLogs;

  const waterIntake = todaysLogs.water || 0;
  const setWaterIntake = (val: number) =>
    setTodaysLogs((prev) => ({ ...prev, water: val }));

  const [nutritionCards, setNutritionCards] = useState(() => {
    try {
      const stored = getItem("synk:nutritionCards");
      if (stored) return JSON.parse(stored);
    } catch {}
    return { summary: true, meals: true, aiCoaching: true, aiPick: true, hydration: true, coachPlan: true };
  });
  const [showCustomizeSheet, setShowCustomizeSheet] = useState(false);
  const [nutritionCardOrder, setNutritionCardOrder] = useState<string[]>(() => {
    try {
      const stored = getItem("synk:nutritionCardOrder");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && (parsed.length === 5 || parsed.length === 6)) {
          if (parsed.length === 5 && !parsed.includes("coachPlan")) return ["coachPlan", ...parsed];
          return parsed;
        }
      }
    } catch {}
    return ["coachPlan", "summary", "meals", "aiCoaching", "aiPick", "hydration"];
  });

  const toggleCard = (key: string) => {
    setNutritionCards((prev: any) => {
      const next = { ...prev, [key]: !prev[key] };
      setItem("synk:nutritionCards", JSON.stringify(next));
      return next;
    });
  };

  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [weekOffset, setWeekOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [foodHistory, setFoodHistory] = useState<Record<string, { count: number; lastUsed: string }>>({});

  useEffect(() => {
    if (isSearchOpen) {
      try {
        const raw = getItem("synk:foodHistory");
        if (raw) setFoodHistory(JSON.parse(raw));
      } catch {}
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen && !activeSlot) {
      setActiveSlot(slotForHour(new Date().getHours(), user.mealsPerDay ?? 4));
    }
  }, [isSearchOpen, activeSlot, user.mealsPerDay]);

  const [customWaterAmount, setCustomWaterAmount] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", slot: "" });
  const [selectedFood, setSelectedFood] = useState<UIDisplayFood | null>(null);
  const [showToast, setShowToastState] = useState(false);
  const [toastMode, setToastMode] = useState<"add" | "delete">("add");
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(() => {
    try {
      const stored = getItem("synk:dismissedSuggestions");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    setItem("synk:dismissedSuggestions", JSON.stringify(Array.from(dismissedSuggestions)));
  }, [dismissedSuggestions]);

  const [foodFeedback, setFoodFeedback] = useState<Record<string, "liked" | "disliked">>(() => {
    try {
      const stored = getItem("synk:foodFeedback");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handleFoodFeedback = (id: string, type: "liked" | "disliked") => {
    const isAlready = foodFeedback[id] === type;
    if (isAlready) {
      showGlobalToast(isArabic ? "تم إزالة التفضيل" : "Preference removed", "default");
    } else {
      showGlobalToast(
        type === "liked" ? (isArabic ? "تمام" : "Got it") : isArabic ? "مش هقترحه تاني" : "I won't suggest this again",
        type === "liked" ? "success" : "default",
      );
    }
    setFoodFeedback((prev) => {
      const next = { ...prev };
      if (prev[id] === type) delete next[id];
      else next[id] = type;
      setItem("synk:foodFeedback", JSON.stringify(next));
      return next;
    });
  };

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [mealToReplace, setMealToReplace] = useState<FoodItem | null>(null);
  const [portionValue, setPortionValue] = useState<number | string>("");
  const [selectedPortionOptionIdx, setSelectedPortionOptionIdx] = useState<number>(0);
  const [historySort, setHistorySort] = useState<"recent" | "frequent" | "alphabetical">("recent");
  const [mealTime] = useState<string>("");
  const [showDetailedNutrients, setShowDetailedNutrients] = useState(false);
  const [showFoodDetailedNutrients, setShowFoodDetailedNutrients] = useState(false);

  // ---- Custom foods (user-created, persisted) ----
  const [localCustomFoods, setLocalCustomFoods] = useState<UIDisplayFood[]>(() => {
    try {
      const stored = getItem("synk:customFoods");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [localCustomMeals, setLocalCustomMeals] = useState<UIDisplayFood[]>(() => {
    try {
      const stored = getItem("synk:customMeals");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [localRecipes, setLocalRecipes] = useState<Recipe[]>(() => {
    try {
      const stored = getItem("synk:recipes");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCustomFoodOpen, setIsCustomFoodOpen] = useState(false);
  const emptyCustomFood = {
    name: "", calories: "", protein: "", carbs: "", fat: "",
    portionValue: "1", portionUnit: "serving",
    sodium: "", calcium: "", fiber: "", sugar: "", saturatedFat: "", potassium: "", iron: "", cholesterol: "",
  };
  const [customFood, setCustomFood] = useState(emptyCustomFood);
  const cfPill = { height: 44, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, borderRadius: 9999, paddingHorizontal: 16, fontSize: 15, color: colors.ink, textAlign: (isArabic ? "right" : "left") as "right" | "left" };

  const handleAddCustomFood = () => {
    if (!customFood.name || !customFood.calories) return;
    const newFood: UIDisplayFood = {
      name: customFood.name,
      calories: Number(customFood.calories) || 0,
      protein: Number(customFood.protein) || 0,
      carbs: Number(customFood.carbs) || 0,
      fat: Number(customFood.fat) || 0,
      portion: `${customFood.portionValue} ${customFood.portionUnit}`,
      verified: false,
      isCustom: true,
      portionOptions: [
        {
          label: customFood.portionUnit,
          multiplier: 1,
          isGramBased: ["g", "grams"].includes(customFood.portionUnit.toLowerCase()),
        },
      ],
    };
    setLocalCustomFoods((prev) => {
      const next = [newFood, ...prev];
      setItem("synk:customFoods", JSON.stringify(next));
      return next;
    });
    setIsCustomFoodOpen(false);
    setCustomFood(emptyCustomFood);
    showGlobalToast(isArabic ? `تم إضافة ${newFood.name}` : `Added ${newFood.name}`, "success");
  };

  // ---- Foods ----
  const allAvailableFoods = useMemo(() => {
    const formattedRecipes: UIDisplayFood[] = localRecipes.map((r) => ({
      name: r.name,
      calories: r.totals.calories / r.servings,
      protein: r.totals.protein / r.servings,
      carbs: r.totals.carbs / r.servings,
      fat: r.totals.fat / r.servings,
      portion: "1 serving",
      isCustom: true,
      recipeId: r.id,
    }));
    return [...formattedRecipes, ...localCustomMeals, ...localCustomFoods, ...(ALL_FOODS as UIDisplayFood[])];
  }, [localRecipes, localCustomMeals, localCustomFoods]);

  // ---- Custom meal builder ----
  const [isCustomMealOpen, setIsCustomMealOpen] = useState(false);
  const [customMealBuilder, setCustomMealBuilder] = useState<{
    name: string;
    items: { food: UIDisplayFood; multiplier: number; portionStr: string }[];
  }>({ name: "", items: [] });
  const [mealItemSearchMode, setMealItemSearchMode] = useState(false);
  const [mealSearchQuery, setMealSearchQuery] = useState("");
  const filteredMealItems = useMemo(() => {
    if (!mealSearchQuery) return allAvailableFoods.slice(0, 10);
    const q = mealSearchQuery.toLowerCase().trim();
    const qRaw = mealSearchQuery.trim();
    return allAvailableFoods
      .filter((f) => f.name.toLowerCase().includes(q) || ((f as any).nameAr || "").includes(qRaw))
      .slice(0, 10);
  }, [mealSearchQuery, allAvailableFoods]);
  const mealTotals = useMemo(() => {
    const sum = (sel: (f: UIDisplayFood) => number) =>
      Math.round(customMealBuilder.items.reduce((acc, it) => acc + sel(it.food) * it.multiplier, 0));
    return { kcal: sum((f) => f.calories), prot: sum((f) => f.protein), carb: sum((f) => f.carbs), fat: sum((f) => f.fat) };
  }, [customMealBuilder.items]);

  const handleSaveCustomMeal = () => {
    if (!customMealBuilder.name || customMealBuilder.items.length === 0) return;
    const newMeal: UIDisplayFood = {
      name: customMealBuilder.name,
      calories: mealTotals.kcal,
      protein: mealTotals.prot,
      carbs: mealTotals.carb,
      fat: mealTotals.fat,
      portion: "1 meal",
      verified: false,
      isCustom: true,
      subFoods: customMealBuilder.items.map((it) => ({
        id: "",
        name: it.food.name,
        calories: it.food.calories * it.multiplier,
        protein: it.food.protein * it.multiplier,
        carbs: it.food.carbs * it.multiplier,
        fat: it.food.fat * it.multiplier,
        portion: it.portionStr,
        time: "",
      })),
      portionOptions: [{ label: "meal", multiplier: 1 }],
    };
    setLocalCustomMeals((prev) => {
      const next = [newMeal, ...prev];
      setItem("synk:customMeals", JSON.stringify(next));
      return next;
    });
    addMeal(newMeal, 1, "1 meal");
    setIsCustomMealOpen(false);
    setCustomMealBuilder({ name: "", items: [] });
    setMealItemSearchMode(false);
    setMealSearchQuery("");
    showGlobalToast(isArabic ? "تم حفظ الوجبة وإضافتها" : "Meal saved & added", "success");
  };

  const handleScanLabel = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      const result = perm.granted
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });
      if (result.canceled || !result.assets?.[0]) return;
      showGlobalToast(isArabic ? "جاري قراءة الملصق..." : "Reading nutrition label...", "default");
      const data = await scanNutritionLabel(result.assets[0].base64 || "");
      if (!data.success) {
        showGlobalToast(isArabic ? "تعذّرت قراءة الملصق" : "Could not read label", "error");
        return;
      }
      setCustomFood({
        ...emptyCustomFood,
        name: data.productName || "",
        portionValue: data.servingSize?.amount?.toString() || "1",
        portionUnit: data.servingSize?.unit || "serving",
        calories: data.calories?.toString() || "",
        protein: data.macros?.protein?.toString() || "",
        carbs: data.macros?.carbs?.toString() || "",
        fat: data.macros?.fat?.toString() || "",
        sugar: data.nutrients?.sugar?.toString() || "",
        fiber: data.nutrients?.fiber?.toString() || "",
        sodium: data.nutrients?.sodium?.toString() || "",
        calcium: data.nutrients?.calcium?.toString() || "",
        saturatedFat: data.nutrients?.saturatedFat?.toString() || "",
        potassium: data.nutrients?.potassium?.toString() || "",
        iron: data.nutrients?.iron?.toString() || "",
        cholesterol: data.nutrients?.cholesterol?.toString() || "",
      });
      setIsCustomFoodOpen(true);
      showGlobalToast(
        isArabic ? "راجع القيم قبل الحفظ (وضع المعاينة)" : "Review values before saving (preview mode)",
        "default",
      );
    } catch {
      showGlobalToast(isArabic ? "تعذّر المسح" : "Scan failed", "error");
    }
  };

  const exportWeeklyData = async () => {
    try {
      const weekStart = weeklyTotals.weekStart.toISOString().split("T")[0];
      const data = { weekStart, weekEnd: weeklyTotals.weekEnd.toISOString().split("T")[0], days: weeklyTotals.daysData };
      const uri = `${FileSystem.cacheDirectory}synk-week-${weekStart}.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/json", UTI: "public.json" });
      else showGlobalToast(isArabic ? "تم حفظ الملف" : "File saved", "success");
    } catch {
      showGlobalToast(isArabic ? "تعذّر التصدير" : "Export failed", "error");
    }
  };

  // ---- Recipe builder ----
  const [isRecipeBuilderOpen, setIsRecipeBuilderOpen] = useState(false);
  const emptyRecipe = { name: "", description: "", servings: 1, ingredients: [] as any[], steps: [""] };
  const [recipeBuilder, setRecipeBuilder] = useState(emptyRecipe);
  const [recipeIngredientSearchMode, setRecipeIngredientSearchMode] = useState(false);
  const [recipeIngredientQuery, setRecipeIngredientQuery] = useState("");

  const recipeTotals = useMemo(
    () =>
      recipeBuilder.ingredients.reduce(
        (acc, c) => ({
          calories: acc.calories + (Number(c.calories) || 0),
          protein: acc.protein + (Number(c.protein) || 0),
          carbs: acc.carbs + (Number(c.carbs) || 0),
          fat: acc.fat + (Number(c.fat) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [recipeBuilder.ingredients],
  );

  const recipeValid =
    recipeBuilder.name.trim() !== "" &&
    recipeBuilder.ingredients.length > 0 &&
    recipeBuilder.steps.filter((s) => s.trim() !== "").length > 0;

  const saveRecipe = (shareAfter: boolean) => {
    if (!recipeValid) return;
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: recipeBuilder.name.trim(),
      description: recipeBuilder.description.trim(),
      ingredients: recipeBuilder.ingredients.map((i) => ({
        name: i.food.name,
        portion: i.portionStr,
        calories: Number(i.calories) || 0,
        protein: Number(i.protein) || 0,
        carbs: Number(i.carbs) || 0,
        fat: Number(i.fat) || 0,
      })),
      steps: recipeBuilder.steps.filter((s) => s.trim() !== ""),
      servings: recipeBuilder.servings,
      totals: recipeTotals,
      createdAt: new Date().toISOString(),
    };
    setLocalRecipes((prev) => {
      const next = [...prev, newRecipe];
      setItem("synk:recipes", JSON.stringify(next));
      return next;
    });
    setIsRecipeBuilderOpen(false);
    setRecipeBuilder(emptyRecipe);
    setRecipeIngredientSearchMode(false);
    setRecipeIngredientQuery("");
    showGlobalToast(isArabic ? "تم حفظ الوصفة" : "Recipe saved", "success");
    if (shareAfter) {
      const perServ = (n: number) => Math.round(n / Math.max(1, newRecipe.servings));
      const lines = [
        `🍳 ${newRecipe.name}`,
        newRecipe.description,
        "",
        isArabic ? "المكونات:" : "Ingredients:",
        ...newRecipe.ingredients.map((i) => `• ${i.name} — ${i.portion}`),
        "",
        isArabic ? "الخطوات:" : "Steps:",
        ...newRecipe.steps.map((s, i) => `${i + 1}. ${s}`),
        "",
        `${isArabic ? "لكل حصة" : "Per serving"}: ${perServ(newRecipe.totals.calories)} kcal · ${perServ(newRecipe.totals.protein)}P / ${perServ(newRecipe.totals.carbs)}C / ${perServ(newRecipe.totals.fat)}F`,
        "synk.app",
      ].filter(Boolean);
      Share.share({ message: lines.join("\n") }).catch(() => {});
    }
  };

  const handleEditMeal = (meal: LoggedFood) => {
    const originalFood = allAvailableFoods.find((f) => f.name === meal.name);
    const baseFood: UIDisplayFood = originalFood || {
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      portion: meal.portion,
      isCustom: true,
    };
    setMealToReplace(meal);
    setSelectedFood(baseFood);
    setActiveSlot(meal.slot as any);
    setIsConfirmingDelete(false);
  };

  useEffect(() => {
    if (selectedFood) {
      if (!mealToReplace && !activeSlot) {
        setActiveSlot(slotForHour(new Date().getHours(), user.mealsPerDay ?? 4));
      }
      setSelectedPortionOptionIdx(0);
      const options = selectedFood.portionOptions;
      if (options && options.length > 0) {
        setPortionValue(options[0].isGramBased ? parseFloat(selectedFood.portion) || 100 : 1);
      } else {
        setPortionValue(/g\s*$/i.test(selectedFood.portion) ? parseFloat(selectedFood.portion) || 100 : 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFood, mealToReplace]);

  const currentPortionOpt = selectedFood?.portionOptions?.[selectedPortionOptionIdx];
  const isGramBased = currentPortionOpt
    ? !!currentPortionOpt.isGramBased
    : selectedFood
      ? /g\s*$/i.test(selectedFood.portion)
      : false;
  const baseGrams = selectedFood ? parseFloat(selectedFood.portion) || 100 : 100;
  const parsedPortion = typeof portionValue === "string" ? parseFloat(portionValue) : portionValue;
  const validPortion = isNaN(parsedPortion) ? (isGramBased ? baseGrams : 1) : parsedPortion;
  const optMultiplier = currentPortionOpt ? currentPortionOpt.multiplier : 1;
  const computedMultiplier = selectedFood
    ? isGramBased
      ? (validPortion / baseGrams) * optMultiplier
      : validPortion * optMultiplier
    : 1;

  const handleDecreasePortion = () =>
    setPortionValue((prev) => {
      const p = typeof prev === "string" ? parseFloat(prev) : prev;
      const valid = isNaN(p) ? (isGramBased ? baseGrams : 1) : p;
      const step = isGramBased ? 10 : 0.5;
      return Math.max(step, valid - step);
    });
  const handleIncreasePortion = () =>
    setPortionValue((prev) => {
      const p = typeof prev === "string" ? parseFloat(prev) : prev;
      const valid = isNaN(p) ? (isGramBased ? baseGrams : 1) : p;
      const step = isGramBased ? 10 : 0.5;
      return valid + step;
    });

  const computedPortionString = currentPortionOpt
    ? isGramBased
      ? `${validPortion}g`
      : `${validPortion} ${currentPortionOpt.label}`
    : isGramBased
      ? `${validPortion}g`
      : `${validPortion} servings`;

  useEffect(() => {
    if (params.openSearch === "1") setIsSearchOpen(true);
  }, [params.openSearch]);

  const plan = computePlanPreview(user);
  const targets = {
    calories: user.calorieTarget || plan.calorieTarget,
    protein: user.proteinTarget || plan.protein,
    carbs: user.carbsTarget || plan.carbs,
    fat: user.fatTarget || plan.fat,
    water: user.dailyWaterTarget || 2000,
  };

  const totals = useMemo(() => {
    return todaysLogs.foods.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
        sodium: acc.sodium + (meal.sodium || 0),
        calcium: acc.calcium + (meal.calcium || 0),
        fiber: acc.fiber + (meal.fiber || 0),
        sugar: acc.sugar + (meal.sugar || 0),
        potassium: acc.potassium + (meal.potassium || 0),
        iron: acc.iron + (meal.iron || 0),
        saturatedFat: acc.saturatedFat + (meal.saturatedFat || 0),
        cholesterol: acc.cholesterol + (meal.cholesterol || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, calcium: 0, fiber: 0, sugar: 0, potassium: 0, iron: 0, saturatedFat: 0, cholesterol: 0 },
    );
  }, [todaysLogs.foods]);

  const goalMessage = useMemo(() => {
    const goals = user.goals ?? [];
    if (goals.includes("lose-body-fat" as any)) return isArabic ? "ركز على السعرات والبروتين لخسارة الدهون" : "Focus on calories & protein for fat loss";
    if (goals.includes("gain-muscle" as any) || goals.includes("build-strength" as any)) return isArabic ? "احرص على فائض السعرات والبروتين" : "Ensure calorie & protein surplus for muscle gain";
    return isArabic ? "توازن في العناصر الغذائية" : "Maintain nutrient balance";
  }, [user.goals, isArabic]);

  const weeklyTotals = useMemo(() => {
    const d = new Date(activeDate);
    const day = d.getDay();
    const diff = d.getDate() - day + weekOffset * 7;
    const weekStart = new Date(d);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let totalCals = 0, totalPro = 0, totalCarbs = 0, totalFat = 0;
    let totalSugar = 0, totalFiber = 0, totalSodium = 0, totalCalcium = 0;
    let daysLogged = 0;
    const daysData: { date: string; calories: number; protein: number; carbs: number; fat: number }[] = [];

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(weekStart);
      checkDate.setDate(checkDate.getDate() + i);
      const checkDateString = checkDate.toISOString().split("T")[0];
      let dayLog: any = null;
      if (checkDateString === todayString) dayLog = contextTodaysLogs;
      else if (checkDateString === activeDateString) dayLog = localLogs;
      else {
        const saved = getItem(`synk:logs:${checkDateString}`);
        if (saved) {
          try {
            dayLog = JSON.parse(saved);
          } catch {}
        }
      }
      if (!dayLog) dayLog = { date: checkDateString, foods: [], workouts: [], water: 0 };
      const dayFoods = dayLog.foods || [];
      let dCals = 0, dPro = 0, dCarbs = 0, dFat = 0;
      if (dayFoods.length > 0) {
        daysLogged++;
        dayFoods.forEach((food: any) => {
          dCals += food.calories || 0;
          dPro += food.protein || 0;
          dCarbs += food.carbs || 0;
          dFat += food.fat || 0;
          const n = food.nutrients || {};
          totalSugar += food.sugar ?? n.sugar ?? 0;
          totalFiber += food.fiber ?? n.fiber ?? 0;
          totalSodium += food.sodium ?? n.sodium ?? 0;
          totalCalcium += food.calcium ?? n.calcium ?? 0;
        });
      }
      totalCals += dCals; totalPro += dPro; totalCarbs += dCarbs; totalFat += dFat;
      daysData.push({ date: checkDateString, calories: Math.round(dCals), protein: Math.round(dPro), carbs: Math.round(dCarbs), fat: Math.round(dFat) });
    }

    return {
      calories: totalCals, protein: totalPro, carbs: totalCarbs, fat: totalFat,
      sugar: totalSugar, fiber: totalFiber, sodium: totalSodium, calcium: totalCalcium,
      daysLogged, daysData,
      avgCalories: daysLogged > 0 ? Math.round(totalCals / daysLogged) : 0,
      avgProtein: daysLogged > 0 ? Math.round(totalPro / daysLogged) : 0,
      avgCarbs: daysLogged > 0 ? Math.round(totalCarbs / daysLogged) : 0,
      avgFat: daysLogged > 0 ? Math.round(totalFat / daysLogged) : 0,
      weekStart, weekEnd,
    };
  }, [activeDate, activeDateString, todayString, contextTodaysLogs, localLogs, weekOffset]);

  const MEAL_SLOTS = useMemo(() => {
    const count = user.mealsPerDay ?? 4;
    switch (count) {
      case 2:
        return [
          { id: "breakfast", labelEn: "Breakfast", labelAr: "الإفطار" },
          { id: "dinner", labelEn: "Dinner", labelAr: "العشاء" },
        ];
      case 3:
        return [
          { id: "breakfast", labelEn: "Breakfast", labelAr: "الإفطار" },
          { id: "lunch", labelEn: "Lunch", labelAr: "الغداء" },
          { id: "dinner", labelEn: "Dinner", labelAr: "العشاء" },
        ];
      case 4:
        return [
          { id: "breakfast", labelEn: "Breakfast", labelAr: "الإفطار" },
          { id: "lunch", labelEn: "Lunch", labelAr: "الغداء" },
          { id: "dinner", labelEn: "Dinner", labelAr: "العشاء" },
          { id: "snack", labelEn: "Snacks", labelAr: "وجبة خفيفة" },
        ];
      default:
        return [
          { id: "breakfast", labelEn: "Breakfast", labelAr: "الإفطار" },
          { id: "snack1", labelEn: "Morning snack", labelAr: "وجبة خفيفة صباحًا" },
          { id: "lunch", labelEn: "Lunch", labelAr: "الغداء" },
          { id: "snack2", labelEn: "Afternoon snack", labelAr: "وجبة خفيفة بعد الظهر" },
          { id: "dinner", labelEn: "Dinner", labelAr: "العشاء" },
        ];
    }
  }, [user.mealsPerDay]);

  const mealGroups = useMemo<{ [key: string]: FoodItem[] }>(() => {
    const groups: { [key: string]: FoodItem[] } = {};
    MEAL_SLOTS.forEach((slot) => {
      groups[slot.id] = [];
    });
    todaysLogs.foods.forEach((food) => {
      const lf = food as LoggedFood;
      const normalizedSlot = normalizeSlot(lf.slot, lf.loggedAt, MEAL_SLOTS, user.mealsPerDay ?? 4);
      if (groups[normalizedSlot]) groups[normalizedSlot].push(food);
      else {
        const firstSlot = MEAL_SLOTS[0]?.id || "breakfast";
        if (groups[firstSlot]) groups[firstSlot].push(food);
      }
    });
    return groups;
  }, [todaysLogs.foods, MEAL_SLOTS, user.mealsPerDay]);

  const isFuture = activeDateString > todayString;
  const activeSlotName = MEAL_SLOTS.find((s) => s.id === activeSlot)?.labelEn || "";
  const activeSlotLabelAr = MEAL_SLOTS.find((s) => s.id === activeSlot)?.labelAr || "";

  const historyFoods = useMemo(() => {
    let items = allAvailableFoods.map((food) => {
      const key = getFoodKey(food as any);
      const stats = foodHistory[key];
      return { ...food, _count: stats?.count || 0, _lastUsed: stats?.lastUsed || "1970-01-01T00:00:00.000Z" };
    });
    if (historySort === "recent") {
      items.sort((a, b) => new Date(b._lastUsed).getTime() - new Date(a._lastUsed).getTime());
    } else if (historySort === "frequent") {
      items.sort((a, b) => (b._count !== a._count ? b._count - a._count : new Date(b._lastUsed).getTime() - new Date(a._lastUsed).getTime()));
    } else {
      items.sort((a, b) => {
        const nA = isArabic && (a as any).nameAr ? (a as any).nameAr : a.name;
        const nB = isArabic && (b as any).nameAr ? (b as any).nameAr : b.name;
        return nA.localeCompare(nB);
      });
    }
    return items.slice(0, 30);
  }, [historySort, allAvailableFoods, foodHistory, isArabic]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery) return allAvailableFoods.slice(0, 5);
    const q = searchQuery.toLowerCase().trim();
    const qRaw = searchQuery.trim();
    return allAvailableFoods.filter((f) => f.name.toLowerCase().includes(q) || ((f as any).nameAr || "").includes(qRaw));
  }, [searchQuery, allAvailableFoods]);

  const displayFoods = searchQuery ? filteredFoods : historyFoods;

  const flashToast = (mode: "add" | "delete") => {
    setToastMode(mode);
    setShowToastState(true);
    setTimeout(() => setShowToastState(false), 2000);
  };

  const addMeal = (food: Omit<FoodItem, "id" | "time">, multiplier: number, customPortion?: string, slotOverride?: string) => {
    const fallbackSlot = slotForHour(new Date().getHours(), user.mealsPerDay ?? 4);
    const assignedSlot = activeSlot || fallbackSlot;
    let timeStr = mealToReplace ? (mealToReplace as any).time : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    let loggedAtStr = (mealToReplace as unknown as LoggedFood)?.loggedAt || (activeDateString !== todayString ? activeDate.toISOString() : new Date().toISOString());
    if (mealTime) {
      timeStr = mealTime;
      const d = activeDateString !== todayString ? new Date(activeDate) : new Date();
      const [h, m] = mealTime.split(":");
      d.setHours(parseInt(h, 10));
      d.setMinutes(parseInt(m, 10));
      loggedAtStr = d.toISOString();
    }
    const newFood: LoggedFood = {
      id: mealToReplace ? mealToReplace.id : Date.now().toString(),
      name: food.name,
      calories: Math.round(food.calories * multiplier),
      protein: Math.round(food.protein * multiplier),
      carbs: Math.round(food.carbs * multiplier),
      fat: Math.round(food.fat * multiplier),
      portion: customPortion || food.portion,
      time: timeStr,
      loggedAt: loggedAtStr,
      slot: (slotOverride || activeSlot || (mealToReplace as unknown as LoggedFood)?.slot || assignedSlot) as any,
    };

    if (mealToReplace) {
      setTodaysLogs((prev) => ({ ...prev, foods: prev.foods.map((f) => (f.id === mealToReplace.id ? newFood : f)) }));
      setMealToReplace(null);
    } else {
      setTodaysLogs((prev) => ({ ...prev, foods: [...prev.foods, newFood] }));
      try {
        const key = getFoodKey({ name: food.name, brand: (food as any).brand, isCustom: (food as any).isCustom });
        const raw = getItem("synk:foodHistory");
        const history: Record<string, { count: number; lastUsed: string }> = raw ? JSON.parse(raw) : {};
        const existing = history[key] || { count: 0, lastUsed: "" };
        history[key] = { count: existing.count + 1, lastUsed: new Date().toISOString() };
        setItem("synk:foodHistory", JSON.stringify(history));
      } catch {}
    }

    setSelectedFood(null);
    setPortionValue("");
    setIsSearchOpen(false);
    setSearchQuery("");
    setActiveSlot(null);
    flashToast("add");
  };

  // F2 — "Use this plan today": append the plan's suggested meals to the active
  // day's diary (mapping each mealStructure label to a valid diary slot id),
  // guarding against double-logging via the isCoachSuggested flag.
  const handleUsePlanToday = () => {
    const plan = user.nutritionPlan as CoachNutritionPlan | undefined;
    if (!plan) return;

    if (todaysLogs.foods.some((f) => (f as LoggedFood).isCoachSuggested)) {
      showGlobalToast(isArabic ? "خطة المدرب مضافة بالفعل لهذا اليوم" : "Coach plan already added to this day", "info");
      return;
    }

    const validIds = MEAL_SLOTS.map((s) => s.id);
    const firstSlot = (MEAL_SLOTS[0]?.id || "breakfast") as LoggedFood["slot"];
    const labelToSlotId = (label: string): LoggedFood["slot"] => {
      const l = label.toLowerCase();
      if (l.includes("breakfast")) return validIds.includes("breakfast") ? "breakfast" : firstSlot;
      if (l.includes("lunch")) return validIds.includes("lunch") ? "lunch" : (slotForHour(12, user.mealsPerDay ?? 4) as LoggedFood["slot"]);
      if (l.includes("dinner")) return validIds.includes("dinner") ? "dinner" : firstSlot;
      if (l.includes("pre-workout") || l.includes("morning")) return validIds.includes("snack1") ? "snack1" : validIds.includes("snack") ? "snack" : firstSlot;
      if (l.includes("evening") || l.includes("afternoon")) return validIds.includes("snack2") ? "snack2" : validIds.includes("snack") ? "snack" : validIds.includes("dinner") ? "dinner" : firstSlot;
      if (l.includes("snack")) return validIds.includes("snack") ? "snack" : validIds.includes("snack1") ? "snack1" : firstSlot;
      return firstSlot;
    };

    const nowIso = activeDateString !== todayString ? activeDate.toISOString() : new Date().toISOString();
    const timeStr = new Date(nowIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const stamp = Date.now();

    const newFoods: LoggedFood[] = [];
    (plan.mealStructure || []).forEach((label, li) => {
      const meals = (plan.suggestedMeals?.[label] || []) as SuggestedMeal[];
      meals.forEach((m, mi) => {
        newFoods.push({
          id: `${stamp}-${li}-${mi}`,
          name: m.name,
          calories: Math.round(m.calories),
          protein: Math.round(m.protein),
          carbs: Math.round(m.carbs),
          fat: Math.round(m.fat),
          portion: isArabic ? "حصة واحدة" : "1 serving",
          time: timeStr,
          loggedAt: nowIso,
          slot: labelToSlotId(label),
          isCoachSuggested: true,
        });
      });
    });

    if (newFoods.length === 0) {
      showGlobalToast(isArabic ? "مفيش وجبات مقترحة في الخطة" : "No suggested meals in this plan", "info");
      return;
    }

    setTodaysLogs((prev) => ({ ...prev, foods: [...prev.foods, ...newFoods] }));
    showGlobalToast(
      isArabic ? `تمت إضافة ${newFoods.length} وجبة من خطة المدرب` : `Added ${newFoods.length} meals from your coach plan`,
      "success",
    );
  };

  const aiSuggestions = useMemo<{ id: string; text: string }[]>(() => {
    const s: { id: string; text: string }[] = [];
    if (totals.protein < targets.protein * 0.6) {
      s.push({ id: "protein-1", text: isArabic ? "زود استهلاكك للبروتين! أنت حالياً أقل من هدفك. إضافة ١٠٠ جم دجاج بتساعدك توصل لهدفك." : "Boost your protein intake! You're currently below your target. Adding 100g of grilled chicken would help hit your goal." });
    }
    if (totals.fat > targets.fat * 0.8) {
      s.push({ id: "fat-1", text: isArabic ? "أنت قريب من حد الدهون لليوم. حاول تاكل أكل أخف زي السمك الأبيض في وجبتك الجاية." : "You're approaching your fat limit for today. Consider leaner options like white fish for your next meal." });
    }
    s.push({ id: "hydration-1", text: isArabic ? "اشرب مياه كتير! شرب المياه قبل الوجبة بيساعد على الهضم والشبع." : "Stay hydrated! Drinking water before meals can help with digestion and satiety." });
    return s.filter((x) => !dismissedSuggestions.has(x.id));
  }, [totals, targets, isArabic, dismissedSuggestions]);

  // =====================================================================
  // Small style atoms
  // =====================================================================
  const card = {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    padding: 16,
  } as const;
  const circleBtn = {
    width: 44, height: 44, borderRadius: 22, alignItems: "center" as const, justifyContent: "center" as const,
    backgroundColor: "rgba(210,210,215,0.64)",
  };
  const primaryFill = withAlpha(colors.primary, isDark ? 0.1 : 0.05);
  const subtle = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  const sectionLabel = (text: string, color = colors.inkMuted48) => (
    <AppText style={{ fontSize: 11, fontWeight: "600", color, textTransform: "uppercase", letterSpacing: 1, fontFamily: ff(isArabic, 600) }}>
      {text}
    </AppText>
  );

  const progressBar = (value: number, target: number) => (
    <View style={{ height: 2, width: "100%", backgroundColor: withAlpha(colors.primary, 0.1), borderRadius: 9999, overflow: "hidden", marginVertical: 8 }}>
      <View style={{ height: "100%", backgroundColor: colors.primary, width: `${Math.min(100, (value / Math.max(1, target)) * 100)}%`, borderRadius: 9999 }} />
    </View>
  );

  const macroCol = (label: string, value: number, target: number) => (
    <View style={{ flex: 1, alignItems: "center" }}>
      {sectionLabel(label, colors.primary)}
      <View style={{ width: "100%", marginTop: 6 }}>{progressBar(value, target)}</View>
      <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink }}>
        {Math.round(value)}
        <AppText style={{ fontSize: 12, color: colors.inkMuted48 }}> / {target}g</AppText>
      </AppText>
    </View>
  );

  // =====================================================================
  // Card renderers
  // =====================================================================
  const renderCoachPlan = () => {
    if (!user.nutritionPlan || !nutritionCards.coachPlan) return null;
    const p = user.nutritionPlan as any;
    return (
      <View key="coachPlan" style={{ backgroundColor: colors.canvas, borderWidth: 2, borderColor: withAlpha(colors.primary, isDark ? 0.1 : 0.2), borderRadius: 12, padding: 20, marginBottom: 8, overflow: "hidden" }}>
        <View style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", backgroundColor: colors.primary }} />
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <CoachAvatar coachId={user.coach || "khaled"} size={32} />
          <View>
            <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textAlign: isArabic ? "right" : "left" }}>
              {isArabic ? "خطة التغذية الخاصة بك" : "Your Nutrition Plan"}
            </AppText>
            <AppText style={{ fontSize: 12, color: colors.inkMuted48, textAlign: isArabic ? "right" : "left" }}>
              {isArabic ? "بناءً على أهدافك" : "Based on your goals"}
            </AppText>
          </View>
        </View>
        {!!p.coachExplanation && (
          <View style={{ backgroundColor: primaryFill, borderRadius: 8, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: withAlpha(colors.primary, 0.1) }}>
            <AppText style={{ fontSize: 14, color: colors.ink, lineHeight: 20, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>
              {p.coachExplanation}
            </AppText>
          </View>
        )}
        <View style={{ marginBottom: 16 }}>
          {sectionLabel(isArabic ? "السعرات اليومية" : "DAILY TARGET")}
          <AppText style={{ fontSize: 28, fontWeight: "600", color: colors.ink, marginTop: 4, textAlign: isArabic ? "right" : "left" }}>
            {(p.dailyCalories ?? 0).toLocaleString()}
            <AppText style={{ fontSize: 15, color: colors.inkMuted48 }}> kcal</AppText>
          </AppText>
        </View>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12, marginBottom: 24 }}>
          {[
            { l: isArabic ? "بروتين" : "Prot", v: p.proteinTarget },
            { l: isArabic ? "كربوهيدرات" : "Carbs", v: p.carbsTarget },
            { l: isArabic ? "دهون" : "Fats", v: p.fatsTarget },
          ].map((m, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: colors.canvasParchment, padding: 10, borderRadius: 8, alignItems: "center" }}>
              {sectionLabel(m.l, colors.primary)}
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, marginTop: 4 }}>{m.v}g</AppText>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
          <Pressable onPress={handleUsePlanToday} style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center", fontFamily: ff(isArabic, 600) }}>{isArabic ? "استخدم هذه الخطة اليوم" : "Use this plan today"}</AppText>
          </Pressable>
          <Pressable onPress={() => router.push("/nutrition-plan")} style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
            <AppText style={{ color: colors.ink, fontSize: 14, fontWeight: "600", fontFamily: ff(isArabic, 600) }}>{isArabic ? "تعديل الخطة" : "Adjust plan"}</AppText>
          </Pressable>
        </View>
      </View>
    );
  };

  const detailedNutrientRows = (entries: { label: string; val: number; unit: string }[]) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", paddingTop: 16 }}>
      {entries.map((n, idx) => (
        <View key={idx} style={{ width: "48%", marginRight: idx % 2 === 0 ? "4%" : 0, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingBottom: 4, marginBottom: 12 }}>
          <AppText style={{ fontSize: 12, color: colors.inkMuted48 }}>{n.label}</AppText>
          <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}>{Math.round(n.val)}{n.unit}</AppText>
        </View>
      ))}
    </View>
  );

  const renderSummary = () => {
    if (!nutritionCards.summary) return null;
    if (viewMode === "daily") {
      return (
        <View key="summary" style={card}>
          <View style={{ borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingBottom: 16, marginBottom: 16 }}>
            {sectionLabel(goalMessage, withAlpha(colors.primary, 0.8))}
          </View>
          <View style={{ marginBottom: 24 }}>
            {sectionLabel("REMAINING", colors.primary)}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <AppText style={{ fontSize: 32, fontWeight: "600", color: colors.ink }}>
                {Math.max(0, (targets.calories || 0) - totals.calories).toLocaleString()}
              </AppText>
              <AppText style={{ fontSize: 13, color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 0.5 }}>OF {targets.calories} KCAL</AppText>
            </View>
          </View>
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 20 }}>
            {macroCol("PROT", totals.protein, targets.protein)}
            {macroCol("CARBS", totals.carbs, targets.carbs)}
            {macroCol("FATS", totals.fat, targets.fat)}
          </View>
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.hairline }}>
            <Pressable onPress={() => setShowDetailedNutrients(!showDetailedNutrients)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              {sectionLabel(isArabic ? "تفاصيل العناصر الغذائية" : "DETAILED NUTRIENTS")}
              {showDetailedNutrients ? <ChevronUp size={16} color={colors.inkMuted48} /> : <ChevronDown size={16} color={colors.inkMuted48} />}
            </Pressable>
            {showDetailedNutrients &&
              detailedNutrientRows([
                { label: "Sodium", val: totals.sodium, unit: "mg" },
                { label: "Calcium", val: totals.calcium, unit: "mg" },
                { label: "Potassium", val: totals.potassium, unit: "mg" },
                { label: "Iron", val: totals.iron, unit: "mg" },
                { label: "Fiber", val: totals.fiber, unit: "g" },
                { label: "Sugar", val: totals.sugar, unit: "g" },
                { label: "Sat Fat", val: totals.saturatedFat, unit: "g" },
                { label: "Cholesterol", val: totals.cholesterol, unit: "mg" },
              ])}
          </View>
        </View>
      );
    }
    // weekly
    return (
      <View key="summary" style={card}>
        {weeklyTotals.daysLogged === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: "center" }}>
            <AppText style={{ fontSize: 14, fontWeight: "500", color: colors.inkMuted48 }}>{isArabic ? "لم يتم تسجيل وجبات هذا الأسبوع بعد" : "No meals logged this week yet"}</AppText>
          </View>
        ) : (
          <>
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.hairline, paddingBottom: 16, marginBottom: 16 }}>
              {sectionLabel(`${goalMessage} - ${isArabic ? "معدل الأسبوع" : "WEEKLY AVERAGE"}`, withAlpha(colors.primary, 0.8))}
            </View>
            <View style={{ marginBottom: 24 }}>
              {sectionLabel(isArabic ? "متوسط الأسبوع" : "WEEKLY AVG", colors.primary)}
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                <AppText style={{ fontSize: 32, fontWeight: "600", color: colors.ink }}>{weeklyTotals.avgCalories.toLocaleString()}</AppText>
                <AppText style={{ fontSize: 13, color: colors.inkMuted48, textTransform: "uppercase" }}>{isArabic ? "سعر/يوم" : "KCAL / DAY"}</AppText>
              </View>
              <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 4 }}>
                {isArabic ? `إجمالي سعرات الأسبوع: ${weeklyTotals.calories.toLocaleString()}` : `TOTAL WEEK CALORIES: ${weeklyTotals.calories.toLocaleString()}`}
              </AppText>
            </View>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 20 }}>
              {macroCol(isArabic ? "بروتين" : "AVG PROT", weeklyTotals.avgProtein, targets.protein)}
              {macroCol(isArabic ? "كارب" : "AVG CARBS", weeklyTotals.avgCarbs, targets.carbs)}
              {macroCol(isArabic ? "دهون" : "AVG FATS", weeklyTotals.avgFat, targets.fat)}
            </View>
            <Pressable onPress={exportWeeklyData} style={{ marginTop: 20, height: 44, borderRadius: 9999, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Download size={16} color={colors.ink} />
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 0.5, fontFamily: ff(isArabic, 600) }}>{isArabic ? "تصدير الأسبوع (JSON)" : "Export week (JSON)"}</AppText>
            </Pressable>
          </>
        )}
      </View>
    );
  };

  const renderMeals = () => (
    <View key="meals" style={{ gap: 24 }}>
      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 }}>
        <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: ff(isArabic, 600) }}>
          {activeDateString === todayString ? (isArabic ? "وجبات اليوم" : "TODAY'S MEALS") : isFuture ? (isArabic ? "الوجبات المخططة" : "PLANNED MEALS") : isArabic ? "الوجبات السابقة" : "PAST MEALS"}
        </AppText>
      </View>
      {MEAL_SLOTS.map((slot) => {
        const items = mealGroups[slot.id] || [];
        const slotCalories = items.reduce((acc, item) => acc + item.calories, 0);
        return (
          <View key={slot.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 4 }}>
              <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: ff(isArabic, 600) }}>
                  {isArabic ? slot.labelAr : slot.labelEn}
                </AppText>
                {slotCalories > 0 && <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2 }}>{slotCalories} KCAL</AppText>}
              </View>
              {items.length > 0 && (
                <Pressable onPress={() => { setActiveSlot(slot.id); setIsSearchOpen(true); }} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                  <Plus size={14} strokeWidth={2.5} color={colors.primary} />
                  <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, textTransform: "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إضافة" : "ADD FOOD"}</AppText>
                </Pressable>
              )}
            </View>
            <View style={{ gap: 12 }}>
              {items.map((meal) => (
                <View key={meal.id} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                  <Pressable onPress={() => handleEditMeal(meal as LoggedFood)} style={{ flex: 1, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 12, flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, textTransform: "uppercase" }} numberOfLines={1}>{meal.name}</AppText>
                      <AppText style={{ fontSize: 11, color: colors.inkMuted48, marginTop: 2 }}>{meal.portion}</AppText>
                    </View>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                      {isFuture && (
                        <View style={{ backgroundColor: withAlpha(colors.semanticOrange, 0.1), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 }}>
                          <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.semanticOrange, textTransform: "uppercase" }}>{isArabic ? "مخطط" : "PLANNED"}</AppText>
                        </View>
                      )}
                      <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{meal.calories} KCAL</AppText>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setTodaysLogs((prev) => ({ ...prev, foods: prev.foods.filter((f) => f.id !== meal.id) }));
                      flashToast("delete");
                    }}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: withAlpha(colors.semanticRed, 0.1), alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={18} color={colors.semanticRed} />
                  </Pressable>
                </View>
              ))}
              {items.length === 0 && (
                <Pressable onPress={() => { setActiveSlot(slot.id); setIsSearchOpen(true); }} style={{ backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, borderStyle: "dashed", borderRadius: 10, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                  <Plus size={14} color={colors.inkMuted48} />
                  <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.inkMuted48, textTransform: "uppercase", fontFamily: ff(isArabic) }}>{isArabic ? "إضافة طعام" : "ADD FOOD"}</AppText>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderAiCoaching = () => {
    if (!nutritionCards.aiCoaching || aiSuggestions.length === 0) return null;
    return (
      <View key="aiCoaching" style={{ gap: 12 }}>
        <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 4, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>
          {isArabic ? "مدرب الذكاء الاصطناعي" : "AI COACHING"}
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 4, flexDirection: isArabic ? "row-reverse" : "row" }}>
          {aiSuggestions.map((s) => (
            <View key={s.id} style={{ width: 260, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 12, flexDirection: isArabic ? "row-reverse" : "row", gap: 12 }}>
              <Pressable onPress={() => setDismissedSuggestions((prev) => new Set(prev).add(s.id))} style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                <X size={10} color={colors.inkMuted48} />
              </Pressable>
              <CoachAvatar coachId={user.coach || "khaled"} size={32} />
              <AppText style={{ flex: 1, fontSize: 11, color: colors.ink, lineHeight: 15, paddingRight: 16, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{s.text}</AppText>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAiPick = () => {
    if (!nutritionCards.aiPick) return null;
    let suggestions = allAvailableFoods;
    const h = new Date().getHours();
    if (h >= 4 && h < 11) suggestions = allAvailableFoods.filter((f) => /Oat|Egg|Banana|Yogurt|Avocado|Foul|Ta3miyya/.test(f.name));
    else if (h >= 11 && h < 15) suggestions = allAvailableFoods.filter((f) => !/Oat|Egg|Pancake/.test(f.name));
    else if (h >= 15 && h < 21) suggestions = allAvailableFoods.filter((f) => /Chicken|Rice|Beef|Salmon|Sweet Potato|Koshary|Shawarma/.test(f.name));
    if (suggestions.length < 6) suggestions = allAvailableFoods;

    return (
      <View key="aiPick" style={{ gap: 12, paddingTop: 16 }}>
        <View style={{ paddingHorizontal: 4 }}>
          <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إضافة سريعة" : "QUICK ADD"}</AppText>
          <AppText style={{ fontSize: 13, color: colors.inkMuted48, textAlign: isArabic ? "right" : "left" }}>{isArabic ? "اقتراحات حسب الوقت والروتين." : "Suggested from your routine and time of day."}</AppText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, flexDirection: isArabic ? "row-reverse" : "row" }}>
          {suggestions.slice(0, 6).map((food, i) => {
            const fb = foodFeedback[food.name];
            const isLiked = fb === "liked";
            const isDisliked = fb === "disliked";
            return (
              <View key={i} style={{ width: 140, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 16, opacity: isDisliked ? 0.6 : 1 }}>
                <Pressable onPress={() => addMeal(food, 1, food.portion)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                  <Plus size={16} strokeWidth={2.5} color="#fff" />
                </Pressable>
                <Pressable onPress={() => setSelectedFood(food)}>
                  <Utensils size={18} color={colors.primary} style={{ marginBottom: 12 }} />
                  <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, textTransform: "uppercase", lineHeight: 16, marginBottom: 4 }} numberOfLines={2}>
                    {isArabic && (food as any).nameAr ? (food as any).nameAr : food.name}
                  </AppText>
                  <AppText style={{ fontSize: 13, color: colors.primary, textTransform: "uppercase" }}>{food.calories} KCAL</AppText>
                  <View style={{ flexDirection: "row", gap: 12, paddingTop: 6, marginBottom: 12 }}>
                    {[["P", food.protein], ["C", food.carbs], ["F", food.fat]].map(([l, v]) => (
                      <View key={l as string} style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                        <AppText style={{ fontSize: 8, fontWeight: "600", color: colors.inkMuted48 }}>{l}</AppText>
                        <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.ink }}>{v}</AppText>
                      </View>
                    ))}
                  </View>
                </Pressable>
                <View style={{ flexDirection: "row", gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.hairline }}>
                  <Pressable onPress={() => handleFoodFeedback(food.name, "liked")} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                    <ThumbsUp size={16} color={isLiked ? colors.primary : colors.inkMuted48} />
                  </Pressable>
                  <Pressable onPress={() => handleFoodFeedback(food.name, "disliked")} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                    <ThumbsDown size={16} color={colors.inkMuted48} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const waterPearlBtn = (label: string, onPress: () => void, disabled = false, flex = false) => (
    <Pressable key={label} onPress={onPress} disabled={disabled} style={{ flex: flex ? 1 : undefined, height: 40, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center", opacity: disabled ? 0.3 : 1 }}>
      <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.inkMuted80 }}>{label}</AppText>
    </Pressable>
  );

  const renderHydration = () => {
    if (!nutritionCards.hydration) return null;
    return (
      <View key="hydration" style={{ ...card, padding: 24 }}>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-end" }}>
          <View style={{ alignItems: isArabic ? "flex-end" : "flex-start" }}>
            {sectionLabel(isArabic ? "الترطيب" : "HYDRATION", colors.primary)}
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "baseline", gap: 6, marginTop: 6 }}>
              <AppText style={{ fontSize: 22, fontWeight: "600", color: colors.ink }}>{waterIntake.toLocaleString()}</AppText>
              <AppText style={{ fontSize: 15, color: colors.inkMuted48 }}>/ {targets.water.toLocaleString()} {isArabic ? "مل" : "ML"}</AppText>
            </View>
          </View>
          <Pressable onPress={() => setWaterIntake(0)}>
            <AppText style={{ fontSize: 11, color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: isArabic ? 0 : 0.5, fontFamily: ff(isArabic) }}>{isArabic ? "إعادة" : "Reset"}</AppText>
          </Pressable>
        </View>
        <View style={{ height: 6, width: "100%", backgroundColor: colors.hairline, borderRadius: 9999, overflow: "hidden", marginVertical: 16 }}>
          <View style={{ height: "100%", backgroundColor: colors.primary, width: `${Math.min(100, (waterIntake / Math.max(1, targets.water)) * 100)}%`, borderRadius: 9999 }} />
        </View>
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8, marginBottom: 12 }}>
          {waterPearlBtn("−", () => {
            const now = Date.now();
            if (now - lastTapRef.current < 300) return;
            lastTapRef.current = now;
            setWaterIntake(Math.max(0, waterIntake - (parseInt(customWaterAmount) || 250)));
          }, waterIntake <= 0)}
          <TextInput
            value={customWaterAmount}
            onChangeText={setCustomWaterAmount}
            keyboardType="number-pad"
            placeholder={isArabic ? "كمية مخصصة (مل)" : "Custom ml..."}
            placeholderTextColor={colors.inkMuted48}
            style={{ flex: 1, height: 40, paddingHorizontal: 12, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, fontSize: 14, fontWeight: "600", color: colors.ink, textAlign: "center" }}
          />
          {waterPearlBtn("+", () => {
            const now = Date.now();
            if (now - lastTapRef.current < 300) return;
            lastTapRef.current = now;
            setWaterIntake(waterIntake + (parseInt(customWaterAmount) || 250));
          })}
        </View>
        {sectionLabel(isArabic ? "إضافة سريعة" : "QUICK ADD")}
        <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8, marginTop: 8 }}>
          {[100, 500, 1000].map((amount) =>
            waterPearlBtn(`+${amount}ml`, () => {
              const now = Date.now();
              if (now - lastTapRef.current < 300) return;
              lastTapRef.current = now;
              setWaterIntake(waterIntake + amount);
            }, false, true),
          )}
        </View>
      </View>
    );
  };

  const renderCard = (key: string) => {
    switch (key) {
      case "coachPlan": return viewMode === "daily" ? renderCoachPlan() : null;
      case "summary": return renderSummary();
      case "meals": return viewMode === "daily" ? renderMeals() : null;
      case "aiCoaching": return viewMode === "daily" ? renderAiCoaching() : null;
      case "aiPick": return viewMode === "daily" ? renderAiPick() : null;
      case "hydration": return viewMode === "daily" ? renderHydration() : null;
      default: return null;
    }
  };

  const slotPickerGrid = (selected: string | null, onSelect: (id: string) => void) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {MEAL_SLOTS.map((slot) => {
        const active = selected === slot.id;
        return (
          <Pressable key={slot.id} onPress={() => onSelect(slot.id)} style={{ width: MEAL_SLOTS.length <= 4 ? "48%" : "31%", paddingVertical: 8, borderRadius: 10, backgroundColor: active ? colors.primary : subtle, alignItems: "center" }}>
            <AppText style={{ fontSize: 12, fontWeight: "600", color: active ? "#fff" : colors.inkMuted48, fontFamily: ff(isArabic, 600) }}>{isArabic ? slot.labelAr : slot.labelEn}</AppText>
          </Pressable>
        );
      })}
    </View>
  );

  // =====================================================================
  // Render
  // =====================================================================
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
      {/* Header */}
      <View style={{ paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20, alignItems: "center", backgroundColor: colors.canvasParchment }}>
        <Pressable onPress={() => setShowCustomizeSheet(true)} style={{ position: "absolute", top: 16, right: 20, width: 28, height: 28, alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          <SlidersHorizontal size={14} color={colors.inkMuted48} />
        </Pressable>
        <View style={{ flexDirection: "row", backgroundColor: subtle, borderRadius: 9999, padding: 4, marginBottom: 16, width: 240 }}>
          {(["daily", "weekly"] as const).map((m) => {
            const active = viewMode === m;
            return (
              <Pressable key={m} onPress={() => { setViewMode(m); if (m === "daily") setWeekOffset(0); }} style={{ flex: 1, paddingVertical: 6, borderRadius: 9999, alignItems: "center", backgroundColor: active ? colors.canvas : "transparent" }}>
                <AppText style={{ fontSize: 12, fontWeight: "600", color: active ? colors.ink : colors.inkMuted48 }}>
                  {m === "daily" ? (isArabic ? "يومياً" : "DAILY") : isArabic ? "أسبوعياً" : "WEEKLY"}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {viewMode === "daily" && (
          <DateNavigator date={activeDate} onChange={setActiveDate} isArabic={isArabic} />
        )}

        {viewMode === "weekly" && (
          <>
            <View style={{ backgroundColor: primaryFill, borderWidth: 1, borderColor: withAlpha(colors.primary, 0.15), borderRadius: 10, padding: 12, marginBottom: 16, width: "100%", flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 8 }}>
              <Info size={14} color={colors.primary} style={{ marginTop: 2 }} />
              <AppText style={{ flex: 1, fontSize: 13, color: colors.primary, lineHeight: 18, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>
                {isArabic ? "العرض الأسبوعي بيعرض اتجاهاتك — للتسجيل رجّع لليومي." : "Weekly view shows your trends — switch to Daily to log meals."}
              </AppText>
            </View>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 12, width: "100%" }}>
              <Pressable onPress={() => setWeekOffset((w) => w - 1)} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
              <View style={{ flex: 1, alignItems: "center" }}>
                <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink }} numberOfLines={1}>
                  {weekOffset === 0 ? (isArabic ? "هذا الأسبوع" : "THIS WEEK") : weekOffset === -1 ? (isArabic ? "الأسبوع الماضي" : "LAST WEEK") : `${Math.abs(weekOffset)} ${isArabic ? "أسابيع مضت" : "weeks ago"}`}
                </AppText>
                <AppText style={{ fontSize: 13, color: colors.inkMuted48 }} numberOfLines={1}>
                  {`${weeklyTotals.weekStart.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { day: "numeric", month: "short" })} – ${weeklyTotals.weekEnd.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { day: "numeric", month: "short" })}`}
                </AppText>
              </View>
              <Pressable onPress={() => weekOffset < 0 && setWeekOffset((w) => w + 1)} disabled={weekOffset >= 0} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center", opacity: weekOffset >= 0 ? 0.4 : 1 }}>
                <ChevronRight size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
            </View>
          </>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, gap: 20, maxWidth: 448, width: "100%", alignSelf: "center" }}
      >
        {/* Search bar + quick actions (daily only) */}
        {viewMode === "daily" && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
              <Pressable onPress={() => { setSearchQuery(""); setActiveSlot(null); setIsSearchOpen(true); }} style={{ flex: 1, height: 44, borderRadius: 9999, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 }}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                  <Search size={18} color={colors.inkMuted48} />
                  <AppText style={{ fontSize: 15, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{isArabic ? "ابحث عن وجبات..." : "Search dishes..."}</AppText>
                </View>
                <ChevronRight size={18} color={colors.inkMuted48} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
              <Pressable onPress={() => router.push("/voice-log")} style={circleBtn}>
                <Mic size={20} color={colors.ink} />
              </Pressable>
              <Pressable onPress={handleScanLabel} style={circleBtn}>
                <Camera size={20} color={colors.ink} />
              </Pressable>
            </View>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
              <Pressable
                onPress={() => { setQuickAdd({ name: "", calories: "", protein: "", carbs: "", fat: "", slot: activeSlot || slotForHour(new Date().getHours(), user.mealsPerDay ?? 4) }); setIsQuickAddOpen(true); }}
                style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: withAlpha(colors.primary, 0.1), borderWidth: 1, borderColor: withAlpha(colors.primary, 0.2), flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Plus size={16} color={colors.primary} />
                <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, textTransform: "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إضافة سريعة" : "QUICK ADD"}</AppText>
              </Pressable>
              <Pressable onPress={() => setShowMoreActions(!showMoreActions)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(210,210,215,0.64)", alignItems: "center", justifyContent: "center" }}>
                <MoreHorizontal size={20} color={colors.ink} />
              </Pressable>
            </View>
            {showMoreActions && (
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
                {[
                  { lbl: isArabic ? "إنشاء طعام" : "FOOD", onPress: () => { setShowMoreActions(false); setIsCustomFoodOpen(true); } },
                  { lbl: isArabic ? "إنشاء وجبة" : "MEAL", onPress: () => { setShowMoreActions(false); setIsCustomMealOpen(true); } },
                  { lbl: isArabic ? "وصفة" : "RECIPE", onPress: () => { setShowMoreActions(false); setIsRecipeBuilderOpen(true); } },
                ].map(({ lbl, onPress }) => (
                  <Pressable key={lbl} onPress={onPress} style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <Plus size={12} color={colors.inkMuted80} />
                    <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted80 }} numberOfLines={1}>{lbl}</AppText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {nutritionCardOrder.map((key) => {
          const el = renderCard(key);
          return el ? <React.Fragment key={key}>{el}</React.Fragment> : null;
        })}
      </ScrollView>

      <CoachIcon coachId={user.coach || "khaled"} onPress={() => router.push("/coach")} />

      {/* ===== Search Overlay ===== */}
      <Modal visible={isSearchOpen} animationType="slide" onRequestClose={() => { setIsSearchOpen(false); setActiveSlot(null); }}>
        <View style={{ flex: 1, backgroundColor: colors.canvasParchment }}>
          <View style={{ paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: colors.canvas, borderBottomWidth: 1, borderBottomColor: colors.hairline, gap: 16 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
              <Pressable onPress={() => { setIsSearchOpen(false); setActiveSlot(null); }} style={circleBtn}>
                <ArrowLeft size={20} color={colors.ink} style={{ transform: [{ scaleX: isArabic ? -1 : 1 }] }} />
              </Pressable>
              <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: "uppercase" }}>
                {isArabic ? `إضافة إلى ${activeSlotLabelAr || "الوجبة"}` : `ADD TO ${activeSlotName || "MEAL"}`}
              </AppText>
            </View>
            <View style={{ position: "relative", justifyContent: "center" }}>
              <Search size={18} color={colors.inkMuted48} style={{ position: "absolute", left: isArabic ? undefined : 16, right: isArabic ? 16 : undefined, zIndex: 1 }} />
              <TextInput
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={isArabic ? "ابحث عن الأطعمة..." : "Search foods..."}
                placeholderTextColor={colors.inkMuted48}
                style={{ height: 44, paddingHorizontal: 44, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 9999, fontSize: 15, color: colors.ink, textAlign: isArabic ? "right" : "left" }}
              />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24, gap: 12 }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 }}>
              {sectionLabel(searchQuery ? (isArabic ? "نتائج البحث" : "SEARCH RESULTS") : isArabic ? "أطعمة حديثة" : "RECENT FOODS")}
              {!searchQuery && (
                <Pressable onPress={() => setHistorySort((s) => (s === "recent" ? "frequent" : s === "frequent" ? "alphabetical" : "recent"))}>
                  <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: "uppercase" }}>
                    {historySort === "recent" ? (isArabic ? "الأحدث" : "MOST RECENT") : historySort === "frequent" ? (isArabic ? "الأكثر تكراراً" : "MOST FREQUENT") : isArabic ? "أبجدياً" : "ALPHABETICAL"}
                  </AppText>
                </Pressable>
              )}
            </View>

            {searchQuery && displayFoods.length === 0 ? (
              <View style={{ paddingVertical: 48, alignItems: "center", gap: 24 }}>
                <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.inkMuted48 }}>No results for "{searchQuery}"</AppText>
              </View>
            ) : (
              displayFoods.map((food, i) => (
                <Pressable key={i} onPress={() => setSelectedFood(food)} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, flexDirection: isArabic ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start", paddingRight: isArabic ? 0 : 16, paddingLeft: isArabic ? 16 : 0 }}>
                    <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 8 }}>
                      <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink }} numberOfLines={1}>
                        {isArabic && (food as any).nameAr ? (food as any).nameAr : food.name}
                      </AppText>
                      {(food as any).region === "egypt" && (
                        <View style={{ backgroundColor: withAlpha(colors.primary, 0.1), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.primary }}>{isArabic ? "مصري" : "EG"}</AppText>
                        </View>
                      )}
                      {food.verified ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: withAlpha(colors.primary, 0.1), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <CheckCircle2 size={10} strokeWidth={3} color={colors.primary} />
                          <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.primary, textTransform: "uppercase" }}>Verified</AppText>
                        </View>
                      ) : food.isCustom ? (
                        <View style={{ backgroundColor: subtle, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase" }}>Custom</AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText style={{ fontSize: 11, fontWeight: "500", color: colors.inkMuted48, textTransform: "uppercase", marginTop: 2 }}>{food.brand || food.portion}</AppText>
                  </View>
                  <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                    <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary, textTransform: "uppercase" }}>{food.calories} kcal</AppText>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: subtle, alignItems: "center", justifyContent: "center" }}>
                      <Plus size={16} strokeWidth={2.5} color={colors.ink} />
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ===== Portion Modal ===== */}
      <Modal visible={selectedFood !== null} transparent animationType="fade" onRequestClose={() => { setSelectedFood(null); setMealToReplace(null); }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }} onPress={() => { setSelectedFood(null); setMealToReplace(null); }}>
          {selectedFood && (
            <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 24, width: "100%", maxWidth: 340, maxHeight: "85%" }}>
              <Pressable onPress={() => { setSelectedFood(null); setMealToReplace(null); }} style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                <X size={18} color={colors.inkMuted48} />
              </Pressable>
              <ScrollView showsVerticalScrollIndicator={false}>
                <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, textTransform: "uppercase", textAlign: "center", paddingRight: 24 }}>{selectedFood.name}</AppText>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginTop: 4, marginBottom: 16 }}>{isArabic ? "تعديل الحصة" : "ADJUST PORTION"}</AppText>

                {selectedFood.portionOptions && selectedFood.portionOptions.length > 1 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
                    {selectedFood.portionOptions.map((opt, idx) => {
                      const active = selectedPortionOptionIdx === idx;
                      return (
                        <Pressable key={idx} onPress={() => { setSelectedPortionOptionIdx(idx); setPortionValue(opt.isGramBased ? parseFloat(selectedFood.portion) || 100 : 1); }} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: active ? colors.primary : subtle }}>
                          <AppText style={{ fontSize: 12, fontWeight: "600", color: active ? "#fff" : colors.ink }}>{opt.label}</AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 24 }}>
                  <Pressable onPress={handleDecreasePortion} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink }}>−</AppText>
                  </Pressable>
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, paddingHorizontal: 12, width: 112, height: 48 }}>
                    <TextInput value={String(portionValue)} onChangeText={setPortionValue} keyboardType="numeric" style={{ flex: 1, fontSize: 22, fontWeight: "600", color: colors.ink, textAlign: "center" }} />
                    <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.inkMuted48 }}>{isGramBased ? "g" : "x"}</AppText>
                  </View>
                  <Pressable onPress={handleIncreasePortion} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.canvasParchment, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                    <AppText style={{ fontSize: 20, fontWeight: "600", color: colors.ink }}>+</AppText>
                  </Pressable>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                  {[
                    { l: isArabic ? "طاقة" : "ENERGY", v: Math.round(selectedFood.calories * computedMultiplier), u: " kcal", primary: true },
                    { l: isArabic ? "بروتين" : "PROTEIN", v: Math.round(selectedFood.protein * computedMultiplier), u: "g" },
                    { l: isArabic ? "كارب" : "CARBS", v: Math.round(selectedFood.carbs * computedMultiplier), u: "g" },
                    { l: isArabic ? "دهون" : "FAT", v: Math.round(selectedFood.fat * computedMultiplier), u: "g" },
                  ].map((m, i) => (
                    <View key={i} style={{ width: "47%", backgroundColor: colors.canvasParchment, padding: 16, borderRadius: 8 }}>
                      <AppText style={{ fontSize: 9, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{m.l}</AppText>
                      <AppText style={{ fontSize: 17, fontWeight: "600", color: m.primary ? colors.primary : colors.ink }}>{m.v}{m.u}</AppText>
                    </View>
                  ))}
                </View>

                <Pressable onPress={() => setShowFoodDetailedNutrients(!showFoodDetailedNutrients)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, marginBottom: 8 }}>
                  {sectionLabel(isArabic ? "تفاصيل العناصر الغذائية" : "DETAILED NUTRIENTS")}
                  {showFoodDetailedNutrients ? <ChevronUp size={16} color={colors.inkMuted48} /> : <ChevronDown size={16} color={colors.inkMuted48} />}
                </Pressable>
                {showFoodDetailedNutrients &&
                  detailedNutrientRows([
                    { label: "Sodium", val: (selectedFood.sodium || 0) * computedMultiplier, unit: "mg" },
                    { label: "Calcium", val: (selectedFood.calcium || 0) * computedMultiplier, unit: "mg" },
                    { label: "Potassium", val: (selectedFood.potassium || 0) * computedMultiplier, unit: "mg" },
                    { label: "Iron", val: (selectedFood.iron || 0) * computedMultiplier, unit: "mg" },
                    { label: "Fiber", val: (selectedFood.fiber || 0) * computedMultiplier, unit: "g" },
                    { label: "Sugar", val: (selectedFood.sugar || 0) * computedMultiplier, unit: "g" },
                  ])}

                <View style={{ marginTop: 16, marginBottom: 16 }}>
                  <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 8 }}>{isArabic ? "الوجبة" : "MEAL SECTION"}</AppText>
                  {slotPickerGrid(activeSlot, (id) => setActiveSlot(id))}
                </View>

                <Pressable onPress={() => addMeal(selectedFood, computedMultiplier, computedPortionString)} disabled={computedMultiplier <= 0 || isNaN(computedMultiplier)} style={{ height: 44, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", opacity: computedMultiplier <= 0 || isNaN(computedMultiplier) ? 0.5 : 1, marginBottom: 12 }}>
                  <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>
                    {mealToReplace ? (isArabic ? "حفظ التغييرات" : "SAVE CHANGES") : isArabic ? "أضف لليوميات" : "ADD TO DIARY"}
                  </AppText>
                </Pressable>

                {mealToReplace &&
                  (isConfirmingDelete ? (
                    <View style={{ borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 12 }}>
                      <AppText style={{ fontSize: 11, color: colors.inkMuted48, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, fontWeight: "600" }}>{isArabic ? "هل تريد حقاً حذف هذه الوجبة؟" : "Delete this item?"}</AppText>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <Pressable onPress={() => setIsConfirmingDelete(false)} style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                          <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted80 }}>{isArabic ? "إلغاء" : "CANCEL"}</AppText>
                        </Pressable>
                        <Pressable onPress={() => { setTodaysLogs((prev) => ({ ...prev, foods: prev.foods.filter((f) => f.id !== mealToReplace.id) })); setSelectedFood(null); setMealToReplace(null); setIsConfirmingDelete(false); flashToast("delete"); }} style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: withAlpha(colors.semanticRed, 0.12), alignItems: "center", justifyContent: "center" }}>
                          <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.semanticRed, textTransform: "uppercase" }}>{isArabic ? "حذف" : "DELETE"}</AppText>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable onPress={() => setIsConfirmingDelete(true)} style={{ height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Trash2 size={16} color={colors.semanticRed} />
                      <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.semanticRed, textTransform: "uppercase" }}>{isArabic ? "حذف" : "DELETE"}</AppText>
                    </Pressable>
                  ))}
              </ScrollView>
            </Pressable>
          )}
        </Pressable>
      </Modal>

      {/* ===== Quick Add Modal ===== */}
      <Modal visible={isQuickAddOpen} transparent animationType="fade" onRequestClose={() => setIsQuickAddOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }} onPress={() => setIsQuickAddOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 384, backgroundColor: colors.canvas, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, maxHeight: "85%", overflow: "hidden" }}>
            <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
              <AppText style={{ fontSize: 14, fontWeight: "700", color: colors.ink, textTransform: "uppercase", letterSpacing: 1 }}>{isArabic ? "إضافة سريعة" : "QUICK ADD"}</AppText>
              <Pressable onPress={() => setIsQuickAddOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: subtle, alignItems: "center", justifyContent: "center" }}>
                <X size={16} color={colors.inkMuted48} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
              {[
                { key: "name", label: isArabic ? "اسم (اختياري)" : "NAME (OPTIONAL)", ph: isArabic ? "إضافة سريعة" : "Quick entry", kb: "default" as const },
                { key: "calories", label: isArabic ? "السعرات (مطلوب)" : "CALORIES (REQUIRED)", ph: "kcal", kb: "number-pad" as const },
              ].map((f) => (
                <View key={f.key} style={{ gap: 8 }}>
                  <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1 }}>{f.label}</AppText>
                  <TextInput
                    value={(quickAdd as any)[f.key]}
                    onChangeText={(t) => setQuickAdd((p) => ({ ...p, [f.key]: t }))}
                    placeholder={f.ph}
                    placeholderTextColor={colors.inkMuted48}
                    keyboardType={f.kb}
                    style={{ height: 44, borderRadius: 9999, paddingHorizontal: 16, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, fontSize: 15, color: colors.ink, fontWeight: f.key === "calories" ? "700" : "400" }}
                  />
                </View>
              ))}
              <View style={{ flexDirection: "row", gap: 12 }}>
                {[["protein", "Prot (g)"], ["carbs", "Carb (g)"], ["fat", "Fat (g)"]].map(([k, l]) => (
                  <View key={k} style={{ flex: 1, gap: 6 }}>
                    <AppText style={{ fontSize: 10, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>{l}</AppText>
                    <TextInput value={(quickAdd as any)[k]} onChangeText={(t) => setQuickAdd((p) => ({ ...p, [k]: t }))} placeholder="0" placeholderTextColor={colors.inkMuted48} keyboardType="numeric" style={{ height: 44, borderRadius: 9999, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, fontSize: 14, color: colors.ink, textAlign: "center" }} />
                  </View>
                ))}
              </View>
              <View style={{ gap: 8 }}>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>{isArabic ? "الوجبة" : "MEAL SECTION"}</AppText>
                {slotPickerGrid(quickAdd.slot, (id) => setQuickAdd((p) => ({ ...p, slot: id })))}
              </View>
            </ScrollView>
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.hairline }}>
              <Pressable
                disabled={!quickAdd.calories || parseFloat(quickAdd.calories) <= 0}
                onPress={() => {
                  addMeal({ name: quickAdd.name || (isArabic ? "إضافة سريعة" : "Quick entry"), calories: parseFloat(quickAdd.calories) || 0, protein: parseFloat(quickAdd.protein) || 0, carbs: parseFloat(quickAdd.carbs) || 0, fat: parseFloat(quickAdd.fat) || 0, portion: "1 entry", isCustom: true }, 1, "1 entry", quickAdd.slot);
                  setIsQuickAddOpen(false);
                }}
                style={{ height: 44, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", opacity: !quickAdd.calories || parseFloat(quickAdd.calories) <= 0 ? 0.5 : 1 }}
              >
                <AppText style={{ color: "#fff", fontSize: 15, fontWeight: "600", textTransform: "uppercase" }}>{isArabic ? "إضافة" : "ADD"}</AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ===== Customize Sheet ===== */}
      <BottomSheet isOpen={showCustomizeSheet} onClose={() => setShowCustomizeSheet(false)} title={isArabic ? "تخصيص العرض" : "Customize View"}>
        <View style={{ gap: 12, paddingVertical: 8 }}>
          {nutritionCardOrder.map((key, index) => {
            const mappings: Record<string, { en: string; ar: string }> = {
              coachPlan: { en: "Coach Plan", ar: "خطة المدرب" },
              summary: { en: "Daily summary", ar: "ملخص اليوم" },
              meals: { en: "Meal sections", ar: "أقسام الوجبات" },
              aiCoaching: { en: "AI coaching tips", ar: "نصائح الذكاء الاصطناعي" },
              aiPick: { en: "Quick add", ar: "إضافة سريعة" },
              hydration: { en: "Hydration", ar: "الترطيب" },
            };
            const m = mappings[key] || { en: key, ar: key };
            const on = nutritionCards[key];
            const move = (dir: -1 | 1) => {
              const newOrder = [...nutritionCardOrder];
              [newOrder[index], newOrder[index + dir]] = [newOrder[index + dir], newOrder[index]];
              setNutritionCardOrder(newOrder);
              setItem("synk:nutritionCardOrder", JSON.stringify(newOrder));
            };
            return (
              <View key={key} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", padding: 16, backgroundColor: colors.canvas, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, gap: 12 }}>
                <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <Pressable onPress={() => index > 0 && move(-1)} disabled={index === 0} style={{ opacity: index === 0 ? 0.3 : 1 }}>
                    <ChevronUp size={20} color={colors.inkMuted48} />
                  </Pressable>
                  <AppText style={{ flex: 1, fontSize: 15, fontWeight: "500", color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}>{isArabic ? m.ar : m.en}</AppText>
                  <Pressable onPress={() => index < nutritionCardOrder.length - 1 && move(1)} disabled={index === nutritionCardOrder.length - 1} style={{ opacity: index === nutritionCardOrder.length - 1 ? 0.3 : 1 }}>
                    <ChevronDown size={20} color={colors.inkMuted48} />
                  </Pressable>
                </View>
                <Pressable onPress={() => toggleCard(key)} style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: on ? colors.primary : isDark ? "#333336" : "#D2D2D7", justifyContent: "center" }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", marginLeft: on ? 22 : 2 }} />
                </Pressable>
              </View>
            );
          })}
        </View>
      </BottomSheet>

      {/* ===== Custom Food builder ===== */}
      <BottomSheet isOpen={isCustomFoodOpen} onClose={() => setIsCustomFoodOpen(false)} title={isArabic ? "إضافة طعام مخصص" : "Add Custom Food"}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <TextInput
            value={customFood.name}
            onChangeText={(t) => setCustomFood((p) => ({ ...p, name: t }))}
            placeholder={isArabic ? "اسم الطعام" : "Food name"}
            placeholderTextColor={colors.inkMuted48}
            style={cfPill}
          />
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 8 }}>
            <TextInput
              value={customFood.portionValue}
              onChangeText={(t) => setCustomFood((p) => ({ ...p, portionValue: t }))}
              keyboardType="numeric"
              placeholder={isArabic ? "الحجم (مثال: ١)" : "Size (e.g. 1)"}
              placeholderTextColor={colors.inkMuted48}
              style={[cfPill, { flex: 1 }]}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: isArabic ? "row-reverse" : "row" }}>
            {["serving", "g", "ml", "piece", "cup", "tbsp", "tsp", "slice", "scoop"].map((u) => {
              const sel = customFood.portionUnit === u;
              return (
                <Pressable key={u} onPress={() => setCustomFood((p) => ({ ...p, portionUnit: u }))} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: sel ? colors.primary : colors.hairline, backgroundColor: sel ? colors.primary : colors.canvas }}>
                  <AppText style={{ fontSize: 12, fontWeight: "600", color: sel ? "#fff" : colors.ink }}>{u}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {([
              { k: "calories", ph: isArabic ? "سعرات" : "Kcal", primary: true },
              { k: "protein", ph: isArabic ? "بروتين (جم)" : "Prot (g)" },
              { k: "carbs", ph: isArabic ? "كارب (جم)" : "Carbs (g)" },
              { k: "fat", ph: isArabic ? "دهون (جم)" : "Fat (g)" },
            ] as const).map((f) => (
              <TextInput
                key={f.k}
                value={customFood[f.k]}
                onChangeText={(t) => setCustomFood((p) => ({ ...p, [f.k]: t }))}
                keyboardType="numeric"
                placeholder={f.ph}
                placeholderTextColor={colors.inkMuted48}
                style={[cfPill, { width: "47%", fontWeight: "600", color: "primary" in f && f.primary ? colors.primary : colors.ink }]}
              />
            ))}
          </View>
          <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>
            {isArabic ? "عناصر غذائية إضافية (اختياري)" : "Optional nutrients"}
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {([
              ["sodium", "Sodium (mg)"], ["calcium", "Calcium (mg)"], ["iron", "Iron (mg)"], ["fiber", "Fiber (g)"],
              ["sugar", "Sugar (g)"], ["saturatedFat", "Sat Fat (g)"], ["cholesterol", "Cholesterol (mg)"], ["potassium", "Potassium (mg)"],
            ] as const).map(([k, ph]) => (
              <TextInput
                key={k}
                value={customFood[k]}
                onChangeText={(t) => setCustomFood((p) => ({ ...p, [k]: t }))}
                keyboardType="numeric"
                placeholder={ph}
                placeholderTextColor={colors.inkMuted48}
                style={[cfPill, { width: "47%", height: 38, fontSize: 13 }]}
              />
            ))}
          </View>
          <Pressable
            onPress={handleAddCustomFood}
            disabled={!customFood.name || !customFood.calories}
            style={{ height: 48, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 4, opacity: !customFood.name || !customFood.calories ? 0.3 : 1 }}
          >
            <AppText style={{ color: "#fff", fontWeight: "600", fontSize: 15, fontFamily: ff(isArabic, 600) }}>{isArabic ? "أضف الطعام" : "Add Food"}</AppText>
          </Pressable>
        </View>
      </BottomSheet>

      {/* ===== Custom Meal builder ===== */}
      <BottomSheet isOpen={isCustomMealOpen} onClose={() => { setIsCustomMealOpen(false); setMealItemSearchMode(false); }} title={isArabic ? "إنشاء وجبة مخصصة" : "Create Custom Meal"}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <TextInput
            value={customMealBuilder.name}
            onChangeText={(t) => setCustomMealBuilder((p) => ({ ...p, name: t }))}
            placeholder={isArabic ? "اسم الوجبة" : "Meal name"}
            placeholderTextColor={colors.inkMuted48}
            style={cfPill}
          />

          {!mealItemSearchMode ? (
            <>
              <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, fontFamily: ff(isArabic, 600) }}>
                  {isArabic ? "مكونات الوجبة" : "Meal items"}
                </AppText>
                <Pressable onPress={() => setMealItemSearchMode(true)} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 4 }}>
                  <Plus size={14} color={colors.primary} />
                  <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary, textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إضافة عنصر" : "Add item"}</AppText>
                </Pressable>
              </View>

              {customMealBuilder.items.length === 0 ? (
                <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: colors.hairline, borderRadius: 14, padding: 24, alignItems: "center" }}>
                  <AppText style={{ fontSize: 13, color: colors.inkMuted48, textAlign: "center", fontFamily: ff(isArabic) }}>
                    {isArabic ? "لا توجد عناصر. أضف طعاماً للوجبة." : "No items yet. Add food to your meal."}
                  </AppText>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {customMealBuilder.items.map((it, idx) => (
                    <View key={idx} style={{ backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 12, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                        <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }} numberOfLines={1}>{it.food.name}</AppText>
                        <AppText style={{ fontSize: 11, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{it.portionStr}</AppText>
                      </View>
                      <View style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", gap: 12 }}>
                        <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>{Math.round(it.food.calories * it.multiplier)} kcal</AppText>
                        <Pressable onPress={() => setCustomMealBuilder((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}>
                          <X size={16} color={colors.inkMuted48} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                  <View style={{ flexDirection: "row", gap: 8, paddingTop: 4 }}>
                    {([["Kcal", mealTotals.kcal], ["Prot", `${mealTotals.prot}g`], ["Carb", `${mealTotals.carb}g`], ["Fat", `${mealTotals.fat}g`]] as const).map(([lbl, val], i) => (
                      <View key={lbl} style={{ flex: 1, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, paddingVertical: 8, alignItems: "center" }}>
                        <AppText style={{ fontSize: 9, color: colors.inkMuted48, textTransform: "uppercase" }}>{lbl}</AppText>
                        <AppText style={{ fontSize: 13, fontWeight: "600", color: i === 0 ? colors.primary : colors.ink }}>{val}</AppText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <Pressable
                onPress={handleSaveCustomMeal}
                disabled={!customMealBuilder.name || customMealBuilder.items.length === 0}
                style={{ height: 48, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 4, opacity: !customMealBuilder.name || customMealBuilder.items.length === 0 ? 0.3 : 1 }}
              >
                <AppText style={{ color: "#fff", fontWeight: "600", fontSize: 15, fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ وإضافة الوجبة" : "Save & Add Meal"}</AppText>
              </Pressable>
            </>
          ) : (
            <>
              <View style={{ justifyContent: "center" }}>
                <Search size={14} color={colors.inkMuted48} style={{ position: "absolute", left: isArabic ? undefined : 12, right: isArabic ? 12 : undefined, zIndex: 1 }} />
                <TextInput
                  value={mealSearchQuery}
                  onChangeText={setMealSearchQuery}
                  placeholder={isArabic ? "ابحث عن عنصر..." : "Search items..."}
                  placeholderTextColor={colors.inkMuted48}
                  style={[cfPill, { height: 40, paddingLeft: isArabic ? 16 : 36, paddingRight: isArabic ? 36 : 16 }]}
                  autoFocus
                />
              </View>
              <View style={{ gap: 2 }}>
                {filteredMealItems.map((f, i) => (
                  <View key={i} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
                    <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                      <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }} numberOfLines={1}>{f.name}</AppText>
                      <AppText style={{ fontSize: 11, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{f.portion}</AppText>
                    </View>
                    <Pressable
                      onPress={() => { setCustomMealBuilder((p) => ({ ...p, items: [...p.items, { food: f, multiplier: 1, portionStr: f.portion }] })); setMealItemSearchMode(false); setMealSearchQuery(""); }}
                      style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: withAlpha(colors.primary, 0.1), alignItems: "center", justifyContent: "center" }}
                    >
                      <Plus size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                ))}
              </View>
              <Pressable onPress={() => setMealItemSearchMode(false)} style={{ height: 40, borderRadius: 9999, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
              </Pressable>
            </>
          )}
        </View>
      </BottomSheet>

      {/* ===== Recipe builder ===== */}
      <BottomSheet isOpen={isRecipeBuilderOpen} onClose={() => { setIsRecipeBuilderOpen(false); setRecipeIngredientSearchMode(false); }} title={isArabic ? "وصفة جديدة" : "New Recipe"}>
        <View style={{ gap: 16, paddingBottom: 8 }}>
          <TextInput value={recipeBuilder.name} onChangeText={(t) => setRecipeBuilder((p) => ({ ...p, name: t }))} placeholder={isArabic ? "اسم الوصفة" : "Recipe name"} placeholderTextColor={colors.inkMuted48} style={cfPill} />
          <TextInput
            value={recipeBuilder.description}
            onChangeText={(t) => setRecipeBuilder((p) => ({ ...p, description: t }))}
            placeholder={isArabic ? "إيه اللي يميز الوصفة دي؟" : "What's special about this recipe?"}
            placeholderTextColor={colors.inkMuted48}
            multiline
            textAlignVertical="top"
            style={{ minHeight: 70, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 14, padding: 12, fontSize: 15, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}
          />

          {/* Servings */}
          <View style={{ backgroundColor: colors.canvas, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, padding: 16, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between" }}>
            <AppText style={{ fontSize: 13, fontWeight: "700", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, fontFamily: ff(isArabic, 700) }}>{isArabic ? "حصص" : "Servings"}</AppText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Pressable onPress={() => setRecipeBuilder((p) => ({ ...p, servings: Math.max(1, p.servings - 1) }))} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ fontSize: 20, color: colors.ink }}>−</AppText>
              </Pressable>
              <AppText style={{ fontSize: 17, fontWeight: "600", color: colors.ink, minWidth: 24, textAlign: "center" }}>{recipeBuilder.servings}</AppText>
              <Pressable onPress={() => setRecipeBuilder((p) => ({ ...p, servings: Math.min(20, p.servings + 1) }))} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.canvasParchment, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ fontSize: 20, color: colors.ink }}>+</AppText>
              </Pressable>
            </View>
          </View>

          {/* Ingredients */}
          <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? "المكونات" : "Ingredients"}</AppText>
          {recipeBuilder.ingredients.map((item, idx) => (
            <View key={idx} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.canvas, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, padding: 12 }}>
              <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                <AppText style={{ fontSize: 14, fontWeight: "600", color: colors.ink, fontFamily: ff(isArabic, 600) }} numberOfLines={1}>{item.food.name}</AppText>
                <AppText style={{ fontSize: 12, color: colors.inkMuted48, fontFamily: ff(isArabic) }}>{item.portionStr} • {Math.round(item.calories)} kcal</AppText>
              </View>
              <Pressable onPress={() => setRecipeBuilder((p) => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }))} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,59,48,0.1)", alignItems: "center", justifyContent: "center" }}>
                <X size={14} color={colors.semanticRed} />
              </Pressable>
            </View>
          ))}
          {recipeIngredientSearchMode ? (
            <View style={{ backgroundColor: colors.canvas, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, padding: 12, gap: 8 }}>
              <View style={{ justifyContent: "center" }}>
                <Search size={16} color={colors.inkMuted48} style={{ position: "absolute", left: isArabic ? undefined : 10, right: isArabic ? 10 : undefined, zIndex: 1 }} />
                <TextInput value={recipeIngredientQuery} onChangeText={setRecipeIngredientQuery} placeholder={isArabic ? "بحث..." : "Search..."} placeholderTextColor={colors.inkMuted48} autoFocus style={[cfPill, { height: 40, backgroundColor: colors.canvasParchment, paddingLeft: isArabic ? 16 : 34, paddingRight: isArabic ? 34 : 16 }]} />
              </View>
              <View style={{ maxHeight: 200 }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                  {allAvailableFoods.filter((f) => !(f as any).recipeId && (f.name.toLowerCase().includes(recipeIngredientQuery.toLowerCase().trim()) || ((f as any).nameAr || "").includes(recipeIngredientQuery.trim()))).slice(0, 30).map((food, i) => (
                    <Pressable
                      key={i}
                      onPress={() => { setRecipeBuilder((p) => ({ ...p, ingredients: [...p.ingredients, { food, multiplier: 1, portionStr: food.portion, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat }] })); setRecipeIngredientSearchMode(false); setRecipeIngredientQuery(""); }}
                      style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 4 }}
                    >
                      <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
                        <AppText style={{ fontSize: 13, fontWeight: "500", color: colors.ink, fontFamily: ff(isArabic) }} numberOfLines={1}>{food.name}</AppText>
                        <AppText style={{ fontSize: 11, color: colors.inkMuted48 }}>{food.portion}</AppText>
                      </View>
                      <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.primary }}>{Math.round(food.calories)} kcal</AppText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <Pressable onPress={() => { setRecipeIngredientSearchMode(false); setRecipeIngredientQuery(""); }} style={{ height: 34, borderRadius: 9999, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" }}>
                <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إلغاء" : "Cancel"}</AppText>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setRecipeIngredientSearchMode(true)} style={{ height: 44, borderRadius: 14, borderWidth: 1, borderStyle: "dashed", borderColor: colors.hairline, backgroundColor: colors.surfacePearl, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Plus size={16} color={colors.ink} />
              <AppText style={{ fontSize: 13, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إضافة مكون" : "Add Ingredient"}</AppText>
            </Pressable>
          )}

          {/* Steps */}
          <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic, 600) }}>{isArabic ? "الخطوات" : "Steps"}</AppText>
          {recipeBuilder.steps.map((step, idx) => (
            <View key={idx} style={{ flexDirection: isArabic ? "row-reverse" : "row", alignItems: "flex-start", gap: 8 }}>
              <AppText style={{ fontSize: 13, fontWeight: "700", color: colors.inkMuted48, marginTop: 10, width: 18, textAlign: "center" }}>{idx + 1}.</AppText>
              <TextInput
                value={step}
                onChangeText={(t) => setRecipeBuilder((p) => { const n = [...p.steps]; n[idx] = t; return { ...p, steps: n }; })}
                multiline
                textAlignVertical="top"
                placeholder={isArabic ? "..." : "..."}
                placeholderTextColor={colors.inkMuted48}
                style={{ flex: 1, minHeight: 44, backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, padding: 10, fontSize: 14, color: colors.ink, textAlign: isArabic ? "right" : "left", fontFamily: ff(isArabic) }}
              />
              {recipeBuilder.steps.length > 1 && (
                <Pressable onPress={() => setRecipeBuilder((p) => ({ ...p, steps: p.steps.filter((_, i) => i !== idx) }))} style={{ width: 32, height: 32, marginTop: 6, alignItems: "center", justifyContent: "center" }}>
                  <X size={14} color={colors.semanticRed} />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable onPress={() => setRecipeBuilder((p) => ({ ...p, steps: [...p.steps, ""] }))} style={{ height: 40, borderRadius: 9999, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, flexDirection: isArabic ? "row-reverse" : "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Plus size={14} color={colors.ink} />
            <AppText style={{ fontSize: 12, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "إضافة خطوة" : "Add Step"}</AppText>
          </Pressable>

          {/* Per-serving preview */}
          <AppText style={{ fontSize: 11, fontWeight: "600", color: colors.inkMuted48, textTransform: isArabic ? "none" : "uppercase", letterSpacing: 1, textAlign: "center", fontFamily: ff(isArabic, 600) }}>{isArabic ? "لكل حصة" : "Per serving"}</AppText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {([["kcal", recipeTotals.calories, colors.ink], ["prot", recipeTotals.protein, colors.semanticRed], ["carb", recipeTotals.carbs, colors.primary], ["fat", recipeTotals.fat, "#FFB340"]] as const).map(([lbl, val, col]) => (
              <View key={lbl} style={{ flex: 1, backgroundColor: colors.canvasParchment, borderRadius: 10, paddingVertical: 8, alignItems: "center" }}>
                <AppText style={{ fontSize: 12, fontWeight: "700", color: col }}>{Math.round(val / Math.max(1, recipeBuilder.servings))}</AppText>
                <AppText style={{ fontSize: 10, color: colors.inkMuted48, textTransform: "uppercase" }}>{lbl}</AppText>
              </View>
            ))}
          </View>

          {/* Save / Save & Share */}
          <View style={{ flexDirection: isArabic ? "row-reverse" : "row", gap: 12, marginTop: 4 }}>
            <Pressable onPress={() => saveRecipe(false)} disabled={!recipeValid} style={{ flex: 1, height: 48, borderRadius: 9999, backgroundColor: colors.surfacePearl, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center", opacity: recipeValid ? 1 : 0.3 }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: colors.ink, textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ" : "Save"}</AppText>
            </Pressable>
            <Pressable onPress={() => saveRecipe(true)} disabled={!recipeValid} style={{ flex: 1, height: 48, borderRadius: 9999, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", opacity: recipeValid ? 1 : 0.3 }}>
              <AppText style={{ fontSize: 15, fontWeight: "600", color: "#fff", textTransform: isArabic ? "none" : "uppercase", fontFamily: ff(isArabic, 600) }}>{isArabic ? "حفظ ومشاركة" : "Save & Share"}</AppText>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* ===== Success Toast ===== */}
      {showToast && (
        <Animated.View entering={FadeIn} style={{ position: "absolute", bottom: insets.bottom + 96, alignSelf: "center", backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Utensils size={16} color="#fff" />
          <AppText style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
            {toastMode === "add" ? (isArabic ? "تمت إضافة الوجبة!" : "Meal added to diary!") : isArabic ? "تم حذف الوجبة" : "Meal removed"}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
