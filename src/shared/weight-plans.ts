export type WeightPlanGoal = "lose" | "maintain" | "gain";

export type WeightPlanProfile = {
  goal: WeightPlanGoal;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  weightKg: number | null;
  startWeightKg: number | null;
  targetWeightKg: number | null;
  targetDate: string | null;
};

const calorieAdjustments: Record<WeightPlanGoal, number> = { lose: -350, maintain: 0, gain: 300 };
const weeklyPaceKg: Record<WeightPlanGoal, number> = { lose: 0.4, maintain: 0, gain: 0.25 };

export function calculateWeightPlan(profile: WeightPlanProfile, selectedGoal: WeightPlanGoal, now = new Date()) {
  const currentGoalAdjustment = calorieAdjustments[profile.goal];
  const maintenanceCalories = Math.max(1200, profile.calorieGoal - currentGoalAdjustment);
  const calories = Math.max(1200, Math.round(maintenanceCalories + calorieAdjustments[selectedGoal]));
  const weight = profile.weightKg ?? 70;
  const proteinRatio = selectedGoal === "gain" ? 1.8 : selectedGoal === "lose" ? 1.6 : 1.4;
  const protein = Math.max(50, Math.round(weight * proteinRatio));
  const fat = Math.max(35, Math.round((calories * 0.25) / 9));
  const carbs = Math.max(80, Math.round((calories - protein * 4 - fat * 9) / 4));
  const target = profile.targetWeightKg ?? null;
  const difference = target == null || profile.weightKg == null ? null : Math.abs(target - profile.weightKg);
  const estimatedDays = difference != null && weeklyPaceKg[selectedGoal] > 0 ? Math.max(7, Math.ceil((difference / weeklyPaceKg[selectedGoal]) * 7)) : null;
  const targetDateDays = profile.targetDate ? Math.max(0, Math.ceil((new Date(`${profile.targetDate}T23:59:59`).getTime() - now.getTime()) / 86_400_000)) : null;
  const days = targetDateDays ?? estimatedDays;

  let progressPercent = 0;
  if (profile.weightKg != null && target != null) {
    const start = profile.startWeightKg ?? profile.weightKg;
    if (selectedGoal === "maintain") {
      progressPercent = Math.max(0, 100 - Math.abs(profile.weightKg - target) * 20);
    } else {
      const total = Math.abs(start - target);
      const achieved = selectedGoal === "lose" ? start - profile.weightKg : profile.weightKg - start;
      progressPercent = total === 0 ? 100 : (achieved / total) * 100;
    }
  }

  return {
    goal: selectedGoal,
    calories,
    protein,
    carbs,
    fat,
    days,
    estimatedDays,
    targetDateDays,
    difference,
    weeklyPaceKg: weeklyPaceKg[selectedGoal],
    progressPercent: Math.max(0, Math.min(100, Math.round(progressPercent))),
    hasProfileData: profile.weightKg != null,
    hasTarget: target != null,
  };
}
