/**
 * Localized muscle-group labels (audit m1b). Muscle taxonomy keys (chest, back,
 * quads, …) were rendered raw-uppercased even under Arabic, leaving English
 * tags on otherwise-Arabic cards. Map keys → Arabic here; English keeps the raw
 * key (callers uppercase it via style).
 */
const AR: Record<string, string> = {
  chest: "الصدر",
  back: "الظهر",
  lats: "الظهر العريض",
  traps: "الترابيس",
  shoulders: "الأكتاف",
  delts: "الأكتاف",
  biceps: "البايسبس",
  triceps: "الترايسبس",
  forearms: "الساعد",
  arms: "الذراعين",
  abs: "البطن",
  core: "الجذع",
  obliques: "الجانبين",
  legs: "الأرجل",
  quads: "الفخذ الأمامي",
  quadriceps: "الفخذ الأمامي",
  hamstrings: "الفخذ الخلفي",
  glutes: "المؤخرة",
  calves: "السمانة",
  cardio: "كارديو",
  fullbody: "الجسم كامل",
  "full-body": "الجسم كامل",
};

export function muscleLabel(key: string, isArabic: boolean): string {
  if (!isArabic) return key;
  return AR[key.toLowerCase()] ?? key;
}
