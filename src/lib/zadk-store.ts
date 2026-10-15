// Browser-only data store for ZadkAI. All user data lives in localStorage.
import { calculateNutritionGoals } from "@/shared/nutrition-goals";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "high";
export type Goal = "lose" | "maintain" | "gain";

export type Profile = {
  calorieGoal: number; proteinGoal: number; carbsGoal: number; fatGoal: number;
  age: number | null; heightCm: number | null; weightKg: number | null; startWeightKg: number | null;
  targetWeightKg: number | null; targetDate: string | null;
  activityLevel: ActivityLevel; goal: Goal;
  historyMealTypeFilter: "all" | MealType;
  historyCalorieFilter: "all" | "under400" | "400to700" | "over700";
  historySortOrder: "latest" | "caloriesDesc";
  preferredEatingMethod: "bread" | "spoon" | "nothing";
  updatedAt: Date;
};
export type Meal = {
  id: number; mealName: string; description: string | null; mealType: MealType;
  calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number;
  confidence: number; aiSummary: string | null; imageKey: string | null; imageUrl: string | null; createdAt: Date;
};
export type FrequentMeal = {
  id: number; name: string; itemsSnapshot: string; mealType: MealType;
  calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number; createdAt: Date;
};
export type WeightLog = { id: number; weightKg: number; loggedAt: Date };

type Stored = {
  profile: Omit<Profile, "updatedAt"> & { updatedAt: number };
  meals: Array<Omit<Meal, "createdAt"> & { createdAt: number }>;
  frequentMeals: Array<Omit<FrequentMeal, "createdAt"> & { createdAt: number }>;
  weightLogs: Array<{ id: number; weightKg: number; loggedAt: number }>;
  nextId: number;
};

const KEY = "zadak-data-v1";

const defaultProfile = (): Stored["profile"] => ({
  calorieGoal: 2139, proteinGoal: 98, carbsGoal: 293, fatGoal: 64,
  age: null, heightCm: null, weightKg: null, startWeightKg: null, targetWeightKg: null, targetDate: null,
  activityLevel: "moderate", goal: "maintain",
  historyMealTypeFilter: "all", historyCalorieFilter: "all", historySortOrder: "latest",
  preferredEatingMethod: "nothing", updatedAt: Date.now(),
});

function load(): Stored {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      return { profile: { ...defaultProfile(), ...parsed.profile }, meals: parsed.meals ?? [], frequentMeals: parsed.frequentMeals ?? [], weightLogs: parsed.weightLogs ?? [], nextId: parsed.nextId ?? 1 };
    }
  } catch { /* fall through */ }
  return { profile: defaultProfile(), meals: [], frequentMeals: [], weightLogs: [], nextId: 1 };
}

function save(data: Stored) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full (usually images) — drop stored images and retry once.
    data.meals = data.meals.map((m) => ({ ...m, imageUrl: null }));
    window.localStorage.setItem(KEY, JSON.stringify(data));
  }
}

function mutate<T>(fn: (data: Stored) => T): T {
  const data = load();
  const result = fn(data);
  save(data);
  return result;
}

export function getDashboard() {
  const d = load();
  const profile: Profile = { ...d.profile, updatedAt: new Date(d.profile.updatedAt) };
  const meals: Meal[] = [...d.meals].sort((a, b) => b.createdAt - a.createdAt).slice(0, 500).map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
  const frequentMeals: FrequentMeal[] = [...d.frequentMeals].sort((a, b) => b.createdAt - a.createdAt).map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
  let weightLogs: WeightLog[] = [...d.weightLogs].sort((a, b) => b.loggedAt - a.loggedAt).map((w) => ({ ...w, loggedAt: new Date(w.loggedAt) }));
  if (!weightLogs.length && profile.weightKg != null) weightLogs = [{ id: 0, weightKg: profile.weightKg, loggedAt: profile.updatedAt }];
  return { profile, meals, frequentMeals, weightLogs };
}

export type NewMeal = Omit<Meal, "id" | "createdAt" | "imageKey" | "imageUrl"> & { imageUrl?: string | null; imageKey?: string | null };

export function createMeal(input: NewMeal): Meal {
  return mutate((d) => {
    const row = { ...input, imageKey: input.imageKey ?? null, imageUrl: input.imageUrl ?? null, id: d.nextId++, createdAt: Date.now() };
    d.meals.push(row);
    return { ...row, createdAt: new Date(row.createdAt) };
  });
}

export function deleteMeal(id: number) {
  let imageKey: string | null = null;
  mutate((d) => { imageKey = d.meals.find((m) => m.id === id)?.imageKey ?? null; d.meals = d.meals.filter((m) => m.id !== id); });
  return { success: true, imageKey: imageKey as string | null } as const;
}

export function clearToday() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = start.getTime() + 86_400_000;
  mutate((d) => { d.meals = d.meals.filter((m) => m.createdAt < start.getTime() || m.createdAt >= end); });
  return { success: true } as const;
}

type ProfileInput = Partial<Omit<Profile, "updatedAt" | "startWeightKg">> & { useAiCalorieAdjustment?: boolean };

export function saveProfile(input: ProfileInput) {
  const { useAiCalorieAdjustment, ...rest } = input;
  return mutate((d) => {
    const next = { ...rest } as Partial<Stored["profile"]>;
    if (rest.age && rest.heightCm && rest.weightKg && rest.activityLevel && !useAiCalorieAdjustment) {
      const g = calculateNutritionGoals({ age: rest.age, heightCm: rest.heightCm, weightKg: rest.weightKg, activityLevel: rest.activityLevel, goal: rest.goal ?? "maintain" });
      Object.assign(next, { calorieGoal: g.calorieGoal, proteinGoal: g.proteinGoal, carbsGoal: g.carbsGoal, fatGoal: g.fatGoal });
    }
    if (rest.targetWeightKg != null && d.profile.startWeightKg == null) {
      next.startWeightKg = d.profile.weightKg ?? rest.weightKg ?? null;
    }
    d.profile = { ...d.profile, ...next, updatedAt: Date.now() };
    if (rest.weightKg != null) d.weightLogs.push({ id: d.nextId++, weightKg: rest.weightKg, loggedAt: Date.now() });
    return { ...d.profile, updatedAt: new Date(d.profile.updatedAt) };
  });
}

export function createFrequentMeal(input: Omit<FrequentMeal, "id" | "createdAt">) {
  return mutate((d) => {
    const row = { ...input, id: d.nextId++, createdAt: Date.now() };
    d.frequentMeals.push(row);
    return row;
  });
}

export function deleteFrequentMeal(id: number) {
  mutate((d) => { d.frequentMeals = d.frequentMeals.filter((m) => m.id !== id); });
  return { success: true } as const;
}

export function logFrequentMeal(id: number, mealType: MealType) {
  const fm = load().frequentMeals.find((m) => m.id === id);
  if (!fm) throw new Error("not_found");
  let items: unknown = [];
  try { items = JSON.parse(fm.itemsSnapshot); } catch { /* ignore */ }
  return createMeal({ mealName: fm.name, description: "وجبة متكررة", mealType, calories: fm.calories, protein: fm.protein, carbs: fm.carbs, fat: fm.fat, fiber: fm.fiber, sugar: fm.sugar, sodium: fm.sodium, confidence: 85, aiSummary: JSON.stringify({ source: "frequent", items }) });
}
