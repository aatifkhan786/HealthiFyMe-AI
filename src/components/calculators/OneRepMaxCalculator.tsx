import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function OneRepMaxCalculator() {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [isMetric, setIsMetric] = useState(true);

  const calculate1RM = () => {
    const w = parseFloat(weight);
    const r = parseFloat(reps);

    if (!w || !r || r <= 0 || r > 15) return null;

    // Epley Formula
    const epley = w * (1 + r / 30);
    // Brzycki Formula
    const brzycki = w * (36 / (37 - r));
    // Wathan Formula
    const wathan = (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r));

    const avg = (epley + brzycki + wathan) / 3;

    return {
      epley: epley.toFixed(1),
      brzycki: brzycki.toFixed(1),
      wathan: wathan.toFixed(1),
      average: avg.toFixed(1),
    };
  };

  const result = calculate1RM();
  const unitLabel = isMetric ? "kg" : "lb";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          One Rep Max (1RM) Calculator
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Estimate the maximum weight you can lift for a single repetition.
          This helps you choose the right training weights and track strength
          progress.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr] items-start">
        {/* Form & result */}
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border bg-muted/60 px-1 py-1 text-xs">
            <button
              type="button"
              onClick={() => setIsMetric(true)}
              className={`px-3 py-1 rounded-full transition ${
                isMetric
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Metric (kg)
            </button>
            <button
              type="button"
              onClick={() => setIsMetric(false)}
              className={`px-3 py-1 rounded-full transition ${
                !isMetric
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Imperial (lb)
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="orm-weight">
                Weight lifted ({unitLabel})
              </Label>
              <Input
                id="orm-weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={`e.g., 90 ${unitLabel}`}
              />
            </div>
            <div>
              <Label htmlFor="orm-reps">Number of reps</Label>
              <Input
                id="orm-reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            For best results, use a weight you can lift for 3–10 reps with good
            form.
          </p>

          <div className="mt-4 rounded-lg border bg-muted/60 p-4">
            <h3 className="font-semibold mb-2">Your estimated 1RM</h3>
            {!result ? (
              <p className="text-sm text-muted-foreground">
                Enter weight and reps to see your estimate.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  <b>Epley formula:</b> {result.epley} {unitLabel}
                </p>
                <p>
                  <b>Brzycki formula:</b> {result.brzycki} {unitLabel}
                </p>
                <p>
                  <b>Wathan formula:</b> {result.wathan} {unitLabel}
                </p>
                <p className="mt-3 rounded bg-emerald-100 px-3 py-2 text-emerald-800 font-semibold">
                  Average 1RM: {result.average} {unitLabel}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Explanation */}
        <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-4">
          <div>
            <h3 className="font-semibold mb-1">
              How to use your 1RM in training
            </h3>
            <table className="w-full text-xs border border-border/60">
              <thead className="bg-muted">
                <tr>
                  <th className="border px-2 py-1 text-left">Goal</th>
                  <th className="border px-2 py-1 text-left">% of 1RM</th>
                  <th className="border px-2 py-1 text-left">Reps</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-2 py-1">General fitness</td>
                  <td className="border px-2 py-1">&lt; 70%</td>
                  <td className="border px-2 py-1">12–15+</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Muscle growth</td>
                  <td className="border px-2 py-1">70–80%</td>
                  <td className="border px-2 py-1">8–12</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Strength</td>
                  <td className="border px-2 py-1">80–90%</td>
                  <td className="border px-2 py-1">3–6</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">Max power (advanced)</td>
                  <td className="border px-2 py-1">90–100%</td>
                  <td className="border px-2 py-1">1–3</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Safety tips</h3>
            <ul className="list-disc pl-4 space-y-1">
              <li>Always warm up before heavy sets.</li>
              <li>Use a spotter for bench press and squats.</li>
              <li>Stop if you feel sharp pain or dizziness.</li>
              <li>
                Beginners should focus on technique first, not on testing true
                max.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
