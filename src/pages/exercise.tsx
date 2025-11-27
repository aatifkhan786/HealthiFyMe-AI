import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';

// Icons (LayoutDashboard add kiya hai Dashboard icon ke liye)
import { 
  Dumbbell, Clock, RotateCw, Activity, AlertTriangle, 
   Bot, Layers,  ScanLine, 
  BookOpen, ChevronRight, Search, X, LayoutDashboard, Filter 
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';

// --- Environment Setup ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// --- Header Component (Updated Navbar) ---
const PageHeader = () => (
  <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
    <div className="container flex h-16 max-w-screen-2xl items-center px-6">
      <div className="mr-auto flex items-center space-x-2">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg tracking-tight text-white">
            HealthifyMe <span className="text-emerald-500">Pro</span>
          </span>
        </Link>
      </div>
      
      {/* --- NEW NAVBAR LINKS --- */}
      <nav className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
          <Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard</Link>
        </Button>
        
        {/* SCANNER ADDED HERE */}
        <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-all">
          <Link to="/scanner"><ScanLine className="w-4 h-4 mr-2" /> Scanner</Link>
        </Button>

        <Button variant="ghost" size="sm" asChild className="text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
          <Link to="/blog"><BookOpen className="w-4 h-4 mr-2" /> Blog</Link>
        </Button>
      </nav>
    </div>
  </header>
);

const Exercise = () => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All'); // New Filter
  const [searchQuery, setSearchQuery] = useState('');
  
  const [aiLoading, setAiLoading] = useState<number | null>(null);

  // Modals State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalContent, setAiModalContent] = useState('');
  const [currentExerciseTitle, setCurrentExerciseTitle] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const { data, error } = await supabase.from('exercises' as any).select('*');
        if (error) throw error;
        setExercises(data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({ title: "Error", description: "Could not load exercises.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [toast]);

  // --- 2. AI Function ---
  const askAI = async (exerciseTitle: string, cardId: number) => {
    if (!genAI) {
      toast({ title: "Error", description: "AI Key missing.", variant: "destructive" });
      return;
    }
    setAiLoading(cardId);
    const userQuestion = prompt(`Ask regarding ${exerciseTitle}:`, "Is this safe for lower back pain?");
    if (!userQuestion) { setAiLoading(null); return; }

    const promptText = `
      You are an expert Gym Trainer on HealthifyMe Pro. 
      The user is asking about: "${exerciseTitle}".
      User's Question: "${userQuestion}"
      
      INSTRUCTIONS:
      1. Reply in Hinglish (Casual, Gym Bro style).
      2. Use English for technical terms.
      3. Provide a detailed answer (150-200 words).
      4. Include a Pro Tip.
    `;

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { maxOutputTokens: 60000 }
      });
      const result = await model.generateContent(promptText);
      setAiModalContent(result.response.text());
      setCurrentExerciseTitle(exerciseTitle);
      setAiModalOpen(true);
    } catch (err) {
      toast({ title: "AI Error", description: "Connection failed.", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  // --- Filter Logic (Search + Category + Difficulty) ---
  const categories = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Abs'];
  
  const filteredData = exercises.filter((ex: any) => {
    const query = searchQuery.toLowerCase().trim();
    
    // 1. Category Match
    const matchesCategory = categoryFilter === 'All' || ex.category === categoryFilter;
    
    // 2. Difficulty Match (New)
    const matchesDifficulty = difficultyFilter === 'All' || ex.difficulty === difficultyFilter;

    // 3. Search Match
    const matchesSearch = !query || (
      ex.title.toLowerCase().includes(query) ||
      ex.category.toLowerCase().includes(query) ||
      ex.muscles?.some((m: any) => m.name.toLowerCase().includes(query)) ||
      ex.alternatives?.toLowerCase().includes(query)
    );

    return matchesCategory && matchesSearch && matchesDifficulty;
  });

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      <p className="text-emerald-500 font-bold mt-4 animate-pulse">Loading Gym Assets...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-emerald-500/30">
      <PageHeader />

      {/* --- AI MODAL --- */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-zinc-800 bg-zinc-900 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><Bot className="text-emerald-500 w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Trainer Advice</h3>
                  <p className="text-xs text-zinc-400">{currentExerciseTitle}</p>
                </div>
              </div>
              <button onClick={() => setAiModalOpen(false)}><X size={24} className="text-zinc-400 hover:text-white" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar text-zinc-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap">
              {aiModalContent.split('**').map((part, i) => i % 2 === 1 ? <span key={i} className="text-emerald-400 font-bold">{part}</span> : part)}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 rounded-b-2xl flex justify-end">
              <button onClick={() => setAiModalOpen(false)} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-lg">Got it!</button>
            </div>
          </div>
        </div>
      )}

      {/* --- IMAGE ZOOM MODAL --- */}
      {selectedImage && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl overflow-y-auto h-full w-full flex justify-center items-center" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="fixed top-6 right-6 bg-zinc-800 text-white p-2 rounded-full hover:bg-red-600 transition-all z-[160] shadow-lg border border-zinc-600"><X size={24} /></button>
          <div className="relative w-full max-w-3xl px-4 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Exercise" className="w-full h-auto rounded-xl shadow-2xl border border-zinc-700" />
            <p className="text-center text-zinc-500 mt-3 text-xs">Scroll or Click outside to close</p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        
        <div className="text-center mb-10 space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-white">
            MASTER YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">PHYSIQUE</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Select a muscle group to view scientific breakdown, correct forms, and AI-powered advice.
          </p>
        </div>

        {/* --- SEARCH & FILTER SECTION --- */}
        <div className="max-w-3xl mx-auto mb-12 flex flex-col md:flex-row gap-4">
          
          {/* Search Bar (Bada Wala) */}
          <div className="relative flex-grow group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500" size={20} />
            <input 
              type="text" 
              placeholder="Search exercises (e.g. 'Plank')..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Difficulty Filter Dropdown (Search ke bagal mein) */}
          <div className="relative min-w-[180px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <select 
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 text-white rounded-xl outline-none focus:border-emerald-500 appearance-none cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Hard">Hard</option>
            </select>
            {/* Custom Arrow Icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="text-zinc-500 rotate-90" size={16} />
            </div>
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 border ${categoryFilter === cat ? 'bg-emerald-500 text-black border-emerald-500 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredData.length === 0 ? (
            <div className="col-span-full text-center py-20 text-zinc-500 flex flex-col items-center">
               <Dumbbell className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-lg">No exercises found.</p>
               <p className="text-sm text-zinc-600">Try changing the difficulty filter or search term.</p>
            </div>
          ) : (
            filteredData.map((ex: any) => (
              <div key={ex.id} className="group relative bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 flex flex-col h-full">
                
                {/* Image */}
                <div className="relative h-64 overflow-hidden bg-black cursor-zoom-in group/img" onClick={() => setSelectedImage(ex.image_url)}>
                  <img 
                    src={ex.image_url} alt={ex.title}
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"; }} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur border-l-4 border-emerald-500 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-r-md uppercase tracking-wider shadow-lg">
                    {ex.difficulty || 'Intermediate'}
                  </div>
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-zinc-900 via-zinc-900/90 to-transparent p-5 pt-12">
                    <h2 className="text-2xl font-bold text-white leading-tight mb-1">{ex.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Activity size={14} className="text-emerald-500" />
                      Target: <span className="text-emerald-300 font-medium uppercase">{ex.muscles?.[0]?.name}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 flex-grow flex flex-col">
                  <div className="grid grid-cols-3 gap-px bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-800">
                    <div className="bg-zinc-900/50 p-3 text-center"><Layers size={18} className="mx-auto text-emerald-500 mb-1" /><span className="block text-lg font-bold text-white">{ex.stats?.sets || '3'}</span><span className="text-[10px] uppercase text-zinc-500 font-bold">Sets</span></div>
                    <div className="bg-zinc-900/50 p-3 text-center"><RotateCw size={18} className="mx-auto text-emerald-500 mb-1" /><span className="block text-lg font-bold text-white">{ex.stats?.reps || '12'}</span><span className="text-[10px] uppercase text-zinc-500 font-bold">Reps</span></div>
                    <div className="bg-zinc-900/50 p-3 text-center"><Clock size={18} className="mx-auto text-emerald-500 mb-1" /><span className="block text-lg font-bold text-white">{ex.stats?.rest || '60s'}</span><span className="text-[10px] uppercase text-zinc-500 font-bold">Rest</span></div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest"><Activity size={12} /> Muscle Activation</div>
                    {ex.muscles?.map((m: any, idx: number) => (
                      <div key={idx} className="group/bar">
                        <div className="flex justify-between text-xs mb-1.5"><span className="text-zinc-300 font-medium">{m.name}</span><span className="font-mono text-emerald-500/80">{m.percent}</span></div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${m.type === 'primary' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-blue-500/80'}`} style={{ width: m.percent }}></div></div>
                      </div>
                    ))}
                  </div>

                  {ex.mistakes && ex.mistakes.length > 0 && (
                    <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-3 text-red-400 font-bold text-xs uppercase tracking-wide"><AlertTriangle size={14} /> Avoid These Mistakes</div>
                      <ul className="space-y-2">{ex.mistakes.map((mistake: string, i: number) => (<li key={i} className="text-xs text-zinc-400 flex items-start gap-2"><span className="text-red-500 shrink-0 mt-0.5">•</span> <span>{mistake}</span></li>))}</ul>
                    </div>
                  )}

                  <div className="mt-auto pt-6 space-y-3">
                    {ex.alternatives && <div className="text-xs text-zinc-500 flex items-center gap-2 pb-2"><ChevronRight size={12} /><span className="text-zinc-400 font-bold">Alt:</span> {ex.alternatives}</div>}
                    <button onClick={() => askAI(ex.title, ex.id)} disabled={aiLoading === ex.id} className="w-full relative overflow-hidden flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group/btn">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 blur-md"></div>
                      {aiLoading === ex.id ? <RotateCw size={18} className="animate-spin" /> : <Bot size={18} className="group-hover/btn:rotate-12 transition-transform" />}
                      <span className="relative">{aiLoading === ex.id ? "Analyzing..." : "Ask AI Trainer"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Exercise;