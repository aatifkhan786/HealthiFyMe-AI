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

export interface BodyFatResult {
  bodyFatPercent: number;
  gender: Gender;
}

const classifyBodyFat = (gender: Gender, fat: number) => {
  const ranges =
    gender === "female"
      ? [
          { max: 13, label: "Essential Fat" },
          { max: 20, label: "Athletes" },
          { max: 24, label: "Fitness" },
          { max: 31, label: "Acceptable" },
          { max: 99, label: "Obese" },
        ]
      : [
          { max: 5, label: "Essential Fat" },
          { max: 13, label: "Athletes" },
          { max: 17, label: "Fitness" },
          { max: 25, label: "Acceptable" },
          { max: 99, label: "Obese" },
        ];

  return ranges.find((r) => fat <= r.max)?.label ?? "Unknown";
};

interface BodyFatCalculatorProps {
  // Dashboard callback (optional)
  onApplyToDashboard?: (data: BodyFatResult) => void;
}

export default function BodyFatCalculator({
  onApplyToDashboard,
}: BodyFatCalculatorProps) {
  const [gender, setGender] = useState<Gender>("male");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [neck, setNeck] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState<{ fat: string; category: string } | null>(
    null
  );

  const handleCalculate = () => {
    const w = parseFloat(waist);
    const h = parseFloat(height);
    const n = parseFloat(neck);
    const hp = parseFloat(hip);

    if (!w || !h || !n || (gender === "female" && !hp)) {
      setResult(null);
      return;
    }

    const log10 = (v: number) => Math.log10(v);

    let bodyFat: number;

    if (gender === "male") {
      // U.S. Navy formula (men)
      bodyFat =
        495 / (1.0324 - 0.19077 * log10(w - n) + 0.15456 * log10(h)) - 450;
    } else {
      // U.S. Navy formula (women)
      bodyFat =
        495 /
          (1.29579 -
            0.35004 * log10(w + hp - n) +
            0.221 * log10(h)) -
        450;
    }

    const fat = Math.max(0, Math.min(60, parseFloat(bodyFat.toFixed(1))));
    setResult({
      fat: fat.toFixed(1),
      category: classifyBodyFat(gender, fat),
    });
  };

  const handleApply = () => {
    if (!result || !onApplyToDashboard) return;
    const fatNum = parseFloat(result.fat);
    onApplyToDashboard({
      bodyFatPercent: fatNum,
      gender,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          Body Fat Index
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Estimate your body fat percentage using a tape measure. This gives a
          better picture of your body composition than BMI alone.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr] items-start">
        {/* Form */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Gender</Label>
              <Select
                value={gender}
                onValueChange={(value) => setGender(value as Gender)}
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
              <Label htmlFor="bf-height">Height (cm)</Label>
              <Input
                id="bf-height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g., 175"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bf-waist">Waist (cm)</Label>
              <Input
                id="bf-waist"
                type="number"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                placeholder="Measure at belly button level"
              />
            </div>
            <div>
              <Label htmlFor="bf-hip">
                Hip (cm){" "}
                <span className="text-xs text-muted-foreground">
                  (women only)
                </span>
              </Label>
              <Input
                id="bf-hip"
                type="number"
                value={hip}
                onChange={(e) => setHip(e.target.value)}
                disabled={gender === "male"}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bf-neck">Neck (cm)</Label>
              <Input
                id="bf-neck"
                type="number"
                value={neck}
                onChange={(e) => setNeck(e.target.value)}
                placeholder="Just below Adam’s apple"
              />
            </div>
          </div>

          <Button onClick={handleCalculate}>Calculate Body Fat</Button>

          {result ? (
            <div className="mt-4 rounded-lg border bg-muted/60 p-4">
              <p className="text-sm text-muted-foreground">
                Estimated body fat
              </p>
              <p className="text-3xl font-bold">
                {result.fat}%{" "}
                <span className="text-base font-medium text-muted-foreground">
                  ({result.category})
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter your measurements and tap <b>Calculate</b>.
            </p>
          )}

          {result && onApplyToDashboard && (
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={handleApply}
            >
              Use this to update protein &amp; water targets
            </Button>
          )}
        </div>

        {/* Categories table */}
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <h3 className="font-semibold mb-3">
            Body Fat Percentage Categories
          </h3>
          <table className="w-full text-xs border border-border/60">
            <thead className="bg-muted">
              <tr>
                <th className="border px-2 py-1 text-left">Classification</th>
                <th className="border px-2 py-1 text-left">Women (% fat)</th>
                <th className="border px-2 py-1 text-left">Men (% fat)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">Essential Fat</td>
                <td className="border px-2 py-1">10–13%</td>
                <td className="border px-2 py-1">2–5%</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Athletes</td>
                <td className="border px-2 py-1">14–20%</td>
                <td className="border px-2 py-1">6–13%</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Fitness</td>
                <td className="border px-2 py-1">21–24%</td>
                <td className="border px-2 py-1">14–17%</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Acceptable</td>
                <td className="border px-2 py-1">25–31%</td>
                <td className="border px-2 py-1">18–25%</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">Obese</td>
                <td className="border px-2 py-1">32% +</td>
                <td className="border px-2 py-1">26% +</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            Ideal range depends on age, activity and goals. Very low or very
            high body fat can both be risky for health.
          </p>
        </div>
      </div>
    </div>
  );
}
