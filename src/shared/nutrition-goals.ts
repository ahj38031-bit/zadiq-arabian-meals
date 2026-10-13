export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";
export type NutritionGoal = "lose" | "maintain" | "gain";

export type GoalInputs = {
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
};

export type NutritionGoals = {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  bmr: number;
  activityMultiplier: number;
  goalAdjustment: number;
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

/**
 * Estimates maintenance calories with the Mifflin-St Jeor equation using a
 * sex-neutral midpoint correction because the current profile does not ask for sex.
 * Goal adjustments are intentionally moderate: -15% for loss, 0% for maintenance,
 * and +10% for gain. Macro ratios also shift slightly to support the chosen goal.
 */
export function calculateNutritionGoals(input: GoalInputs): NutritionGoals {
  const { age, heightCm, weightKg, activityLevel, goal } = input;
  if (!Number.isFinite(age) || !Number.isFinite(heightCm) || !Number.isFinite(weightKg)) {
    throw new Error("Age, height, and weight are required");
  }
  const multiplier = activityMultipliers[activityLevel];
  const goalAdjustment = goal === "lose" ? 0.85 : goal === "gain" ? 1.1 : 1;
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 78);
  const calorieGoal = Math.max(1200, Math.round((bmr * multiplier * goalAdjustment) / 10) * 10);
  const proteinRatio = goal === "lose" ? 0.30 : 0.25;
  const carbsRatio = goal === "gain" ? 0.50 : goal === "lose" ? 0.40 : 0.45;
  const fatRatio = 1 - proteinRatio - carbsRatio;
  const proteinGoal = Math.max(40, Math.round((calorieGoal * proteinRatio) / 4));
  const carbsGoal = Math.max(40, Math.round((calorieGoal * carbsRatio) / 4));
  const fatGoal = Math.max(25, Math.round((calorieGoal * fatRatio) / 9));

  return { calorieGoal, proteinGoal, carbsGoal, fatGoal, bmr, activityMultiplier: multiplier, goalAdjustment };
}
