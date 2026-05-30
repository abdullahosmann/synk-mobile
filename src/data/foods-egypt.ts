/**
 * Egyptian, Levantine, and Gulf food database seed.
 *
 * Coverage:
 * - Egyptian breakfast (foul, ta3miyya, eish baladi, gebna)
 * - Egyptian mains (koshary, molokhia, mahshi, fattah, hawawshi, mombar, fiteer)
 * - Levantine (hummus, tabbouleh, shawarma, fattoush, kebab, shish tawook)
 * - Gulf (machboos, harees, mandi, kabsa)
 * - Sweets (kunafa, basbousa, om ali, ruz bel laban, qatayef, balah el sham)
 * - Drinks (qarqade, sahlab, sobya, ersous, tamr hindi)
 * - Egyptian-context staples (Domty cheese, Juhayna yogurt, Edita Molto)
 *
 * Values are approximate per-serving (one piece, one plate, one cup as noted).
 * Sources: typical Egyptian/regional dishes, cross-referenced with USDA + local nutrition tables.
 */

export interface RegionalFood {
  id: string;
  name: string;
  nameAr: string;
  category: 'breakfast' | 'main' | 'side' | 'sweet' | 'drink' | 'snack' | 'dairy' | 'bread';
  region: 'egypt' | 'levant' | 'gulf' | 'pan-arab';
  // Per the noted serving
  calories: number;
  protein: number; // grams
  carbs: number;
  fat: number;
  // Serving descriptor — what one unit means
  serving: string;       // EN: "1 piece", "1 plate (300g)", "1 cup"
  servingAr: string;     // AR: "١ قطعة", "١ طبق (٣٠٠ جم)", "كوب"
  servingGrams?: number; // approximate weight in grams if relevant
}

export const EGYPTIAN_FOODS: RegionalFood[] = [
  // ───── EGYPTIAN BREAKFAST ─────
  {
    id: 'eg-foul-medames',
    name: 'Foul Medames',
    nameAr: 'فول مدمس',
    category: 'breakfast',
    region: 'egypt',
    calories: 180, protein: 11, carbs: 28, fat: 3,
    serving: '1 plate (200g)', servingAr: '١ طبق (٢٠٠ جم)', servingGrams: 200,
  },
  {
    id: 'eg-taameya',
    name: 'Ta3miyya (Falafel)',
    nameAr: 'طعمية',
    category: 'breakfast',
    region: 'egypt',
    calories: 75, protein: 3, carbs: 7, fat: 4,
    serving: '1 piece', servingAr: '١ قرص', servingGrams: 25,
  },
  {
    id: 'eg-eish-baladi',
    name: 'Eish Baladi (Egyptian Bread)',
    nameAr: 'عيش بلدي',
    category: 'bread',
    region: 'egypt',
    calories: 165, protein: 6, carbs: 33, fat: 1,
    serving: '1 loaf', servingAr: '١ رغيف', servingGrams: 90,
  },
  {
    id: 'eg-eish-fino',
    name: 'Eish Fino',
    nameAr: 'عيش فينو',
    category: 'bread',
    region: 'egypt',
    calories: 145, protein: 5, carbs: 28, fat: 2,
    serving: '1 loaf', servingAr: '١ رغيف', servingGrams: 50,
  },
  {
    id: 'eg-gebna-domiati',
    name: 'Gebna Domiati (Domiati Cheese)',
    nameAr: 'جبنة دمياطي',
    category: 'dairy',
    region: 'egypt',
    calories: 110, protein: 7, carbs: 1, fat: 9,
    serving: '30g', servingAr: '٣٠ جم', servingGrams: 30,
  },
  {
    id: 'eg-gebna-beida',
    name: 'Gebna Beida (White Cheese)',
    nameAr: 'جبنة بيضا',
    category: 'dairy',
    region: 'egypt',
    calories: 90, protein: 6, carbs: 1, fat: 7,
    serving: '30g', servingAr: '٣٠ جم', servingGrams: 30,
  },
  {
    id: 'eg-mish',
    name: 'Mish (Aged Cheese)',
    nameAr: 'مش',
    category: 'dairy',
    region: 'egypt',
    calories: 105, protein: 6, carbs: 2, fat: 8,
    serving: '30g', servingAr: '٣٠ جم', servingGrams: 30,
  },
  {
    id: 'eg-tehina',
    name: 'Tehina (Tahini)',
    nameAr: 'طحينة',
    category: 'side',
    region: 'pan-arab',
    calories: 90, protein: 3, carbs: 3, fat: 8,
    serving: '1 tbsp', servingAr: 'م.كبيرة', servingGrams: 15,
  },
  {
    id: 'eg-baba-ghanoug',
    name: 'Baba Ghanoug',
    nameAr: 'بابا غنوج',
    category: 'side',
    region: 'pan-arab',
    calories: 75, protein: 2, carbs: 5, fat: 5,
    serving: '½ cup', servingAr: 'نص كوب', servingGrams: 100,
  },

  // ───── EGYPTIAN MAINS ─────
  {
    id: 'eg-koshary',
    name: 'Koshary',
    nameAr: 'كشري',
    category: 'main',
    region: 'egypt',
    calories: 540, protein: 18, carbs: 95, fat: 11,
    serving: '1 plate (350g)', servingAr: '١ طبق (٣٥٠ جم)', servingGrams: 350,
  },
  {
    id: 'eg-molokhia',
    name: 'Molokhia',
    nameAr: 'ملوخية',
    category: 'main',
    region: 'egypt',
    calories: 110, protein: 5, carbs: 8, fat: 6,
    serving: '1 bowl (200g)', servingAr: '١ طبق (٢٠٠ جم)', servingGrams: 200,
  },
  {
    id: 'eg-mahshi-warak-3enab',
    name: 'Mahshi Warak Enab',
    nameAr: 'محشي ورق عنب',
    category: 'main',
    region: 'egypt',
    calories: 55, protein: 1, carbs: 9, fat: 2,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 25,
  },
  {
    id: 'eg-mahshi-koromb',
    name: 'Mahshi Koromb (Cabbage)',
    nameAr: 'محشي كرنب',
    category: 'main',
    region: 'egypt',
    calories: 65, protein: 2, carbs: 10, fat: 2,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 35,
  },
  {
    id: 'eg-fattah',
    name: 'Fattah',
    nameAr: 'فتة',
    category: 'main',
    region: 'egypt',
    calories: 520, protein: 28, carbs: 60, fat: 18,
    serving: '1 plate (300g)', servingAr: '١ طبق (٣٠٠ جم)', servingGrams: 300,
  },
  {
    id: 'eg-hawawshi',
    name: 'Hawawshi',
    nameAr: 'حواوشي',
    category: 'main',
    region: 'egypt',
    calories: 420, protein: 22, carbs: 38, fat: 20,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 180,
  },
  {
    id: 'eg-mombar',
    name: 'Mombar (Stuffed Sausage)',
    nameAr: 'ممبار',
    category: 'main',
    region: 'egypt',
    calories: 280, protein: 9, carbs: 35, fat: 12,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 100,
  },
  {
    id: 'eg-fiteer-meshaltet',
    name: 'Fiteer Meshaltet',
    nameAr: 'فطير مشلتت',
    category: 'main',
    region: 'egypt',
    calories: 480, protein: 9, carbs: 52, fat: 26,
    serving: '¼ piece', servingAr: 'ربع فطيرة', servingGrams: 120,
  },
  {
    id: 'eg-roz-mammar',
    name: 'Roz Mammar (Oven Rice)',
    nameAr: 'رز معمر',
    category: 'main',
    region: 'egypt',
    calories: 310, protein: 8, carbs: 42, fat: 12,
    serving: '1 cup (200g)', servingAr: '١ كوب (٢٠٠ جم)', servingGrams: 200,
  },
  {
    id: 'eg-bamya',
    name: 'Bamya (Okra Stew)',
    nameAr: 'بامية',
    category: 'main',
    region: 'egypt',
    calories: 145, protein: 6, carbs: 14, fat: 7,
    serving: '1 bowl (200g)', servingAr: '١ طبق (٢٠٠ جم)', servingGrams: 200,
  },
  {
    id: 'eg-firak-mashwy',
    name: 'Firak Mashwy (Grilled Chicken)',
    nameAr: 'فراخ مشوية',
    category: 'main',
    region: 'pan-arab',
    calories: 260, protein: 35, carbs: 0, fat: 13,
    serving: '½ chicken', servingAr: 'نص فرخة', servingGrams: 200,
  },
  {
    id: 'eg-kofta',
    name: 'Kofta',
    nameAr: 'كفتة',
    category: 'main',
    region: 'pan-arab',
    calories: 280, protein: 22, carbs: 4, fat: 19,
    serving: '2 skewers', servingAr: '٢ سيخ', servingGrams: 150,
  },
  {
    id: 'eg-kebda-eskandarani',
    name: 'Kebda Eskandarani',
    nameAr: 'كبدة إسكندراني',
    category: 'main',
    region: 'egypt',
    calories: 270, protein: 28, carbs: 5, fat: 14,
    serving: '1 plate (150g)', servingAr: '١ طبق (١٥٠ جم)', servingGrams: 150,
  },
  {
    id: 'eg-feseekh',
    name: 'Feseekh',
    nameAr: 'فسيخ',
    category: 'main',
    region: 'egypt',
    calories: 195, protein: 21, carbs: 0, fat: 12,
    serving: '100g', servingAr: '١٠٠ جم', servingGrams: 100,
  },

  // ───── LEVANTINE & PAN-ARAB ─────
  {
    id: 'lev-hummus',
    name: 'Hummus',
    nameAr: 'حمص',
    category: 'side',
    region: 'levant',
    calories: 165, protein: 6, carbs: 14, fat: 9,
    serving: '½ cup (120g)', servingAr: 'نص كوب', servingGrams: 120,
  },
  {
    id: 'lev-tabbouleh',
    name: 'Tabbouleh',
    nameAr: 'تبولة',
    category: 'side',
    region: 'levant',
    calories: 95, protein: 3, carbs: 12, fat: 5,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 150,
  },
  {
    id: 'lev-fattoush',
    name: 'Fattoush',
    nameAr: 'فتوش',
    category: 'side',
    region: 'levant',
    calories: 135, protein: 3, carbs: 15, fat: 7,
    serving: '1 bowl', servingAr: '١ طبق', servingGrams: 200,
  },
  {
    id: 'lev-shawarma-chicken',
    name: 'Shawarma Chicken Sandwich',
    nameAr: 'ساندويتش شاورما فراخ',
    category: 'main',
    region: 'levant',
    calories: 480, protein: 28, carbs: 42, fat: 22,
    serving: '1 sandwich', servingAr: '١ ساندويتش', servingGrams: 280,
  },
  {
    id: 'lev-shawarma-meat',
    name: 'Shawarma Meat Sandwich',
    nameAr: 'ساندويتش شاورما لحمة',
    category: 'main',
    region: 'levant',
    calories: 560, protein: 32, carbs: 38, fat: 30,
    serving: '1 sandwich', servingAr: '١ ساندويتش', servingGrams: 280,
  },
  {
    id: 'lev-shish-tawook',
    name: 'Shish Tawook',
    nameAr: 'شيش طاووق',
    category: 'main',
    region: 'levant',
    calories: 320, protein: 38, carbs: 4, fat: 17,
    serving: '2 skewers', servingAr: '٢ سيخ', servingGrams: 180,
  },
  {
    id: 'lev-kebab',
    name: 'Kebab',
    nameAr: 'كباب',
    category: 'main',
    region: 'pan-arab',
    calories: 340, protein: 26, carbs: 3, fat: 25,
    serving: '2 skewers', servingAr: '٢ سيخ', servingGrams: 150,
  },
  {
    id: 'lev-mutabbal',
    name: 'Mutabbal',
    nameAr: 'متبل',
    category: 'side',
    region: 'levant',
    calories: 85, protein: 2, carbs: 6, fat: 6,
    serving: '½ cup', servingAr: 'نص كوب', servingGrams: 100,
  },
  {
    id: 'lev-warak-enab-meat',
    name: 'Warak Enab with Meat',
    nameAr: 'ورق عنب باللحمة',
    category: 'main',
    region: 'levant',
    calories: 75, protein: 3, carbs: 10, fat: 2,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 30,
  },

  // ───── GULF ─────
  {
    id: 'glf-machboos',
    name: 'Machboos',
    nameAr: 'مجبوس',
    category: 'main',
    region: 'gulf',
    calories: 520, protein: 26, carbs: 70, fat: 14,
    serving: '1 plate (350g)', servingAr: '١ طبق (٣٥٠ جم)', servingGrams: 350,
  },
  {
    id: 'glf-kabsa',
    name: 'Kabsa',
    nameAr: 'كبسة',
    category: 'main',
    region: 'gulf',
    calories: 540, protein: 28, carbs: 68, fat: 16,
    serving: '1 plate (350g)', servingAr: '١ طبق (٣٥٠ جم)', servingGrams: 350,
  },
  {
    id: 'glf-mandi',
    name: 'Mandi',
    nameAr: 'مندي',
    category: 'main',
    region: 'gulf',
    calories: 580, protein: 32, carbs: 65, fat: 20,
    serving: '1 plate (350g)', servingAr: '١ طبق (٣٥٠ جم)', servingGrams: 350,
  },
  {
    id: 'glf-harees',
    name: 'Harees',
    nameAr: 'هريس',
    category: 'main',
    region: 'gulf',
    calories: 410, protein: 22, carbs: 52, fat: 12,
    serving: '1 bowl (250g)', servingAr: '١ طبق (٢٥٠ جم)', servingGrams: 250,
  },
  {
    id: 'glf-thareed',
    name: 'Thareed',
    nameAr: 'ثريد',
    category: 'main',
    region: 'gulf',
    calories: 380, protein: 18, carbs: 45, fat: 14,
    serving: '1 plate (300g)', servingAr: '١ طبق (٣٠٠ جم)', servingGrams: 300,
  },

  // ───── SWEETS ─────
  {
    id: 'eg-konafa',
    name: 'Konafa',
    nameAr: 'كنافة',
    category: 'sweet',
    region: 'pan-arab',
    calories: 320, protein: 5, carbs: 40, fat: 16,
    serving: '1 piece (100g)', servingAr: '١ قطعة (١٠٠ جم)', servingGrams: 100,
  },
  {
    id: 'eg-basbousa',
    name: 'Basbousa',
    nameAr: 'بسبوسة',
    category: 'sweet',
    region: 'egypt',
    calories: 220, protein: 3, carbs: 32, fat: 9,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 60,
  },
  {
    id: 'eg-om-ali',
    name: 'Om Ali',
    nameAr: 'أم علي',
    category: 'sweet',
    region: 'egypt',
    calories: 380, protein: 8, carbs: 42, fat: 20,
    serving: '1 bowl', servingAr: '١ طبق', servingGrams: 200,
  },
  {
    id: 'eg-ruz-bel-laban',
    name: 'Roz Bel Laban',
    nameAr: 'رز باللبن',
    category: 'sweet',
    region: 'egypt',
    calories: 250, protein: 6, carbs: 38, fat: 9,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 200,
  },
  {
    id: 'eg-qatayef',
    name: 'Qatayef',
    nameAr: 'قطايف',
    category: 'sweet',
    region: 'pan-arab',
    calories: 180, protein: 4, carbs: 22, fat: 9,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 50,
  },
  {
    id: 'eg-balah-sham',
    name: 'Balah El Sham',
    nameAr: 'بلح الشام',
    category: 'sweet',
    region: 'egypt',
    calories: 150, protein: 2, carbs: 22, fat: 6,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 35,
  },
  {
    id: 'eg-meshabbek',
    name: 'Meshabbek (Jalebi)',
    nameAr: 'مشبك',
    category: 'sweet',
    region: 'egypt',
    calories: 200, protein: 1, carbs: 32, fat: 8,
    serving: '50g', servingAr: '٥٠ جم', servingGrams: 50,
  },
  {
    id: 'eg-mahalabia',
    name: 'Mahalabia',
    nameAr: 'مهلبية',
    category: 'sweet',
    region: 'pan-arab',
    calories: 195, protein: 5, carbs: 28, fat: 7,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 180,
  },
  {
    id: 'eg-baklava',
    name: 'Baklava',
    nameAr: 'بقلاوة',
    category: 'sweet',
    region: 'pan-arab',
    calories: 245, protein: 4, carbs: 28, fat: 13,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 55,
  },

  // ───── DRINKS ─────
  {
    id: 'eg-qarqade',
    name: 'Qarqade (Hibiscus)',
    nameAr: 'كركديه',
    category: 'drink',
    region: 'egypt',
    calories: 25, protein: 0, carbs: 6, fat: 0,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 240,
  },
  {
    id: 'eg-sahlab',
    name: 'Sahlab',
    nameAr: 'سحلب',
    category: 'drink',
    region: 'pan-arab',
    calories: 230, protein: 7, carbs: 35, fat: 7,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 240,
  },
  {
    id: 'eg-sobya',
    name: 'Sobya',
    nameAr: 'سوبيا',
    category: 'drink',
    region: 'egypt',
    calories: 165, protein: 4, carbs: 32, fat: 2,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 240,
  },
  {
    id: 'eg-ersous',
    name: 'Ersous (Licorice Drink)',
    nameAr: 'عرقسوس',
    category: 'drink',
    region: 'egypt',
    calories: 55, protein: 0, carbs: 14, fat: 0,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 240,
  },
  {
    id: 'eg-tamr-hindi',
    name: 'Tamr Hindi (Tamarind)',
    nameAr: 'تمر هندي',
    category: 'drink',
    region: 'egypt',
    calories: 110, protein: 1, carbs: 28, fat: 0,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 240,
  },
  {
    id: 'eg-shay-bel-laban',
    name: 'Shay Bel Laban (Tea with Milk)',
    nameAr: 'شاي باللبن',
    category: 'drink',
    region: 'egypt',
    calories: 90, protein: 3, carbs: 12, fat: 3,
    serving: '1 cup', servingAr: '١ كوب', servingGrams: 240,
  },

  // ───── EGYPTIAN BRAND STAPLES ─────
  {
    id: 'eg-domty-feta',
    name: 'Domty Feta',
    nameAr: 'دومتي فيتا',
    category: 'dairy',
    region: 'egypt',
    calories: 70, protein: 5, carbs: 1, fat: 5,
    serving: '30g', servingAr: '٣٠ جم', servingGrams: 30,
  },
  {
    id: 'eg-juhayna-zabady',
    name: 'Juhayna Zabady (Yogurt)',
    nameAr: 'جهينة زبادي',
    category: 'dairy',
    region: 'egypt',
    calories: 90, protein: 6, carbs: 10, fat: 3,
    serving: '1 cup (170g)', servingAr: '١ كوب (١٧٠ جم)', servingGrams: 170,
  },
  {
    id: 'eg-juhayna-milk',
    name: 'Juhayna Full Milk',
    nameAr: 'جهينة لبن كامل الدسم',
    category: 'dairy',
    region: 'egypt',
    calories: 150, protein: 8, carbs: 12, fat: 8,
    serving: '1 cup (240ml)', servingAr: '١ كوب (٢٤٠ مل)', servingGrams: 240,
  },
  {
    id: 'eg-edita-molto',
    name: 'Edita Molto',
    nameAr: 'إيديتا مولتو',
    category: 'snack',
    region: 'egypt',
    calories: 195, protein: 3, carbs: 24, fat: 10,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 55,
  },
  {
    id: 'eg-edita-twinkies',
    name: 'Edita Twinkies',
    nameAr: 'إيديتا توينكيز',
    category: 'snack',
    region: 'egypt',
    calories: 150, protein: 2, carbs: 20, fat: 7,
    serving: '1 piece', servingAr: '١ قطعة', servingGrams: 38,
  },
  {
    id: 'eg-balady-cheese',
    name: 'Gebna Balady',
    nameAr: 'جبنة بلدي',
    category: 'dairy',
    region: 'egypt',
    calories: 95, protein: 6, carbs: 1, fat: 8,
    serving: '30g', servingAr: '٣٠ جم', servingGrams: 30,
  },
];

/**
 * Helper: search foods by query in either English or Arabic.
 */
export function searchEgyptianFoods(query: string, lang: 'en' | 'ar' = 'en'): RegionalFood[] {
  if (!query.trim()) return EGYPTIAN_FOODS;
  const q = query.toLowerCase().trim();
  return EGYPTIAN_FOODS.filter(f => {
    const en = f.name.toLowerCase();
    const ar = f.nameAr;
    return en.includes(q) || ar.includes(q) || ar.includes(query.trim());
  });
}

/**
 * Helper: filter by category.
 */
export function foodsByCategory(category: RegionalFood['category']): RegionalFood[] {
  return EGYPTIAN_FOODS.filter(f => f.category === category);
}
