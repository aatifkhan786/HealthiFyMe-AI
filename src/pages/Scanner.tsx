import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom'; // Link import add karein
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Utensils, LogOut, ScanLine, BookOpen } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Logo } from '@/components/Logo'; // Logo ko import karein

// --- Gemini AI Setup ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Missing Gemini API Key. Please check your .env file.");
}
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-pro" }) : null;
// -----------------------

interface NutritionAnalysis {
  food_name: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_sugar: number;
  portion_analyzed: string;
}

function parseGeminiResponse(responseText: string): NutritionAnalysis {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) { throw new Error("Invalid JSON structure in AI response."); }
  return JSON.parse(jsonMatch[0]);
}

// === NAVBAR COMPONENT YAHAN HAI ===
const PageHeader = ({ onSignOut }: { onSignOut: () => void }) => (
  <header
    className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div className="container flex h-14 max-w-screen-2xl items-center px-6 sm:px-10"> 
      {/* px-6, sm:px-10 → thoda padding diya left-right se taaki edges se chipke na lagे */}

      {/* Left side: Logo + Text */}
      <div className="mr-auto flex items-center space-x-2">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-6 h-6 sm:w-7 sm:h-7" /> {/* Thoda bada logo */}
          <span className="font-bold text-base sm:text-lg tracking-tight">
            HealthifyMe AI
          </span>
        </Link>
      </div>

      {/* Right side: Navigation */}
      <nav className="flex items-center gap-3 sm:gap-4 pr-4"> 
        {/* pr-4 → thoda right se andar, gap badhaya */}
        <Button variant="ghost" size="sm" asChild className="border border-gray-300 hover:border-gray-400">
          <Link to="/dashboard">
            <ScanLine className="w-4 h-4 mr-2" /> Dashboard
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className="border border-gray-300 hover:border-gray-400">
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

const Scanner = () => {
  const { user, signOut } = useAuth(); // signOut ko yahan se lein
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [nutritionData, setNutritionData] = useState<NutritionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const sampleFoodSuggestions = ['5 bananas', '1 glass of milk', '2 boiled eggs', '1 cup rice', 'chicken breast 200g', '1 medium apple'];

  const searchFood = async () => {
    if (!model) {
      toast({ title: "Configuration Error", description: "Gemini API is not configured.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setNutritionData(null);
    toast({ title: 'AI is analyzing...', description: `Analyzing "${searchTerm}"` });

    try {
      const prompt = `
            Analyze the following food description: "${searchTerm}".
            The user might provide quantities in pieces, grams, ml, or sizes like small/medium/large (e.g., "5 bananas", "250ml milk", "1 large apple").
            Your task is to:
            1. Identify the food and the quantity.
            2. Calculate the TOTAL nutritional values for that specific quantity.
            
            Respond ONLY in a valid JSON format with no extra text or markdown. The JSON object must have these exact keys:
            "food_name" (string, e.g., "Banana"),
            "portion_analyzed" (string, e.g., "5 pieces" or "250 ml"),
            "total_calories" (number),
            "total_protein" (number),
            "total_carbs" (number),
            "total_fat" (number),
            "total_sugar" (number).
        `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const aiResponse = parseGeminiResponse(responseText);

      setNutritionData(aiResponse);
      toast({ title: 'Analysis Complete!', description: `Nutrition data loaded for ${aiResponse.food_name}` });
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      toast({
        title: 'AI Analysis Failed',
        description: error.message || 'An unknown error occurred. Please try a different description.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addToConsumption = async () => {
    if (!nutritionData || !user) return;
    try {
      const { error } = await supabase
        .from('food_scans')
        .insert({
          user_id: user.id,
          food_name: nutritionData.food_name,
          calories_per_100g: nutritionData.total_calories, 
          protein_per_100g: nutritionData.total_protein,
          carbs_per_100g: nutritionData.total_carbs,
          fat_per_100g: nutritionData.total_fat,
          sugar_per_100g: nutritionData.total_sugar,
          portion_size: 1, 
          consumed_at: new Date().toISOString()
        });
      if (error) throw error;
      toast({ title: 'Success!', description: `${nutritionData.food_name} added to your daily intake` });
      setNutritionData(null); setSearchTerm('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add food to your intake', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader onSignOut={signOut} />
      <main className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">AI Food Search</h1>
            <p className="text-muted-foreground">Describe your meal to get instant nutrition analysis</p>
          </div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Analyze a Meal</CardTitle>
              <CardDescription>Enter a food name with quantity (e.g., "5 bananas", "250ml milk").</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 5 bananas, 1 glass of milk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchFood()}
                  className="flex-1"
                />
                <Button onClick={searchFood} disabled={!searchTerm || loading}>
                  {loading ? 'AI is Analyzing...' : 'Analyze'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {nutritionData && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5" /> 
                  {nutritionData.food_name} - Nutrition for {nutritionData.portion_analyzed}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-primary">{Math.round(nutritionData.total_calories)}</p><p className="text-sm text-muted-foreground">Calories</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-primary">{nutritionData.total_protein.toFixed(1)}g</p><p className="text-sm text-muted-foreground">Protein</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-primary">{nutritionData.total_carbs.toFixed(1)}g</p><p className="text-sm text-muted-foreground">Carbs</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-primary">{nutritionData.total_fat.toFixed(1)}g</p><p className="text-sm text-muted-foreground">Fat</p></div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg"><p className="text-2xl font-bold text-primary">{nutritionData.total_sugar.toFixed(1)}g</p><p className="text-sm text-muted-foreground">Sugar</p></div>
                  </div>
                  <Button onClick={addToConsumption} className="w-full" size="lg"><Plus className="w-4 h-4 mr-2" />Add to My Daily Intake</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Food Suggestions</CardTitle>
              <CardDescription>Try searching with quantities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sampleFoodSuggestions.map((food) => (
                  <Button key={food} variant="outline" size="sm" onClick={() => { setSearchTerm(food); }} className="capitalize text-left justify-start">
                    {food}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Scanner;