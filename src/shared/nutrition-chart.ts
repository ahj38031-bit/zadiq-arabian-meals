export type ChartMeal = { calories: number; createdAt: Date | string | number };
export type ChartWeightLog = { weightKg: number; loggedAt: Date | string | number };
export type NutritionComparisonPoint = { key: string; label: string; calories: number; weight: number | null };

function localDayKey(value: Date | string | number) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function buildNutritionComparison(meals: ChartMeal[], weightLogs: ChartWeightLog[], days = 14, now = new Date(), locale = "en-US"): NutritionComparisonPoint[] {
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    const key = localDayKey(date);
    const dayMeals = meals.filter((meal) => localDayKey(meal.createdAt) === key);
    const dayLogs = weightLogs.filter((log) => localDayKey(log.loggedAt) === key).sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());
    return { key, label: date.toLocaleDateString(locale, { day: "numeric", month: "short" }), calories: dayMeals.reduce((sum, meal) => sum + meal.calories, 0), weight: dayLogs.at(-1)?.weightKg ?? null };
  });
  let lastWeight: number | null = null;
  return points.map((point) => {
    if (point.weight != null) lastWeight = point.weight;
    return { ...point, weight: lastWeight };
  });
}
