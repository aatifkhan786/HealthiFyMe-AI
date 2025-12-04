// src/components/dashboard/AdvancedFoodIntake.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Activity, Pencil, Trash2, Info, PieChart as PieChartIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface AdvancedFoodScan {
  id: number;
  user_id: string;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  portion_size: number;
  ai_suggestion?: string | null;
  carbs_per_100g?: number | null;
  fats_per_100g?: number | null;
  sugar_per_100g?: number | null;
  fiber_per_100g?: number | null;
}

interface AdvancedFoodIntakeProps {
  foodScans: AdvancedFoodScan[];
  todaysCalories: number;
  todaysProtein: number;
  onEditPortion: (scanId: number, newPortion: number) => Promise<void> | void;
  onDeleteScan: (scanId: number) => Promise<void> | void;
}

const MACRO_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#e11d48"];

export const AdvancedFoodIntake: React.FC<AdvancedFoodIntakeProps> = ({
  foodScans,
  todaysCalories,
  todaysProtein,
  onEditPortion,
  onDeleteScan,
}) => {
  const [editingScan, setEditingScan] = useState<AdvancedFoodScan | null>(null);
  const [editPortion, setEditPortion] = useState<string>("");

  const calcValue = (scan: AdvancedFoodScan, key: keyof AdvancedFoodScan): number => {
    const base = (scan[key] as number) || 0;
    if (scan.portion_size === 1) return base;
    const portion = scan.portion_size || 100;
    return (base * portion) / 100;
  };

  const macroTotals = useMemo(() => {
    let carbs = 0;
    let fats = 0;
    let sugar = 0;
    let fiber = 0;
    for (const scan of foodScans) {
      if (scan.carbs_per_100g != null) carbs += calcValue(scan, "carbs_per_100g");
      if (scan.fats_per_100g != null) fats += calcValue(scan, "fats_per_100g");
      if (scan.sugar_per_100g != null) sugar += calcValue(scan, "sugar_per_100g");
      if (scan.fiber_per_100g != null) fiber += calcValue(scan, "fiber_per_100g");
    }
    return { carbs, fats, sugar, fiber };
  }, [foodScans]);

  const macroData = useMemo(() => {
    const { carbs, fats, sugar, fiber } = macroTotals;
    const items = [
      { name: "Carbs (g)", value: Math.round(carbs) },
      { name: "Fats (g)", value: Math.round(fats) },
      { name: "Sugar (g)", value: Math.round(sugar) },
      { name: "Fiber (g)", value: Math.round(fiber) },
    ].filter((m) => m.value > 0);
    return items;
  }, [macroTotals]);

  const openEditModal = (scan: AdvancedFoodScan) => {
    setEditingScan(scan);
    setEditPortion(scan.portion_size?.toString() ?? "");
  };

  const handleSavePortion = async () => {
    if (!editingScan) return;
    const newPortion = parseFloat(editPortion);
    if (!newPortion || newPortion <= 0) return;

    await onEditPortion(editingScan.id, newPortion);
    setEditingScan(null);
  };

  const handleDelete = async (scan: AdvancedFoodScan) => {
    const confirmDelete = window.confirm(
      `Remove "${scan.food_name}" from today's intake?`
    );
    if (!confirmDelete) return;
    await onDeleteScan(scan.id);
  };

  return (
    <>
      <Card className="lg-col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Today&apos;s Food Intake
          </CardTitle>
          <CardDescription>
            Foods you&apos;ve scanned and consumed today, with macros and quick edit options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {foodScans.length > 0 ? (
            <div className="space-y-4">
              {/* Summary row */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Today&apos;s totals
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(todaysCalories)} kcal · {Math.round(todaysProtein)}g protein
                  </p>
                </div>
                {macroData.length > 0 && (
                  <div className="flex items-center gap-3">
                    <PieChartIcon className="w-4 h-4 text-primary" />
                    <div className="h-20 w-32">
                      <ResponsiveContainer>
                        <RePieChart>
                          <Pie
                            data={macroData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={20}
                            outerRadius={35}
                            paddingAngle={2}
                          >
                            {macroData.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={MACRO_COLORS[index % MACRO_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              fontSize: "0.75rem",
                              padding: "4px 8px",
                            }}
                          />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-1 text-[0.65rem] text-muted-foreground">
                      {macroData.map((m, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: MACRO_COLORS[idx % MACRO_COLORS.length] }}
                          />
                          <span>{m.name}</span>
                          <span className="font-medium text-foreground ml-1">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Food list */}
              <div className="space-y-3">
                {foodScans.map((scan) => {
                  const calories =
                    scan.portion_size === 1
                      ? Math.round(scan.calories_per_100g)
                      : Math.round(
                          (scan.calories_per_100g || 0) *
                            (scan.portion_size || 100) /
                            100
                        );
                  const protein =
                    scan.portion_size === 1
                      ? Math.round(scan.protein_per_100g)
                      : Math.round(
                          (scan.protein_per_100g || 0) *
                            (scan.portion_size || 100) /
                            100
                        );

                  const carbs = scan.carbs_per_100g != null
                    ? Math.round(calcValue(scan, "carbs_per_100g"))
                    : null;
                  const fats = scan.fats_per_100g != null
                    ? Math.round(calcValue(scan, "fats_per_100g"))
                    : null;
                  const sugar = scan.sugar_per_100g != null
                    ? Math.round(calcValue(scan, "sugar_per_100g"))
                    : null;
                  const fiber = scan.fiber_per_100g != null
                    ? Math.round(calcValue(scan, "fiber_per_100g"))
                    : null;

                  const hasAnyMacro = carbs || fats || sugar || fiber;

                  return (
                    <div
                      key={scan.id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{scan.food_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {scan.portion_size === 1
                            ? "AI-estimated portion"
                            : `${scan.portion_size}g portion`}
                          {" · "}
                          {calories} cal · {protein}g protein
                        </p>
                        {hasAnyMacro && (
                          <p className="text-[0.7rem] text-muted-foreground">
                            {carbs !== null && <span>Carbs: {carbs}g</span>}
                            {fats !== null && (
                              <span className="ml-2">Fats: {fats}g</span>
                            )}
                            {sugar !== null && (
                              <span className="ml-2">Sugar: {sugar}g</span>
                            )}
                            {fiber !== null && (
                              <span className="ml-2">Fiber: {fiber}g</span>
                            )}
                          </p>
                        )}
                        {scan.ai_suggestion && (
                          <p className="flex items-start gap-1 text-[0.7rem] text-muted-foreground mt-1">
                            <Info className="w-3 h-3 mt-[2px]" />
                            <span>{scan.ai_suggestion}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-start md:self-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditModal(scan)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(scan)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No food scanned today. Use the scanner to track your nutrition!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit portion dialog */}
      <Dialog
        open={!!editingScan}
        onOpenChange={(open) => {
          if (!open) setEditingScan(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Portion Size</DialogTitle>
          </DialogHeader>
          {editingScan && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{editingScan.food_name}</p>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground" htmlFor="edit-portion">
                  Portion size (in grams). If you keep it &quot;1&quot;, it will be treated as an AI-estimated total portion.
                </label>
                <Input
                  id="edit-portion"
                  type="number"
                  value={editPortion}
                  onChange={(e) => setEditPortion(e.target.value)}
                  min={1}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingScan(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePortion}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
