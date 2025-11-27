import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/auth";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import NotFound from "./pages/NotFound";
// === Your existing imports ===
import Blog from '@/components/Blog';
import Exercise from "./pages/exercise";
// === The import for the AI Talk page ===
// Make sure your file is named 'AiTalk.tsx' inside 'src/components/'
import AITalk from "./components/AiTalk";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
            
            {/* === Your existing Blog route === */}
            <Route path="/blog" element={<Blog />} />

            {/* === CHANGE THIS LINE: Removed the dash from the path === */}
            <Route path="/aitalk" element={<AITalk />} />
            <Route path="/exercise" element={<Exercise />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;