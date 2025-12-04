// src/utils/aiHealthEngine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("Missing Gemini API Key in .env file (VITE_GEMINI_API_KEY)");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface AIHealthInputFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs?: number;
  fats?: number;
  sugar?: number;
  fiber?: number;
  aiNote?: string | null;
}

export interface AIHealthInput {
  age?: number | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  bodyFatPercentEstimate?: number | null;
  goal?: string | null;
  activityLevel?: string | null;
  dailyTargets?: {
    calories?: number | null;
    protein?: number | null;
    waterMl?: number | null;
  };
  todayTotals: {
    calories: number;
    protein: number;
    waterMl: number;
    carbs?: number;
    fats?: number;
    sugar?: number;
    fiber?: number;
  };
  strength?: {
    oneRepMaxKg?: number | null;
    gripCategory?: string | null;
  };
  foodList: AIHealthInputFoodItem[];
}

export interface AIHealthOutput {
  score: number; // 0–100
  summary: string;
  nutritionSummary?: string;
  hydrationSummary?: string;
  strengthSummary?: string;
  macroBalanceSummary?: string;
  riskFlags?: string[];
  mealSuggestions?: string[];
  workoutSuggestions?: string[];
  tomorrowPlan?: string[];
}

/**
 * Calls Gemini 2.5 Flash to generate a daily health report.
 * If AI parsing fails, returns a simple safe fallback.
 */
export async function getAIHealthReport(
  input: AIHealthInput
): Promise<AIHealthOutput> {
  const prompt = `
You are an expert sports nutritionist and strength coach.

You will receive a JSON object "input" containing:
- Profile (age, height, weight, BMI, goal, activity level)
- Daily targets (calories/protein/water)
- Today's totals (calories/protein/water/macros)
- Optional strength (1RM, grip category)
- Today food list with macros and AI notes.

TASK:
1. Analyze overall health and nutrition for TODAY only.
2. Give a 0–100 DAILY HEALTH SCORE (integer).
3. Write a SHORT summary (2–3 lines) about today's health status.
4. Write:
   - nutritionSummary (2–3 lines)
   - hydrationSummary (1–2 lines)
   - strengthSummary (1–2 lines) based on strength/grip if present, otherwise general guidance.
   - macroBalanceSummary (1–2 lines) about carbs/protein/fats balance.
5. riskFlags: an array of short bullet points about potential risks (e.g., "low protein", "high sugar", "low water").
6. mealSuggestions: an array of simple meal ideas tailored to remaining calories/protein.
7. workoutSuggestions: an array of suggested workouts for tomorrow.
8. tomorrowPlan: an array of 3–5 concrete actions to improve.

RULES:
- HEALTH SCORE MUST be between 0 and 100.
- Keep language simple and motivational.
- Tailor advice to the given goal and activity level.

INPUT JSON:
${JSON.stringify(input)}

Respond ONLY in this exact JSON structure (no backticks, no extra text):

{
  "score": number (0-100),
  "summary": string,
  "nutritionSummary": string,
  "hydrationSummary": string,
  "strengthSummary": string,
  "macroBalanceSummary": string,
  "riskFlags": string[],
  "mealSuggestions": string[],
  "workoutSuggestions": string[],
  "tomorrowPlan": string[]
}
  `.trim();

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as AIHealthOutput;

    // Small safety check on score
    let safeScore = parsed.score;
    if (Number.isNaN(safeScore)) safeScore = 70;
    if (safeScore < 0) safeScore = 0;
    if (safeScore > 100) safeScore = 100;
    parsed.score = Math.round(safeScore);

    return parsed;
  } catch (error) {
    console.error("AIHealthEngine parse error:", error, raw);

    // Fallback: basic rule-based output
    const cal = input.todayTotals.calories ?? 0;
    const targetCal = input.dailyTargets?.calories ?? 0;
    const protein = input.todayTotals.protein ?? 0;
    const targetProtein = input.dailyTargets?.protein ?? 0;
    const water = input.todayTotals.waterMl ?? 0;
    const targetWater = input.dailyTargets?.waterMl ?? 0;

    let score = 70;
    const notes: string[] = [];

    if (targetCal > 0) {
      const diff = Math.abs(cal - targetCal) / targetCal;
      if (diff < 0.1) score += 10;
      else if (diff > 0.3) score -= 10;
    }

    if (targetProtein > 0 && protein < targetProtein * 0.8) {
      score -= 5;
      notes.push("Protein intake is lower than ideal.");
    }

    if (targetWater > 0 && water < targetWater * 0.6) {
      score -= 5;
      notes.push("Water intake is lower than target.");
    }

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return {
      score: Math.round(score),
      summary: "Basic fallback analysis based on calories, protein and water.",
      nutritionSummary:
        "Aim to keep calories closer to your target and ensure protein intake is sufficient.",
      hydrationSummary:
        targetWater > 0 && water < targetWater * 0.6
          ? "Try to drink more water across the day."
          : "Hydration is reasonably on track.",
      strengthSummary:
        "Strength and performance can improve with consistent training and adequate protein.",
      macroBalanceSummary:
        "Focus on balancing carbs, protein and fats across meals.",
      riskFlags: notes,
      mealSuggestions: [
        "Add one high-protein snack such as paneer, eggs, or Greek yogurt.",
      ],
      workoutSuggestions: [
        "A 30–40 minute brisk walk or light strength session would be beneficial.",
      ],
      tomorrowPlan: [
        "Distribute protein across 3–4 meals.",
        "Carry a water bottle and sip regularly.",
        "Avoid very large, heavy dinners.",
      ],
    };
  }
}
