import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Activity, User, Heart, Target, Zap } from 'lucide-react';

// Gemini AI Library
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Gemini AI Setup ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("Missing Gemini API Key in .env file");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
// -----------------------

interface Profile {
  user_id: string; // Corrected from 'id'
  name: string;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  blood_group?: string | null;
  health_conditions?: string[] | null;
  daily_calorie_target?: number | null;
  daily_protein_target?: number | null;
  ideal_body_weight?: number | null;
}

interface FoodScan {
  user_id: string;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  consumed_at: string;
  portion_size: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [foodScans, setFoodScans] = useState<FoodScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New state for AI loading
  const [formData, setFormData] = useState({
    name: '', age: '', height: '', weight: '', blood_group: '', health_conditions: [] as string[]
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTodaysFoodScans();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).single<Profile>();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setProfile(data);
        setFormData({ name: data.name || '', age: data.age?.toString() || '', height: data.height?.toString() || '', weight: data.weight?.toString() || '', blood_group: data.blood_group || '', health_conditions: data.health_conditions || [] });
      } else {
        setFormData(prev => ({ ...prev, name: user?.user_metadata?.name || '' }));
      }
    } catch (error) { console.error('Error fetching profile:', error); } finally { setLoading(false); }
  };

  const fetchTodaysFoodScans = async () => {
    if (!user) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('food_scans').select('*').eq('user_id', user.id).gte('consumed_at', `${today} 00:00:00`).lt('consumed_at', `${today} 23:59:59`).returns<FoodScan[]>();
      if (error) throw error;
      setFoodScans(data || []);
    } catch (error) { console.error('Error fetching food scans:', error); }
  };

  // *** YAHAN BADA BADLAV HAI: Gemini Integration ***
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const age = formData.age ? parseInt(formData.age) : null;
      const height = formData.height ? parseFloat(formData.height) : null;
      const weight = formData.weight ? parseFloat(formData.weight) : null;

      let targets = {};
      if (age && height && weight) {
        toast({ title: 'AI is thinking...', description: 'Generating personalized health targets.' });
        const prompt = `Based on user data - Age: ${age}, Height: ${height}cm, Weight: ${weight}kg, Health Conditions: ${formData.health_conditions?.join(', ') || 'None'}. Calculate ideal_body_weight, daily_calorie_target, and daily_protein_target. Respond ONLY in a valid JSON format with no extra text or markdown formatting. Example: {"ideal_body_weight": 68, "daily_calorie_target": 2200, "daily_protein_target": 80}.`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const aiResponse = JSON.parse(responseText.replace(/```json|```/g, '').trim());
        targets = aiResponse;
      }

      const profileData: Profile = {
        user_id: user.id, name: formData.name, age, height, weight,
        blood_group: formData.blood_group || null,
        health_conditions: formData.health_conditions.length > 0 ? formData.health_conditions : null,
        ...targets
      };

      const { error } = await supabase.from('profiles').upsert(profileData, { onConflict: 'user_id' });
      if (error) throw error;

      toast({ title: 'Success', description: 'Profile updated with AI-powered targets!' });
      setEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to get AI response or update profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const todaysCalories = foodScans.reduce((total, scan) => total + ((scan.calories_per_100g || 0) * (scan.portion_size || 100) / 100), 0);
  const todaysProtein = foodScans.reduce((total, scan) => total + ((scan.protein_per_100g || 0) * (scan.portion_size || 100) / 100), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Track your health journey</p>
          </div>
          <Button onClick={() => setEditing(!editing)} variant={editing ? "outline" : "default"}>
            {editing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Profile Information</CardTitle>
              <CardDescription>Your health profile and targets</CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}/></div>
                    <div><Label htmlFor="age">Age</Label><Input id="age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}/></div>
                    <div><Label htmlFor="height">Height (cm)</Label><Input id="height" type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })}/></div>
                    <div><Label htmlFor="weight">Weight (kg)</Label><Input id="weight" type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })}/></div>
                    <div>
                      <Label htmlFor="blood_group">Blood Group</Label>
                      <Select value={formData.blood_group} onValueChange={(value) => setFormData({ ...formData, blood_group: value })}>
                        <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem><SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem><SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} className="w-full" disabled={isSaving}>
                    {isSaving ? 'AI is working...' : 'Save Profile with AI'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{profile.name}</p></div>
                      {profile.age && <div><p className="text-sm text-muted-foreground">Age</p><p className="font-medium">{profile.age} years</p></div>}
                      {profile.height && <div><p className="text-sm text-muted-foreground">Height</p><p className="font-medium">{profile.height} cm</p></div>}
                      {profile.weight && <div><p className="text-sm text-muted-foreground">Weight</p><p className="font-medium">{profile.weight} kg</p></div>}
                      {profile.blood_group && <div><p className="text-sm text-muted-foreground">Blood Group</p><p className="font-medium">{profile.blood_group}</p></div>}
                      {profile.ideal_body_weight && <div><p className="text-sm text-muted-foreground">Ideal Weight (AI)</p><p className="font-medium">{profile.ideal_body_weight} kg</p></div>}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No profile data available. Click 'Edit Profile' to add your information.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5" /> Today's Calories</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Consumed</span><span className="font-bold">{Math.round(todaysCalories)}</span></div>
                  <div className="flex justify-between"><span>Target</span><span className="font-bold">{profile?.daily_calorie_target || 'Not set'}</span></div>
                  {profile?.daily_calorie_target && <Progress value={profile.daily_calorie_target > 0 ? Math.min((todaysCalories / profile.daily_calorie_target) * 100, 100) : 0} className="mt-2"/>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /> Today's Protein</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Consumed</span><span className="font-bold">{Math.round(todaysProtein)}g</span></div>
                  <div className="flex justify-between"><span>Target</span><span className="font-bold">{profile?.daily_protein_target ? `${profile.daily_protein_target}g` : 'Not set'}</span></div>
                  {profile?.daily_protein_target && <Progress value={profile.daily_protein_target > 0 ? Math.min((todaysProtein / profile.daily_protein_target) * 100, 100) : 0} className="mt-2"/>}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="lg:col-span-3">
            <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Today's Food Intake</CardTitle><CardDescription>Foods you've scanned and consumed today</CardDescription></CardHeader>
            <CardContent>
              {foodScans.length > 0 ? (
                <div className="space-y-3">
                  {foodScans.map((scan, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div><p className="font-medium">{scan.food_name}</p><p className="text-sm text-muted-foreground">{scan.portion_size}g portion</p></div>
                      <div className="text-right">
                        <p className="font-medium">{Math.round((scan.calories_per_100g || 0) * (scan.portion_size || 100) / 100)} cal</p>
                        <p className="text-sm text-muted-foreground">{Math.round((scan.protein_per_100g || 0) * (scan.portion_size || 100) / 100)}g protein</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No food scanned today. Use the scanner to track your nutrition!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;