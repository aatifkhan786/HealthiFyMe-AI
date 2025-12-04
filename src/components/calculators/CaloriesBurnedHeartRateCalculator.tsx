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

export interface HeartRateCaloriesResult {
  totalCalories: number;
  perMinute: number;
  durationMinutes: number;
  averageHeartRate: number;
  gender: Gender;
}

interface CaloriesBurnedProps {
  onAddToToday?: (data: HeartRateCaloriesResult) => void;
}

export default function CaloriesBurnedHeartRateCalculator({
  onAddToToday,
}: CaloriesBurnedProps) {
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [duration, setDuration] = useState("");

  const result: HeartRateCaloriesResult | null = (() => {
    const a = parseFloat(age);
    const w = parseFloat(weight);
    const hr = parseFloat(heartRate);
    const d = parseFloat(duration);

    if (!a || !w || !hr || !d) return null;

    // Keytel / Ainsworth style formula (approx)
    let calsPerMin: number;

    if (gender === "male") {
      calsPerMin =
        (-55.0969 + 0.6309 * hr + 0.1988 * w + 0.2017 * a) / 4.184;
    } else {
      calsPerMin =
        (-20.4022 + 0.4472 * hr - 0.1263 * w + 0.074 * a) / 4.184;
    }

    const total = Math.max(0, calsPerMin * d);

    return {
      perMinute: Math.round(calsPerMin),
      totalCalories: Math.round(total),
      durationMinutes: d,
      averageHeartRate: hr,
      gender,
    };
  })();

  const handleAdd = () => {
    if (result && onAddToToday) {
      onAddToToday(result);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          Calories Burned by Heart Rate
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Estimate how many calories you burn during a workout using your heart
          rate, age and body weight. This works best for steady cardio like
          running, cycling or brisk walking.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1.3fr] items-start">
        {/* Form + result */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div>
              <Label htmlFor="cb-age">Age (years)</Label>
              <Input
                id="cb-age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 24"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cb-weight">Weight (kg)</Label>
              <Input
                id="cb-weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 70"
              />
            </div>
            <div>
              <Label htmlFor="cb-hr">Average heart rate (BPM)</Label>
              <Input
                id="cb-hr"
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="e.g., 145"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cb-duration">Duration (minutes)</Label>
              <Input
                id="cb-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 30"
              />
            </div>
          </div>

          <div className="mt-4 rounded-lg border bg-muted/60 p-4 text-sm">
            <h3 className="font-semibold mb-2">Calories burned</h3>
            {!result ? (
              <p className="text-sm text-muted-foreground">
                Enter all fields to estimate calories burned.
              </p>
            ) : (
              <div className="space-y-1">
                <p>
                  <b>Per minute:</b> ~{result.perMinute} kcal/min
                </p>
                <p>
                  <b>Total for this workout:</b> {result.totalCalories} kcal
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  This is an estimate, based on steady heart rate. Real values
                  change with fitness level, temperature and effort.
                </p>
              </div>
            )}
          </div>

          {result && onAddToToday && (
            <Button
              type="button"
              className="mt-2"
              variant="outline"
              onClick={handleAdd}
            >
              Add this workout to today&apos;s burned calories
            </Button>
          )}
        </div>

        {/* Explanation */}
        <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-4">
          <div>
            <h3 className="font-semibold mb-1">
              How heart rate relates to calories
            </h3>
            <p>
              Higher heart rate usually means your body is working harder and
              using more energy. This calculator uses research-based equations
              to convert your heart rate into an estimated calorie burn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
