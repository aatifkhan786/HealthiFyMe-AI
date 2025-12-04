import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as Router, Routes, Route } from "react-router-dom";  // ⬅️ FIXED
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/auth";
import Dashboard from "./pages/Dashboard";
import Scanner from "./pages/Scanner";
import NotFound from "./pages/NotFound";
import Blog from '@/components/Blog';
import Exercise from "./pages/exercise";
import AITalk from "./components/AiTalk";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Router>   {/* ⬅️ FIXED */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/aitalk" element={<AITalk />} />
            <Route path="/exercise" element={<Exercise />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>   {/* ⬅️ FIXED */}

      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
