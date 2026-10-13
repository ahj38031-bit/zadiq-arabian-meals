// Drop-in replacement for the original tRPC client: same hook shape, but data
// lives in localStorage and AI/barcode calls go to server functions.
import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import * as store from "./zadk-store";
import { analyzeMealAI, lookupBarcodeFn, suggestCalorieAI } from "./zadk-ai.functions";
import { calculateNutritionGoals } from "@/shared/nutrition-goals";

type QOpts = { enabled?: boolean; retry?: boolean | number; refetchOnWindowFocus?: boolean; staleTime?: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MOpts<TOut, TIn> = Omit<UseMutationOptions<TOut, Error, TIn>, "mutationFn"> & Record<string, any>;

function mutation<TIn, TOut>(fn: (input: TIn) => Promise<TOut> | TOut) {
  return {
    useMutation: (opts?: MOpts<TOut, TIn>) => useMutation<TOut, Error, TIn>({ ...(opts ?? {}), mutationFn: async (input: TIn) => fn(input) }),
  };
}

type AnalyzeIn = { description?: string; imageData?: string; imageMimeType?: string; plateSize?: "small" | "medium" | "large" };
type SaveProfileIn = Parameters<typeof store.saveProfile>[0];
type FrequentIn = Omit<store.FrequentMeal, "id" | "createdAt">;
type BarcodeMealIn = { name: string; brand?: string | null; mealType: store.MealType; barcode: string; servingGrams: number; calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number };
type SuggestIn = Parameters<typeof suggestCalorieAI>[0]["data"];

export const trpc = {
  useUtils() {
    const qc = useQueryClient();
    return { nutrition: { dashboard: { invalidate: () => qc.invalidateQueries({ queryKey: ["zadk", "dashboard"] }) } } };
  },
  nutrition: {
    dashboard: {
      useQuery: (_input?: undefined, opts?: QOpts) => useQuery({ queryKey: ["zadk", "dashboard"], queryFn: async () => store.getDashboard(), ...opts, retry: false }),
    },
    calculateGoals: {
      useQuery: (input: Parameters<typeof calculateNutritionGoals>[0], opts?: QOpts) => useQuery({ queryKey: ["zadk", "goals", input], queryFn: async () => calculateNutritionGoals(input), ...opts, retry: false }),
    },
    lookupBarcode: {
      useQuery: (input: { barcode: string }, opts?: QOpts) => useQuery({ queryKey: ["zadk", "barcode", input.barcode], queryFn: () => lookupBarcodeFn({ data: input }), ...opts, retry: false }),
    },
    analyzeMeal: mutation(async (input: AnalyzeIn) => {
      const analysis = await analyzeMealAI({ data: { description: input.description, imageData: input.imageData, plateSize: input.plateSize ?? "medium" } });
      const meal = store.createMeal({
        mealName: analysis.mealName.slice(0, 180), description: input.description ?? null, mealType: analysis.mealType,
        calories: analysis.calories, protein: analysis.protein, carbs: analysis.carbs, fat: analysis.fat, fiber: analysis.fiber, sugar: analysis.sugar, sodium: analysis.sodium,
        confidence: analysis.confidence,
        aiSummary: JSON.stringify({ summary: analysis.summary, items: analysis.items, ingredients: analysis.ingredients, assumptions: analysis.assumptions, calorieMismatch: analysis.calorieMismatch }),
      });
      return { meal, analysis };
    }),
    suggestCalorieAdjustment: mutation((input: SuggestIn) => suggestCalorieAI({ data: input })),
    saveProfile: mutation((input: SaveProfileIn) => store.saveProfile(input)),
    saveHistoryPreferences: mutation((input: Pick<store.Profile, "historyMealTypeFilter" | "historyCalorieFilter" | "historySortOrder">) => store.saveProfile(input)),
    createFrequentMeal: mutation((input: FrequentIn) => store.createFrequentMeal(input)),
    deleteFrequentMeal: mutation((input: { id: number }) => store.deleteFrequentMeal(input.id)),
    logFrequentMeal: mutation((input: { id: number; mealType: store.MealType }) => store.logFrequentMeal(input.id, input.mealType)),
    saveBarcodeMeal: mutation((input: BarcodeMealIn) => store.createMeal({
      mealName: input.name, description: input.brand ? `${input.brand} · باركود ${input.barcode}` : `باركود ${input.barcode}`, mealType: input.mealType,
      calories: input.calories, protein: Math.round(input.protein), carbs: Math.round(input.carbs), fat: Math.round(input.fat), fiber: Math.round(input.fiber), sugar: Math.round(input.sugar), sodium: input.sodium,
      confidence: 100, aiSummary: JSON.stringify({ source: "open-food-facts", barcode: input.barcode, servingGrams: input.servingGrams, brand: input.brand ?? null }),
    })),
    deleteMeal: mutation((input: { id: number }) => store.deleteMeal(input.id)),
    clearToday: mutation((_input?: void) => store.clearToday()),
  },
};
