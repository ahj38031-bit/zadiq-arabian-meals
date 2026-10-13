import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

type Content = string | Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "high" }>;

async function callJson(system: string, user: Content, name: string, schema: object, maxTokens: number): Promise<unknown> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI غير مهيأ");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: maxTokens,
      instructions: system,
      input: [{ role: "user", content: user }],
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error("[AI]", res.status, body.slice(0, 500));
    if (res.status === 429) throw new Error("rate_limited");
    if (res.status === 402) throw new Error("no_credits");
    throw new Error("ai_failed");
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        if (ev.type === "response.refusal.delta" || ev.type === "response.failed") throw new Error("ai_refused");
      } catch (e) { if ((e as Error).message === "ai_refused") throw e; }
    }
  }
  return JSON.parse(text);
}

const num = { type: "integer", minimum: 0 } as const;
const ingredientSchema = {
  type: "object",
  properties: { name: { type: "string" }, portion: { type: "string" }, grams: num, calories: num, protein: num, carbs: num, fat: num, fiber: num, sugar: num, sodium: num, confidence: { type: "integer", minimum: 0, maximum: 100 } },
  required: ["name", "portion", "grams", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "confidence"],
  additionalProperties: false,
};
const analysisSchema = {
  type: "object",
  properties: {
    mealName: { type: "string" }, mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] },
    calories: num, protein: num, carbs: num, fat: num, fiber: num, sugar: num, sodium: num,
    confidence: { type: "integer", minimum: 0, maximum: 100 }, summary: { type: "string" },
    items: { type: "array", items: { type: "string" } }, ingredients: { type: "array", items: ingredientSchema },
    assumptions: { type: "array", items: { type: "string" } },
  },
  required: ["mealName", "mealType", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium", "confidence", "summary", "items", "ingredients", "assumptions"],
  additionalProperties: false,
};
const int0 = z.number().int().nonnegative();
const analysisZ = z.object({
  mealName: z.string(), mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]), calories: int0, protein: int0, carbs: int0, fat: int0, fiber: int0, sugar: int0, sodium: int0,
  confidence: z.number().int().min(0).max(100), summary: z.string(), items: z.array(z.string()),
  ingredients: z.array(z.object({ name: z.string(), portion: z.string(), grams: int0, calories: int0, protein: int0, carbs: int0, fat: int0, fiber: int0, sugar: int0, sodium: int0, confidence: z.number().int().min(0).max(100) })),
  assumptions: z.array(z.string()),
});

export const analyzeMealAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    description: z.string().trim().max(500).optional(),
    imageData: z.string().max(8_000_000).regex(/^data:image\/(jpeg|png|webp);base64,/).optional(),
    plateSize: z.enum(["small", "medium", "large"]).default("medium"),
  }).refine((v) => Boolean(v.description || v.imageData)).parse(input))
  .handler(async ({ data }) => {
    const prompt = [
      "حلّل هذه الوجبة كخبير رؤية غذائية. أعد JSON فقط مطابقاً للمخطط.",
      "الهدف هو أفضل تقدير عملي للسعرات والماكروز، وليس مجرد تسمية الطبق.",
      "افحص الصورة منهجياً: حدّد كل عنصر ظاهر، طريقة الطهي، الصلصات والزيوت والإضافات المحتملة، ثم قدّر حجم الحصة.",
      `اختيار المستخدم لحجم الطبق هو: ${data.plateSize === "small" ? "صغير" : data.plateSize === "large" ? "كبير" : "متوسط"}. استخدمه كقرينة للحصة.`,
      "قسّم الوجبة إلى ingredients منفصلة مع اسم عربي، حصة مفهومة، غرامات، سعرات وبروتين وكربوهيدرات ودهون وألياف وسكريات وصوديوم (ملغ) وثقة.",
      "اجعل مجموع العناصر قريباً من إجمالي الوجبة، وتحقق من اتساق السعرات مع الماكروز.",
      "إذا لم تستطع تمييز عنصر لا تخترع اسماً، وخفّض confidence واذكر السبب في assumptions. قدّر الزيت والصلصة بحذر.",
      "لا تقدم نصائح طبية أو تشخيصاً. اللغة العربية في كل النصوص.",
      data.description ? `ملاحظة المستخدم (مصدر مهم): ${data.description}` : "لا توجد ملاحظة نصية؛ اعتمد على الصورة واذكر الافتراضات.",
    ].join("\n");
    const content: Content = data.imageData
      ? [{ type: "input_text", text: prompt }, { type: "input_image", image_url: data.imageData, detail: "high" }]
      : prompt;
    const parsed = analysisZ.parse(await callJson("أنت خبير تغذية تطبق تقديرات غذائية عملية. أعد JSON صالحاً فقط.", content, "meal_analysis", analysisSchema, 6000));
    const ingredientCalories = parsed.ingredients.reduce((s, i) => s + i.calories, 0);
    const calorieMismatch = parsed.calories > 0 ? Math.abs(ingredientCalories - parsed.calories) / parsed.calories : 0;
    const confidence = calorieMismatch > 0.35 ? Math.max(25, parsed.confidence - 15) : parsed.confidence;
    return { ...parsed, confidence, calorieMismatch };
  });

export const suggestCalorieAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({
    currentCalories: z.number().int().min(1200).max(10000), progressPercent: z.number().int().min(0).max(100),
    daysRemaining: z.number().int().nullable(), goal: z.enum(["lose", "maintain", "gain"]),
    adjustmentDirection: z.enum(["lower", "higher"]), currentWeightKg: z.number().int(), targetWeightKg: z.number().int(),
    language: z.enum(["ar", "en", "tr"]).default("ar"),
  }).parse(input))
  .handler(async ({ data }) => {
    const lang = data.language === "en" ? "English" : data.language === "tr" ? "Turkish" : "Arabic";
    const schema = { type: "object", properties: { suggestedCalories: { type: "integer" }, reason: { type: "string" }, focus: { type: "string" } }, required: ["suggestedCalories", "reason", "focus"], additionalProperties: false };
    const out = z.object({ suggestedCalories: z.number().int(), reason: z.string().min(1), focus: z.string().min(1) }).parse(await callJson(
      `أنت مساعد تغذية حذر. أعد JSON فقط باللغة ${lang}. لا تقدم تشخيصاً. اقترح تعديلاً صغيراً لا يتجاوز 10% ولا ينزل عن 1200 سعرة.`,
      `المستخدم أبطأ من جدوله. السعرات الحالية: ${data.currentCalories}. التقدم: ${data.progressPercent}%. الأيام المتبقية: ${data.daysRemaining}. الهدف: ${data.goal}. الوزن الحالي ${data.currentWeightKg} والمستهدف ${data.targetWeightKg}. المطلوب: ${data.adjustmentDirection === "lower" ? "خفض" : "رفع"} السعرات. اقترح رقماً وسبباً وعادة واحدة.`,
      "calorie_adjustment", schema, 2000));
    const maxDelta = Math.max(50, Math.round(data.currentCalories * 0.1));
    const lo = data.adjustmentDirection === "lower" ? Math.max(1200, data.currentCalories - maxDelta) : data.currentCalories;
    const hi = data.adjustmentDirection === "higher" ? data.currentCalories + maxDelta : data.currentCalories;
    const suggestedCalories = Math.min(hi, Math.max(lo, out.suggestedCalories));
    return { suggestedCalories, change: suggestedCalories - data.currentCalories, reason: out.reason, focus: out.focus, safetyNote: data.language === "en" ? "Review this suggestion before applying it." : data.language === "tr" ? "Uygulamadan önce bu öneriyi gözden geçirin." : "راجع الاقتراح قبل تطبيقه." };
  });

export const lookupBarcodeFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ barcode: z.string().min(8).max(32) }).parse(input))
  .handler(async ({ data }) => {
    const { lookupOpenFoodFacts } = await import("@/shared/open-food-facts");
    return lookupOpenFoodFacts(data.barcode);
  });
