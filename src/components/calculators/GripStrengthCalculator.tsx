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

type Gender = "male" | "female";

interface StrengthBand {
  label: string;
  meaning: string;
}

const classifyGrip = (gender: Gender, age: number, grip: number): StrengthBand => {
  // Very simplified ranges inspired by normative tables (kg)
  const table =
    gender === "male"
      ? [
          { ageMax: 29, excellent: 52, good: 47, fair: 40 },
          { ageMax: 39, excellent: 52, good: 47, fair: 40 },
          { ageMax: 49, excellent: 49, good: 44, fair: 39 },
          { ageMax: 59, excellent: 46, good: 41, fair: 36 },
          { ageMax: 200, excellent: 45, good: 40, fair: 35 },
        ]
      : [
          { ageMax: 29, excellent: 31, good: 27, fair: 22 },
          { ageMax: 39, excellent: 32, good: 28, fair: 23 },
          { ageMax: 49, excellent: 30, good: 26, fair: 22 },
          { ageMax: 59, excellent: 28, good: 24, fair: 20 },
          { ageMax: 200, excellent: 25, good: 22, fair: 18 },
        ];

  const row = table.find((r) => age <= r.ageMax) ?? table[table.length - 1];

  if (grip >= row.excellent)
    return {
      label: "Excellent",
      meaning: "Top level for your age group; very strong functional grip.",
    };
  if (grip >= row.good)
    return {
      label: "Very Good / Good",
      meaning: "Above average strength; usually active or trained.",
    };
  if (grip >= row.fair)
    return {
      label: "Fair",
      meaning: "Functional but could benefit from strength training.",
    };
  return {
    label: "Poor",
    meaning: "Below ideal; possible weakness or age-related decline.",
  };
};

export default function GripStrengthCalculator() {
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("");
  const [strength, setStrength] = useState("");

  const result = (() => {
    const a = parseFloat(age);
    const s = parseFloat(strength);
    if (!a || !s) return null;
    return classifyGrip(gender, a, s);
  })();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          Grip Strength Calculator
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Compare your hand grip strength to population standards based on your
          age and gender. You can measure grip using a hand dynamometer.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1.3fr] items-start">
        {/* Inputs & result */}
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
              <Label htmlFor="gs-age">Age (years)</Label>
              <Input
                id="gs-age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g., 25"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="gs-strength">Grip strength (kg)</Label>
              <Input
                id="gs-strength"
                type="number"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="Best of 2–3 trials"
              />
            </div>
          </div>

          <div className="mt-4 rounded-lg border bg-muted/60 p-4 text-sm">
            <h3 className="font-semibold mb-2">Your grip strength category</h3>
            {!result ? (
              <p className="text-sm text-muted-foreground">
                Enter age and grip strength to see your category.
              </p>
            ) : (
              <div>
                <p className="text-xl font-bold">{result.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.meaning}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Normative table (simplified) */}
        <div className="rounded-lg border bg-muted/40 p-4 text-xs space-y-3">
          <h3 className="font-semibold mb-1">
            Grip strength standards (approximate)
          </h3>
          <p className="text-muted-foreground">
            Values are in kilograms and summarised from population tables.
            Exact numbers can vary by study and device.
          </p>

          <table className="w-full border border-border/60 mb-2">
            <thead className="bg-muted">
              <tr>
                <th className="border px-2 py-1 text-left">Age</th>
                <th className="border px-2 py-1 text-left">Sex</th>
                <th className="border px-2 py-1 text-left">Excellent</th>
                <th className="border px-2 py-1 text-left">Very good</th>
                <th className="border px-2 py-1 text-left">Fair</th>
                <th className="border px-2 py-1 text-left">Poor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">20–29</td>
                <td className="border px-2 py-1">M</td>
                <td className="border px-2 py-1">≥ 52</td>
                <td className="border px-2 py-1">47–51</td>
                <td className="border px-2 py-1">40–46</td>
                <td className="border px-2 py-1">&lt; 40</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">20–29</td>
                <td className="border px-2 py-1">F</td>
                <td className="border px-2 py-1">≥ 31</td>
                <td className="border px-2 py-1">27–30</td>
                <td className="border px-2 py-1">22–26</td>
                <td className="border px-2 py-1">&lt; 22</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">40–49</td>
                <td className="border px-2 py-1">M</td>
                <td className="border px-2 py-1">≥ 49</td>
                <td className="border px-2 py-1">44–48</td>
                <td className="border px-2 py-1">39–43</td>
                <td className="border px-2 py-1">&lt; 39</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">40–49</td>
                <td className="border px-2 py-1">F</td>
                <td className="border px-2 py-1">≥ 31</td>
                <td className="border px-2 py-1">27–30</td>
                <td className="border px-2 py-1">22–26</td>
                <td className="border px-2 py-1">&lt; 22</td>
              </tr>
              {/* You can extend rows if you want */}
            </tbody>
          </table>

          <p className="text-muted-foreground">
            Don&apos;t worry if your results are low. Grip strength can improve
            with regular resistance training and practice.
          </p>
        </div>
      </div>
    </div>
  );
}
