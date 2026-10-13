export type NutritionInsightMeal = {
  mealName?: string;
  items?: string[];
  calories?: number;
  fat?: number;
  sugar?: number;
  sodium?: number;
};

export type NutritionAlertKey = "highSugar" | "highFat" | "highSodium" | "highCalories";
export type NutritionAlternativeKey = "reduceOil" | "swapFried" | "swapRice" | "reduceSugar" | "smallerPortion";

export type NutritionInsights = {
  alerts: NutritionAlertKey[];
  alternatives: NutritionAlternativeKey[];
};

function normalizedText(meal: NutritionInsightMeal) {
  return [meal.mealName, ...(meal.items ?? [])].filter(Boolean).join(" ").toLocaleLowerCase();
}

export function buildNutritionInsights(meal: NutritionInsightMeal): NutritionInsights {
  const text = normalizedText(meal);
  const calories = Math.max(0, meal.calories ?? 0);
  const fat = Math.max(0, meal.fat ?? 0);
  const sugar = Math.max(0, meal.sugar ?? 0);
  const sodium = Math.max(0, meal.sodium ?? 0);
  const fried = /مقلي|مقلية|fried|kızart|frit/.test(text);
  const rice = /رز|أرز|أرزاً|rice|pilav|pirinç/.test(text);
  const alerts: NutritionAlertKey[] = [];
  const alternatives: NutritionAlternativeKey[] = [];

  if (sugar >= 25) alerts.push("highSugar");
  if (fat >= 30) alerts.push("highFat");
  if (sodium >= 800) alerts.push("highSodium");
  if (calories >= 700) alerts.push("highCalories");

  if (fat >= 20 || fried) alternatives.push("reduceOil");
  if (fried) alternatives.push("swapFried");
  if (rice && calories >= 500) alternatives.push("swapRice");
  if (sugar >= 18) alternatives.push("reduceSugar");
  if (calories >= 700) alternatives.push("smallerPortion");

  return { alerts: Array.from(new Set(alerts)), alternatives: Array.from(new Set(alternatives)) };
}
