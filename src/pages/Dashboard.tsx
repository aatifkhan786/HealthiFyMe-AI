// --- Dashboard.tsx (with AI Health Engine + Advanced Food Intake) ---

import BMICalculator from "@/components/calculators/BMICalculator";
import BodyFatCalculator from "@/components/calculators/BodyFatCalculator";
import CaloriesBurnedHeartRateCalculator from "@/components/calculators/CaloriesBurnedHeartRateCalculator";
import DailyCalorieCalculator from "@/components/calculators/DailyCalorieCalculator";
import OneRepMaxCalculator from "@/components/calculators/OneRepMaxCalculator";
import GripStrengthCalculator from "@/components/calculators/GripStrengthCalculator";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  User,
  Target,
  Zap,
  LogOut,
  ScanLine,
  BookOpen,
  Droplets,
  GlassWater,
  RotateCcw,
  Scale,
  Flame,
  Dumbbell,
  HandMetal,

  Calculator as CalculatorIcon,
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import {
  getAIHealthReport,
  AIHealthInput,
  AIHealthOutput,
} from "@/utils/aiHealthEngine";
import { AIHealthBriefing } from "@/components/dashboard/AIHealthBriefing";
import {
  AdvancedFoodIntake,
  AdvancedFoodScan,
} from "@/components/dashboard/AdvancedFoodIntake";


// --- Gemini AI Setup (FAST: gemini-2.5-flash) ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("Missing Gemini API Key in .env file");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// --- Types ---
interface Profile {
  user_id: string;
  name: string;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  blood_group?: string | null;
  daily_calorie_target?: number | null;
  daily_protein_target?: number | null;
  ideal_body_weight?: number | null;
  goal?: string | null;
  activity_level?: string | null;
  health_conditions?: string | null;
  daily_water_target?: number | null;
}

interface FoodScan extends AdvancedFoodScan {
  consumed_at: string;
}

// ================== DASHBOARD HEADER ==================
const DashboardHeader = ({ onSignOut }: { onSignOut: () => void }) => (
  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 max-w-screen-2xl items-center px-6 sm:px-10">
      <div className="mr-auto flex items-center space-x-2">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="font-bold text-base sm:text-lg tracking-tight">
            HealthifyMe AI
          </span>
        </Link>
      </div>
      <nav className="flex items-center gap-3 sm:gap-4 pr-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="border border-gray-300 hover:border-gray-400"
        >
          <Link to="/scanner">
            <ScanLine className="w-4 h-4 mr-2" /> Scanner
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="border border-gray-300 hover:border-gray-400"
        >
          <Link to="/blog">
            <BookOpen className="w-4 h-4 mr-2" /> Blog
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onSignOut}>
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </nav>
    </div>
  </header>
);

// ================== EXISTING CALCULATORS (BMI, Body Fat etc.) ==================
// (same as you already have – keeping them unchanged)
// ... BMICalculator, BodyFatCalculator, CaloriesBurnedHeartRateCalculator,
// DailyCalorieCalculator, OneRepMaxCalculator, GripStrengthCalculator ...
// (Use the versions we already added earlier – I won’t repeat here to avoid message overflow)

// For brevity in this reply, I’m referencing them as already present.
// Keep your previous calculator components exactly as they are.

// ----------- WRAPPER SECTION FOR ALL CALCULATORS -----------
type CalculatorKey =
  | "bmi"
  | "bodyFat"
  | "caloriesBurned"
  | "dailyCalories"
  | "oneRepMax"
  | "gripStrength";

const HealthCalculatorsSection = () => {
  const [active, setActive] = useState<CalculatorKey>("bmi");

  const menuItems: { key: CalculatorKey; label: string; icon: JSX.Element }[] =
    [
      { key: "bmi", label: "Body Mass Index (BMI)", icon: <Scale className="w-4 h-4" /> },
      { key: "bodyFat", label: "Body Fat Index", icon: <Droplets className="w-4 h-4" /> },
      { key: "caloriesBurned", label: "Calories Burned", icon: <Flame className="w-4 h-4" /> },
      { key: "dailyCalories", label: "Daily Calorie Calculator", icon: <Activity className="w-4 h-4" /> },
      { key: "oneRepMax", label: "One Rep Max Calculator", icon: <Dumbbell className="w-4 h-4" /> },
      { key: "gripStrength", label: "Grip Strength Calculator", icon: <HandMetal className="w-4 h-4" /> },
    ];

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-2">
        <CalculatorIcon className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">
          Health Tools &amp; Calculators
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Use science-backed fitness and health calculators to better understand your body and plan your workouts.
      </p>
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex md:flex-col gap-2 md:border-r md:pr-4">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActive(item.key)}
                  className={`flex items-center justify-between md:justify-start w-full rounded-lg px-3 py-2 text-sm transition border ${active === item.key
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/40 hover:bg-muted border-border/60"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    <span className="hidden md:inline">{item.label}</span>
                    <span className="md:hidden">
                      {item.label.split("(")[0].trim()}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div className="md:col-span-3">
              {active === "bmi" && <BMICalculator />}
              {active === "bodyFat" && <BodyFatCalculator />}
              {active === "caloriesBurned" && (
                <CaloriesBurnedHeartRateCalculator />
              )}
              {active === "dailyCalories" && <DailyCalorieCalculator />}
              {active === "oneRepMax" && <OneRepMaxCalculator />}
              {active === "gripStrength" && <GripStrengthCalculator />}
            </div>

          </div>
        </CardContent>
      </Card>
    </section>
  );
};

// ================== MAIN DASHBOARD COMPONENT ==================
const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [foodScans, setFoodScans] = useState<FoodScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    height: "",
    weight: "",
    blood_group: "",
    goal: "",
    activity_level: "",
    health_conditions: "" as string,
  });

  const [todaysWater, setTodaysWater] = useState(0);

  // AI Health Engine state
  const [aiHealthReport, setAiHealthReport] = useState<AIHealthOutput | null>(
    null
  );
  const [aiHealthLoading, setAiHealthLoading] = useState(false);
  const [aiHealthError, setAiHealthError] = useState<string | null>(null);

  const formatText = (text: string | null | undefined) => {
    if (!text) return "Not Set";
    return text
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTodaysFoodScans();
    } else {
      setLoading(false);
    }
  }, [user]);

  // REALTIME FOOD SCAN SUBSCRIPTION
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("food_scans_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "food_scans",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setFoodScans((currentScans) => [
            ...currentScans,
            payload.new as FoodScan,
          ]);
          toast({
            title: "Dashboard Updated!",
            description: `${(payload.new as any).food_name} has been added to your intake list.`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const lastVisitDate = localStorage.getItem("lastVisitDate");

    if (lastVisitDate !== today) {
      setTodaysWater(0);
      localStorage.setItem("lastVisitDate", today);
    }
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single<Profile>();

      if (error && (error as any).code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || "",
          age: data.age?.toString() || "",
          height: data.height?.toString() || "",
          weight: data.weight?.toString() || "",
          blood_group: data.blood_group || "",
          goal: data.goal || "",
          activity_level: data.activity_level || "",
          health_conditions:
            (typeof data.health_conditions === "string"
              ? data.health_conditions
              : data.health_conditions
                ? String(data.health_conditions)
                : "") || "",
        });
      } else {
        setEditing(true);
        setFormData((prev) => ({
          ...prev,
          name: (user as any)?.user_metadata?.name || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysFoodScans = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("food_scans")
        .select("*")
        .eq("user_id", user.id)
        .gte("consumed_at", `${today} 00:00:00`)
        .lt("consumed_at", `${today} 23:59:59`)
        .returns<FoodScan[]>();

      if (error) throw error;
      setFoodScans(data || []);
    } catch (error) {
      console.error("Error fetching food scans:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const age = formData.age ? parseInt(formData.age) : null;
      const height = formData.height ? parseFloat(formData.height) : null;
      const weight = formData.weight ? parseFloat(formData.weight) : null;

      let targets: Record<string, number> = {};

      if (age && height && weight && formData.goal && formData.activity_level) {
        toast({
          title: "AI is thinking...",
          description: "Generating personalized health targets.",
        });

        const prompt = `Based on user data - Age: ${age}, Height: ${height}cm, Weight: ${weight}kg, Health Goal: ${formData.goal}, Activity Level: ${formData.activity_level}, Health Conditions: ${formData.health_conditions || "None"
          }. 
        Calculate ideal_body_weight, daily_calorie_target, daily_protein_target, and daily_water_target (in ml).
        Respond ONLY in a valid JSON format: {"ideal_body_weight": number, "daily_calorie_target": number, "daily_protein_target": number, "daily_water_target": number}.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const aiResponse = JSON.parse(
          responseText.replace(/```json|```/g, "").trim()
        );
        targets = aiResponse;
      }

      const profileData = {
        user_id: user.id,
        name: formData.name,
        age,
        height,
        weight,
        blood_group: formData.blood_group || null,
        goal: formData.goal || null,
        activity_level: formData.activity_level || null,
        health_conditions: formData.health_conditions
          ? formData.health_conditions
          : null,
        ...targets,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated with AI-powered targets!",
      });
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = (key: "calories_per_100g" | "protein_per_100g") => {
    return foodScans.reduce((total, scan) => {
      if (scan.portion_size === 1) {
        return total + (scan[key] || 0);
      }
      return (
        total +
        ((scan[key] || 0) * (scan.portion_size || 100)) / 100
      );
    }, 0);
  };

  const calculateMacroTotal = (
    key:
      | "carbs_per_100g"
      | "fats_per_100g"
      | "sugar_per_100g"
      | "fiber_per_100g"
  ) => {
    return foodScans.reduce((total, scan) => {
      const base = (scan as any)[key] as number | null;
      if (base == null) return total;
      if (scan.portion_size === 1) {
        return total + base;
      }
      const portion = scan.portion_size || 100;
      return total + (base * portion) / 100;
    }, 0);
  };

  const todaysCalories = calculateTotal("calories_per_100g");
  const todaysProtein = calculateTotal("protein_per_100g");
  const todaysCarbs = calculateMacroTotal("carbs_per_100g");
  const todaysFats = calculateMacroTotal("fats_per_100g");
  const todaysSugar = calculateMacroTotal("sugar_per_100g");
  const todaysFiber = calculateMacroTotal("fiber_per_100g");

  const addWater = (amount: number) => {
    setTodaysWater((prev) => prev + amount);
    toast({ title: `Added ${amount}ml of water!` });
  };

  // Edit / Delete food scan
  const handleEditFoodPortion = async (
    scanId: number,
    newPortion: number
  ) => {
    try {
      const { error } = await supabase
        .from("food_scans")
        .update({ portion_size: newPortion })
        .eq("id", scanId)
        .eq("user_id", user!.id);

      if (error) throw error;

      setFoodScans((prev) =>
        prev.map((scan) =>
          scan.id === scanId ? { ...scan, portion_size: newPortion } : scan
        )
      );
      toast({ title: "Portion updated" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update portion",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFoodScan = async (scanId: number) => {
    try {
      const { error } = await supabase
        .from("food_scans")
        .delete()
        .eq("id", scanId)
        .eq("user_id", user!.id);
      if (error) throw error;

      setFoodScans((prev) => prev.filter((scan) => scan.id !== scanId));
      toast({ title: "Food removed from today" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove food item",
        variant: "destructive",
      });
    }
  };

  // AI Health Engine trigger
  const handleGenerateHealthReport = async () => {
    if (!profile) {
      toast({
        title: "Profile required",
        description: "Please fill your profile so AI can analyze your health.",
      });
      return;
    }

    setAiHealthLoading(true);
    setAiHealthError(null);

    try {
      const height = profile.height ?? null;
      const weight = profile.weight ?? null;
      const bmi =
        height && weight ? weight / ((height / 100) * (height / 100)) : null;

      const input: AIHealthInput = {
        age: profile.age ?? null,
        gender: null, // can be added later to profile
        heightCm: height,
        weightKg: weight,
        bmi,
        bodyFatPercentEstimate: null, // can be added later
        goal: profile.goal ?? null,
        activityLevel: profile.activity_level ?? null,
        dailyTargets: {
          calories: profile.daily_calorie_target ?? null,
          protein: profile.daily_protein_target ?? null,
          waterMl: profile.daily_water_target ?? null,
        },
        todayTotals: {
          calories: todaysCalories,
          protein: todaysProtein,
          waterMl: todaysWater,
          carbs: todaysCarbs,
          fats: todaysFats,
          sugar: todaysSugar,
          fiber: todaysFiber,
        },
        strength: {
          // Future: hook from calculators / saved fields
          oneRepMaxKg: null,
          gripCategory: null,
        },
        foodList: foodScans.map((scan) => {
          const portion = scan.portion_size || 100;
          const calories =
            scan.portion_size === 1
              ? scan.calories_per_100g
              : (scan.calories_per_100g * portion) / 100;
          const protein =
            scan.portion_size === 1
              ? scan.protein_per_100g
              : (scan.protein_per_100g * portion) / 100;

          const carbs =
            scan.carbs_per_100g != null
              ? scan.portion_size === 1
                ? scan.carbs_per_100g
                : (scan.carbs_per_100g * portion) / 100
              : undefined;

          const fats =
            scan.fats_per_100g != null
              ? scan.portion_size === 1
                ? scan.fats_per_100g
                : (scan.fats_per_100g * portion) / 100
              : undefined;

          const sugar =
            scan.sugar_per_100g != null
              ? scan.portion_size === 1
                ? scan.sugar_per_100g
                : (scan.sugar_per_100g * portion) / 100
              : undefined;

          const fiber =
            scan.fiber_per_100g != null
              ? scan.portion_size === 1
                ? scan.fiber_per_100g
                : (scan.fiber_per_100g * portion) / 100
              : undefined;

          return {
            name: scan.food_name,
            calories,
            protein,
            carbs,
            fats,
            sugar,
            fiber,
            aiNote: scan.ai_suggestion ?? null,
          };
        }),
      };

      const report = await getAIHealthReport(input);
      setAiHealthReport(report);
    } catch (error: any) {
      console.error("AI Health Engine error:", error);
      setAiHealthError(
        error?.message || "Failed to generate AI health report"
      );
    } finally {
      setAiHealthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <DashboardHeader onSignOut={signOut} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Track your health journey</p>
          </div>
          <Button
            onClick={() => setEditing(!editing)}
            variant={editing ? "outline" : "default"}
          >
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PROFILE CARD */}
          <Card className="lg-col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" /> Profile Information
              </CardTitle>
              <CardDescription>Your health profile and targets</CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) =>
                          setFormData({ ...formData, age: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) =>
                          setFormData({ ...formData, height: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({ ...formData, weight: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="blood_group">Blood Group</Label>
                      <Select
                        value={formData.blood_group}
                        onValueChange={(value) =>
                          setFormData({ ...formData, blood_group: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="goal">Health Goal</Label>
                      <Select
                        value={formData.goal}
                        onValueChange={(value) =>
                          setFormData({ ...formData, goal: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weight_loss">
                            Weight Loss
                          </SelectItem>
                          <SelectItem value="maintain_weight">
                            Maintain Weight
                          </SelectItem>
                          <SelectItem value="weight_gain">
                            Weight Gain
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="activity_level">Activity Level</Label>
                      <Select
                        value={formData.activity_level}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            activity_level: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your activity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal_person">
                            Normal Person (Sedentary)
                          </SelectItem>
                          <SelectItem value="sports_person">
                            Sports Person (Active)
                          </SelectItem>
                          <SelectItem value="gymmer_athelete">
                            Gymeer / Athlete (Heavy Training)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="health_conditions">
                        Health Conditions (Optional)
                      </Label>
                      <Input
                        id="health_conditions"
                        placeholder="e.g., Diabetes, High BP"
                        value={formData.health_conditions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            health_conditions: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    className="w-full"
                    disabled={isSaving}
                  >
                    {isSaving ? "AI is working..." : "Save Profile with AI"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{profile.name}</p>
                      </div>
                      {profile.age && (
                        <div>
                          <p className="text-sm text-muted-foreground">Age</p>
                          <p className="font-medium">{profile.age} years</p>
                        </div>
                      )}
                      {profile.height && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Height
                          </p>
                          <p className="font-medium">{profile.height} cm</p>
                        </div>
                      )}
                      {profile.weight && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Weight
                          </p>
                          <p className="font-medium">{profile.weight} kg</p>
                        </div>
                      )}
                      {profile.blood_group && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Blood Group
                          </p>
                          <p className="font-medium">{profile.blood_group}</p>
                        </div>
                      )}
                      {profile.ideal_body_weight && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Ideal Weight (AI)
                          </p>
                          <p className="font-medium">
                            {profile.ideal_body_weight} kg
                          </p>
                        </div>
                      )}
                      {profile.goal && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Health Goal
                          </p>
                          <p className="font-medium">
                            {formatText(profile.goal)}
                          </p>
                        </div>
                      )}
                      {profile.activity_level && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Activity Level
                          </p>
                          <p className="font-medium">
                            {formatText(profile.activity_level)}
                          </p>
                        </div>
                      )}
                      {profile.health_conditions &&
                        profile.health_conditions.length > 0 && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground">
                              Health Conditions
                            </p>
                            <p className="font-medium">
                              {profile.health_conditions}
                            </p>
                          </div>
                        )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No profile data available. Click &apos;Edit Profile&apos; to add your
                      information.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* TODAY'S CALORIES / PROTEIN / WATER */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Today&apos;s Calories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Consumed</span>
                    <span className="font-bold">
                      {Math.round(todaysCalories)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target</span>
                    <span className="font-bold">
                      {profile?.daily_calorie_target || "Not set"}
                    </span>
                  </div>
                  {profile?.daily_calorie_target && (
                    <Progress
                      value={
                        profile.daily_calorie_target > 0
                          ? Math.min(
                            (todaysCalories /
                              profile.daily_calorie_target) *
                            100,
                            100
                          )
                          : 0
                      }
                      className="mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" /> Today&apos;s Protein
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Consumed</span>
                    <span className="font-bold">
                      {Math.round(todaysProtein)}g
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target</span>
                    <span className="font-bold">
                      {profile?.daily_protein_target
                        ? `${profile.daily_protein_target}g`
                        : "Not set"}
                    </span>
                  </div>
                  {profile?.daily_protein_target && (
                    <Progress
                      value={
                        profile.daily_protein_target > 0
                          ? Math.min(
                            (todaysProtein /
                              profile.daily_protein_target) *
                            100,
                            100
                          )
                          : 0
                      }
                      className="mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" /> Today&apos;s Water
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center mb-2">
                    <span className="text-2xl font-bold">{todaysWater}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      / {profile?.daily_water_target || 2000} ml
                    </span>
                  </div>
                  <Progress
                    value={
                      profile?.daily_water_target
                        ? Math.min(
                          (todaysWater /
                            profile.daily_water_target) *
                          100,
                          100
                        )
                        : 0
                    }
                  />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addWater(250)}
                    >
                      <GlassWater className="w-4 h-4 mr-1" />
                      +250ml
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addWater(500)}
                    >
                      +500ml
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTodaysWater(0)}
                    >
                      <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ADVANCED TODAY FOOD INTAKE */}
          <AdvancedFoodIntake
            foodScans={foodScans}
            todaysCalories={todaysCalories}
            todaysProtein={todaysProtein}
            onEditPortion={handleEditFoodPortion}
            onDeleteScan={handleDeleteFoodScan}
          />
        </div>

        {/* HEALTH CALCULATORS SECTION */}
        <HealthCalculatorsSection />

        {/* AI DAILY HEALTH BRIEFING SECTION */}
        <AIHealthBriefing
          loading={aiHealthLoading}
          error={aiHealthError}
          report={aiHealthReport}
          onGenerate={handleGenerateHealthReport}
        />
      </main>
    </div>
  );
};

export default Dashboard;
