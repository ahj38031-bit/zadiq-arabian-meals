export type BarcodeNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

export function normalizeBarcode(value: string) {
  const barcode = value.replace(/[^0-9]/g, "");
  return /^\d{8,14}$/.test(barcode) ? barcode : null;
}

export function scaleBarcodeNutrition(per100g: BarcodeNutrition, grams: number): BarcodeNutrition {
  const factor = Math.max(1, grams) / 100;
  return {
    calories: Math.max(0, Math.round(per100g.calories * factor)),
    protein: Math.max(0, Math.round(per100g.protein * factor * 10) / 10),
    carbs: Math.max(0, Math.round(per100g.carbs * factor * 10) / 10),
    fat: Math.max(0, Math.round(per100g.fat * factor * 10) / 10),
    fiber: Math.max(0, Math.round(per100g.fiber * factor * 10) / 10),
    sugar: Math.max(0, Math.round(per100g.sugar * factor * 10) / 10),
    sodium: Math.max(0, Math.round(per100g.sodium * factor)),
  };
}

export function nutrientNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}
