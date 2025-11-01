import  { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Utensils } from 'lucide-react';

interface NutritionData {
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  sugar_per_100g: number;
}

const Scanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [portionSize, setPortionSize] = useState('100');

  // Sample nutrition database (in production, this would come from an API)
  const nutritionDatabase: Record<string, NutritionData> = {
    'apple': {
      food_name: 'Apple',
      calories_per_100g: 52,
      protein_per_100g: 0.3,
      carbs_per_100g: 14,
      fat_per_100g: 0.2,
      sugar_per_100g: 10
    },
    'banana': {
      food_name: 'Banana',
      calories_per_100g: 89,
      protein_per_100g: 1.1,
      carbs_per_100g: 23,
      fat_per_100g: 0.3,
      sugar_per_100g: 12
    },
    'chicken breast': {
      food_name: 'Chicken Breast',
      calories_per_100g: 165,
      protein_per_100g: 31,
      carbs_per_100g: 0,
      fat_per_100g: 3.6,
      sugar_per_100g: 0
    },
    'rice': {
      food_name: 'White Rice',
      calories_per_100g: 130,
      protein_per_100g: 2.7,
      carbs_per_100g: 28,
      fat_per_100g: 0.3,
      sugar_per_100g: 0.1
    },
    'broccoli': {
      food_name: 'Broccoli',
      calories_per_100g: 34,
      protein_per_100g: 2.8,
      carbs_per_100g: 7,
      fat_per_100g: 0.4,
      sugar_per_100g: 1.5
    },
    'salmon': {
      food_name: 'Salmon',
      calories_per_100g: 208,
      protein_per_100g: 25,
      carbs_per_100g: 0,
      fat_per_100g: 12,
      sugar_per_100g: 0
    },
    'egg': {
      food_name: 'Egg',
      calories_per_100g: 155,
      protein_per_100g: 13,
      carbs_per_100g: 1.1,
      fat_per_100g: 11,
      sugar_per_100g: 1.1
    },
    'bread': {
      food_name: 'White Bread',
      calories_per_100g: 265,
      protein_per_100g: 9,
      carbs_per_100g: 49,
      fat_per_100g: 3.2,
      sugar_per_100g: 5
    }
  };

  const searchFood = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const searchKey = searchTerm.toLowerCase();
      const found = nutritionDatabase[searchKey];
      
      if (found) {
        setNutritionData(found);
        toast({
          title: 'Food Found!',
          description: `Nutrition data loaded for ${found.food_name}`
        });
      } else {
        toast({
          title: 'Food Not Found',
          description: 'Try searching for: apple, banana, chicken breast, rice, broccoli, salmon, egg, or bread',
          variant: 'destructive'
        });
        setNutritionData(null);
      }
      setLoading(false);
    }, 1000);
  };

  const addToConsumption = async () => {
    if (!nutritionData || !user) return;

    try {
      const { error } = await supabase
        .from('food_scans')
        .insert({
          user_id: user.id,
          food_name: nutritionData.food_name,
          calories_per_100g: nutritionData.calories_per_100g,
          protein_per_100g: nutritionData.protein_per_100g,
          carbs_per_100g: nutritionData.carbs_per_100g,
          fat_per_100g: nutritionData.fat_per_100g,
          sugar_per_100g: nutritionData.sugar_per_100g,
          portion_size: parseFloat(portionSize),
          consumed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `${nutritionData.food_name} added to your daily intake`
      });

      // Reset form
      setNutritionData(null);
      setSearchTerm('');
      setPortionSize('100');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add food to your intake',
        variant: 'destructive'
      });
    }
  };

  const calculateNutritionForPortion = (valuePerHundred: number) => {
    return Math.round((valuePerHundred * parseFloat(portionSize)) / 100);
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Food Scanner</h1>
          <p className="text-muted-foreground">Search for foods and track your nutrition</p>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Food
            </CardTitle>
            <CardDescription>
              Enter a food name to get nutrition information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Try: apple, banana, chicken breast, rice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchFood()}
                className="flex-1"
              />
              <Button onClick={searchFood} disabled={!searchTerm || loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Results */}
        {nutritionData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                {nutritionData.food_name} - Nutrition Facts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Portion Size */}
                <div>
                  <Label htmlFor="portion">Portion Size (grams)</Label>
                  <Input
                    id="portion"
                    type="number"
                    value={portionSize}
                    onChange={(e) => setPortionSize(e.target.value)}
                    min="1"
                    className="mt-1"
                  />
                </div>

                {/* Nutrition Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {calculateNutritionForPortion(nutritionData.calories_per_100g)}
                    </p>
                    <p className="text-sm text-muted-foreground">Calories</p>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {calculateNutritionForPortion(nutritionData.protein_per_100g)}g
                    </p>
                    <p className="text-sm text-muted-foreground">Protein</p>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {calculateNutritionForPortion(nutritionData.carbs_per_100g)}g
                    </p>
                    <p className="text-sm text-muted-foreground">Carbs</p>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {calculateNutritionForPortion(nutritionData.fat_per_100g)}g
                    </p>
                    <p className="text-sm text-muted-foreground">Fat</p>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {calculateNutritionForPortion(nutritionData.sugar_per_100g)}g
                    </p>
                    <p className="text-sm text-muted-foreground">Sugar</p>
                  </div>
                </div>

                {/* Add to Consumption Button */}
                <Button 
                  onClick={addToConsumption} 
                  className="w-full"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to My Daily Intake
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Foods */}
        <Card>
          <CardHeader>
            <CardTitle>Available Foods</CardTitle>
            <CardDescription>
              Try searching for any of these foods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.keys(nutritionDatabase).map((food) => (
                <Button
                  key={food}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm(food);
                    setNutritionData(nutritionDatabase[food]);
                  }}
                  className="capitalize"
                >
                  {food}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Scanner;