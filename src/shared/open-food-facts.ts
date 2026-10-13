import { normalizeBarcode, nutrientNumber, type BarcodeNutrition } from "@/shared/barcode-nutrition";

const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product";
const USER_AGENT = "ZadakAI/1.0 (nutrition companion)";

type OpenFoodFactsProduct = {
  product_name?: string;
  product_name_ar?: string;
  product_name_en?: string;
  brands?: string;
  image_url?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutrition_grades?: string;
  nutriments?: Record<string, unknown>;
};

type OpenFoodFactsResponse = { status?: number; product?: OpenFoodFactsProduct };

function gramsFromServing(product: OpenFoodFactsProduct) {
  const serving = typeof product.serving_quantity === "number" ? product.serving_quantity : Number(product.serving_quantity);
  return Number.isFinite(serving) && serving > 0 && serving <= 5000 ? Math.round(serving) : 100;
}

function per100gNutrition(nutriments: Record<string, unknown> = {}): BarcodeNutrition {
  const calories = nutrientNumber(nutriments["energy-kcal_100g"] ?? nutriments["energy-kcal"]);
  return {
    calories: Math.round(calories),
    protein: nutrientNumber(nutriments.proteins_100g ?? nutriments.proteins),
    carbs: nutrientNumber(nutriments.carbohydrates_100g ?? nutriments.carbohydrates),
    fat: nutrientNumber(nutriments.fat_100g ?? nutriments.fat),
    fiber: nutrientNumber(nutriments.fiber_100g ?? nutriments.fiber),
    sugar: nutrientNumber(nutriments.sugars_100g ?? nutriments.sugars),
    sodium: Math.round(nutrientNumber(nutriments.sodium_100g ?? nutriments.sodium) * 1000),
  };
}

export async function lookupOpenFoodFacts(rawBarcode: string) {
  const barcode = normalizeBarcode(rawBarcode);
  if (!barcode) return { kind: "invalid" as const };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_URL}/${barcode}.json?fields=code,product_name,product_name_ar,product_name_en,brands,image_url,serving_size,serving_quantity,nutriments,nutrition_grades`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    if (!response.ok) return { kind: "unavailable" as const };
    const payload = await response.json() as OpenFoodFactsResponse;
    if (payload.status !== 1 || !payload.product) return { kind: "not_found" as const, barcode };
    const product = payload.product;
    const per100g = per100gNutrition(product.nutriments);
    const servingGrams = gramsFromServing(product);
    return {
      kind: "found" as const,
      barcode,
      name: product.product_name_ar || product.product_name || product.product_name_en || `منتج ${barcode}`,
      brand: product.brands || null,
      imageUrl: product.image_url || null,
      servingSize: product.serving_size || null,
      servingGrams,
      grade: product.nutrition_grades?.toUpperCase() || null,
      per100g,
      serving: {
        calories: Math.round(per100g.calories * servingGrams / 100),
        protein: Math.round(per100g.protein * servingGrams / 100 * 10) / 10,
        carbs: Math.round(per100g.carbs * servingGrams / 100 * 10) / 10,
        fat: Math.round(per100g.fat * servingGrams / 100 * 10) / 10,
        fiber: Math.round(per100g.fiber * servingGrams / 100 * 10) / 10,
        sugar: Math.round(per100g.sugar * servingGrams / 100 * 10) / 10,
        sodium: Math.round(per100g.sodium * servingGrams / 100),
      },
    };
  } catch (error) {
    console.warn("[OpenFoodFacts] lookup failed:", error);
    return { kind: "unavailable" as const };
  } finally {
    clearTimeout(timeout);
  }
}
