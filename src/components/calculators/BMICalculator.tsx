import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UnitSystem = "metric" | "imperial";

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

export default function BMICalculator() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<UnitSystem>("metric");
  const [result, setResult] = useState<{
    bmi: string;
    category: string;
  } | null>(null);

  const handleCalculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!w || !h) {
      setResult(null);
      return;
    }

    let bmi: number;

    if (unit === "metric") {
      // kg & cm → convert to meters
      bmi = w / Math.pow(h / 100, 2);
    } else {
      // imperial: pounds & inches
      bmi = (703 * w) / Math.pow(h, 2);
    }

    const rounded = parseFloat(bmi.toFixed(1));
    setResult({
      bmi: rounded.toFixed(1),
      category: getBMICategory(rounded),
    });
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          BMI Calculator
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Body Mass Index (BMI) compares your weight to your height and helps you see
          whether your weight is in a healthy range.
        </p>
      </div>

      {/* Form */}
      <div className="grid gap-4 md:grid-cols-[2fr,1fr] items-start">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border bg-muted/60 px-1 py-1 text-xs">
            <button
              type="button"
              onClick={() => setUnit("metric")}
              className={`px-3 py-1 rounded-full transition ${
                unit === "metric"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Metric (kg / cm)
            </button>
            <button
              type="button"
              onClick={() => setUnit("imperial")}
              className={`px-3 py-1 rounded-full transition ${
                unit === "imperial"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Imperial (lb / in)
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bmi-weight">
                Weight ({unit === "metric" ? "kg" : "lb"})
              </Label>
              <Input
                id="bmi-weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={unit === "metric" ? "e.g., 72" : "e.g., 160"}
              />
            </div>
            <div>
              <Label htmlFor="bmi-height">
                Height ({unit === "metric" ? "cm" : "inches"})
              </Label>
              <Input
                id="bmi-height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder={unit === "metric" ? "e.g., 177" : "e.g., 70"}
              />
            </div>
          </div>

          <Button onClick={handleCalculate}>Calculate BMI</Button>

          {result ? (
            <div className="mt-4 rounded-lg border bg-muted/60 p-4">
              <p className="text-sm text-muted-foreground">Your BMI</p>
              <p className="text-3xl font-bold">
                {result.bmi}{" "}
                <span className="text-base font-medium text-muted-foreground">
                  ({result.category})
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Enter your weight and height, then tap <b>Calculate</b>.
            </p>
          )}
        </div>

        {/* Category quick guide */}
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <h3 className="font-semibold mb-2">BMI Categories</h3>
          <ul className="space-y-1">
            <li>
              <span className="font-medium">Below 18.5</span> – Underweight
            </li>
            <li>
              <span className="font-medium">18.5 – 24.9</span> – Normal weight
            </li>
            <li>
              <span className="font-medium">25 – 29.9</span> – Overweight
            </li>
            <li>
              <span className="font-medium">30 and above</span> – Obese
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            BMI is a simple tool. It doesn&apos;t separate muscle and fat, but it
            gives a quick overview of health risk.
          </p>
        </div>
      </div>
    </div>
  );
}
