import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Gender = "male" | "female";
type Activity =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "veryActive";
type Goal = "lose" | "maintain" | "gain";

const activityLabels: Record<Activity, string> = {
  sedentary: "Little or no exercise",
  light: "Light exercise 1–3 days/week",
  moderate: "Moderate exercise 3–5 days/week",
  active: "Hard exercise 6–7 days/week",
  veryActive: "Very hard exercise / physical job",
};

export interface DailyCalorieResult {
  bmr: number;
  maintenance: number;
  target: number;
  goal: Goal;
}

interface DailyCalorieCalculatorProps {
  // Optional: Dashboard se callback aayega
  onApplyToDashboard?: (data: DailyCalorieResult) => void;
}

export default function DailyCalorieCalculator({
  onApplyToDashboard,
}: DailyCalorieCalculatorProps) {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState<Activity>("sedentary");
  const [goal, setGoal] = useState<Goal>("maintain");

  const result: DailyCalorieResult | null = (() => {
    const a = parseFloat(age);
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (!a || !h || !w) return null;

    // Mifflin-St Jeor equation (metric)
    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr += gender === "male" ? 5 : -161;

    const activityFactor: Record<Activity, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };

    const maintenance = bmr * activityFactor[activity];

    let target = maintenance;
    if (goal === "lose") target = maintenance - 500;
    if (goal === "gain") target = maintenance + 300;

    return {
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      target: Math.round(target),
      goal,
    };
  })();

  const handleApply = () => {
    if (result && onApplyToDashboard) {
      onApplyToDashboard(result);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          Daily Calorie Calculator
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Estimate how many calories you should eat each day based on your body,
          lifestyle and goal. Use this as a starting point for weight loss,
          maintenance or muscle gain.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1.4fr] items-start">
        {/* Form + result */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dc-age">Age</Label>
              <Input
                id="dc-age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 24"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={gender}
                onValueChange={(v) => setGender(v as Gender)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dc-weight">Weight (kg)</Label>
              <Input
                id="dc-weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 70"
              />
            </div>
            <div>
              <Label htmlFor="dc-height">Height (cm)</Label>
              <Input
                id="dc-height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 175"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Activity level</Label>
              <Select
                value={activity}
                onValueChange={(v) => setActivity(v as Activity)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="veryActive">Very active</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Goal</Label>
              <Select
                value={goal}
                onValueChange={(v) => setGoal(v as Goal)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose">Lose fat</SelectItem>
                  <SelectItem value="maintain">Maintain weight</SelectItem>
                  <SelectItem value="gain">Gain muscle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 rounded-lg border bg-muted/60 p-4 text-sm">
            <h3 className="font-semibold mb-2">
              Your daily calorie estimate
            </h3>
            {!result ? (
              <p className="text-sm text-muted-foreground">
                Fill in your details to see your calorie needs.
              </p>
            ) : (
              <div className="space-y-1">
                <p>
                  <b>Basal Metabolic Rate (BMR):</b> {result.bmr} kcal/day
                </p>
                <p>
                  <b>Maintenance calories:</b> {result.maintenance} kcal/day
                </p>
                <p>
                  <b>Target for your goal:</b> {result.target} kcal/day
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  This is an estimate, not a strict rule. Adjust based on real
                  progress every 2–3 weeks.
                </p>
              </div>
            )}
          </div>

          {result && onApplyToDashboard && (
            <Button
              type="button"
              className="mt-2"
              onClick={handleApply}
            >
              Apply this target to my Dashboard
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            Activity selected: {activityLabels[activity]}
          </p>
        </div>

        {/* Explanation */}
        <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-4">
          <div>
            <h3 className="font-semibold mb-1">
              Understanding calories and macros
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Calories are the energy your body uses to move and live.</li>
              <li>1 g carbohydrate = 4 kcal</li>
              <li>1 g protein = 4 kcal</li>
              <li>1 g fat = 9 kcal</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-1">7700 calories ≈ 1 kg</h3>
            <p>
              Roughly, eating about <b>7700 extra calories</b> can add 1 kg of
              body weight, and burning 7700 calories can remove 1 kg.
              This happens slowly over days and weeks, not in one day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
