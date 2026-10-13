export type HistoryMealType = "breakfast" | "lunch" | "dinner" | "snack";
export type HistoryCalorieFilter = "all" | "under400" | "400to700" | "over700";
export type HistorySortOrder = "latest" | "caloriesDesc";
export type FilterableMeal = { mealType: string; calories: number };
export type SortableMeal = { calories: number; createdAt: Date | string | number };

export function filterHistoryMeals<T extends FilterableMeal>(meals: T[], mealType: HistoryMealType | "all", calorieRange: HistoryCalorieFilter): T[] {
  return meals.filter((meal) => {
    const matchesType = mealType === "all" || meal.mealType === mealType;
    const matchesCalories = calorieRange === "all" || calorieRange === "under400" && meal.calories < 400 || calorieRange === "400to700" && meal.calories >= 400 && meal.calories <= 700 || calorieRange === "over700" && meal.calories > 700;
    return matchesType && matchesCalories;
  });
}

export function sortHistoryMeals<T extends SortableMeal>(meals: T[], order: HistorySortOrder): T[] {
  return [...meals].sort((a, b) => order === "caloriesDesc"
    ? b.calories - a.calories
    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
