export interface ScannedNutritionData {
  success: boolean;
  productName?: string;
  brand?: string;
  servingSize?: {
    amount: number;
    unit: string;
  };
  valuesPer?: "serving" | "100g" | "100ml";
  calories?: number;
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  nutrients?: {
    sugar: number;
    fiber: number;
    sodium: number;
    calcium: number;
    saturatedFat: number;
    potassium: number;
    iron: number;
    cholesterol: number;
  };
  confidence?: number;
  warnings?: string[];
  error?: string;
}

// TODO: Replace this mock function with a real backend request later:
// POST /api/nutrition/scan-label
// Do not implement the backend request now. AI/OCR API keys must live in the future backend only.
export async function scanNutritionLabel(base64Image: string): Promise<ScannedNutritionData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return mock extracted nutrition data
  return {
    success: true,
    productName: "Mock Scanned Product",
    servingSize: {
      amount: 45,
      unit: "g"
    },
    valuesPer: "serving",
    calories: 180,
    macros: {
      protein: 12,
      carbs: 24,
      fat: 6
    },
    nutrients: {
      sugar: 2,
      fiber: 4,
      sodium: 150,
      calcium: 50,
      saturatedFat: 1,
      potassium: 200,
      iron: 2,
      cholesterol: 0
    },
    confidence: 0.85,
    warnings: [
      "Scanner extraction is in preview mode. Review values before saving."
    ]
  };
}
