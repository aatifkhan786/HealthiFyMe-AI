// src/components/dashboard/AIHealthBriefing.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AIHealthOutput } from "@/utils/aiHealthEngine";
import { AlertCircle, Brain, RefreshCcw, Utensils, Activity, Droplets, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AIHealthBriefingProps {
  loading: boolean;
  error: string | null;
  report: AIHealthOutput | null;
  onGenerate: () => void;
}

export const AIHealthBriefing: React.FC<AIHealthBriefingProps> = ({
  loading,
  error,
  report,
  onGenerate,
}) => {
  return (
    <section className="mt-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Daily Health Briefing
            </CardTitle>
            <CardDescription>
              Smart, personalized summary of today&apos;s nutrition, hydration and strength.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={onGenerate} disabled={loading}>
            {loading ? (
              <>
                <RefreshCcw className="w-4 h-4 mr-1 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-1" />
                Generate Today&apos;s Report
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 border border-red-200 bg-red-50 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {!report && !error && !loading && (
            <p className="text-sm text-muted-foreground">
              Click &quot;Generate Today&apos;s Report&quot; to get an AI-powered breakdown of your current day:
              calories, protein, water, macros, and simple action steps for tomorrow.
            </p>
          )}

          {report && (
            <div className="space-y-6">
              {/* Score */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Today&apos;s Health Score
                  </p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">{report.score}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {report.summary}
                  </p>
                </div>
                <div className="w-full md:w-1/2 space-y-2">
                  <Progress value={report.score} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>

              {/* Grid of summaries */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Utensils className="w-4 h-4 text-primary" />
                    Nutrition
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {report.nutritionSummary || "Nutrition summary will appear here."}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Hydration
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {report.hydrationSummary || "Hydration summary will appear here."}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Strength &amp; Activity
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {report.strengthSummary || "Strength summary will appear here."}
                  </p>
                </div>
              </div>

              {/* Macro + risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Macro Balance
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {report.macroBalanceSummary ||
                      "AI will analyze your carbs, protein and fats balance here."}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Potential Risks
                  </div>
                  {report.riskFlags && report.riskFlags.length > 0 ? (
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      {report.riskFlags.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No major risks detected today based on your logged data.
                    </p>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Utensils className="w-4 h-4 text-primary" />
                    Meal Suggestions
                  </div>
                  {report.mealSuggestions && report.mealSuggestions.length > 0 ? (
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      {report.mealSuggestions.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      AI meal suggestions will appear here based on your remaining calories and protein.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/40 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    Workout Suggestions
                  </div>
                  {report.workoutSuggestions && report.workoutSuggestions.length > 0 ? (
                    <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                      {report.workoutSuggestions.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      AI workout suggestions will appear here based on your current energy and goals.
                    </p>
                  )}
                </div>
              </div>

              {/* Tomorrow plan */}
              <div className="rounded-lg border bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Plan for Tomorrow
                </div>
                {report.tomorrowPlan && report.tomorrowPlan.length > 0 ? (
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                    {report.tomorrowPlan.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    When you generate a report, AI will list 3–5 specific actions to follow tomorrow.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
