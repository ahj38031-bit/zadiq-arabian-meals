import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getProgressMotivationStatus } from "@/shared/progress";
import { buildNutritionComparison } from "@/shared/nutrition-chart";
import { scaleByPlateSize, type PlateSize } from "@/shared/plate-size";
import { filterHistoryMeals, sortHistoryMeals, type HistoryCalorieFilter, type HistorySortOrder } from "@/shared/history-filters";
import type { BarcodeNutrition } from "@/shared/barcode-nutrition";
import { buildNutritionInsights } from "@/shared/nutrition-insights";
import { PlansView } from "@/components/zadk/PlansView";
import { LocalLoginModal } from "@/components/zadk/LocalLoginModal";
import type { WeightPlanGoal } from "@/shared/weight-plans";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertCircle,
  Barcode,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Globe2,
  History,
  ImagePlus,
  LockKeyhole,
  Loader2,
  LogIn,
  Moon,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  UserRound,
  Volume2,
  VolumeX,
  Utensils,
  X,
  Zap,
} from "lucide-react";

type Language = "ar" | "en" | "tr";
type View = "home" | "history" | "stats" | "profile" | "plans";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type CalorieFilter = HistoryCalorieFilter;
type MealSortOrder = HistorySortOrder;
type NotificationKind = "success" | "error";
type NotificationTone = "gentle" | "chime" | "pulse" | "off";
type PlateSizeOption = PlateSize;
type AppNotification = { id: string; kind: NotificationKind; message: string; createdAt: number; read: boolean };
type AnalysisResultView = ReturnType<typeof parseSummary> & { mealName?: string; mealType?: MealType; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; sugar?: number; sodium?: number; confidence?: number; items?: string[]; ingredients?: Array<{ name: string; portion: string; grams: number; calories: number; protein: number; carbs: number; fat: number; fiber?: number; sugar?: number; sodium?: number; confidence: number }>; assumptions?: string[] };
type FrequentMealView = { id: number; name: string; itemsSnapshot: string; mealType: MealType; calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number; createdAt: Date };
type BarcodeProductView = { kind: "found"; barcode: string; name: string; brand: string | null; imageUrl: string | null; servingSize: string | null; servingGrams: number; grade: string | null; per100g: BarcodeNutrition; serving: BarcodeNutrition };

type Labels = {
  home: string; analyze: string; history: string; stats: string; profile: string; navigation: string; sectionIndicator: string; login: string; logout: string;
  greeting: string; headline: string; subheadline: string; analyzeNow: string; smart: string; today: string;
  calories: string; newDay: string; remaining: string; protein: string; carbs: string; fats: string; lastMeals: string;
  noMeals: string; emptyHint: string; viewHistory: string; startAnalysis: string; privacy: string; privacyTitle: string;
  privacyText: string; close: string; reset: string; soon: string; language: string; dark: string; light: string;
  sync: string; addMeal: string; descriptionPlaceholder: string; takePhoto: string; uploadPhoto: string;
  analyzing: string; analysisDone: string; mealSaved: string; mealDeleted: string; dayCleared: string; operationFailed: string; delete: string; allMeals: string; noHistory: string;
  statsTitle: string; weekly: string; totalMeals: string; avgCalories: string; avgProtein: string; targetSettings: string; autoGoals: string; autoGoalsHint: string; calculateGoals: string; goalsNeedData: string; calculatedGoals: string; bmr: string; activityMultiplier: string; photoNoteTitle: string; photoNoteHint: string; photoNotePlaceholder: string; oilHint: string; sauceHint: string; portionHint: string;
  calorieGoal: string; proteinGoal: string; carbsGoal: string; fatGoal: string; age: string; height: string; weight: string; goal: string; loseWeight: string; maintainWeight: string; gainWeight: string; goalHint: string; targetWeight: string; targetDate: string; progress: string; currentWeight: string; targetReached: string; daysLeft: string; overdue: string; setTargetHint: string; motivationReached: string; motivationAhead: string; motivationOnTrack: string; motivationDeadline: string; motivationOverdue: string; motivationStart: string; calorieSuggestion: string; aiSuggestionHint: string; suggestionReason: string; suggestionFocus: string; suggestionReview: string; applySuggestion: string; suggestionApplied: string; suggestionLoading: string; suggestionError: string; chartTitle: string; chartHint: string; caloriesSeries: string; weightSeries: string; chartRange: string; chartRange7: string; chartRange14: string; chartRange30: string; chartCaloriesAverage: string; chartLatestWeight: string; chartDailyTarget: string; chartVisible: string; noChartData: string;
  activity: string; save: string; saved: string; saving: string; calculatingGoals: string; breakfast: string; lunch: string; dinner: string; snack: string; plans?: string;
  notificationCenter: string; noNotifications: string; markAllRead: string; soundOn: string; soundOff: string; successTone: string; errorTone: string; toneGentle: string; toneChime: string; tonePulse: string; toneOff: string; guestHint: string; filters: string; mealTypeFilter: string; calorieFilter: string; allTypes: string; allCalories: string; under400: string; between400700: string; over700: string; filteredResults: string; noFilteredMeals: string; resetFilters: string; sortOrder: string; newestFirst: string; highestCalories: string; preferenceHint: string; guestPreferenceHint: string; preferencesSaving: string; preferencesSaved: string; preferencesError: string; preferencesLoading: string; signInToSync: string; confidence: string; estimated: string; items: string; removeImage: string; plateSize: string; plateSizeHint: string; plateSmall: string; plateMedium: string; plateLarge: string; portionAdjusted: string; saveFrequent: string; frequentSaved: string; frequentSaveError: string; frequentMeals: string; noFrequentMeals: string; logFrequent: string; loggingFrequent: string; frequentMealLogged: string; frequentMealDeleted: string; chooseMealType: string; removeFrequent: string; barcodeScanner: string; barcodePlaceholder: string; barcodeLookup: string; barcodeLookingUp: string; barcodeNotFound: string; barcodeUnavailable: string; barcodeInvalid: string; barcodeFound: string; saveBarcodeMeal: string; barcodeSaved: string; barcodeNutritionSource: string; fiber: string; sugar: string; sodium: string; perServing: string; per100g: string; grams: string; nutritionAlerts: string; smartAlternatives: string; alertHighSugar: string; alertHighFat: string; alertHighSodium: string; alertHighCalories: string; altReduceOil: string; altSwapFried: string; altSwapRice: string; altReduceSugar: string; altSmallerPortion: string;
};

const labels: Record<Language, Labels> = {
  ar: {
    home: "الرئيسية", analyze: "حلّل وجبة", history: "السجل", stats: "الإحصائيات", profile: "ملفي", navigation: "التنقل الرئيسي", sectionIndicator: "القسم {current} من {total}", login: "تسجيل الدخول للمزامنة", logout: "تسجيل الخروج",
    greeting: "أهلاً، يا صديق الصحة", headline: "اعرف ما في طبقك، وخُذ قرارك بثقة.", subheadline: "صوّر وجبتك أو صفها بكلماتك — وسنحوّلها إلى تقدير غذائي واضح خلال لحظات.", analyzeNow: "حلّل وجبتك الآن", smart: "ذكي وبسيط", today: "ملخص اليوم", calories: "سعرة", newDay: "يوم جديد", remaining: "متبقٍ", protein: "بروتين", carbs: "كربوهيدرات", fats: "دهون", lastMeals: "آخر الوجبات", noMeals: "لم تُسجّل أي وجبة بعد", emptyHint: "ابدأ بصورة أو وصف بسيط، وسنرتب النتيجة لك.", viewHistory: "عرض السجل", startAnalysis: "ابدأ التحليل", privacy: "الخصوصية والمعالجة", privacyTitle: "بياناتك على جهازك", privacyText: "افهم بوضوح أين تبقى بياناتك ومتى تُرسل صورة للتحليل.", close: "إغلاق", reset: "تم تصفير وجبات اليوم", soon: "الميزة جاهزة للحسابات المسجلة", language: "اللغة", dark: "الوضع الداكن", light: "الوضع الفاتح", sync: "تم تسجيل الدخول للمزامنة", addMeal: "إضافة وجبة", descriptionPlaceholder: "أو اكتب وصفاً لوجبتك هنا...", photoNoteTitle: "ملاحظة تساعد على التعرف", photoNoteHint: "اكتب ما لا يظهر في الصورة مثل نوع الزيت أو الصلصة أو حجم الحصة.", photoNotePlaceholder: "مثال: مطبوخ بملعقة زيت زيتون، مع صلصة طحينة...", oilHint: "زيت زيتون", sauceHint: "صلصة", portionHint: "حصة كبيرة", takePhoto: "التقاط صورة", uploadPhoto: "اختيار صورة", analyzing: "جارٍ تحليل وجبتك...", analysisDone: "نتيجة التحليل", mealSaved: "تم حفظ الوجبة في سجلك", mealDeleted: "تم حذف الوجبة", dayCleared: "تم تصفير وجبات اليوم", operationFailed: "تعذر إكمال العملية، حاول مرة أخرى", delete: "حذف", allMeals: "كل الوجبات", noHistory: "لا توجد وجبات في سجلك بعد", statsTitle: "إحصائياتك الغذائية", weekly: "آخر 7 أيام", totalMeals: "عدد الوجبات", avgCalories: "متوسط السعرات", avgProtein: "متوسط البروتين", targetSettings: "أهدافك اليومية", autoGoals: "احسب أهدافي تلقائياً", autoGoalsHint: "باستخدام العمر والطول والوزن ومستوى النشاط، سنقترح أهدافاً يومية مناسبة.", calculateGoals: "حساب الأهداف", goalsNeedData: "أكمل العمر والطول والوزن لحساب أهدافك تلقائياً.", calculatedGoals: "الأهداف المحسوبة", bmr: "معدل الأيض الأساسي", activityMultiplier: "معامل النشاط", calorieGoal: "هدف السعرات", proteinGoal: "هدف البروتين (غ)", carbsGoal: "هدف الكربوهيدرات (غ)", fatGoal: "هدف الدهون (غ)", age: "العمر", height: "الطول (سم)", weight: "الوزن (كغ)", goal: "هدفك الحالي", loseWeight: "خسارة الوزن", maintainWeight: "المحافظة على الوزن", gainWeight: "زيادة الوزن", goalHint: "سنعدّل السعرات والماكروز تلقائياً وفق هدفك.", targetWeight: "الوزن المستهدف (كغ)", targetDate: "تاريخ الوصول", progress: "تقدمك نحو الهدف", currentWeight: "وزنك الحالي", targetReached: "أحسنت، وصلت إلى هدفك", daysLeft: "يوم متبقٍ", overdue: "الموعد المحدد مضى", setTargetHint: "حدد نقطة وصول واضحة، وسنحولها إلى تقدم مرئي.", motivationReached: "أحسنت! وصلت إلى هدفك، حافظ على هذا الإيقاع.", motivationAhead: "رائع! تقدمك أسرع من المتوقع، استمر بهدوء.", motivationOnTrack: "كل خطوة محسوبة — أنت على الطريق الصحيح.", motivationDeadline: "اقترب موعدك، ركّز على عادة صغيرة اليوم.", motivationOverdue: "لم يفت الأوان، حدّث وزنك لنبدأ من جديد.", motivationStart: "البداية الهادئة تصنع الفرق، التزم بخطوتك التالية.", calorieSuggestion: "اقتراح ذكي للسعرات", aiSuggestionHint: "يبدو أن تقدمك أبطأ من الموعد. اقترحنا تعديلاً صغيراً لتراجعه.", suggestionReason: "لماذا؟", suggestionFocus: "ركّز على", suggestionReview: "اقتراح مساعد — راجعه قبل التطبيق", applySuggestion: "تطبيق الاقتراح", suggestionApplied: "تم تحديث هدف السعرات", suggestionLoading: "جارٍ إعداد اقتراح آمن...", suggestionError: "تعذر إعداد الاقتراح الآن.", chartTitle: "السعرات والوزن معاً", chartHint: "مرّر المؤشر على أي يوم لمقارنة استهلاكك بتغير الوزن الفعلي.", caloriesSeries: "السعرات المستهلكة", weightSeries: "الوزن الفعلي", chartRange: "آخر 14 يوماً", chartRange7: "7 أيام", chartRange14: "14 يوماً", chartRange30: "30 يوماً", chartCaloriesAverage: "متوسط السعرات", chartLatestWeight: "آخر وزن", chartDailyTarget: "الهدف اليومي", chartVisible: "عرض السلاسل", noChartData: "سجّل وجباتك ووزنك لعرض المقارنة هنا.", activity: "مستوى النشاط", save: "حفظ الأهداف", saved: "تم حفظ أهدافك", saving: "جارٍ حفظ التغييرات...", calculatingGoals: "جارٍ تحديث الأهداف...", breakfast: "الفطور", lunch: "الغداء", dinner: "العشاء", snack: "وجبة خفيفة", notificationCenter: "مركز الإشعارات", noNotifications: "لا توجد إشعارات سابقة", markAllRead: "تحديد الكل كمقروء", soundOn: "كتم صوت الإشعارات", soundOff: "تفعيل صوت الإشعارات", successTone: "نغمة النجاح", errorTone: "نغمة الخطأ", toneGentle: "هادئة", toneChime: "رنانة", tonePulse: "نبضية", toneOff: "بدون صوت", guestHint: "سجّل الدخول لحفظ وجباتك ومزامنتها بين أجهزتك.", signInToSync: "سجّل الدخول للمزامنة", confidence: "الثقة", estimated: "تقديري", items: "المكونات الظاهرة", removeImage: "إزالة الصورة", filters: "تصفية السجل", mealTypeFilter: "نوع الوجبة", calorieFilter: "السعرات الحرارية", allTypes: "كل الأنواع", allCalories: "كل السعرات", under400: "أقل من 400", between400700: "من 400 إلى 700", over700: "أكثر من 700", filteredResults: "وجبة ظاهرة", noFilteredMeals: "لا توجد وجبات بهذا الفلتر", resetFilters: "مسح التصفية", sortOrder: "ترتيب العرض", newestFirst: "الأحدث أولاً", highestCalories: "الأعلى سعراً أولاً", preferenceHint: "سيُحفظ ترتيبك وفلاترك تلقائياً مع حسابك.", guestPreferenceHint: "للحفظ بين الزيارات، سجّل الدخول للمزامنة.", preferencesSaving: "جارٍ حفظ التفضيل", preferencesSaved: "تم الحفظ", preferencesError: "تعذر الحفظ", preferencesLoading: "جارٍ استعادة تفضيلاتك...", plateSize: "حجم الطبق", plateSizeHint: "اختر الحجم الأقرب للطبق أو الكمية الظاهرة", plateSmall: "صغير", plateMedium: "متوسط", plateLarge: "كبير", portionAdjusted: "تم تحديث التقدير حسب حجم الطبق", saveFrequent: "حفظ كوجبة متكررة", frequentSaved: "تم حفظ الوجبة ضمن وجباتك المتكررة", frequentSaveError: "تعذر حفظ الوجبة المتكررة", frequentMeals: "وجباتي المتكررة", noFrequentMeals: "لا توجد وجبات متكررة بعد", logFrequent: "تسجيل اليوم", loggingFrequent: "جارٍ التسجيل...", frequentMealLogged: "تم تسجيل الوجبة اليوم", frequentMealDeleted: "تم حذف الوجبة المتكررة", chooseMealType: "اختر نوع الوجبة", removeFrequent: "حذف من المتكررة", barcodeScanner: "ماسح الباركود", barcodePlaceholder: "أدخل رقم الباركود", barcodeLookup: "بحث عن المنتج", barcodeLookingUp: "جارٍ البحث...", barcodeNotFound: "لم نعثر على هذا المنتج", barcodeUnavailable: "تعذر الاتصال بمصدر المنتجات", barcodeInvalid: "أدخل باركوداً صحيحاً من 8 إلى 14 رقماً", barcodeFound: "تم العثور على المنتج", saveBarcodeMeal: "تسجيل كوجبة", barcodeSaved: "تم تسجيل المنتج في سجلك", barcodeNutritionSource: "المصدر: Open Food Facts", fiber: "ألياف", sugar: "سكريات", sodium: "صوديوم", perServing: "للحصة", per100g: "لكل 100غ", grams: "غ", nutritionAlerts: "تنبيهات غذائية", smartAlternatives: "بدائل ذكية", alertHighSugar: "السكر مرتفع نسبياً في هذه الوجبة", alertHighFat: "الدهون مرتفعة نسبياً في هذه الوجبة", alertHighSodium: "الصوديوم مرتفع نسبياً في هذه الوجبة", alertHighCalories: "السعرات مرتفعة نسبياً لهذه الوجبة", altReduceOil: "خفّف الزيت أو اطلب الصلصة جانباً", altSwapFried: "جرّب الشوي أو القلي الهوائي بدلاً من القلي العميق", altSwapRice: "استبدل جزءاً من الأرز بخضار أو حبوب كاملة", altReduceSugar: "اختر نسخة أقل سكراً أو قلّل الإضافة الحلوة", altSmallerPortion: "ابدأ بنصف الحصة وأضف لاحقاً إذا احتجت"
  },
  en: {
    home: "Home", analyze: "Analyze meal", history: "History", stats: "Statistics", profile: "My profile", navigation: "Primary navigation", sectionIndicator: "Section {current} of {total}", login: "Log in to sync", logout: "Log out", greeting: "Hello, health friend", headline: "Know what's on your plate, and decide with confidence.", subheadline: "Snap your meal or describe it in words — we'll turn it into a clear nutrition estimate in moments.", analyzeNow: "Analyze your meal", smart: "Smart & simple", today: "Today's summary", calories: "calories", newDay: "New day", remaining: "remaining", protein: "Protein", carbs: "Carbs", fats: "Fat", lastMeals: "Recent meals", noMeals: "No meal logged yet", emptyHint: "Start with a photo or a simple description, and we'll organize the result for you.", viewHistory: "View history", startAnalysis: "Start analysis", privacy: "Privacy & processing", privacyTitle: "Your data on your device", privacyText: "Understand clearly where your data stays and when an image is sent for analysis.", close: "Close", reset: "Today's meals were cleared", soon: "This feature is ready for signed-in accounts", language: "Language", dark: "Dark mode", light: "Light mode", sync: "Signed in and ready to sync", addMeal: "Add meal", descriptionPlaceholder: "Or describe your meal here...", photoNoteTitle: "Note to improve recognition", photoNoteHint: "Mention hidden details such as oil, sauce, or portion size.", photoNotePlaceholder: "Example: cooked with one tablespoon olive oil and tahini sauce...", oilHint: "Olive oil", sauceHint: "Sauce", portionHint: "Large portion", takePhoto: "Take a photo", uploadPhoto: "Choose an image", analyzing: "Analyzing your meal...", analysisDone: "Analysis result", mealSaved: "Meal saved to your history", mealDeleted: "Meal deleted", dayCleared: "Today’s meals were cleared", operationFailed: "Something went wrong. Please try again.", delete: "Delete", allMeals: "All meals", noHistory: "No meals in your history yet", statsTitle: "Your nutrition stats", weekly: "Last 7 days", totalMeals: "Meals logged", avgCalories: "Average calories", avgProtein: "Average protein", targetSettings: "Your daily targets", autoGoals: "Calculate my targets automatically", autoGoalsHint: "Using your age, height, weight, and activity level, we'll suggest suitable daily targets.", calculateGoals: "Calculate targets", goalsNeedData: "Complete your age, height, and weight to calculate targets automatically.", calculatedGoals: "Calculated targets", bmr: "Basal metabolic rate", activityMultiplier: "Activity multiplier", calorieGoal: "Calorie goal", proteinGoal: "Protein goal (g)", carbsGoal: "Carb goal (g)", fatGoal: "Fat goal (g)", age: "Age", height: "Height (cm)", weight: "Weight (kg)", goal: "Your goal", loseWeight: "Lose weight", maintainWeight: "Maintain weight", gainWeight: "Gain weight", goalHint: "Calories and macros will adapt automatically to your goal.", targetWeight: "Target weight (kg)", targetDate: "Target date", progress: "Progress to your goal", currentWeight: "Current weight", targetReached: "Great work, you reached your goal", daysLeft: "days left", overdue: "Target date has passed", setTargetHint: "Set a clear finish line and turn it into visible progress.", motivationReached: "You made it! Keep this steady rhythm going.", motivationAhead: "Amazing — you are ahead of pace. Keep it calm and consistent.", motivationOnTrack: "Every step counts — you are on the right track.", motivationDeadline: "Your date is close. Focus on one small habit today.", motivationOverdue: "It is not too late. Update your weight and begin again.", motivationStart: "A gentle start makes a difference. Take your next step today.", calorieSuggestion: "Smart calorie suggestion", aiSuggestionHint: "Your progress appears behind schedule. We prepared a small change for you to review.", suggestionReason: "Why", suggestionFocus: "Focus on", suggestionReview: "Helpful suggestion — review before applying", applySuggestion: "Apply suggestion", suggestionApplied: "Calorie target updated", suggestionLoading: "Preparing a safe suggestion...", suggestionError: "We could not prepare a suggestion right now.", chartTitle: "Calories & weight together", chartHint: "Hover over a day to compare your intake with actual weight changes.", caloriesSeries: "Calories consumed", weightSeries: "Actual weight", chartRange: "Last 14 days", chartRange7: "7 days", chartRange14: "14 days", chartRange30: "30 days", chartCaloriesAverage: "Average calories", chartLatestWeight: "Latest weight", chartDailyTarget: "Daily target", chartVisible: "Visible series", noChartData: "Log meals and weight to see the comparison here.", activity: "Activity level", save: "Save targets", saved: "Your targets were saved", saving: "Saving changes...", calculatingGoals: "Updating targets...", breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack", notificationCenter: "Notification center", noNotifications: "No previous notifications", markAllRead: "Mark all as read", soundOn: "Mute notification sound", soundOff: "Enable notification sound", successTone: "Success tone", errorTone: "Error tone", toneGentle: "Gentle", toneChime: "Chime", tonePulse: "Pulse", toneOff: "Muted", guestHint: "Log in to save meals and sync them across devices.", signInToSync: "Log in to sync", confidence: "Confidence", estimated: "Estimated", items: "Detected items", removeImage: "Remove image", filters: "Filter history", mealTypeFilter: "Meal type", calorieFilter: "Calories", allTypes: "All types", allCalories: "All calories", under400: "Under 400", between400700: "400–700", over700: "Over 700", filteredResults: "meals shown", noFilteredMeals: "No meals match these filters", resetFilters: "Clear filters", sortOrder: "Sort display", newestFirst: "Newest first", highestCalories: "Highest calories first", preferenceHint: "Your filters and sort order are saved with your account.", guestPreferenceHint: "Log in to sync preferences across visits.", preferencesSaving: "Saving preference", preferencesSaved: "Saved", preferencesError: "Could not save", preferencesLoading: "Restoring your preferences...", plateSize: "Plate size", plateSizeHint: "Choose the closest size to the visible plate or amount", plateSmall: "Small", plateMedium: "Medium", plateLarge: "Large", portionAdjusted: "Estimate updated for plate size", saveFrequent: "Save as frequent", frequentSaved: "Meal saved to frequent meals", frequentSaveError: "Could not save frequent meal", frequentMeals: "My frequent meals", noFrequentMeals: "No frequent meals yet", logFrequent: "Log today", loggingFrequent: "Logging...", frequentMealLogged: "Meal logged for today", frequentMealDeleted: "Frequent meal deleted", chooseMealType: "Choose meal type", removeFrequent: "Remove from frequent", barcodeScanner: "Barcode scanner", barcodePlaceholder: "Enter barcode number", barcodeLookup: "Find product", barcodeLookingUp: "Looking up...", barcodeNotFound: "We couldn’t find this product", barcodeUnavailable: "The product source is unavailable", barcodeInvalid: "Enter a valid 8–14 digit barcode", barcodeFound: "Product found", saveBarcodeMeal: "Log as meal", barcodeSaved: "Product logged to your history", barcodeNutritionSource: "Source: Open Food Facts", fiber: "Fiber", sugar: "Sugar", sodium: "Sodium", perServing: "Per serving", per100g: "Per 100g", grams: "g", nutritionAlerts: "Nutrition notes", smartAlternatives: "Smart alternatives", alertHighSugar: "Sugar is relatively high in this meal", alertHighFat: "Fat is relatively high in this meal", alertHighSodium: "Sodium is relatively high in this meal", alertHighCalories: "Calories are relatively high for this meal", altReduceOil: "Use less oil or ask for sauce on the side", altSwapFried: "Try grilled or air-fried instead of deep-fried", altSwapRice: "Swap part of the rice for vegetables or whole grains", altReduceSugar: "Choose a lower-sugar version or reduce the sweet topping", altSmallerPortion: "Start with half the portion and add more if needed"
  },
  tr: {
    home: "Ana sayfa", analyze: "Öğün analiz et", history: "Geçmiş", stats: "İstatistikler", profile: "Profilim", navigation: "Ana navigasyon", sectionIndicator: "Bölüm {current} / {total}", login: "Senkronize olmak için giriş", logout: "Çıkış", greeting: "Merhaba, sağlık dostu", headline: "Tabağında ne olduğunu bil, güvenle karar ver.", subheadline: "Öğünün fotoğrafını çek veya kelimelerle anlat — saniyeler içinde anlaşılır bir beslenme tahmini sunalım.", analyzeNow: "Öğününü analiz et", smart: "Akıllı ve basit", today: "Bugünün özeti", calories: "kalori", newDay: "Yeni gün", remaining: "kalan", protein: "Protein", carbs: "Karbonhidrat", fats: "Yağ", lastMeals: "Son öğünler", noMeals: "Henüz öğün kaydedilmedi", emptyHint: "Bir fotoğraf veya kısa açıklamayla başlayın, sonucu sizin için düzenleyelim.", viewHistory: "Geçmişi gör", startAnalysis: "Analizi başlat", privacy: "Gizlilik ve işleme", privacyTitle: "Verileriniz cihazınızda", privacyText: "Verilerinizin nerede kaldığını ve bir görüntünün ne zaman analiz için gönderildiğini açıkça görün.", close: "Kapat", reset: "Bugünün öğünleri temizlendi", soon: "Bu özellik giriş yapan hesaplar için hazır", language: "Dil", dark: "Karanlık mod", light: "Aydınlık mod", sync: "Giriş yapıldı ve senkronizasyona hazır", addMeal: "Öğün ekle", descriptionPlaceholder: "Veya öğününüzü açıklayın...", photoNoteTitle: "Tanımayı iyileştiren not", photoNoteHint: "Yağ, sos veya porsiyon gibi görünmeyen ayrıntıları yazın.", photoNotePlaceholder: "Örnek: bir kaşık zeytinyağı ve tahin sosuyla pişirildi...", oilHint: "Zeytinyağı", sauceHint: "Sos", portionHint: "Büyük porsiyon", takePhoto: "Fotoğraf çek", uploadPhoto: "Görsel seç", analyzing: "Öğününüz analiz ediliyor...", analysisDone: "Analiz sonucu", mealSaved: "Öğün geçmişinize kaydedildi", mealDeleted: "Öğün silindi", dayCleared: "Bugünün öğünleri temizlendi", operationFailed: "İşlem tamamlanamadı. Lütfen tekrar deneyin.", delete: "Sil", allMeals: "Tüm öğünler", noHistory: "Geçmişinizde henüz öğün yok", statsTitle: "Beslenme istatistikleriniz", weekly: "Son 7 gün", totalMeals: "Kaydedilen öğün", avgCalories: "Ortalama kalori", avgProtein: "Ortalama protein", targetSettings: "Günlük hedefleriniz", autoGoals: "Hedeflerimi otomatik hesapla", autoGoalsHint: "Yaş, boy, kilo ve aktivite seviyenizi kullanarak uygun günlük hedefler önereceğiz.", calculateGoals: "Hedefleri hesapla", goalsNeedData: "Hedefleri otomatik hesaplamak için yaş, boy ve kilonuzu tamamlayın.", calculatedGoals: "Hesaplanan hedefler", bmr: "Bazal metabolizma", activityMultiplier: "Aktivite katsayısı", calorieGoal: "Kalori hedefi", proteinGoal: "Protein hedefi (g)", carbsGoal: "Karbonhidrat hedefi (g)", fatGoal: "Yağ hedefi (g)", age: "Yaş", height: "Boy (cm)", weight: "Kilo (kg)", goal: "Hedefiniz", loseWeight: "Kilo ver", maintainWeight: "Kilonu koru", gainWeight: "Kilo al", goalHint: "Kalori ve makrolar hedefinize göre otomatik uyarlanır.", targetWeight: "Hedef kilo (kg)", targetDate: "Hedef tarihi", progress: "Hedefe ilerleme", currentWeight: "Mevcut kilonuz", targetReached: "Harika, hedefinize ulaştınız", daysLeft: "gün kaldı", overdue: "Hedef tarihi geçti", setTargetHint: "Net bir bitiş çizgisi belirleyin ve ilerlemenizi görün.", motivationReached: "Başardınız! Bu istikrarlı ritmi koruyun.", motivationAhead: "Harika — hedef temposunun önündesiniz, sakin ve istikrarlı kalın.", motivationOnTrack: "Her adım önemli — doğru yoldasınız.", motivationDeadline: "Hedef tarihiniz yaklaştı. Bugün küçük bir alışkanlığa odaklanın.", motivationOverdue: "Henüz geç değil. Kilonuzu güncelleyin ve yeniden başlayın.", motivationStart: "Sakin bir başlangıç fark yaratır. Bugünkü adımınızı atın.", calorieSuggestion: "Akıllı kalori önerisi", aiSuggestionHint: "İlerlemeniz takvimin gerisinde görünüyor. İncelemeniz için küçük bir değişiklik hazırladık.", suggestionReason: "Neden", suggestionFocus: "Odaklanın", suggestionReview: "Yardımcı öneri — uygulamadan önce inceleyin", applySuggestion: "Öneriyi uygula", suggestionApplied: "Kalori hedefi güncellendi", suggestionLoading: "Güvenli öneri hazırlanıyor...", suggestionError: "Şu anda öneri hazırlanamadı.", chartTitle: "Kalori ve kilo birlikte", chartHint: "Gerçek kilo değişiminizle tüketiminizi karşılaştırmak için bir günün üzerine gelin.", caloriesSeries: "Tüketilen kalori", weightSeries: "Gerçek kilo", chartRange: "Son 14 gün", chartRange7: "7 gün", chartRange14: "14 gün", chartRange30: "30 gün", chartCaloriesAverage: "Ortalama kalori", chartLatestWeight: "Son kilo", chartDailyTarget: "Günlük hedef", chartVisible: "Görünen seriler", noChartData: "Karşılaştırmayı görmek için öğün ve kilo kaydedin.", activity: "Aktivite seviyesi", save: "Hedefleri kaydet", saved: "Hedefleriniz kaydedildi", saving: "Değişiklikler kaydediliyor...", calculatingGoals: "Hedefler güncelleniyor...", breakfast: "Kahvaltı", lunch: "Öğle", dinner: "Akşam", snack: "Atıştırmalık", notificationCenter: "Bildirim merkezi", noNotifications: "Önceki bildirim yok", markAllRead: "Tümünü okundu olarak işaretle", soundOn: "Bildirim sesini kapat", soundOff: "Bildirim sesini aç", successTone: "Başarı tonu", errorTone: "Hata tonu", toneGentle: "Yumuşak", toneChime: "Çınlama", tonePulse: "Darbe", toneOff: "Sessiz", guestHint: "Öğünlerinizi kaydetmek ve cihazlar arasında senkronize etmek için giriş yapın.", signInToSync: "Senkronize olmak için giriş", confidence: "Güven", estimated: "Tahmini", items: "Algılanan öğeler", removeImage: "Görseli kaldır", filters: "Geçmişi filtrele", mealTypeFilter: "Öğün türü", calorieFilter: "Kalori", allTypes: "Tüm türler", allCalories: "Tüm kaloriler", under400: "400 altı", between400700: "400–700", over700: "700 üstü", filteredResults: "öğün gösteriliyor", noFilteredMeals: "Bu filtrelerle eşleşen öğün yok", resetFilters: "Filtreleri temizle", sortOrder: "Görüntüleme sırası", newestFirst: "En yeni önce", highestCalories: "En yüksek kalori önce", preferenceHint: "Filtreleriniz ve sıralamanız hesabınıza kaydedilir.", guestPreferenceHint: "Ziyaretler arasında senkronizasyon için giriş yapın.", preferencesSaving: "Tercih kaydediliyor", preferencesSaved: "Kaydedildi", preferencesError: "Kaydedilemedi", preferencesLoading: "Tercihleriniz geri yükleniyor...", plateSize: "Tabak boyutu", plateSizeHint: "Görünen tabağa veya miktara en yakın boyutu seçin", plateSmall: "Küçük", plateMedium: "Orta", plateLarge: "Büyük", portionAdjusted: "Tahmin tabak boyutuna göre güncellendi", saveFrequent: "Sık kullanılanlara kaydet", frequentSaved: "Öğün sık kullanılanlara kaydedildi", frequentSaveError: "Sık kullanılan öğün kaydedilemedi", frequentMeals: "Sık kullanılan öğünlerim", noFrequentMeals: "Henüz sık kullanılan öğün yok", logFrequent: "Bugün kaydet", loggingFrequent: "Kaydediliyor...", frequentMealLogged: "Öğün bugün kaydedildi", frequentMealDeleted: "Sık kullanılan öğün silindi", chooseMealType: "Öğün türünü seçin", removeFrequent: "Sık kullanılanlardan kaldır", barcodeScanner: "Barkod tarayıcı", barcodePlaceholder: "Barkod numarasını girin", barcodeLookup: "Ürünü bul", barcodeLookingUp: "Aranıyor...", barcodeNotFound: "Bu ürünü bulamadık", barcodeUnavailable: "Ürün kaynağına ulaşılamıyor", barcodeInvalid: "8–14 haneli geçerli bir barkod girin", barcodeFound: "Ürün bulundu", saveBarcodeMeal: "Öğün olarak kaydet", barcodeSaved: "Ürün geçmişinize kaydedildi", barcodeNutritionSource: "Kaynak: Open Food Facts", fiber: "Lif", sugar: "Şeker", sodium: "Sodyum", perServing: "Porsiyon başına", per100g: "100 g başına", grams: "g", nutritionAlerts: "Beslenme notları", smartAlternatives: "Akıllı alternatifler", alertHighSugar: "Bu öğünde şeker nispeten yüksek", alertHighFat: "Bu öğünde yağ nispeten yüksek", alertHighSodium: "Bu öğünde sodyum nispeten yüksek", alertHighCalories: "Bu öğün için kalori nispeten yüksek", altReduceOil: "Daha az yağ kullanın veya sosu ayrı isteyin", altSwapFried: "Derin kızartma yerine ızgara veya airfryer deneyin", altSwapRice: "Pirinç miktarının bir kısmını sebze veya tam tahılla değiştirin", altReduceSugar: "Daha az şekerli bir seçenek seçin veya tatlı eklemeyi azaltın", altSmallerPortion: "Yarım porsiyonla başlayın, gerekirse sonra ekleyin"
  },
};

const marketingCopy = {
  ar: {
    kicker: "مساعدك اليومي لفهم طعامك", trust: "تقدير ذكي • واضح • قابل للفهم", previewTitle: "تحليل فوري", previewDish: "طبق متوازن", previewStatus: "تم التعرف على 6 مكونات", previewConfidence: "دقة التعرّف", previewEstimate: "تقدير غذائي", focus: "خطوتك التالية أسهل", focusText: "صوّر وجبتك، أضف ملاحظة قصيرة عن الزيت أو الصلصة، واترك الباقي لزادك.", featureOne: "تعرّف بصري أدق", featureOneText: "يفكك الطبق إلى مكونات وحصص بدلاً من تخمين اسم واحد.", featureTwo: "نتيجة تفهمها", featureTwoText: "السعرات والماكروز والافتراضات في بطاقة واحدة واضحة.", featureThree: "خصوصيتك أولاً", featureThreeText: "لا تُحلل الصورة إلا عندما تطلب ذلك ويمكنك حذف السجل.", setup: "اضبط أهدافك", weekly: "نظرة سريعة على يومك", analyzePrompt: "ابدأ بصورة أو وصف قصير" 
  },
  en: {
    kicker: "Your everyday food intelligence", trust: "Smart • clear • easy to understand", previewTitle: "Instant analysis", previewDish: "Balanced plate", previewStatus: "6 ingredients detected", previewConfidence: "Recognition confidence", previewEstimate: "Nutrition estimate", focus: "Your next step, made easy", focusText: "Snap your meal, add a quick note about oil or sauce, and let Zadak do the rest.", featureOne: "Sharper visual recognition", featureOneText: "Breaks a plate into ingredients and portions instead of one broad guess.", featureTwo: "A result you can use", featureTwoText: "Calories, macros, and assumptions in one clear card.", featureThree: "Privacy comes first", featureThreeText: "Images are analyzed only when you ask, and history stays removable.", setup: "Set your targets", weekly: "A quick look at your day", analyzePrompt: "Start with a photo or short note"
  },
  tr: {
    kicker: "Günlük beslenme yardımcınız", trust: "Akıllı • anlaşılır • pratik", previewTitle: "Anında analiz", previewDish: "Dengeli tabak", previewStatus: "6 içerik algılandı", previewConfidence: "Tanıma güveni", previewEstimate: "Beslenme tahmini", focus: "Sıradaki adımınız kolay", focusText: "Öğününüzü çekin, yağ veya sos hakkında kısa bir not ekleyin; gerisini Zadak'a bırakın.", featureOne: "Daha güçlü görsel tanıma", featureOneText: "Tabağı tek bir tahmin yerine içeriklere ve porsiyonlara ayırır.", featureTwo: "Kullanışlı bir sonuç", featureTwoText: "Kalori, makro ve varsayımlar tek bir net kartta.", featureThree: "Gizlilik önceliğimiz", featureThreeText: "Görüntüler yalnızca istediğinizde analiz edilir ve geçmiş silinebilir.", setup: "Hedeflerini ayarla", weekly: "Gününüzden hızlı bir görünüm", analyzePrompt: "Fotoğraf veya kısa notla başlayın"
  },
} as const;

const navItems = [
  { key: "home" as const, icon: Utensils },
  { key: "analyze" as const, icon: Sparkles },
  { key: "plans" as const, icon: Target },
  { key: "history" as const, icon: History },
  { key: "stats" as const, icon: BarChart3 },
  { key: "profile" as const, icon: UserRound },
];
const mobileSections: View[] = ["home", "history", "plans", "stats", "profile"];
const planNavLabels: Record<Language, string> = { ar: "الخطط", en: "Plans", tr: "Planlar" };
function navLabel(key: keyof Labels, language: Language, t: Labels) {
  return key === "plans" ? planNavLabels[language] : t[key];
}

type ProfileForm = { calorieGoal: number; proteinGoal: number; carbsGoal: number; fatGoal: number; age: number | null; heightCm: number | null; weightKg: number | null; startWeightKg: number | null; targetWeightKg: number | null; targetDate: string | null; activityLevel: "sedentary" | "light" | "moderate" | "high"; goal: "lose" | "maintain" | "gain" };
const defaultProfile: ProfileForm = { calorieGoal: 2139, proteinGoal: 98, carbsGoal: 293, fatGoal: 64, age: null, heightCm: null, weightKg: null, startWeightKg: null, targetWeightKg: null, targetDate: null, activityLevel: "moderate", goal: "maintain" };

function formatNumber(value: number, language: Language) {
  return value.toLocaleString(language === "ar" ? "ar-EG" : language === "tr" ? "tr-TR" : "en-US");
}

function isToday(date: Date | string) {
  const a = new Date(date); const b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseSummary(value: string | null) {
  try { return value ? JSON.parse(value) as { summary?: string; items?: string[] } : {}; } catch { return {}; }
}

function playNotificationTone(tone: NotificationTone) {
  if (tone === "off" || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const settings = tone === "chime" ? { start: 740, end: 980, duration: 0.19 } : tone === "pulse" ? { start: 430, end: 430, duration: 0.14 } : { start: 560, end: 680, duration: 0.16 };
    oscillator.type = tone === "pulse" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(settings.start, now);
    oscillator.frequency.exponentialRampToValueAtTime(settings.end, now + Math.min(0.1, settings.duration * 0.6));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(tone === "pulse" ? 0.045 : 0.055, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + settings.duration + 0.01);
    oscillator.addEventListener("ended", () => { void context.close(); }, { once: true });
  } catch {
    // Browsers may block audio until a user gesture; the visual Toast still appears.
  }
}function NotificationCenter({ notifications, open, onToggle, onMarkAllRead, soundEnabled, onToggleSound, successTone, errorTone, onToneChange, t, dark }: { notifications: AppNotification[]; open: boolean; onToggle: () => void; onMarkAllRead: () => void; soundEnabled: boolean; onToggleSound: () => void; successTone: NotificationTone; errorTone: NotificationTone; onToneChange: (kind: NotificationKind, tone: NotificationTone) => void; t: Labels; dark: boolean }) {
  const unreadCount = notifications.filter((item) => !item.read).length;
  return <div className="relative"><button type="button" onClick={onToggle} aria-label={t.notificationCenter} aria-expanded={open} className={`relative grid h-9 w-9 place-items-center rounded-full transition-colors ${dark ? "bg-white/10 text-[#b8d9c3] hover:bg-white/15" : "bg-[#eef2ed] text-[#718078] hover:bg-[#e3eee5]"}`}><Bell size={16} />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#d49c3e] px-1 text-[9px] font-black text-white ring-2 ring-[#fbfbf8]" aria-label={`${unreadCount}`}>{unreadCount > 9 ? "9+" : unreadCount}</span>}</button>{open && <div className={`zadak-notification-popover absolute left-0 top-12 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-[0_18px_45px_rgba(35,67,51,.16)] ${dark ? "border-white/10 bg-[#20312b] text-[#e6f1e8]" : "border-[#e1ebe1] bg-white text-[#24362b]"}`} role="dialog" aria-label={t.notificationCenter}><div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${dark ? "border-white/10" : "border-[#eef2ed]"}`}><div><h2 className="text-xs font-black">{t.notificationCenter}</h2><p className={`mt-1 text-[9px] ${dark ? "text-[#a9c0af]" : "text-[#8a978f]"}`}>{notifications.length} · {unreadCount} {t.markAllRead}</p></div><div className="flex items-center gap-1.5"><button type="button" onClick={onToggleSound} aria-label={soundEnabled ? t.soundOn : t.soundOff} className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${dark ? "text-[#b8d9c3] hover:bg-white/10" : "text-[#718078] hover:bg-[#eef5ee]"}`}>{soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button>{unreadCount > 0 && <button type="button" onClick={onMarkAllRead} className="rounded-full px-2.5 py-1.5 text-[9px] font-bold text-[#16866f] transition-colors hover:bg-[#eaf7ed]">{t.markAllRead}</button>}</div></div><div className={`grid grid-cols-2 gap-2 border-b px-4 py-2.5 ${dark ? "border-white/10" : "border-[#eef2ed]"}`}><label className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[9px] font-bold ${dark ? "bg-white/5 text-[#b8d0be]" : "bg-[#f7fbf7] text-[#6e7c72]"}`}>{t.successTone}<select value={successTone} onChange={(event) => onToneChange("success", event.target.value as NotificationTone)} className="max-w-[78px] rounded-md border-0 bg-transparent text-[9px] font-bold outline-none"><option value="gentle">{t.toneGentle}</option><option value="chime">{t.toneChime}</option><option value="pulse">{t.tonePulse}</option><option value="off">{t.toneOff}</option></select></label><label className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[9px] font-bold ${dark ? "bg-white/5 text-[#b8d0be]" : "bg-[#f7fbf7] text-[#6e7c72]"}`}>{t.errorTone}<select value={errorTone} onChange={(event) => onToneChange("error", event.target.value as NotificationTone)} className="max-w-[78px] rounded-md border-0 bg-transparent text-[9px] font-bold outline-none"><option value="gentle">{t.toneGentle}</option><option value="chime">{t.toneChime}</option><option value="pulse">{t.tonePulse}</option><option value="off">{t.toneOff}</option></select></label></div>{notifications.length === 0 ? <div className="grid min-h-28 place-items-center px-5 text-center"><div><Bell className="mx-auto mb-2 text-[#9bc7a8]" size={22} /><p className={`text-xs font-bold ${dark ? "text-[#b2c7b7]" : "text-[#7d897f]"}`}>{t.noNotifications}</p></div></div> : <ul className="max-h-72 overflow-y-auto p-2">{notifications.map((item) => <li key={item.id} className={`flex gap-2.5 rounded-xl p-2.5 transition-colors ${item.read ? "opacity-70" : dark ? "bg-white/5" : "bg-[#f7fbf7]"}`}><span className={`mt-0.5 shrink-0 ${item.kind === "success" ? "text-[#16866f]" : "text-[#c66a5d]"}`}>{item.kind === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}</span><div className="min-w-0"><p className="text-[10px] font-semibold leading-5">{item.message}</p><time className={`mt-0.5 block text-[9px] ${dark ? "text-[#8fa999]" : "text-[#9aa69d]"}`} dateTime={new Date(item.createdAt).toISOString()}>{new Date(item.createdAt).toLocaleTimeString(languageLocale(t), { hour: "2-digit", minute: "2-digit" })}</time></div></li>)}</ul>}</div>}</div>;
}

function languageLocale(t: Labels) {
  return t.notificationCenter === "مركز الإشعارات" ? "ar-EG" : t.notificationCenter === "Bildirim merkezi" ? "tr-TR" : "en-US";
}

function PlateSizePicker({ value, onChange, t, dark, compact = false }: { value: PlateSizeOption; onChange: (value: PlateSizeOption) => void; t: Labels; dark: boolean; compact?: boolean }) {
  const options: Array<{ value: PlateSizeOption; label: string; scale: string }> = [
    { value: "small", label: t.plateSmall, scale: "−25%" },
    { value: "medium", label: t.plateMedium, scale: "100%" },
    { value: "large", label: t.plateLarge, scale: "+25%" },
  ];
  return <section className={`rounded-2xl border p-3 ${dark ? "border-white/10 bg-[#182a23]" : "border-[#e3ece2] bg-[#f8fcf7]"}`} aria-labelledby="plate-size-title">
    <div className="mb-2 flex items-start justify-between gap-3"><div><h4 id="plate-size-title" className="text-xs font-extrabold">{t.plateSize}</h4><p className={`mt-1 text-[10px] ${dark ? "text-[#9fb7a8]" : "text-[#819087]"}`}>{t.plateSizeHint}</p></div><Utensils size={16} className="mt-1 shrink-0 text-[#d49c3e]" /></div>
    <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-3"}`} role="radiogroup" aria-label={t.plateSize}>{options.map((option) => <button key={option.value} type="button" role="radio" aria-checked={value === option.value} onClick={() => onChange(option.value)} className={`rounded-xl border px-2 py-2 text-center transition-all active:scale-[.97] ${value === option.value ? "border-[#16866f] bg-[#e7f5e9] text-[#087b69] shadow-sm" : dark ? "border-white/10 bg-[#20312b] text-[#b7cdbd] hover:bg-white/5" : "border-[#e0eae0] bg-white text-[#6d7d72] hover:border-[#bcd8c1]"}`}><span className="block text-[11px] font-extrabold">{option.label}</span><span className="mt-0.5 block text-[9px] opacity-70">{option.scale}</span></button>)}</div>
  </section>;
}

function FrequentMealsSection({ meals, selectedMealType, onMealTypeChange, onLog, onDelete, t, dark, loggingId }: { meals: FrequentMealView[]; selectedMealType: MealType; onMealTypeChange: (value: MealType) => void; onLog: (id: number) => void; onDelete: (id: number) => void; t: Labels; dark: boolean; loggingId?: number }) {
  return <section className={`mt-5 rounded-2xl border p-3 ${dark ? "border-white/10 bg-[#182a23]" : "border-[#e3ece2] bg-[#f8fcf7]"}`} aria-labelledby="frequent-meals-title">
    <div className="flex items-start justify-between gap-3"><div><h4 id="frequent-meals-title" className="text-xs font-extrabold">{t.frequentMeals}</h4><p className={`mt-1 text-[10px] ${dark ? "text-[#9fb7a8]" : "text-[#819087]"}`}>{t.chooseMealType}</p></div><Star size={16} className="mt-1 shrink-0 text-[#d49c3e]" /></div>
    {meals.length ? <><label className="mt-3 block text-[10px] font-bold text-[#7f8d83]">{t.chooseMealType}<select value={selectedMealType} onChange={(event) => onMealTypeChange(event.target.value as MealType)} className={`mt-1 h-9 w-full rounded-xl border px-2 text-xs outline-none focus:ring-2 focus:ring-[#70b99a] ${dark ? "border-white/10 bg-[#20312b] text-[#d9e8dc]" : "border-[#e1e9e1] bg-white text-[#526158]"}`}><option value="breakfast">{t.breakfast}</option><option value="lunch">{t.lunch}</option><option value="dinner">{t.dinner}</option><option value="snack">{t.snack}</option></select></label><div className="mt-3 space-y-2">{meals.map((meal) => <div key={meal.id} className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 ${dark ? "border-white/10 bg-[#20312b]" : "border-[#e5eee4] bg-white"}`}><div className="min-w-0"><div className="truncate text-[11px] font-extrabold">{meal.name}</div><div className="mt-1 text-[10px] text-[#849188]">{meal.calories} {t.calories} · {t[meal.mealType]}</div></div><div className="flex shrink-0 items-center gap-1.5"><button type="button" onClick={() => onLog(meal.id)} disabled={loggingId === meal.id} className="rounded-full bg-[#087b69] px-2.5 py-1.5 text-[10px] font-bold text-white transition-transform active:scale-95 disabled:opacity-60">{loggingId === meal.id ? t.loggingFrequent : t.logFrequent}</button><button type="button" onClick={() => onDelete(meal.id)} className="grid h-7 w-7 place-items-center rounded-full text-[#9da8a0] transition-colors hover:bg-red-50 hover:text-red-500" aria-label={t.removeFrequent}><Trash2 size={12} /></button></div></div>)}</div></> : <p className={`mt-3 rounded-xl px-3 py-4 text-center text-[10px] ${dark ? "bg-[#20312b] text-[#9fb7a8]" : "bg-white text-[#849188]"}`}>{t.noFrequentMeals}</p>}
  </section>;
}

function Logo() {
  return <div className="flex items-center gap-3" dir="rtl"><div className="relative grid h-11 w-11 place-items-center rounded-full bg-[#087b69] text-white shadow-[0_8px_18px_rgba(6,101,84,.2)]"><Utensils size={20} strokeWidth={2.2} /><span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-[#f0ad4e] ring-2 ring-white" /></div><div className="leading-none"><div className="text-[17px] font-black tracking-[-0.04em] text-[#087b69]">زادك AI</div><div className="mt-1 text-[7px] font-bold tracking-[.2em] text-[#9b9b93]">YOUR FOOD COMPANION</div></div></div>;
}

function MacroRow({ label, current, goal, color, unit }: { label: string; current: number; goal: number; color: string; unit: string }) {
  const percent = Math.min(100, goal ? (current / goal) * 100 : 0);
  return <div className="mb-4 last:mb-0"><div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[#6f756f]"><span>{label}</span><span dir="ltr" className="text-[10px] text-[#48514c]">{current} / {goal}{unit}</span></div><div className="h-[7px] overflow-hidden rounded-full bg-[#e9eeea]"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: color }} /></div></div>;
}

function MobileSectionIndicator({ view, t, dark }: { view: View; t: Labels; dark: boolean }) {
  const currentIndex = Math.max(0, mobileSections.indexOf(view));
  const label = t.sectionIndicator.replace("{current}", String(currentIndex + 1)).replace("{total}", String(mobileSections.length));
  return <div className={`zadak-section-indicator lg:hidden ${dark ? "bg-[#20312b]/95 text-[#b9d0c0]" : "bg-white/95 text-[#708077]"}`} aria-label={label}>
    <span aria-hidden="true" className="flex items-center gap-1.5">{mobileSections.map((section) => <span key={section} className={`zadak-section-dot ${section === view ? "is-active" : ""}`} />)}</span>
    <span dir="ltr" className="text-[9px] font-black tabular-nums">{currentIndex + 1}/{mobileSections.length}</span>
  </div>;
}

function MobileBottomNav({ view, onSelect, t, dark, language }: { view: View; onSelect: (key: string) => void; t: Labels; dark: boolean; language: Language }) {
  return <nav className={`zadak-bottom-nav lg:hidden ${dark ? "border-white/10 bg-[#182522]/95 text-[#b9d0c0]" : "border-[#e1e9e1] bg-white/95 text-[#7a877e]"}`} aria-label={t.navigation}>
    {navItems.map(({ key, icon: Icon }) => <button key={key} type="button" onClick={() => onSelect(key)} aria-current={view === key ? "page" : undefined} className={`zadak-bottom-nav-item ${view === key ? (dark ? "is-active-dark" : "is-active") : ""}`}>
      <span className="zadak-bottom-nav-icon"><Icon size={17} strokeWidth={view === key ? 2.4 : 1.9} /></span><span>{navLabel(key, language, t)}</span>
    </button>)}
  </nav>;
}
export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const [language, setLanguage] = useState<Language>(() => {
    const stored = window.localStorage.getItem("zadak-language");
    return stored === "en" || stored === "tr" ? stored : "ar";
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => window.localStorage.getItem("zadak-notification-sound") !== "false");
  const [successTone, setSuccessTone] = useState<NotificationTone>(() => (window.localStorage.getItem("zadak-success-tone") as NotificationTone) || "gentle");
  const [errorTone, setErrorTone] = useState<NotificationTone>(() => (window.localStorage.getItem("zadak-error-tone") as NotificationTone) || "pulse");
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try { return JSON.parse(window.localStorage.getItem("zadak-notifications-v1") ?? "[]") as AppNotification[]; } catch { return []; }
  });
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [mealModal, setMealModal] = useState(false);
  const [description, setDescription] = useState("");
  const [imageData, setImageData] = useState<string | undefined>();
  const [imageMimeType, setImageMimeType] = useState<"image/jpeg" | "image/png" | "image/webp" | undefined>();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultView>();
  const [plateSize, setPlateSize] = useState<PlateSizeOption>("medium");
  const [analysisPlateSize, setAnalysisPlateSize] = useState<PlateSizeOption>("medium");
  const analysisBaseRef = useRef<AnalysisResultView | undefined>(undefined);
  const [frequentMealType, setFrequentMealType] = useState<MealType>("snack");
  const [loggingFrequentId, setLoggingFrequentId] = useState<number>();
  const [barcode, setBarcode] = useState("");
  const [barcodeQueryValue, setBarcodeQueryValue] = useState("");
  const [barcodeMealType, setBarcodeMealType] = useState<MealType>("snack");
  const [calorieSuggestion, setCalorieSuggestion] = useState<{ suggestedCalories: number; change: number; reason: string; focus: string; safetyNote: string }>();
  const [profileForm, setProfileForm] = useState(defaultProfile);
  const fileRef = useRef<HTMLInputElement>(null);
  const suggestionKeyRef = useRef<string | undefined>(undefined);
  const t = labels[language];
  const c = marketingCopy[language];
  const isArabic = language === "ar";
  const utils = trpc.useUtils();
  const notify = (kind: NotificationKind, message: string) => {
    toast[kind](message);
    if (soundEnabled) playNotificationTone(kind === "success" ? successTone : errorTone);
    setNotifications((current) => [{ id: `${Date.now()}-${Math.random()}`, kind, message, createdAt: Date.now(), read: false }, ...current].slice(0, 20));
  };
  useEffect(() => { window.localStorage.setItem("zadak-language", language); document.documentElement.lang = language; document.documentElement.dir = language === "ar" ? "rtl" : "ltr"; }, [language]);
  useEffect(() => { window.localStorage.setItem("zadak-notifications-v1", JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { window.localStorage.setItem("zadak-notification-sound", String(soundEnabled)); }, [soundEnabled]);
  useEffect(() => { window.localStorage.setItem("zadak-success-tone", successTone); }, [successTone]);
  useEffect(() => { window.localStorage.setItem("zadak-error-tone", errorTone); }, [errorTone]);
  const dashboardQuery = trpc.nutrition.dashboard.useQuery(undefined, { enabled: isAuthenticated, retry: false, refetchOnWindowFocus: false });
  const analyzeMutation = trpc.nutrition.analyzeMeal.useMutation({ onSuccess: (result) => { const next = { ...result.analysis, items: result.analysis.items } as AnalysisResultView; analysisBaseRef.current = next; setAnalysisPlateSize(plateSize); setAnalysisResult(next); void utils.nutrition.dashboard.invalidate(); notify("success", t.mealSaved); }, onError: () => notify("error", t.operationFailed) });
  const deleteMutation = trpc.nutrition.deleteMeal.useMutation({ onSuccess: () => { void utils.nutrition.dashboard.invalidate(); notify("success", t.mealDeleted); }, onError: () => notify("error", t.operationFailed) });
  const clearMutation = trpc.nutrition.clearToday.useMutation({ onSuccess: () => { void utils.nutrition.dashboard.invalidate(); notify("success", t.dayCleared); }, onError: () => notify("error", t.operationFailed) });
  const saveProfileMutation = trpc.nutrition.saveProfile.useMutation({ onSuccess: () => { void utils.nutrition.dashboard.invalidate(); notify("success", calorieSuggestion ? t.suggestionApplied : t.saved); }, onError: () => notify("error", t.operationFailed) });
  const calorieSuggestionMutation = trpc.nutrition.suggestCalorieAdjustment.useMutation();
  const createFrequentMealMutation = trpc.nutrition.createFrequentMeal.useMutation({ onSuccess: () => { void utils.nutrition.dashboard.invalidate(); notify("success", t.frequentSaved); }, onError: () => notify("error", t.frequentSaveError) });
  const logFrequentMealMutation = trpc.nutrition.logFrequentMeal.useMutation({ onSuccess: () => { void utils.nutrition.dashboard.invalidate(); setLoggingFrequentId(undefined); notify("success", t.frequentMealLogged); }, onError: () => { setLoggingFrequentId(undefined); notify("error", t.operationFailed); } });
  const deleteFrequentMealMutation = trpc.nutrition.deleteFrequentMeal.useMutation({ onSuccess: () => { void utils.nutrition.dashboard.invalidate(); notify("success", t.frequentMealDeleted); }, onError: () => notify("error", t.operationFailed) });
  const barcodeQueryInput = useMemo(() => ({ barcode: barcodeQueryValue || "00000000" }), [barcodeQueryValue]);
  const barcodeLookup = trpc.nutrition.lookupBarcode.useQuery(barcodeQueryInput, { enabled: isAuthenticated && barcodeQueryValue.length >= 8, retry: false, refetchOnWindowFocus: false });
  const saveBarcodeMealMutation = trpc.nutrition.saveBarcodeMeal.useMutation({ onSuccess: () => { void utils.nutrition.dashboard.invalidate(); notify("success", t.barcodeSaved); setBarcode(""); setBarcodeQueryValue(""); }, onError: () => notify("error", t.operationFailed) });
  const canCalculateGoals = profileForm.age !== null && profileForm.heightCm !== null && profileForm.weightKg !== null;
  const goalInput = useMemo(() => ({ age: profileForm.age ?? 30, heightCm: profileForm.heightCm ?? 170, weightKg: profileForm.weightKg ?? 70, activityLevel: profileForm.activityLevel, goal: profileForm.goal }), [profileForm.age, profileForm.heightCm, profileForm.weightKg, profileForm.activityLevel, profileForm.goal]);
  const goalCalculation = trpc.nutrition.calculateGoals.useQuery(goalInput, { enabled: isAuthenticated && canCalculateGoals, staleTime: 30_000 });

  const profile = dashboardQuery.data?.profile ?? defaultProfile;
  const historyPreferences = dashboardQuery.data?.profile ? {
    historyMealTypeFilter: dashboardQuery.data.profile.historyMealTypeFilter,
    historyCalorieFilter: dashboardQuery.data.profile.historyCalorieFilter,
    historySortOrder: dashboardQuery.data.profile.historySortOrder,
  } : undefined;
  const meals = dashboardQuery.data?.meals ?? [];
  const frequentMeals = (dashboardQuery.data?.frequentMeals ?? []) as FrequentMealView[];
  const barcodeProduct = barcodeLookup.data?.kind === "found" ? barcodeLookup.data as BarcodeProductView : undefined;
  const weightLogs = dashboardQuery.data?.weightLogs ?? [];
  const todayMeals = meals.filter((meal) => isToday(meal.createdAt));
  const totals = useMemo(() => todayMeals.reduce((sum, meal) => ({ calories: sum.calories + meal.calories, protein: sum.protein + meal.protein, carbs: sum.carbs + meal.carbs, fat: sum.fat + meal.fat, fiber: sum.fiber + meal.fiber, sugar: sum.sugar + meal.sugar, sodium: sum.sodium + meal.sodium }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }), [todayMeals]);
  const weeklyMeals = meals.filter((meal) => new Date(meal.createdAt).getTime() >= Date.now() - 7 * 86_400_000);
  const weeklyAverage = weeklyMeals.length ? Math.round(weeklyMeals.reduce((sum, meal) => sum + meal.calories, 0) / 7) : 0;
  const homeProgress = isAuthenticated ? getGoalProgress(profile) : null;
  const homeDaysRemaining = profile.targetDate ? Math.ceil((new Date(`${profile.targetDate}T23:59:59`).getTime() - Date.now()) / 86_400_000) : null;
  const isBehindSchedule = Boolean(homeProgress && homeDaysRemaining != null && homeDaysRemaining <= 30 && homeProgress.percent < (homeDaysRemaining <= 7 ? 80 : 50));

  useEffect(() => { setProfileForm({ calorieGoal: profile.calorieGoal, proteinGoal: profile.proteinGoal, carbsGoal: profile.carbsGoal, fatGoal: profile.fatGoal, age: profile.age, heightCm: profile.heightCm, weightKg: profile.weightKg, startWeightKg: profile.startWeightKg, targetWeightKg: profile.targetWeightKg, targetDate: profile.targetDate, activityLevel: profile.activityLevel, goal: profile.goal }); }, [profile.calorieGoal, profile.proteinGoal, profile.carbsGoal, profile.fatGoal, profile.age, profile.heightCm, profile.weightKg, profile.startWeightKg, profile.targetWeightKg, profile.targetDate, profile.activityLevel, profile.goal]);

  useEffect(() => {
    if (!isAuthenticated || !homeProgress || !isBehindSchedule || homeDaysRemaining == null || profile.weightKg == null || profile.targetWeightKg == null) { setCalorieSuggestion(undefined); suggestionKeyRef.current = undefined; return; }
    const key = `${profile.weightKg}-${profile.targetWeightKg}-${profile.targetDate}-${homeProgress.percent}-${profile.calorieGoal}-${language}`;
    if (suggestionKeyRef.current === key) return;
    suggestionKeyRef.current = key;
    const adjustmentDirection = profile.goal === "gain" || (profile.goal === "maintain" && profile.weightKg < profile.targetWeightKg) ? "higher" : "lower";
    calorieSuggestionMutation.mutate({ currentCalories: profile.calorieGoal, progressPercent: homeProgress.percent, daysRemaining: homeDaysRemaining, goal: profile.goal, adjustmentDirection, currentWeightKg: profile.weightKg, targetWeightKg: profile.targetWeightKg, language }, { onSuccess: setCalorieSuggestion, onError: () => { suggestionKeyRef.current = undefined; notify("error", t.suggestionError); } });
  }, [isAuthenticated, homeProgress?.percent, homeDaysRemaining, isBehindSchedule, profile.weightKg, profile.targetWeightKg, profile.targetDate, profile.calorieGoal, profile.goal, language]);

  function selectNav(key: string, direction: "next" | "prev" | null = null) {
    setMobileMenu(false);
    setSlideDirection(direction);
    if (key === "analyze") { setMealModal(true); return; }
    setView(key as View);
  }

  function applyPlanGoal(goal: WeightPlanGoal) {
    setProfileForm((current) => ({ ...current, goal }));
    saveProfileMutation.mutate({ ...profileForm, goal });
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 639px)").matches || mealModal || privacyOpen || notificationsOpen || mobileMenu) {
      swipeStartRef.current = null;
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest("button, input, textarea, select, a, [role=dialog], .zadak-bottom-nav")) {
      swipeStartRef.current = null;
      return;
    }
    const touch = event.changedTouches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 56 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    const currentIndex = mobileSections.indexOf(view);
    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < mobileSections.length) selectNav(mobileSections[nextIndex], deltaX < 0 ? "next" : "prev");
  }

  function openAnalyze() { setAnalysisResult(undefined); setMealModal(true); }

  function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { notify("error", "استخدم صورة JPG أو PNG أو WEBP"); return; }
    if (file.size > 5 * 1024 * 1024) { notify("error", "حجم الصورة يجب أن يكون أقل من 5 ميغابايت"); return; }
    const reader = new FileReader();
    reader.onload = () => { setImageData(String(reader.result)); setImageMimeType(file.type as "image/jpeg" | "image/png" | "image/webp"); };
    reader.readAsDataURL(file);
  }

  function applyPlateSize(nextSize: PlateSizeOption) {
    const base = analysisBaseRef.current;
    if (!base) { setPlateSize(nextSize); return; }
    const scaled: AnalysisResultView = {
      ...base,
      calories: scaleByPlateSize(base.calories ?? 0, analysisPlateSize, nextSize),
      protein: scaleByPlateSize(base.protein ?? 0, analysisPlateSize, nextSize),
      carbs: scaleByPlateSize(base.carbs ?? 0, analysisPlateSize, nextSize),
      fat: scaleByPlateSize(base.fat ?? 0, analysisPlateSize, nextSize),
      fiber: scaleByPlateSize(base.fiber ?? 0, analysisPlateSize, nextSize),
      sugar: scaleByPlateSize(base.sugar ?? 0, analysisPlateSize, nextSize),
      sodium: scaleByPlateSize(base.sodium ?? 0, analysisPlateSize, nextSize),
      ingredients: base.ingredients?.map((ingredient) => ({
        ...ingredient,
        grams: scaleByPlateSize(ingredient.grams, analysisPlateSize, nextSize),
        calories: scaleByPlateSize(ingredient.calories, analysisPlateSize, nextSize),
        protein: scaleByPlateSize(ingredient.protein, analysisPlateSize, nextSize),
        carbs: scaleByPlateSize(ingredient.carbs, analysisPlateSize, nextSize),
        fat: scaleByPlateSize(ingredient.fat, analysisPlateSize, nextSize),
        fiber: scaleByPlateSize(ingredient.fiber ?? 0, analysisPlateSize, nextSize),
        sugar: scaleByPlateSize(ingredient.sugar ?? 0, analysisPlateSize, nextSize),
        sodium: scaleByPlateSize(ingredient.sodium ?? 0, analysisPlateSize, nextSize),
      })),
    };
    setPlateSize(nextSize);
    setAnalysisPlateSize(nextSize);
    setAnalysisResult(scaled);
    notify("success", t.portionAdjusted);
  }
  function saveAnalysisAsFrequent() {
    if (!analysisResult || createFrequentMealMutation.isPending) return;
    createFrequentMealMutation.mutate({ name: analysisResult.mealName?.trim() || t.analyze, itemsSnapshot: JSON.stringify(analysisResult.ingredients ?? []), mealType: analysisResult.mealType ?? "snack", calories: analysisResult.calories ?? 0, protein: analysisResult.protein ?? 0, carbs: analysisResult.carbs ?? 0, fat: analysisResult.fat ?? 0, fiber: analysisResult.fiber ?? 0, sugar: analysisResult.sugar ?? 0, sodium: analysisResult.sodium ?? 0 });
  }
  function saveHistoryMealAsFrequent(meal: { mealName: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number; mealType: string; aiSummary: string | null }) {
    let items: unknown[] = [];
    try {
      const parsed = JSON.parse(meal.aiSummary ?? "{}");
      items = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
    } catch { items = []; }
    createFrequentMealMutation.mutate({ name: meal.mealName, itemsSnapshot: JSON.stringify(items), mealType: ["breakfast", "lunch", "dinner", "snack"].includes(meal.mealType) ? meal.mealType as MealType : "snack", calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, fiber: meal.fiber, sugar: meal.sugar, sodium: meal.sodium });
  }
  function submitMeal() {
    if (!description.trim() && !imageData) { notify("error", t.emptyHint); return; }
    analyzeMutation.mutate({ description: description.trim() || undefined, imageData, imageMimeType, plateSize });
  }
  function searchBarcode() { setBarcodeQueryValue(barcode.trim()); }
  function saveBarcodeProduct(product: BarcodeProductView) {
    saveBarcodeMealMutation.mutate({ name: product.name, brand: product.brand, barcode: product.barcode, servingGrams: product.servingGrams, mealType: barcodeMealType, calories: product.serving.calories, protein: product.serving.protein, carbs: product.serving.carbs, fat: product.serving.fat, fiber: product.serving.fiber, sugar: product.serving.sugar, sodium: product.serving.sodium });
  }
  function addDescriptionHint(hint: string) { setDescription((current) => current ? `${current}، ${hint}` : hint); }
  async function submitLocalLogin(credentials: { name: string; email: string }) {
    window.localStorage.setItem("zadak-user-info-v1", JSON.stringify({ ...credentials, language, savedAt: Date.now() }));
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials), credentials: "include" });
      if (!response.ok) throw new Error("login_failed");
      setLoginOpen(false);
      window.location.reload();
    } catch {
      notify("error", language === "ar" ? "تعذر تسجيل الدخول الآن. تحقق من إعدادات قاعدة البيانات في Render." : language === "tr" ? "Giriş yapılamadı. Render veritabanı ayarlarını kontrol edin." : "Sign in failed. Check the Render database settings.");
    }
  }

  function closeMealModal() { if (analyzeMutation.isPending) return; setMealModal(false); setDescription(""); setImageData(undefined); setImageMimeType(undefined); setAnalysisResult(undefined); analysisBaseRef.current = undefined; setPlateSize("medium"); setAnalysisPlateSize("medium"); setFrequentMealType("snack"); }
  function saveProfile() { saveProfileMutation.mutate(profileForm); }
  function applyCalorieSuggestion() {
    if (!calorieSuggestion) return;
    saveProfileMutation.mutate({ ...profileForm, calorieGoal: calorieSuggestion.suggestedCalories, useAiCalorieAdjustment: true }, { onSuccess: () => setCalorieSuggestion(undefined) });
  }
  function mealTypeLabel(type: MealType) { return t[type]; }

  const featureCards: Array<{ icon: typeof Sparkles; title: string; body: string; color: string }> = [{ icon: Sparkles, title: c.featureOne, body: c.featureOneText, color: "#16866f" }, { icon: BarChart3, title: c.featureTwo, body: c.featureTwoText, color: "#bd8c3e" }, { icon: ShieldCheck, title: c.featureThree, body: c.featureThreeText, color: "#7f72bd" }];
  const analysisInsights = analysisResult ? buildNutritionInsights(analysisResult) : null;
  const insightLabels: Record<string, string> = {
    highSugar: t.alertHighSugar,
    highFat: t.alertHighFat,
    highSodium: t.alertHighSodium,
    highCalories: t.alertHighCalories,
    reduceOil: t.altReduceOil,
    swapFried: t.altSwapFried,
    swapRice: t.altSwapRice,
    reduceSugar: t.altReduceSugar,
    smallerPortion: t.altSmallerPortion,
  };

  return <div className={`zadak-app-shell min-h-screen overflow-x-hidden transition-colors duration-300 ${dark ? "bg-[#182522] text-[#e7f0eb]" : "bg-[#f8f8f4] text-[#1c2924]"}`} dir={isArabic ? "rtl" : "ltr"} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={() => { swipeStartRef.current = null; }}>
    <header className={`zadak-header sticky top-0 z-40 border-b backdrop-blur-xl ${dark ? "border-white/10 bg-[#182522]/90" : "border-[#e4e9e2] bg-[#fbfbf8]/90"}`}>
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 lg:px-8"><Logo /><nav aria-label={t.navigation} className="hidden items-center gap-1 lg:flex">{navItems.map(({ key, icon: Icon }) => <button key={key} aria-current={view === key ? "page" : undefined} onClick={() => selectNav(key)} className={`zadak-nav-item group flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold transition-all duration-200 ${view === key ? (dark ? "bg-white/10 text-[#8ddab8]" : "bg-[#e8f1eb] text-[#087b69]") : (dark ? "text-[#c9d7d0] hover:bg-white/5" : "text-[#6b716b] hover:bg-[#f1f4ef] hover:text-[#087b69]")}`}><Icon size={15} />{navLabel(key, language, t)}</button>)}</nav><div className="flex items-center gap-2"><NotificationCenter notifications={notifications} open={notificationsOpen} onToggle={() => setNotificationsOpen((value) => !value)} onMarkAllRead={() => setNotifications((current) => current.map((item) => ({ ...item, read: true })))} soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled((value) => !value)} successTone={successTone} errorTone={errorTone} onToneChange={(kind, tone) => kind === "success" ? setSuccessTone(tone) : setErrorTone(tone)} t={t} dark={dark} /><button onClick={() => toggleTheme?.()} className={`grid h-9 w-9 place-items-center rounded-full ${dark ? "bg-white/10 text-[#f5c873]" : "bg-[#eef2ed] text-[#718078]"}`} aria-label={dark ? t.light : t.dark}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button><button onClick={() => setPrivacyOpen(true)} className={`hidden h-9 w-9 place-items-center rounded-full sm:grid ${dark ? "bg-white/10 text-[#9edabc]" : "bg-[#f2f4ed] text-[#728279]"}`} aria-label={t.privacy}><ShieldCheck size={16} /></button><div className="relative hidden sm:block"><Globe2 className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${isArabic ? "right-3" : "left-3"}`} size={14} /><select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className={`h-9 appearance-none rounded-full border bg-transparent px-8 text-[11px] font-semibold outline-none ${isArabic ? "pl-7" : "pr-7"} ${dark ? "border-white/10 text-[#c9d7d0]" : "border-[#dfe7df] text-[#65726a]"}`} aria-label={t.language}><option value="ar">العربية</option><option value="en">EN</option><option value="tr">TR</option></select><ChevronDown className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${isArabic ? "left-2" : "right-2"}`} size={12} /></div>{isAuthenticated ? <button onClick={() => void logout()} className="hidden items-center gap-2 rounded-full bg-[#087b69] px-4 py-2.5 text-[11px] font-bold text-white sm:flex"><LogIn size={14} />{user?.name || t.logout}</button> : <button onClick={() => setLoginOpen(true)} className="hidden items-center gap-2 rounded-full bg-[#087b69] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_7px_18px_rgba(8,123,105,.18)] sm:flex"><LogIn size={14} />{t.login}</button>}<button onClick={() => setMobileMenu(!mobileMenu)} aria-expanded={mobileMenu} className={`grid h-9 w-9 place-items-center rounded-full lg:hidden ${dark ? "bg-white/10" : "bg-[#eef2ed]"}`} aria-label={mobileMenu ? t.close : t.navigation}>{mobileMenu ? <X size={17} /> : <Activity size={17} />}</button></div></div>
      {mobileMenu && <div className={`zadak-mobile-menu border-t px-5 py-3 lg:hidden ${dark ? "border-white/10 bg-[#182522]" : "border-[#e4e9e2] bg-[#fbfbf8]"}`}><div className="flex flex-wrap items-center gap-2">{navItems.map(({ key, icon: Icon }) => <button key={key} onClick={() => selectNav(key)} className="flex items-center gap-2 rounded-full bg-[#e8f1eb] px-3 py-2 text-xs font-semibold text-[#087b69]"><Icon size={14} />{navLabel(key, language, t)}</button>)}<label className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${dark ? "border-white/10 text-[#c9d7d0]" : "border-[#dfe7df] text-[#65726a]"}`}><Globe2 size={14} /><select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={t.language} className="bg-transparent outline-none"><option value="ar">العربية</option><option value="en">English</option><option value="tr">Türkçe</option></select></label>{!isAuthenticated && <button onClick={() => setLoginOpen(true)} className="flex items-center gap-2 rounded-full bg-[#087b69] px-3 py-2 text-xs font-semibold text-white"><LogIn size={14} />{t.login}</button>}</div></div>}
    </header>

    <div key={view} className={`zadak-view-stage ${slideDirection ? `is-${slideDirection}` : ""}`}>
    {view === "home" && <main className="mx-auto max-w-[1220px] px-4 pb-12 pt-5 sm:px-6 lg:px-8 lg:pt-7">
      <section className="zadak-home-hero relative overflow-hidden rounded-[32px] px-5 py-6 text-white shadow-[0_24px_60px_rgba(12,104,78,.18)] sm:px-9 sm:py-9 lg:px-12 lg:py-11">
        <div className="absolute inset-0 opacity-[.12]" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.95) .75px, transparent .75px)", backgroundSize: "10px 10px" }} />
        <div className="absolute -left-28 -top-36 h-96 w-96 rounded-full bg-[#bde6b5]/20 blur-3xl" />
        <div className="absolute -bottom-40 right-[-7%] h-[430px] w-[430px] rounded-full border border-white/10 bg-[#0c806b]/25 blur-2xl" />
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div className={isArabic ? "text-right" : "text-left"}>
            <div className="zadak-reveal mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold text-[#ddf1dc] backdrop-blur"><span className="h-2 w-2 rounded-full bg-[#f5c46c] shadow-[0_0_0_5px_rgba(245,196,108,.12)]" />{c.kicker}</div>
            <h1 className="zadak-reveal max-w-[670px] text-[34px] font-black leading-[1.22] tracking-[-0.045em] sm:text-[50px] lg:text-[58px]">{t.headline}</h1>
            <p className="zadak-reveal mt-5 max-w-[590px] text-[13px] leading-7 text-[#d3ead6] sm:text-[15px]">{t.subheadline}</p>
            <div className={`zadak-reveal mt-7 flex flex-wrap items-center gap-3 ${isArabic ? "justify-start" : "justify-start"}`}>
              <button onClick={openAnalyze} className="zadak-primary-button group inline-flex items-center gap-2 rounded-full bg-[#fffdf6] px-5 py-3.5 text-[12px] font-extrabold text-[#087b69] shadow-[0_10px_24px_rgba(0,0,0,.12)] transition-all hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,.16)] active:scale-[.97]">{t.analyzeNow} {isArabic ? <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> : <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />}<Sparkles size={14} /></button>
              <button onClick={() => selectNav("profile")} className="zadak-hero-secondary inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3.5 text-[12px] font-bold text-white transition-all hover:bg-white/12 active:scale-[.97]"><BarChart3 size={15} />{c.setup}</button>
            </div>
            <div className="zadak-reveal mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-semibold text-[#b9dbbf]"><span className="flex items-center gap-1.5"><Check size={13} className="text-[#f4c66c]" />{c.trust}</span><span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#a4dcb4]" />{t.privacyTitle}</span></div>
          </div>
          <div className="zadak-hero-preview relative mx-auto w-full max-w-[400px] lg:ms-auto">
            <div className="absolute -inset-4 rounded-[35px] bg-[#f1c869]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-[#f8fff8]/95 p-4 text-[#1d3429] shadow-[0_22px_45px_rgba(0,0,0,.14)] backdrop-blur sm:p-5">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f6e9] text-[#16866f]"><Sparkles size={15} /></span><div><div className="text-[11px] font-black">{c.previewTitle}</div><div className="mt-0.5 text-[9px] text-[#829087]">زادك AI</div></div></div><span className="rounded-full bg-[#e8f6e9] px-2.5 py-1 text-[9px] font-bold text-[#16866f]">{c.previewStatus}</span></div>
              <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#eff8ef] p-3"><div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full border-[7px] border-[#f9f5e8] bg-[#fffdf4] shadow-sm"><div className="absolute inset-1 rounded-full border border-dashed border-[#d9c78c]" /><Utensils size={27} className="text-[#16866f]" /><span className="absolute -bottom-1 rounded-full bg-[#16866f] px-2 py-1 text-[8px] font-black text-white">{c.previewDish}</span></div><div className="min-w-0"><div className="text-[15px] font-black">{c.previewEstimate}</div><p className="mt-1 text-[10px] leading-5 text-[#7d8c80]">{c.previewStatus} · {c.previewDish}</p><div className="mt-2 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#e5ae54]" /><span className="text-[9px] font-bold text-[#8b7847]">{c.previewConfidence}: 92%</span></div></div></div>
              <div className="mt-4 grid grid-cols-3 gap-2">{[[t.calories, "485", "#16866f"], [t.protein, "24غ", "#e6aa4f"], [t.carbs, "52غ", "#7e72c2"]].map(([label, value, color]) => <div key={String(label)} className="rounded-xl bg-[#f7faf6] p-2.5"><div className="text-[9px] text-[#849188]">{label}</div><div className="mt-1 text-base font-black" style={{ color: String(color) }}>{value}</div><div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e7eee7]"><div className="h-full rounded-full" style={{ width: label === t.calories ? "72%" : label === t.protein ? "54%" : "66%", backgroundColor: String(color) }} /></div></div>)}</div>
              <div className="mt-4 flex items-center justify-between border-t border-[#e4eee4] pt-3 text-[9px] text-[#849188]"><span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#16866f]" />{t.estimated}</span><span>{t.confidence}: 92%</span></div>
            </div>
          </div>
        </div>
      </section>

      {!isAuthenticated && !authLoading && <div className={`mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-xs sm:flex-row sm:items-center ${dark ? "border-[#355546] bg-[#20312b] text-[#bcd4c3]" : "border-[#d9ebd9] bg-[#f4fbf4] text-[#5d7866]"}`}><span className="flex items-center gap-2"><LockKeyhole size={14} className="text-[#16866f]" />{t.guestHint}</span><button onClick={() => setLoginOpen(true)} className="rounded-full bg-[#087b69] px-4 py-2 font-bold text-white transition-transform active:scale-95">{t.signInToSync}</button></div>}

      <section className={`zadak-feature-strip mt-5 grid gap-px overflow-hidden rounded-[23px] border ${dark ? "border-white/10 bg-white/10" : "border-[#e4ece3] bg-[#e4ece3]"} sm:grid-cols-3`}>
        {featureCards.map(({ icon: Icon, title, body, color }) => <div key={title} className={`zadak-feature-card ${dark ? "bg-[#20312b]" : "bg-white"} flex gap-3 p-4 sm:p-5`}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${color}15`, color }}><Icon size={17} /></div><div><div className="text-[11px] font-black">{title}</div><p className={`mt-1 text-[10px] leading-5 ${dark ? "text-[#9db4a8]" : "text-[#7e8a82]"}`}>{body}</p></div></div>)}
      </section>

      <BarcodeScannerPanel isAuthenticated={isAuthenticated} onLogin={() => setLoginOpen(true)} barcode={barcode} setBarcode={setBarcode} onSearch={searchBarcode} loading={barcodeLookup.isFetching} state={barcodeLookup.data?.kind} product={barcodeProduct} mealType={barcodeMealType} onMealTypeChange={setBarcodeMealType} onSave={saveBarcodeProduct} saving={saveBarcodeMealMutation.isPending} t={t} dark={dark} onNotify={notify} />

      {isAuthenticated && <section className={`zadak-progress-widget mt-5 overflow-hidden rounded-[26px] border p-5 shadow-[0_10px_30px_rgba(35,67,51,.05)] sm:p-6 ${dark ? "border-[#385449] bg-[#20312b]" : "border-[#dceee0] bg-white"}`} aria-label={t.progress}>
        {homeProgress ? (() => { const days = profile.targetDate ? Math.ceil((new Date(`${profile.targetDate}T23:59:59`).getTime() - Date.now()) / 86_400_000) : null; const motivation = getProgressMotivation(homeProgress.percent, days, t); return <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e8f6e9] text-[#16866f]"><Activity size={20} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-black">{t.progress}</h2><span className="rounded-full bg-[#e8f6e9] px-2.5 py-1 text-[10px] font-black text-[#16866f]">{homeProgress.percent}%</span></div><p className={`mt-1 text-[10px] ${dark ? "text-[#a6bcae]" : "text-[#849188]"}`}>{t.currentWeight}: <strong>{homeProgress.current}</strong> → <strong className="text-[#16866f]">{homeProgress.target}</strong>{profile.targetDate && <span className="mx-1" dir="ltr">· {profile.targetDate}</span>}</p></div></div>
          <div className="min-w-0 flex-1 lg:max-w-[470px]"><div className="flex items-center justify-between text-[10px] font-bold text-[#849188]"><span>{homeProgress.percent >= 100 ? t.targetReached : days == null ? t.setTargetHint : days >= 0 ? `${days} ${t.daysLeft}` : t.overdue}</span><button onClick={() => selectNav("profile")} className="rounded-full border border-[#b9dec3] px-3 py-1.5 text-[#087b69] transition-colors hover:bg-[#eff9ef] active:scale-95">{t.profile}</button></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e3eee4]"><div className="h-full rounded-full bg-gradient-to-l from-[#087b69] to-[#73c694] transition-all duration-700" style={{ width: `${homeProgress.percent}%` }} /></div><p className="zadak-motivation mt-3 flex items-center gap-2 text-[11px] font-semibold leading-5 text-[#567665]" aria-live="polite"><Sparkles size={13} className="shrink-0 text-[#d49c3e]" />{motivation}</p>{calorieSuggestionMutation.isPending && <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-[#d8e8d9] bg-[#fbfdf9] px-3 py-2.5 text-[10px] text-[#6f8876]"><Sparkles size={13} className="animate-pulse text-[#d49c3e]" />{t.suggestionLoading}</div>}{calorieSuggestion && <div className="zadak-ai-suggestion mt-4 rounded-2xl border border-[#eadfbf] bg-gradient-to-l from-[#fffaf0] to-[#f7fbf4] p-3.5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-1.5 text-[11px] font-black text-[#8e7136]"><Sparkles size={13} />{t.calorieSuggestion}</div><p className="mt-1 text-[10px] leading-5 text-[#7d7868]">{t.aiSuggestionHint}</p></div><div className="shrink-0 rounded-xl bg-white/80 px-2.5 py-1.5 text-center shadow-sm"><div className="text-[9px] text-[#8d948a]">{t.calories}</div><div className="text-sm font-black text-[#087b69]">{calorieSuggestion.suggestedCalories}</div></div></div><p className="mt-2 text-[10px] leading-5 text-[#6e796f]"><strong>{t.suggestionReason}:</strong> {calorieSuggestion.reason}</p><p className="mt-1 text-[10px] leading-5 text-[#6e796f]"><strong>{t.suggestionFocus}:</strong> {calorieSuggestion.focus}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] text-[#9a927e]">{t.suggestionReview} · {calorieSuggestion.safetyNote}</span><button onClick={applyCalorieSuggestion} disabled={saveProfileMutation.isPending} className="rounded-full bg-[#087b69] px-3 py-2 text-[10px] font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50">{t.applySuggestion}</button></div></div>}</div>
        </div>; })() : <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff5d7] text-[#bd8c3e]"><Activity size={20} /></div><div><h2 className="text-base font-black">{t.progress}</h2><p className={`mt-1 max-w-[520px] text-[10px] leading-5 ${dark ? "text-[#a6bcae]" : "text-[#849188]"}`}>{t.setTargetHint}</p></div></div><button onClick={() => selectNav("profile")} className="rounded-full bg-[#087b69] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_7px_18px_rgba(8,123,105,.16)] transition-all hover:-translate-y-0.5 active:scale-95">{c.setup}</button></div>}
      </section>}

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.12fr_.88fr]">
        <div className={`rounded-[26px] p-5 shadow-[0_10px_30px_rgba(35,67,51,.05)] sm:p-6 ${dark ? "bg-[#20312b]" : "bg-white"}`}>
          <div className="mb-5 flex items-start justify-between gap-4"><div><div className={`mb-1 text-[10px] font-bold ${dark ? "text-[#8ca69b]" : "text-[#9ba69d]"}`}>{t.today}</div><h2 className="text-xl font-black">{c.weekly}</h2></div><button onClick={() => isAuthenticated ? clearMutation.mutate() : setLoginOpen(true)} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-bold transition-transform active:scale-95 ${dark ? "bg-[#29453a] text-[#b5dec2]" : "bg-[#f4f7ee] text-[#6c846e]"}`}><Sun size={14} />{t.newDay}</button></div>
          <div className="grid items-center gap-6 sm:grid-cols-[150px_1fr]"><div className="relative mx-auto grid h-[136px] w-[136px] place-items-center rounded-full" style={{ background: `conic-gradient(#2c9d7b ${Math.min(100, (totals.calories / profile.calorieGoal) * 100) * 3.6}deg, ${dark ? "#31473e" : "#e8eee9"} 0deg)` }}><div className={`grid h-[108px] w-[108px] place-items-center rounded-full text-center ${dark ? "bg-[#20312b]" : "bg-white"}`}><div className="text-2xl font-black">{formatNumber(totals.calories, language)}</div><div className={`mt-1 text-[10px] ${dark ? "text-[#9fb3a8]" : "text-[#869188]"}`}>{t.calories}</div></div><span className="absolute -bottom-1 rounded-full bg-[#eaf6eb] px-2.5 py-1 text-[9px] font-black text-[#16866f]">{Math.round((totals.calories / profile.calorieGoal) * 100)}%</span></div><div><div className="mb-4 flex items-end justify-between"><div><div className={`text-[10px] ${dark ? "text-[#9fb3a8]" : "text-[#869188]"}`}>{t.remaining}</div><div className="mt-1 text-lg font-black">{formatNumber(Math.max(0, profile.calorieGoal - totals.calories), language)} <span className="text-[10px] font-medium">{t.calories}</span></div></div><div className={`rounded-xl px-3 py-2 text-center ${dark ? "bg-[#182a23]" : "bg-[#f6faf4]"}`}><div className="text-[9px] text-[#87948b]">{t.lastMeals}</div><div className="mt-1 text-sm font-black text-[#16866f]">{todayMeals.length}</div></div></div><MacroRow label={t.protein} current={totals.protein} goal={profile.proteinGoal} color="#299c78" unit="غ" /><MacroRow label={t.carbs} current={totals.carbs} goal={profile.carbsGoal} color="#f0b45a" unit="غ" /><MacroRow label={t.fats} current={totals.fat} goal={profile.fatGoal} color="#8c7ed1" unit="غ" /><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className={`rounded-xl p-2 ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="text-[9px] text-[#849188]">{t.fiber}</div><div className="mt-1 text-xs font-black text-[#16866f]">{totals.fiber}{t.grams}</div></div><div className={`rounded-xl p-2 ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="text-[9px] text-[#849188]">{t.sugar}</div><div className="mt-1 text-xs font-black text-[#d49c3e]">{totals.sugar}{t.grams}</div></div><div className={`rounded-xl p-2 ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="text-[9px] text-[#849188]">{t.sodium}</div><div className="mt-1 text-xs font-black text-[#7b65a7]">{totals.sodium}mg</div></div></div></div></div>
        </div>
        <div className={`relative overflow-hidden rounded-[26px] p-6 shadow-[0_10px_30px_rgba(35,67,51,.05)] ${dark ? "bg-[#294b3d]" : "bg-[#eff8ef]"}`}><div className="absolute -left-12 -top-14 h-40 w-40 rounded-full bg-[#b9dfb8]/30 blur-2xl" /><div className="relative"><div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-[#fff5d7] text-[#bd8c3e]"><Camera size={20} /></div><div className={`text-[11px] font-bold ${dark ? "text-[#b9d9c1]" : "text-[#728474]"}`}>{c.focus}</div><h2 className="mt-2 max-w-[310px] text-2xl font-black leading-[1.35]">{c.analyzePrompt}</h2><p className={`mt-3 max-w-[330px] text-[12px] leading-7 ${dark ? "text-[#b6d0bc]" : "text-[#728178]"}`}>{c.focusText}</p><button onClick={openAnalyze} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#087b69] px-4 py-3 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(8,123,105,.18)] transition-all hover:-translate-y-0.5 active:scale-95">{t.startAnalysis} <Zap size={14} /></button></div></div>
      </section>

      <section className={`mt-5 flex flex-col items-start justify-between gap-4 rounded-[21px] border px-5 py-4 shadow-[0_5px_18px_rgba(35,67,51,.03)] sm:flex-row sm:items-center ${dark ? "border-[#385449] bg-[#20312b]" : "border-[#f0e6cc] bg-[#fffaf0]"}`}><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#fff0c9] text-[#cf9b45]"><LockKeyhole size={15} /></div><div><div className={`text-[12px] font-extrabold ${dark ? "text-[#e9f3e9]" : "text-[#455148]"}`}>{t.privacyTitle}</div><p className={`mt-1 text-[10px] ${dark ? "text-[#9db2a5]" : "text-[#90948d]"}`}>{t.privacyText}</p></div></div><button onClick={() => setPrivacyOpen(true)} className="rounded-full border border-[#e9d9a9] bg-white/50 px-4 py-2 text-[11px] font-bold text-[#8c783f] transition-colors hover:bg-white">{t.privacy}</button></section>
    </main>}

    {view === "history" && <HistoryView meals={meals} t={t} language={language} dark={dark} onDelete={(id) => deleteMutation.mutate({ id })} onSaveFrequent={saveHistoryMealAsFrequent} onAnalyze={openAnalyze} isAuthenticated={isAuthenticated} preferences={historyPreferences} preferencesReady={Boolean(dashboardQuery.data?.profile)} onNotify={notify} />}
    {view === "plans" && <PlansView profile={profile} weightLogs={weightLogs} language={language} dark={dark} isAuthenticated={isAuthenticated} onLogin={() => setLoginOpen(true)} onApplyGoal={applyPlanGoal} onOpenProfile={() => selectNav("profile")} />}
    {view === "stats" && <StatsView meals={meals} weightLogs={weightLogs} profile={profile} t={t} language={language} dark={dark} weeklyAverage={weeklyAverage} />}
    {view === "profile" && <ProfileView form={profileForm} setForm={setProfileForm} t={t} dark={dark} onSave={saveProfile} saving={saveProfileMutation.isPending} saved={saveProfileMutation.isSuccess} isAuthenticated={isAuthenticated} onLogin={() => setLoginOpen(true)} user={user} onLogout={() => void logout()} calculation={goalCalculation.data} canCalculate={canCalculateGoals} calculating={goalCalculation.isFetching} />}

    </div>
    <MobileSectionIndicator view={view} t={t} dark={dark} />
    <MobileBottomNav view={view} onSelect={selectNav} t={t} dark={dark} language={language} />
    <LocalLoginModal open={loginOpen} language={language} dark={dark} onClose={() => setLoginOpen(false)} onSubmit={submitLocalLogin} />
    <footer className="mx-auto flex max-w-[1180px] justify-end px-5 pb-5 lg:px-8"><span className={`rounded-full px-3 py-1.5 text-[9px] font-semibold shadow-sm ${dark ? "bg-[#20312b] text-[#9db5a8]" : "bg-white text-[#9da59d]"}`}>Made with Manus ◈</span></footer>

    {privacyOpen && <div className="zadak-modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#10271f]/35 p-5 backdrop-blur-sm" onClick={() => setPrivacyOpen(false)}><div className={`zadak-modal-panel relative w-full max-w-md rounded-[25px] p-6 shadow-2xl ${dark ? "bg-[#20312b] text-[#e8f5ec]" : "bg-white text-[#23342b]"}`} onClick={(e) => e.stopPropagation()}><button onClick={() => setPrivacyOpen(false)} className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/5"><X size={15} /></button><div className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-[#eaf6eb] text-[#16866f]"><ShieldCheck size={22} /></div><h3 className="text-xl font-black">{t.privacyTitle}</h3><p className={`mt-3 text-sm leading-7 ${dark ? "text-[#b3c7ba]" : "text-[#738078]"}`}>{t.privacyText}</p><div className={`mt-5 space-y-3 rounded-2xl p-4 text-xs leading-6 ${dark ? "bg-[#182a23] text-[#c0d4c6]" : "bg-[#f6faf4] text-[#65746a]"}`}><div className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-[#169374]" /> لا تُرسل الصور إلا عند طلب التحليل.</div><div className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-[#169374]" /> يمكنك حذف سجل اليوم في أي وقت.</div><div className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-[#169374]" /> بياناتك محفوظة بحسابك ويمكنك حذفها من السجل.</div></div><button onClick={() => setPrivacyOpen(false)} className="mt-5 w-full rounded-full bg-[#087b69] py-3 text-sm font-bold text-white">{t.close}</button></div></div>}

    {mealModal && <div className="zadak-modal-backdrop fixed inset-0 z-50 grid place-items-center bg-[#10271f]/45 p-5 backdrop-blur-sm" onClick={closeMealModal}><div className={`zadak-modal-panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[25px] p-6 shadow-2xl ${dark ? "bg-[#20312b] text-[#e8f5ec]" : "bg-white text-[#23342b]"}`} onClick={(e) => e.stopPropagation()}><FrequentMealsSection meals={frequentMeals} selectedMealType={frequentMealType} onMealTypeChange={setFrequentMealType} onLog={(id) => { setLoggingFrequentId(id); logFrequentMealMutation.mutate({ id, mealType: frequentMealType }); }} onDelete={(id) => deleteFrequentMealMutation.mutate({ id })} t={t} dark={dark} loggingId={loggingFrequentId} /><button onClick={closeMealModal} className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/5"><X size={15} /></button>{analysisResult ? <div><div className="mb-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#eaf6eb] text-[#16866f]"><Check size={20} /></div><div><h3 className="text-xl font-black">{t.analysisDone}</h3><p className="mt-1 text-xs text-[#7b897e]">{analysisResult.mealName}</p></div></div><div className="mt-5"><PlateSizePicker value={analysisPlateSize} onChange={applyPlateSize} t={t} dark={dark} compact /></div><div className="mt-3 flex items-center gap-2 text-[10px] text-[#7b897e]"><Sparkles size={12} className="text-[#d49c3e]" />{t.portionAdjusted}</div><div className="grid grid-cols-4 gap-2">{[[t.calories, analysisResult.calories, "#299c78"], [t.protein, analysisResult.protein, "#f0b45a"], [t.carbs, analysisResult.carbs, "#8c7ed1"], [t.fats, analysisResult.fat, "#dd8d77"]].map(([label, value, color]) => <div key={String(label)} className={`rounded-2xl p-3 text-center ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="text-[10px] text-[#7b897e]">{label}</div><div className="mt-1 text-lg font-black" style={{ color: String(color) }}>{value}</div><div className="text-[9px] text-[#8d968f]">{label === t.calories ? t.calories : "غ"}</div></div>)}</div><div className={`mt-3 grid grid-cols-3 gap-2 rounded-2xl p-3 text-center ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div><div className="text-[9px] text-[#849188]">{t.fiber}</div><div className="mt-1 text-xs font-black text-[#16866f]">{analysisResult.fiber ?? 0}{t.grams}</div></div><div><div className="text-[9px] text-[#849188]">{t.sugar}</div><div className="mt-1 text-xs font-black text-[#d49c3e]">{analysisResult.sugar ?? 0}{t.grams}</div></div><div><div className="text-[9px] text-[#849188]">{t.sodium}</div><div className="mt-1 text-xs font-black text-[#7b65a7]">{analysisResult.sodium ?? 0}mg</div></div></div><p className={`mt-5 rounded-2xl p-4 text-sm leading-7 ${dark ? "bg-[#182a23] text-[#c2d5c7]" : "bg-[#f6faf4] text-[#65746a]"}`}>{analysisResult.summary}</p>{analysisInsights?.alerts.length ? <section className={`mt-4 rounded-2xl border p-4 ${dark ? "border-[#8b6d35]/40 bg-[#3a3423]" : "border-[#f0dfac] bg-[#fff9e9]"}`} aria-label={t.nutritionAlerts} role="status"><div className="flex items-center gap-2 text-xs font-black text-[#a27a2e]"><AlertCircle size={15} />{t.nutritionAlerts}</div><ul className={`mt-2 space-y-1 text-[10px] leading-5 ${dark ? "text-[#e2d39f]" : "text-[#806d3e]"}`}>{analysisInsights.alerts.map((key) => <li key={key}>• {insightLabels[key]}</li>)}</ul></section> : null}{analysisInsights?.alternatives.length ? <section className={`mt-4 rounded-2xl border p-4 ${dark ? "border-[#385449] bg-[#1c342b]" : "border-[#cfe8d2] bg-[#f4fbf4]"}`} aria-label={t.smartAlternatives}><div className="flex items-center gap-2 text-xs font-black text-[#16866f]"><Sparkles size={15} />{t.smartAlternatives}</div><ul className={`mt-2 space-y-1 text-[10px] leading-5 ${dark ? "text-[#b9d5c0]" : "text-[#557764]"}`}>{analysisInsights.alternatives.map((key) => <li key={key}>• {insightLabels[key]}</li>)}</ul></section> : null}{analysisResult.items?.length ? <div className="mt-5"><h4 className="mb-2 text-xs font-extrabold">{t.items}</h4><div className="flex flex-wrap gap-2">{analysisResult.items.map((item) => <span key={item} className="rounded-full bg-[#eaf6eb] px-3 py-1.5 text-[11px] font-semibold text-[#16866f]">{item}</span>)}</div></div> : null}{analysisResult.ingredients?.length ? <div className="mt-5"><h4 className="mb-2 text-xs font-extrabold">تفصيل المكونات والحصص</h4><div className="space-y-2">{analysisResult.ingredients.map((ingredient) => <div key={`${ingredient.name}-${ingredient.portion}`} className={`rounded-xl p-3 ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-extrabold">{ingredient.name}</div><div className="mt-1 text-[10px] text-[#849188]">{ingredient.portion} · {ingredient.grams}غ · ثقة {ingredient.confidence}%</div></div><div className="text-left"><div className="text-sm font-black text-[#16866f]">{ingredient.calories}</div><div className="text-[9px] text-[#8d968f]">سعرة</div></div></div><div className="mt-2 flex gap-3 text-[9px] text-[#7f8c83]"><span>ب {ingredient.protein}غ</span><span>ك {ingredient.carbs}غ</span><span>د {ingredient.fat}غ</span></div></div>)}</div></div> : null}{analysisResult.assumptions?.length ? <div className={`mt-4 rounded-xl p-3 text-[10px] leading-6 ${dark ? "bg-[#2f3426] text-[#d5d0a3]" : "bg-[#fff9e9] text-[#887a4d]"}`}><div className="mb-1 font-extrabold">ملاحظات التقدير</div>{analysisResult.assumptions.map((assumption) => <div key={assumption}>• {assumption}</div>)}</div> : null}<div className="mt-5 flex items-center justify-between text-[11px] text-[#7b897e]"><span>{t.confidence}: {analysisResult.confidence}%</span><span>{t.estimated}</span></div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={saveAnalysisAsFrequent} disabled={createFrequentMealMutation.isPending} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#d8e7d8] px-3 py-3 text-xs font-bold text-[#087b69] transition-transform active:scale-95 disabled:opacity-60"><Star size={14} />{createFrequentMealMutation.isPending ? t.loggingFrequent : t.saveFrequent}</button><button onClick={closeMealModal} className="rounded-full bg-[#087b69] py-3 text-sm font-bold text-white">{t.close}</button></div></div> : <div><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#eaf6eb] text-[#16866f]"><Sparkles size={19} /></div><div><h3 className="text-xl font-black">{t.analyze}</h3><p className="mt-1 text-xs text-[#7b897e]">{t.emptyHint}</p></div></div><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={() => fileRef.current?.click()} className={`flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed ${dark ? "border-white/15 bg-[#182a23]" : "border-[#dbe8dc] bg-[#f8fcf7]"}`}><ImagePlus size={21} className="text-[#16866f]" /><span className="text-xs font-bold">{t.uploadPhoto}</span></button><button onClick={() => fileRef.current?.click()} className={`flex h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed ${dark ? "border-white/15 bg-[#182a23]" : "border-[#dbe8dc] bg-[#f8fcf7]"}`}><Camera size={21} className="text-[#16866f]" /><span className="text-xs font-bold">{t.takePhoto}</span></button></div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />{imageData && <div className="relative mt-4 overflow-hidden rounded-2xl"><img src={imageData} alt="meal preview" className="h-40 w-full object-cover" /><button onClick={() => { setImageData(undefined); setImageMimeType(undefined); }} className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white"><X size={15} /></button></div>}<div className="mt-4"><div className="mb-2 flex items-start justify-between gap-3"><div><div className="text-xs font-extrabold">{imageData ? t.photoNoteTitle : t.descriptionPlaceholder}</div><div className="mt-1 text-[10px] leading-5 text-[#829087]">{imageData ? t.photoNoteHint : t.emptyHint}</div></div><span className="shrink-0 text-[10px] text-[#9aa69d]">{description.length}/500</span></div><textarea value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} placeholder={imageData ? t.photoNotePlaceholder : t.descriptionPlaceholder} aria-label={imageData ? t.photoNoteTitle : t.descriptionPlaceholder} className={`min-h-24 w-full resize-none rounded-2xl border p-4 text-sm outline-none ring-[#70b99a] focus:ring-2 ${dark ? "border-white/10 bg-[#182a23] placeholder:text-[#789084]" : "border-[#e1e9e1] bg-[#fbfdf9] placeholder:text-[#9aa69d]"}`} />{imageData && <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => addDescriptionHint(t.oilHint)} className="rounded-full bg-[#fff5d9] px-3 py-1.5 text-[10px] font-bold text-[#997b36]">+ {t.oilHint}</button><button type="button" onClick={() => addDescriptionHint(t.sauceHint)} className="rounded-full bg-[#f1eafa] px-3 py-1.5 text-[10px] font-bold text-[#7b65a7]">+ {t.sauceHint}</button><button type="button" onClick={() => addDescriptionHint(t.portionHint)} className="rounded-full bg-[#eaf6eb] px-3 py-1.5 text-[10px] font-bold text-[#16866f]">+ {t.portionHint}</button></div>}</div><div className="mt-4"><PlateSizePicker value={plateSize} onChange={setPlateSize} t={t} dark={dark} /></div><button onClick={submitMeal} disabled={analyzeMutation.isPending || (!description.trim() && !imageData)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#087b69] py-3 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-45">{analyzeMutation.isPending ? <><Activity className="animate-spin" size={15} />{t.analyzing}</> : <>{t.startAnalysis}<Zap size={15} /></>}</button>{analyzeMutation.error && <p className="mt-3 text-center text-xs font-semibold text-red-600">{analyzeMutation.error.message}</p>}</div>}</div></div>}
  </div>;
}

function BarcodeScannerPanel({ isAuthenticated, onLogin, barcode, setBarcode, onSearch, loading, state, product, mealType, onMealTypeChange, onSave, saving, t, dark, onNotify }: { isAuthenticated: boolean; onLogin: () => void; barcode: string; setBarcode: (value: string) => void; onSearch: () => void; loading: boolean; state?: string; product?: BarcodeProductView; mealType: MealType; onMealTypeChange: (value: MealType) => void; onSave: (product: BarcodeProductView) => void; saving: boolean; t: Labels; dark: boolean; onNotify: (kind: NotificationKind, message: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | undefined>(undefined);
  const [cameraOpen, setCameraOpen] = useState(false);

  function stopCamera() {
    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
    scanTimerRef.current = undefined;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    if (!isAuthenticated) { onLogin(); return; }
    const Detector = (window as Window & { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
    if (!navigator.mediaDevices?.getUserMedia || !Detector) {
      onNotify("error", t.barcodeUnavailable);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); } });
      const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const value = codes.find((code) => code.rawValue)?.rawValue;
          if (value) { setBarcode(value); stopCamera(); return; }
        } catch { /* Camera frames can be unavailable while the video initializes. */ }
        scanTimerRef.current = window.setTimeout(() => void scan(), 220);
      };
      scanTimerRef.current = window.setTimeout(() => void scan(), 450);
    } catch {
      onNotify("error", t.barcodeUnavailable);
    }
  }

  return <section className={`mt-5 overflow-hidden rounded-[24px] border p-5 shadow-[0_10px_30px_rgba(35,67,51,.05)] sm:p-6 ${dark ? "border-[#385449] bg-[#20312b]" : "border-[#dceee0] bg-white"}`} aria-labelledby="barcode-title">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eaf6eb] text-[#16866f]"><Barcode size={20} /></div><div><h2 id="barcode-title" className="text-base font-black">{t.barcodeScanner}</h2><p className={`mt-1 max-w-[560px] text-[10px] leading-5 ${dark ? "text-[#a5bbae]" : "text-[#7d8c82]"}`}>{t.barcodeNutritionSource} · {t.barcodePlaceholder}</p></div></div>{isAuthenticated ? <button type="button" onClick={() => void startCamera()} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#b9dec3] px-3 py-2 text-[10px] font-bold text-[#087b69] transition-all hover:-translate-y-0.5 active:scale-95"><Barcode size={14} />{t.takePhoto}</button> : <button type="button" onClick={onLogin} className="rounded-full bg-[#087b69] px-3 py-2 text-[10px] font-bold text-white transition-transform active:scale-95">{t.login}</button>}</div>
    {cameraOpen && <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#b9dec3] bg-[#10271f]"><video ref={videoRef} className="h-44 w-full object-cover" muted playsInline aria-label={t.barcodeScanner} /><div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-[#f5d783] shadow-[0_0_14px_rgba(245,215,131,.8)]" /><button type="button" onClick={stopCamera} className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-bold text-white">{t.close}</button></div>}
    <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); onSearch(); }}><input value={barcode} onChange={(event) => setBarcode(event.target.value.replace(/[^0-9]/g, "").slice(0, 14))} inputMode="numeric" autoComplete="off" placeholder={t.barcodePlaceholder} aria-label={t.barcodePlaceholder} className={`h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none ring-[#70b99a] focus:ring-2 ${dark ? "border-white/10 bg-[#182a23] placeholder:text-[#789084]" : "border-[#e1e9e1] bg-[#fbfdf9] placeholder:text-[#9aa69d]"}`} /><button type="submit" disabled={loading || barcode.length < 8} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#087b69] px-4 text-xs font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 size={15} className="animate-spin" /> : <Barcode size={15} />}{loading ? t.barcodeLookingUp : t.barcodeLookup}</button></form>
    {state === "invalid" && <p className="mt-2 text-[10px] font-semibold text-[#b36b3b]">{t.barcodeInvalid}</p>}
    {state === "not_found" && <p className="mt-2 text-[10px] font-semibold text-[#b36b3b]">{t.barcodeNotFound}</p>}
    {state === "unavailable" && <p className="mt-2 text-[10px] font-semibold text-[#b36b3b]">{t.barcodeUnavailable}</p>}
    {product && <div className={`mt-4 rounded-2xl p-4 ${dark ? "bg-[#182a23]" : "bg-[#f7fbf6]"}`}><div className="flex items-start gap-3">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-16 w-16 rounded-xl object-contain bg-white" /> : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#eaf6eb] text-[#16866f]"><Barcode size={24} /></div>}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-black">{product.name}</h3>{product.grade && <span className="rounded-full bg-[#fff2c9] px-2 py-1 text-[9px] font-black text-[#97763a]">Nutri-Score {product.grade}</span>}</div>{product.brand && <p className="mt-1 text-[10px] text-[#849188]">{product.brand}</p>}<p className="mt-1 text-[10px] text-[#849188]">{product.servingSize || `${product.servingGrams} ${t.grams}`} · {t.perServing}</p></div></div><div className="mt-4 grid grid-cols-4 gap-2">{[[t.calories, product.serving.calories, "#16866f", ""], [t.protein, product.serving.protein, "#d49c3e", t.grams], [t.carbs, product.serving.carbs, "#7b65a7", t.grams], [t.fats, product.serving.fat, "#c97968", t.grams]].map(([label, value, color, unit]) => <div key={String(label)} className={`rounded-xl p-2 text-center ${dark ? "bg-[#20312b]" : "bg-white"}`}><div className="text-[9px] text-[#849188]">{label}</div><div className="mt-1 text-sm font-black" style={{ color: String(color) }}>{value}</div><div className="text-[8px] text-[#9aa69d]">{label === t.calories ? t.calories : unit}</div></div>)}</div><div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]"><div><span className="text-[#849188]">{t.fiber}</span><strong className="mx-1 text-[#16866f]">{product.serving.fiber}{t.grams}</strong></div><div><span className="text-[#849188]">{t.sugar}</span><strong className="mx-1 text-[#d49c3e]">{product.serving.sugar}{t.grams}</strong></div><div><span className="text-[#849188]">{t.sodium}</span><strong className="mx-1 text-[#7b65a7]">{product.serving.sodium}mg</strong></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><select value={mealType} onChange={(event) => onMealTypeChange(event.target.value as MealType)} aria-label={t.chooseMealType} className={`h-10 flex-1 rounded-xl border px-3 text-xs font-bold outline-none ${dark ? "border-white/10 bg-[#20312b]" : "border-[#e1e9e1] bg-white"}`}><option value="breakfast">{t.breakfast}</option><option value="lunch">{t.lunch}</option><option value="dinner">{t.dinner}</option><option value="snack">{t.snack}</option></select><button type="button" onClick={() => onSave(product)} disabled={saving} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#d49c3e] px-3 text-xs font-black text-white transition-all active:scale-95 disabled:opacity-60">{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}{saving ? t.loggingFrequent : t.saveBarcodeMeal}</button></div></div>}
  </section>;
}

function MealRow({ meal, language, dark, label, onDelete, t }: { meal: { id: number; mealName: string; calories: number; protein: number; carbs: number; fat: number; mealType: string; createdAt: Date }; language: Language; dark: boolean; label: string; onDelete: () => void; t: Labels }) {
  return <div className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${dark ? "border-white/10 bg-[#1b2a25]" : "border-[#edf0eb] bg-[#fdfdfa]"}`}><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eaf6eb] text-[#16866f]"><Utensils size={17} /></div><div className="min-w-0"><div className="truncate text-xs font-extrabold">{meal.mealName}</div><div className="mt-1 flex items-center gap-2 text-[10px] text-[#849087]"><span>{label}</span><span>•</span><span>{new Date(meal.createdAt).toLocaleTimeString(language === "ar" ? "ar-EG" : language, { hour: "2-digit", minute: "2-digit" })}</span></div></div></div><div className="flex items-center gap-3"><div className="text-left"><div className="text-sm font-black text-[#16866f]">{meal.calories}</div><div className="text-[9px] text-[#8c978f]">{t.calories}</div></div><button onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full text-[#a2aaa4] hover:bg-red-50 hover:text-red-500" aria-label={t.delete}><Trash2 size={14} /></button></div></div>;
}

type HistoryPreferences = {
  historyMealTypeFilter: MealType | "all";
  historyCalorieFilter: CalorieFilter;
  historySortOrder: MealSortOrder;
};

type PreferenceSaveState = "saving" | "saved" | "error" | null;
const HISTORY_PREFERENCES_STORAGE_KEY = "zadak-history-preferences-v1";

function MacroMiniBar({ protein, carbs, fat, dark, ariaLabel }: { protein: number; carbs: number; fat: number; dark: boolean; ariaLabel: string }) {
  const total = Math.max(1, protein + carbs + fat);
  return <div className={`mt-3 flex h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-[#edf1eb]"}`} role="img" aria-label={ariaLabel}>
    <span className="bg-[#d49c3e]" style={{ width: `${(protein / total) * 100}%` }} />
    <span className="bg-[#7d72b5]" style={{ width: `${(carbs / total) * 100}%` }} />
    <span className="bg-[#16866f]" style={{ width: `${(fat / total) * 100}%` }} />
  </div>;
}

function HistoryView({ meals, t, language, dark, onDelete, onSaveFrequent, onAnalyze, isAuthenticated, preferences, preferencesReady, onNotify }: { meals: Array<{ id: number; mealName: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number; mealType: string; createdAt: Date; aiSummary: string | null }>; t: Labels; language: Language; dark: boolean; onDelete: (id: number) => void; onSaveFrequent: (meal: { mealName: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number; mealType: string; aiSummary: string | null }) => void; onAnalyze: () => void; isAuthenticated: boolean; preferences?: HistoryPreferences; preferencesReady: boolean; onNotify: (kind: NotificationKind, message: string) => void }) {
  const [mealTypeFilter, setMealTypeFilter] = useState<MealType | "all">("all");
  const [calorieFilter, setCalorieFilter] = useState<CalorieFilter>("all");
  const [sortOrder, setSortOrder] = useState<MealSortOrder>("latest");
  const [preferencesLoaded, setPreferencesLoaded] = useState(!isAuthenticated);
  const [saveState, setSaveState] = useState<PreferenceSaveState>(null);
  const savePreferencesMutation = trpc.nutrition.saveHistoryPreferences.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (isAuthenticated) {
      if (!preferencesReady || !preferences) return;
      setMealTypeFilter(preferences.historyMealTypeFilter);
      setCalorieFilter(preferences.historyCalorieFilter);
      setSortOrder(preferences.historySortOrder);
      setPreferencesLoaded(true);
      return;
    }

    try {
      const stored = window.localStorage.getItem(HISTORY_PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<HistoryPreferences>;
        if (["all", "breakfast", "lunch", "dinner", "snack"].includes(parsed.historyMealTypeFilter ?? "")) setMealTypeFilter(parsed.historyMealTypeFilter as MealType | "all");
        if (["all", "under400", "400to700", "over700"].includes(parsed.historyCalorieFilter ?? "")) setCalorieFilter(parsed.historyCalorieFilter as CalorieFilter);
        if (["latest", "caloriesDesc"].includes(parsed.historySortOrder ?? "")) setSortOrder(parsed.historySortOrder as MealSortOrder);
      }
    } catch {
      // Ignore malformed guest preferences and use the defaults.
    } finally {
      setPreferencesLoaded(true);
    }
  }, [isAuthenticated, preferencesReady, preferences?.historyMealTypeFilter, preferences?.historyCalorieFilter, preferences?.historySortOrder]);

  const filteredMeals = useMemo(() => sortHistoryMeals(filterHistoryMeals(meals, mealTypeFilter, calorieFilter), sortOrder), [meals, mealTypeFilter, calorieFilter, sortOrder]);
  const hasFilters = mealTypeFilter !== "all" || calorieFilter !== "all";

  function persistPreferences(next: HistoryPreferences) {
    setMealTypeFilter(next.historyMealTypeFilter);
    setCalorieFilter(next.historyCalorieFilter);
    setSortOrder(next.historySortOrder);
    if (!preferencesLoaded) return;
    setSaveState("saving");

    if (!isAuthenticated) {
      window.localStorage.setItem(HISTORY_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
      setSaveState("saved");
      return;
    }

    savePreferencesMutation.mutate(next, {
      onSuccess: () => {
        setSaveState("saved");
        void utils.nutrition.dashboard.invalidate();
      },
      onError: () => {
        setSaveState("error");
        onNotify("error", t.preferencesError);
      },
    });
  }

  function changeMealType(value: MealType | "all") {
    persistPreferences({ historyMealTypeFilter: value, historyCalorieFilter: calorieFilter, historySortOrder: sortOrder });
  }

  function changeCalories(value: CalorieFilter) {
    persistPreferences({ historyMealTypeFilter: mealTypeFilter, historyCalorieFilter: value, historySortOrder: sortOrder });
  }

  function changeSort(value: MealSortOrder) {
    persistPreferences({ historyMealTypeFilter: mealTypeFilter, historyCalorieFilter: calorieFilter, historySortOrder: value });
  }

  function resetFilters() {
    persistPreferences({ historyMealTypeFilter: "all", historyCalorieFilter: "all", historySortOrder: sortOrder });
  }

  const preferenceStatus = saveState === "saving" ? t.preferencesSaving : saveState === "saved" ? t.preferencesSaved : saveState === "error" ? t.preferencesError : null;
  const controlClass = `mt-2 h-11 w-full rounded-xl border px-3 text-xs font-semibold outline-none transition-shadow focus:ring-2 focus:ring-[#70b99a] disabled:cursor-wait disabled:opacity-60 ${dark ? "border-white/10 bg-[#182a23] text-[#d9e8dc]" : "border-[#e1e9e1] bg-[#fbfdf9] text-[#526158]"}`;

  return <main className="mx-auto max-w-[1180px] px-5 pb-10 pt-8 lg:px-8">
    <div className="mb-6 flex items-end justify-between gap-4"><div><div className="mb-2 text-xs font-semibold text-[#8a988e]">{t.history}</div><h1 className="text-3xl font-black">{t.allMeals}</h1></div><button onClick={onAnalyze} className="flex items-center gap-2 rounded-full bg-[#087b69] px-4 py-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(8,123,105,.14)] transition-all hover:-translate-y-0.5 active:scale-95"><Plus size={15} />{t.addMeal}</button></div>
    {meals.length > 0 && <section className={`mb-5 rounded-[26px] border p-4 shadow-[0_10px_30px_rgba(35,67,51,.05)] sm:p-5 ${dark ? "border-white/10 bg-[#20312b]" : "border-[#e2ece2] bg-white"}`} aria-label={t.filters}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-2"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#eaf6eb] text-[#16866f]"><History size={17} /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-black">{t.filters}</h2>{isAuthenticated && <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${saveState === "error" ? "bg-red-50 text-red-600" : saveState === "saving" ? "bg-[#fff7df] text-[#9a7730]" : "bg-[#eef8ef] text-[#16866f]"}`} aria-live="polite"><Save size={10} />{preferenceStatus ?? (preferencesLoaded ? t.preferencesSaved : t.preferencesLoading)}</span>}</div><p className={`mt-1 text-[10px] ${dark ? "text-[#9fb7a8]" : "text-[#849188]"}`}>{filteredMeals.length} / {meals.length} {t.filteredResults}</p><p className={`mt-1 text-[10px] ${dark ? "text-[#8ca89a]" : "text-[#9aa69d]"}`}>{isAuthenticated ? t.preferenceHint : t.guestPreferenceHint}</p></div></div>{hasFilters && <button type="button" onClick={resetFilters} disabled={!preferencesLoaded} className="rounded-full border border-[#cfe2d1] px-3 py-1.5 text-[10px] font-bold text-[#087b69] transition-colors hover:bg-[#eff8ef] disabled:opacity-50">{t.resetFilters}</button>}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><label className={`text-[10px] font-bold ${dark ? "text-[#b9cdbf]" : "text-[#68776d]"}`}>{t.mealTypeFilter}<select disabled={!preferencesLoaded} value={mealTypeFilter} onChange={(event) => changeMealType(event.target.value as MealType | "all")} className={controlClass}><option value="all">{t.allTypes}</option><option value="breakfast">{t.breakfast}</option><option value="lunch">{t.lunch}</option><option value="dinner">{t.dinner}</option><option value="snack">{t.snack}</option></select></label><label className={`text-[10px] font-bold ${dark ? "text-[#b9cdbf]" : "text-[#68776d]"}`}>{t.calorieFilter}<select disabled={!preferencesLoaded} value={calorieFilter} onChange={(event) => changeCalories(event.target.value as CalorieFilter)} className={controlClass}><option value="all">{t.allCalories}</option><option value="under400">{t.under400}</option><option value="400to700">{t.between400700}</option><option value="over700">{t.over700}</option></select></label><label className={`text-[10px] font-bold ${dark ? "text-[#b9cdbf]" : "text-[#68776d]"}`}>{t.sortOrder}<select disabled={!preferencesLoaded} value={sortOrder} onChange={(event) => changeSort(event.target.value as MealSortOrder)} className={controlClass}><option value="latest">{t.newestFirst}</option><option value="caloriesDesc">{t.highestCalories}</option></select></label></div>
    </section>}
    {meals.length === 0 ? <div className={`rounded-[24px] p-12 text-center shadow-sm ${dark ? "bg-[#20312b]" : "bg-white"}`}><History className="mx-auto mb-4 text-[#8fc5a8]" size={36} /><h2 className="text-xl font-black">{t.noHistory}</h2><p className="mt-2 text-sm text-[#7d897f]">{t.emptyHint}</p></div> : filteredMeals.length === 0 ? <div className={`rounded-[24px] border border-dashed p-12 text-center shadow-sm ${dark ? "border-white/10 bg-[#20312b]" : "border-[#dce9dd] bg-white"}`}><History className="mx-auto mb-4 text-[#8fc5a8]" size={34} /><h2 className="text-lg font-black">{t.noFilteredMeals}</h2><p className="mt-2 text-xs text-[#7d897f]">{t.emptyHint}</p><button type="button" onClick={resetFilters} disabled={!preferencesLoaded} className="mt-5 rounded-full bg-[#087b69] px-4 py-2.5 text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-50">{t.resetFilters}</button></div> : <div className="grid gap-3 md:grid-cols-2">{filteredMeals.map((meal) => <div key={meal.id} className={`zadak-meal-card rounded-[22px] p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${dark ? "bg-[#20312b]" : "bg-white"}`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold">{meal.mealName}</h3><div className="mt-1 flex items-center gap-2 text-[10px] text-[#8a978f]"><Clock3 size={12} />{new Date(meal.createdAt).toLocaleString(language === "ar" ? "ar-EG" : language)}<span>•</span>{t[meal.mealType as MealType]}</div></div><div className="flex items-center gap-1"><button type="button" onClick={() => onSaveFrequent(meal)} className="grid h-8 w-8 place-items-center rounded-full text-[#d49c3e] transition-colors hover:bg-[#fff5d9]" aria-label={t.saveFrequent} title={t.saveFrequent}><Star size={14} /></button><button onClick={() => onDelete(meal.id)} className="grid h-8 w-8 place-items-center rounded-full text-[#9da8a0] transition-colors hover:bg-red-50 hover:text-red-500" aria-label={t.delete}><Trash2 size={14} /></button></div></div><div className="mt-4 grid grid-cols-4 gap-2">{[[t.calories, meal.calories], [t.protein, meal.protein], [t.carbs, meal.carbs], [t.fats, meal.fat]].map(([label, value]) => <div key={String(label)} className={`rounded-xl p-2 text-center ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="text-[9px] text-[#8b978e]">{label}</div><div className="mt-1 text-sm font-black text-[#16866f]">{value}{label === t.calories ? "" : "غ"}</div></div>)}</div><MacroMiniBar protein={meal.protein} carbs={meal.carbs} fat={meal.fat} dark={dark} ariaLabel={`${t.protein} ${meal.protein}غ، ${t.carbs} ${meal.carbs}غ، ${t.fats} ${meal.fat}غ`} /></div>)}</div>}
  </main>;
}
function StatsView({ meals, weightLogs, profile, t, language, dark, weeklyAverage }: { meals: Array<{ calories: number; protein: number; carbs: number; fat: number; createdAt: Date }>; weightLogs: Array<{ weightKg: number; loggedAt: Date }>; profile: { calorieGoal: number; proteinGoal: number }; t: Labels; language: Language; dark: boolean; weeklyAverage: number }) {
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(14);
  const [visibleSeries, setVisibleSeries] = useState({ calories: true, weight: true, target: true });
  const recent = meals.filter((meal) => new Date(meal.createdAt).getTime() >= Date.now() - 7 * 86_400_000);
  const avgProtein = recent.length ? Math.round(recent.reduce((sum, meal) => sum + meal.protein, 0) / recent.length) : 0;
  const maxCalories = Math.max(profile.calorieGoal, ...Array.from({ length: 7 }, (_, index) => recent.filter((meal) => new Date(meal.createdAt).getDay() === (new Date().getDay() - index + 7) % 7).reduce((sum, meal) => sum + meal.calories, 0)));
  const chartData = useMemo(() => buildNutritionComparison(meals, weightLogs, chartDays, new Date(), language === "ar" ? "ar-EG" : language).map((point) => ({ ...point, calorieGoal: profile.calorieGoal })), [meals, weightLogs, chartDays, language, profile.calorieGoal]);
  const hasCalories = chartData.some((day) => day.calories > 0);
  const hasWeight = chartData.some((day) => day.weight != null);
  const hasComparisonData = hasCalories || hasWeight;
  const averageChartCalories = hasCalories ? Math.round(chartData.reduce((sum, day) => sum + day.calories, 0) / chartData.length) : 0;
  const latestWeight = [...chartData].reverse().find((day) => day.weight != null)?.weight;
  const rangeLabel = chartDays === 7 ? t.chartRange7 : chartDays === 30 ? t.chartRange30 : t.chartRange14;
  const rangeButton = (days: 7 | 14 | 30, label: string) => <button type="button" onClick={() => setChartDays(days)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${chartDays === days ? "bg-[#087b69] text-white shadow-sm" : dark ? "text-[#afc5b6] hover:bg-white/10" : "text-[#718477] hover:bg-[#eef7ef]"}`} aria-pressed={chartDays === days}>{label}</button>;
  const seriesButton = (key: "calories" | "weight" | "target", label: string, color: string) => <button type="button" onClick={() => setVisibleSeries((current) => ({ ...current, [key]: !current[key] }))} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${visibleSeries[key] ? dark ? "border-white/10 bg-white/10 text-[#d9e8dc]" : "border-[#d9e8dc] bg-[#f7fbf6] text-[#526158]" : dark ? "border-white/5 text-[#6f8a79] opacity-60" : "border-[#edf2ed] text-[#9aa69d] opacity-70"}`} aria-pressed={visibleSeries[key]}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</button>;
  return <main className="mx-auto max-w-[1180px] px-5 pb-10 pt-8 lg:px-8"><div className="mb-6"><div className="mb-2 text-xs font-semibold text-[#8a988e]">{t.stats}</div><h1 className="text-3xl font-black">{t.statsTitle}</h1></div><div className="grid gap-4 sm:grid-cols-3"><StatCard label={t.totalMeals} value={String(recent.length)} icon={<Utensils size={18} />} dark={dark} /><StatCard label={t.avgCalories} value={formatNumber(weeklyAverage, language)} icon={<Zap size={18} />} dark={dark} /><StatCard label={t.avgProtein} value={`${avgProtein}غ`} icon={<Activity size={18} />} dark={dark} /></div><section className={`mt-5 rounded-[24px] p-6 shadow-sm ${dark ? "bg-[#20312b]" : "bg-white"}`}><div className="mb-5 flex items-center justify-between"><h2 className="font-black">{t.weekly}</h2><span className="text-xs text-[#8a978e]">{profile.calorieGoal} {t.calories}</span></div><div className="flex h-52 items-end justify-between gap-2">{Array.from({ length: 7 }, (_, index) => { const day = (new Date().getDay() - 6 + index + 7) % 7; const total = recent.filter((meal) => new Date(meal.createdAt).getDay() === day).reduce((sum, meal) => sum + meal.calories, 0); const height = maxCalories ? Math.max(8, (total / maxCalories) * 100) : 8; return <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><button type="button" title={`${total} ${t.calories}`} aria-label={`${total} ${t.calories}`} className="w-full max-w-12 origin-bottom rounded-t-xl bg-gradient-to-t from-[#087b69] to-[#79c39a] transition-all hover:scale-y-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70b99a]" style={{ height: `${height}%` }} /><span className="text-[10px] text-[#8b978f]">{new Date(Date.now() - (6 - index) * 86_400_000).toLocaleDateString(language === "ar" ? "ar-EG" : language, { weekday: "short" })}</span></div>; })}</div></section><section className={`mt-5 rounded-[24px] p-5 shadow-sm sm:p-6 ${dark ? "bg-[#20312b]" : "bg-white"}`}><div className="flex flex-col gap-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf6eb] text-[#16866f]"><BarChart3 size={17} /></div><div><h2 className="font-black">{t.chartTitle}</h2><p className={`mt-1 max-w-[620px] text-[10px] leading-5 ${dark ? "text-[#a3b8aa]" : "text-[#849188]"}`}>{t.chartHint}</p></div></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${dark ? "bg-white/10 text-[#b8d4c0]" : "bg-[#f4f8f1] text-[#718477]"}`}>{rangeLabel}</span></div><div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-2 ${dark ? "bg-[#182a23]" : "bg-[#f8fbf7]"}`}><div className="flex items-center gap-1" aria-label={t.chartRange}><span className="px-2 text-[10px] font-bold text-[#8a978f]">{t.chartRange}</span>{rangeButton(7, t.chartRange7)}{rangeButton(14, t.chartRange14)}{rangeButton(30, t.chartRange30)}</div><div className="flex items-center gap-1.5" aria-label={t.chartVisible}>{seriesButton("calories", t.caloriesSeries, "#16866f")}{seriesButton("weight", t.weightSeries, "#d49c3e")}{seriesButton("target", t.chartDailyTarget, "#7892a6")}</div></div>{hasComparisonData && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><div className={`rounded-2xl p-3 ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="text-[9px] text-[#8b978e]">{t.chartCaloriesAverage}</div><div className="mt-1 text-lg font-black text-[#16866f]">{formatNumber(averageChartCalories, language)}</div></div><div className={`rounded-2xl p-3 ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="text-[9px] text-[#8b978e]">{t.chartLatestWeight}</div><div className="mt-1 text-lg font-black text-[#d49c3e]">{latestWeight != null ? `${formatNumber(latestWeight, language)} كغ` : "—"}</div></div><div className={`col-span-2 rounded-2xl p-3 sm:col-span-1 ${dark ? "bg-[#182a23]" : "bg-[#f7faf6]"}`}><div className="text-[9px] text-[#8b978e]">{t.chartRange}</div><div className="mt-1 text-lg font-black">{chartDays} <span className="text-[10px] font-medium text-[#8b978e]">{language === "ar" ? "يوماً" : language === "tr" ? "gün" : "days"}</span></div></div></div>}{hasComparisonData ? <div className="mt-1" dir="ltr"><div className="h-[320px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? "#365246" : "#e5eee5"} /><XAxis dataKey="label" tick={{ fill: dark ? "#9fb8a8" : "#829188", fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis yAxisId="calories" tick={{ fill: dark ? "#9fb8a8" : "#829188", fontSize: 10 }} tickLine={false} axisLine={false} width={42} /><YAxis yAxisId="weight" orientation="right" tick={{ fill: dark ? "#d2b477" : "#a98a4b", fontSize: 10 }} tickLine={false} axisLine={false} width={35} domain={["dataMin - 2", "dataMax + 2"]} /><Tooltip contentStyle={{ borderRadius: 14, border: dark ? "1px solid #385449" : "1px solid #e0e9df", backgroundColor: dark ? "#20312b" : "#ffffff", fontSize: 11, direction: language === "ar" ? "rtl" : "ltr" }} labelStyle={{ color: dark ? "#d7e7dc" : "#455148", fontWeight: 700 }} /><Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />{visibleSeries.calories && <Line yAxisId="calories" type="monotone" dataKey="calories" name={t.caloriesSeries} stroke="#16866f" strokeWidth={3} dot={{ r: 3, fill: "#16866f" }} activeDot={{ r: 6 }} connectNulls />}{visibleSeries.target && <Line yAxisId="calories" type="monotone" dataKey="calorieGoal" name={t.chartDailyTarget} stroke="#7892a6" strokeWidth={2} strokeDasharray="6 5" dot={false} activeDot={{ r: 4 }} />}{visibleSeries.weight && <Line yAxisId="weight" type="monotone" dataKey="weight" name={t.weightSeries} stroke="#d49c3e" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3, fill: "#d49c3e" }} activeDot={{ r: 6 }} connectNulls />}</LineChart></ResponsiveContainer></div></div> : <div className={`mt-1 grid min-h-[230px] place-items-center rounded-2xl border border-dashed px-6 text-center ${dark ? "border-white/10 bg-[#182a23]" : "border-[#dfeadf] bg-[#fbfdf9]"}`}><div><BarChart3 className="mx-auto mb-3 text-[#8fc5a8]" size={30} /><p className="text-sm font-bold">{t.noChartData}</p><p className="mt-1 text-[10px] text-[#849188]">{t.chartHint}</p></div></div>}</div></section></main>;
}
function StatCard({ label, value, icon, dark }: { label: string; value: string; icon: React.ReactNode; dark: boolean }) { return <div className={`zadak-stat-card rounded-[22px] p-5 shadow-sm ${dark ? "bg-[#20312b]" : "bg-white"}`}><div className="mb-4 grid h-9 w-9 place-items-center rounded-xl bg-[#eaf6eb] text-[#16866f]">{icon}</div><div className="text-[11px] text-[#87948b]">{label}</div><div className="mt-1 text-2xl font-black">{value}</div></div>; }

function getGoalProgress(form: ProfileForm) {
  if (form.weightKg == null || form.targetWeightKg == null) return null;
  const start = form.startWeightKg ?? form.weightKg;
  const target = form.targetWeightKg;
  const current = form.weightKg;
  let percent = 0;
  if (form.goal === "maintain") {
    percent = Math.max(0, 100 - Math.abs(current - target) * 20);
  } else {
    const total = Math.abs(start - target);
    const achieved = form.goal === "lose" ? start - current : current - start;
    percent = total <= 0 ? 100 : (achieved / total) * 100;
  }
  return { percent: Math.max(0, Math.min(100, Math.round(percent))), current, target, start };
}

function getProgressMotivation(percent: number, days: number | null, t: Labels) {
  const messages = {
    reached: t.motivationReached,
    overdue: t.motivationOverdue,
    deadline: t.motivationDeadline,
    ahead: t.motivationAhead,
    onTrack: t.motivationOnTrack,
    start: t.motivationStart,
  };
  return messages[getProgressMotivationStatus(percent, days)];
}

function ProfileView({ form, setForm, t, dark, onSave, saving, saved, isAuthenticated, onLogin, user, onLogout, calculation, canCalculate, calculating }: { form: typeof defaultProfile; setForm: React.Dispatch<React.SetStateAction<typeof defaultProfile>>; t: Labels; dark: boolean; onSave: () => void; saving: boolean; saved: boolean; isAuthenticated: boolean; onLogin: () => void; user: { name?: string | null; email?: string | null } | null; onLogout: () => void; calculation?: { calorieGoal: number; proteinGoal: number; carbsGoal: number; fatGoal: number; bmr: number; activityMultiplier: number }; canCalculate: boolean; calculating: boolean }) {
  const update = (key: keyof typeof defaultProfile, value: string) => setForm((current) => ({ ...current, [key]: ["age", "heightCm", "weightKg", "targetWeightKg", "calorieGoal", "proteinGoal", "carbsGoal", "fatGoal"].includes(key) ? (value === "" ? null : Number(value)) : value }));
  const applyCalculation = () => { if (!calculation) return; setForm((current) => ({ ...current, calorieGoal: calculation.calorieGoal, proteinGoal: calculation.proteinGoal, carbsGoal: calculation.carbsGoal, fatGoal: calculation.fatGoal })); };
  return <main className="mx-auto max-w-[900px] px-5 pb-10 pt-8 lg:px-8"><div className="mb-6"><div className="mb-2 text-xs font-semibold text-[#8a988e]">{t.profile}</div><h1 className="text-3xl font-black">{user?.name || t.targetSettings}</h1>{user?.email && <p className="mt-1 text-sm text-[#839087]">{user.email}</p>}</div>{!isAuthenticated ? <div className={`rounded-[24px] p-8 text-center shadow-sm ${dark ? "bg-[#20312b]" : "bg-white"}`}><UserRound className="mx-auto mb-4 text-[#8fc5a8]" size={36} /><h2 className="text-xl font-black">{t.signInToSync}</h2><button onClick={onLogin} className="mt-5 rounded-full bg-[#087b69] px-5 py-3 text-sm font-bold text-white">{t.login}</button></div> : <><section className={`rounded-[24px] p-6 shadow-sm ${dark ? "bg-[#20312b]" : "bg-white"}`}><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-black">{t.targetSettings}</h2><p className="mt-1 text-xs leading-6 text-[#7f8d83]">{t.autoGoalsHint}</p></div><Sparkles className="mt-1 shrink-0 text-[#e3aa53]" size={20} /></div><div className="grid gap-4 sm:grid-cols-2"><NumberField label={t.age} value={form.age} onChange={(value) => update("age", value)} /><NumberField label={t.height} value={form.heightCm} onChange={(value) => update("heightCm", value)} /><NumberField label={t.weight} value={form.weightKg} onChange={(value) => update("weightKg", value)} /><NumberField label={t.targetWeight} value={form.targetWeightKg} onChange={(value) => update("targetWeightKg", value)} /><label className="text-xs font-bold text-[#68776d]">{t.targetDate}<input type="date" value={form.targetDate ?? ""} onChange={(e) => update("targetDate", e.target.value)} className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${dark ? "border-white/10 bg-[#182a23]" : "border-[#e1e9e1] bg-[#fbfdf9]"}`} /></label><div className="sm:col-span-2"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-bold text-[#68776d]">{t.goal}</span><span className="text-[10px] font-normal text-[#8a978f]">{t.goalHint}</span></div><div role="group" aria-label={t.goal} className="grid gap-2 sm:grid-cols-3">{([ ["lose", t.loseWeight, "−15%"], ["maintain", t.maintainWeight, "0%"], ["gain", t.gainWeight, "+10%"] ] as const).map(([value, label, adjustment]) => <button key={value} type="button" aria-pressed={form.goal === value} onClick={() => update("goal", value)} className={`flex items-center justify-between gap-2 rounded-2xl border p-3 text-right transition-all active:scale-[.98] ${form.goal === value ? "border-[#16866f] bg-[#eaf7ed] text-[#087b69] shadow-[0_6px_15px_rgba(22,134,111,.11)]" : dark ? "border-white/10 bg-[#182a23] text-[#b5c9bc] hover:border-[#4b7764]" : "border-[#e1e9e1] bg-[#fbfdf9] text-[#6e7c72] hover:border-[#9fc7a9]"}`}><span className="min-w-0"><span className="block truncate text-[11px] font-extrabold">{label}</span><span className={`mt-1 block text-[9px] font-medium ${form.goal === value ? "text-[#4e997d]" : "text-[#9aa69d]"}`}>{adjustment} {t.calories}</span></span><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${form.goal === value ? "bg-[#16866f] text-white" : dark ? "bg-white/10 text-[#91ad9c]" : "bg-[#edf2ed] text-[#9aa69d]"}`}>{form.goal === value ? <Check size={13} /> : value === "lose" ? "−" : value === "gain" ? "+" : "="}</span></button>)}</div></div><label className="text-xs font-bold text-[#68776d]">{t.activity}<select value={form.activityLevel} onChange={(e) => update("activityLevel", e.target.value)} className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none ${dark ? "border-white/10 bg-[#182a23]" : "border-[#e1e9e1] bg-[#fbfdf9]"}`}><option value="sedentary">{t.snack === "وجبة خفيفة" ? "قليل" : "Sedentary"}</option><option value="light">{t.snack === "وجبة خفيفة" ? "خفيف" : "Light"}</option><option value="moderate">{t.snack === "وجبة خفيفة" ? "متوسط" : "Moderate"}</option><option value="high">{t.snack === "وجبة خفيفة" ? "عالٍ" : "High"}</option></select></label></div>{(() => { const progress = getGoalProgress(form); if (!progress) return <div className={`mt-5 rounded-2xl border border-dashed p-4 ${dark ? "border-white/10 bg-[#182a23]" : "border-[#e1e9e1] bg-[#fbfdf9]"}`}><div className="flex items-center gap-2 text-xs font-extrabold text-[#16866f]"><Activity size={15} />{t.progress}</div><p className="mt-2 text-[10px] leading-5 text-[#849188]">{t.setTargetHint}</p></div>; const days = form.targetDate ? Math.ceil((new Date(`${form.targetDate}T23:59:59`).getTime() - Date.now()) / 86_400_000) : null; return <div className={`mt-5 rounded-2xl border p-4 ${dark ? "border-[#385449] bg-[#182a23]" : "border-[#dceee0] bg-[#f5fbf5]"}`}><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-xs font-extrabold text-[#16866f]"><Activity size={15} />{t.progress}</div><div className="mt-2 text-[11px] text-[#7f8d83]">{t.currentWeight}: <strong className="text-[#23382c]">{progress.current} كغ</strong> <span className="mx-1">→</span> <strong className="text-[#16866f]">{progress.target} كغ</strong></div></div><span className="rounded-full bg-[#e5f5e8] px-2.5 py-1 text-[11px] font-black text-[#16866f]">{progress.percent}%</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-[#dfece1]"><div className="h-full rounded-full bg-gradient-to-l from-[#087b69] to-[#73c694] transition-all duration-700" style={{ width: `${progress.percent}%` }} /></div><div className="mt-3 flex items-center justify-between text-[10px] text-[#849188]"><span>{progress.percent >= 100 ? t.targetReached : days == null ? t.setTargetHint : days >= 0 ? `${days} ${t.daysLeft}` : t.overdue}</span>{form.targetDate && <span dir="ltr">{form.targetDate}</span>}</div></div>; })()}{calculating && <div className={`zadak-loading-card mt-5 flex items-center gap-3 rounded-2xl border border-dashed p-4 text-xs font-bold ${dark ? "border-[#385449] bg-[#182a23] text-[#b6d2be]" : "border-[#dceee0] bg-[#fbfdf9] text-[#6e8877]"}`} role="status" aria-live="polite"><Loader2 size={16} className="animate-spin text-[#16866f]" />{t.calculatingGoals}</div>}{canCalculate && calculation && <div className={`mt-5 rounded-2xl border p-4 ${dark ? "border-[#385449] bg-[#182a23]" : "border-[#dceee0] bg-[#f5fbf5]"}`}><div className="mb-3 flex items-center justify-between"><div className="text-xs font-extrabold text-[#16866f]">{t.calculatedGoals}</div><span className="text-[10px] text-[#829087]">{t.bmr}: {calculation.bmr} · ×{calculation.activityMultiplier}</span></div><div className="grid grid-cols-4 gap-2">{[[t.calorieGoal, calculation.calorieGoal], [t.proteinGoal, calculation.proteinGoal], [t.carbsGoal, calculation.carbsGoal], [t.fatGoal, calculation.fatGoal]].map(([label, value]) => <div key={String(label)} className={`rounded-xl p-2 text-center ${dark ? "bg-[#20312b]" : "bg-white"}`}><div className="text-[9px] text-[#849188]">{label}</div><div className="mt-1 text-sm font-black text-[#16866f]">{value}</div></div>)}</div><button onClick={applyCalculation} className="mt-3 flex items-center gap-2 text-xs font-bold text-[#087b69]"><Check size={14} />{t.autoGoals}</button></div>}{!canCalculate && <p className="mt-4 text-xs text-[#a0793d]">{t.goalsNeedData}</p>}<div className="mt-6 border-t border-[#e8eee8] pt-5"><div className="mb-3 text-xs font-extrabold text-[#68776d]">{t.autoGoals}</div><div className="grid gap-4 sm:grid-cols-2"><NumberField label={t.calorieGoal} value={form.calorieGoal} onChange={(value) => update("calorieGoal", value)} /><NumberField label={t.proteinGoal} value={form.proteinGoal} onChange={(value) => update("proteinGoal", value)} /><NumberField label={t.carbsGoal} value={form.carbsGoal} onChange={(value) => update("carbsGoal", value)} /><NumberField label={t.fatGoal} value={form.fatGoal} onChange={(value) => update("fatGoal", value)} /></div></div><div className="mt-6 flex flex-wrap items-center gap-3"><button onClick={onSave} disabled={saving || calculating} aria-busy={saving} className={`zadak-save-button flex items-center gap-2 rounded-full bg-[#087b69] px-5 py-3 text-sm font-bold text-white shadow-[0_8px_18px_rgba(8,123,105,.14)] disabled:cursor-wait disabled:opacity-60 ${saving ? "is-saving" : ""}`}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{saving ? t.saving : t.save}</button>{saved && !saving && <span className="zadak-save-success inline-flex items-center gap-1.5 rounded-full bg-[#eaf7ed] px-3 py-2 text-[10px] font-bold text-[#16866f]" role="status" aria-live="polite"><Check size={13} />{t.saved}</span>}</div></section><button onClick={onLogout} className="mt-5 rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-600">{t.logout}</button></>}</main>;
}

function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: string) => void }) { return <label className="text-xs font-bold text-[#68776d]">{label}<input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#e1e9e1] bg-[#fbfdf9] px-3 text-sm outline-none ring-[#70b99a] focus:ring-2" /></label>; }
