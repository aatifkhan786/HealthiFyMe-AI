import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { fileToGenerativePart } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

// Shadcn UI & Lucide Icons
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Camera, X, Sparkles, Type, HeartPulse, Zap, Salad, Beef, Droplets, Gauge, AlertTriangle, CheckCircle, Flame, Plus, Leaf, Info, ScanLine, BookOpen, LogOut, Bone, Feather, Sun, Wind, Banana
} from 'lucide-react';

// --- Environment Setup ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Missing Gemini API Key. Please check your .env file.");
}
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// --- YAHAN BADA BADLAV HAI: Interfaces now handle Energy ---
interface NutritionData {
  food_name: string;
  portion_analyzed: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_sugar: number;
  total_fiber: number;
  total_sodium_mg: number;
  total_energy_kj: number; // New field for energy in kilojoules
  suggestion: string;
  total_calcium_mg: number;
  total_iron_mg: number;
  total_vitamin_c_mg: number;
  total_vitamin_a_mcg: number;
  total_vitamin_d_mcg: number;
  total_potassium_mg: number;
  precautions: string;
}

// System Instruction Prompt for the AI (Updated for Energy and better context handling)
const SYSTEM_INSTRUCTION = `You are an expert AI Food Analyst. Analyze the food from the text and/or image. The user will provide quantities in pieces, grams, ml, or sizes (e.g., "5 bananas", "1 large pizza", "250ml milk").
Your task is to:
1. Identify the food and the quantity, using both the image and the text description for context. If the text says "3 bananas" and the image shows a bunch, calculate for 3 bananas.
2. Calculate the TOTAL nutritional values for that specific quantity.

Respond ONLY in a valid JSON format. The JSON object must have these exact keys:
"food_name", "portion_analyzed", "total_calories", "total_protein", "total_carbs", "total_fat",
"total_sugar", "total_fiber", "total_sodium_mg", "total_energy_kj",
"total_calcium_mg", "total_iron_mg", "total_vitamin_c_mg",
"total_vitamin_a_mcg", "total_vitamin_d_mcg", "total_potassium_mg",
"suggestion", "precautions".`;



// Smart JSON Parser (Updated for new interface)
function parseGeminiResponse(responseText: string): NutritionData {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) { throw new Error("Invalid JSON structure in AI response."); }
  const parsedData = JSON.parse(jsonMatch[0]);
  // Check for a few key fields to ensure the structure is correct
  if (typeof parsedData.total_calories !== 'number' || typeof parsedData.total_protein !== 'number' || typeof parsedData.total_calcium_mg !== 'number') {
    throw new Error("AI returned invalid or incomplete nutritional data.");
  }
  return parsedData as NutritionData;
}

// Reusable Components
const PageHeader = ({ onSignOut }: { onSignOut: () => void }) => (
  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 max-w-screen-2xl items-center px-6 sm:px-10">
      <div className="mr-auto flex items-center space-x-2">
        <Link to="/" className="flex items-center gap-2"><Logo className="w-6 h-6 sm:w-7 sm:h-7" /><span className="font-bold text-base sm:text-lg tracking-tight">HealthifyMe AI</span></Link>
      </div>
      <nav className="flex items-center gap-3 sm:gap-4 pr-4">
        <Button variant="ghost" size="sm" asChild className="border border-gray-300 hover:border-gray-400"><Link to="/dashboard"><ScanLine className="w-4 h-4 mr-2" /> Dashboard</Link></Button>
        <Button variant="ghost" size="sm" asChild className="border border-gray-300 hover:border-gray-400"><Link to="/blog"><BookOpen className="w-4 h-4 mr-2" /> Blog</Link></Button>
        <Button variant="outline" size="sm" onClick={onSignOut}><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button>
      </nav>
    </div>
  </header>
);

const ResultCard = ({ data, onLogMeal, user }: { data: NutritionData, onLogMeal: () => void, user: any }) => (
  <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
    <Card className="mt-8 border-primary shadow-lg">
      <CardHeader className="bg-primary/5 rounded-t-lg">
        <CardTitle className="flex items-center text-primary text-2xl">
          <Salad className="w-6 h-6 mr-3" />
          {data.food_name}
        </CardTitle>
        <CardDescription>Nutritional breakdown for: {data.portion_analyzed}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* === MACRONUTRIENT CARDS (NO CHANGE) === */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 border rounded-lg bg-red-50/50">
            <Flame className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{Math.round(data.total_calories)}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div className="p-3 border rounded-lg bg-green-50/50">
            <Beef className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{data.total_protein.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div className="p-3 border rounded-lg bg-blue-50/50">
            <Gauge className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{data.total_carbs.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="p-3 border rounded-lg bg-yellow-50/50">
            <Droplets className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{data.total_fat.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground">Fat</p>
          </div>
          <div className="p-3 border rounded-lg bg-pink-50/50">
            <Zap className="w-5 h-5 text-pink-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{data.total_sugar.toFixed(1)}g</p>
            <p className="text-xs text-muted-foreground">Sugar</p>
          </div>
          <div className="p-3 border rounded-lg bg-purple-50/50">
            <Sparkles className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <p className="text-lg font-bold">{Math.round(data.total_energy_kj)}</p>
            <p className="text-xs text-muted-foreground">Energy (kJ)</p>
          </div>
        </div>

        {/* === ADDITIONAL NUTRIENTS SECTION (UPDATED) === */}
        <div className="space-y-3 pt-2">
          <h3 className="text-md font-semibold border-b pb-1">Additional Nutrients (Total)</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-amber-600" />
              <div>
                <span className="font-semibold">Fiber:</span>
                <p className="text-muted-foreground">{data.total_fiber.toFixed(1)}g</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-red-500" />
              <div>
                <span className="font-semibold">Sodium:</span>
                <p className="text-muted-foreground">{data.total_sodium_mg.toFixed(0)}mg</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Bone className="w-4 h-4 text-slate-500" />
              <div>
                <span className="font-semibold">Calcium:</span>
                <p className="text-muted-foreground">{data.total_calcium_mg.toFixed(0)}mg</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Feather className="w-4 h-4 text-gray-600" />
              <div>
                <span className="font-semibold">Iron:</span>
                <p className="text-muted-foreground">{data.total_iron_mg.toFixed(1)}mg</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <div>
                <span className="font-semibold">Vitamin C:</span>
                <p className="text-muted-foreground">{data.total_vitamin_c_mg.toFixed(1)}mg</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-500" />
              <div>
                <span className="font-semibold">Vitamin A:</span>
                <p className="text-muted-foreground">{data.total_vitamin_a_mcg.toFixed(0)}µg</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-500" />
              <div>
                <span className="font-semibold">Vitamin D:</span>
                <p className="text-muted-foreground">{data.total_vitamin_d_mcg.toFixed(0)}µg</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Banana className="w-4 h-4 text-yellow-600" />
              <div>
                <span className="font-semibold">Potassium:</span>
                <p className="text-muted-foreground">{data.total_potassium_mg.toFixed(0)}mg</p>
              </div>
            </div>
          </div>
        </div>

        {/* === SUGGESTION & PRECAUTIONS (NO CHANGE) === */}
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <h4 className="flex items-center font-bold text-green-700 mb-2"><CheckCircle className="w-5 h-5 mr-2" />AI Suggestion</h4>
          <p className="text-sm text-green-600">{data.suggestion}</p>
        </div>
        {data.precautions && data.precautions.toLowerCase() !== 'none' && !data.precautions.toLowerCase().includes('no specific precautions') ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <h4 className="flex items-center font-bold text-red-700 mb-2"><AlertTriangle className="w-5 h-5 mr-2" />Important Precautions</h4>
            <p className="text-sm text-red-600 font-medium">{data.precautions}</p>
            <p className="text-xs mt-2 text-red-500">Always consult a healthcare professional for specific dietary advice.</p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
            <h4 className="flex items-center font-bold text-indigo-700 mb-2"><Info className="w-5 h-5 mr-2" />General Advice</h4>
            <p className="text-sm text-indigo-600">{data.precautions}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onLogMeal} className="w-full" disabled={!user}>
          <Plus className="w-4 h-4 mr-2" />
          {user ? 'Log This Meal' : 'Login to Log Meal'}
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);
const LoadingState = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="mt-8 space-y-4"><h3 className="text-lg font-semibold text-center text-primary">AI is analyzing...</h3><Progress value={70} className="h-2 animate-pulse" /><div className="space-y-3 pt-4"><Skeleton className="h-6 w-3/4 mx-auto" /><Skeleton className="h-4 w-5/6 mx-auto" /><div className="grid grid-cols-4 gap-4 pt-4"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div><Skeleton className="h-20 w-full" /></div></div>
  </motion.div>
);

const Scanner = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchTerm, setTextPrompt] = useState('');
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast({ title: "File Too Large", description: "Please upload an image smaller than 5MB.", variant: "destructive" }); return; }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const resetState = () => {
    setImageFile(null); setImagePreview(null);
    setTextPrompt(''); setNutritionData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeFood = useCallback(async () => {
    if (!genAI) { toast({ title: "Configuration Error", description: "Gemini API is not configured.", variant: "destructive" }); return; }
    if (!imageFile && !searchTerm.trim()) { toast({ title: "Input Missing", description: "Please upload an image or describe the food.", variant: "destructive" }); return; }
    setIsLoading(true); setNutritionData(null);
    toast({ title: "AI is analyzing...", description: "This may take a moment." });
    let responseText = '';
    try {
      let result;
      if (imageFile) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `${SYSTEM_INSTRUCTION}\n\nUser query: ${searchTerm || 'Analyze the food in this image.'}`;
        result = await model.generateContent([prompt, imagePart]);
      } else {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `${SYSTEM_INSTRUCTION}\n\nUser query: ${searchTerm}`;
        result = await model.generateContent(prompt);
      }
      responseText = result.response.text();
      const aiResponse = parseGeminiResponse(responseText);
      setNutritionData(aiResponse);
      toast({ title: "Analysis Complete!", description: `Nutritional data for ${aiResponse.food_name} is ready.`, variant: "success" });
    } catch (error: any) {
      console.error("Analysis Error:", error);
      console.error("RAW AI RESPONSE:", responseText);
      toast({ title: "AI Analysis Failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally { setIsLoading(false); }
  }, [imageFile, searchTerm, toast]);

  const addToConsumption = async () => {
    if (!user || !nutritionData) return;
    let imageUrl = null;
    if (imageFile) {
      const fileName = `${user.id}/${uuidv4()}`;
      const { data, error: uploadError } = await supabase.storage.from('food_images').upload(fileName, imageFile);
      if (uploadError) { toast({ title: "Image Upload Failed", description: uploadError.message, variant: "destructive" }); return; }
      imageUrl = data?.path;
    }
    try {
      const { error } = await supabase.from('food_scans').insert({
        user_id: user.id,
        food_name: `${nutritionData.food_name} (${nutritionData.portion_analyzed})`,
        calories_per_100g: nutritionData.total_calories,
        protein_per_100g: nutritionData.total_protein,
        carbs_per_100g: nutritionData.total_carbs,
        fat_per_100g: nutritionData.total_fat,
        sugar_per_100g: nutritionData.total_sugar,
        energy: nutritionData.total_energy_kj, // Saving energy
        ai_suggestion: nutritionData.suggestion,
        image_url: imageUrl,
        portion_size: 1, // Represents 1 analyzed portion
      });
      if (error) throw error;
      toast({ title: "Logged!", description: `${nutritionData.food_name} added to your tracker.` });
      resetState();
    } catch (error: any) { toast({ title: 'Error', description: 'Failed to log food to database.', variant: 'destructive' }); }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <PageHeader onSignOut={signOut} />
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-600">AI Food Scanner</h1>
            <p className="text-black-700 mt-2">Get instant nutritional analysis for any meal.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-green-500">Analyze Your Meal</CardTitle>
              <CardDescription>Click below to use your camera or upload an image, or just type to describe.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors flex flex-col justify-center items-center min-h-[200px]"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative group w-full">
                    <img src={imagePreview} alt="Food preview" className="rounded-lg max-h-60 mx-auto object-cover max-w-full" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); resetState(); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                    <p className="mt-2 font-semibold text-primary">Click to Use Camera or Upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Uses back camera (environment) by default.</p>
                  </div>
                )}
              </div>
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
                ref={fileInputRef}
              />
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="text-prompt"
                  placeholder={imageFile ? "Add details (e.g., '3 bananas')" : "Describe your food (e.g., 'chiken roll 1pc')"}
                  value={searchTerm}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={analyzeFood}
                disabled={isLoading || (!imageFile && !searchTerm.trim())}
                className="w-full"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isLoading ? 'AI is Analyzing...' : 'Analyze with AI'}
              </Button>
            </CardContent>
          </Card>
          <AnimatePresence mode="wait">
            {isLoading && <LoadingState key="loading" />}
            {nutritionData && <ResultCard data={nutritionData} onLogMeal={addToConsumption} user={user} key="results" />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Scanner;