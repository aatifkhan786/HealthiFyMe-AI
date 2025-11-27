import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Heart, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client'; // ✅ import supabase client

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userCount, setUserCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

  // === Navigate button handler ===
  const handleGetStartedClick = () => {
    if (user) navigate('/dashboard');
    else navigate('/auth');
  };

  // === Load initial count & realtime updates ===
  useEffect(() => {
    const fetchCount = async () => {
      const { data, error } = await (supabase as any)
        .from('site_likes')
        .select('count')
        .eq('id', 1)
        .maybeSingle(); // ✅ safely handle empty table

      if (error) {
        console.error('Error fetching count:', error.message);
      } else if (data) {
        setUserCount(data.count || 0);
      } else {
        // ✅ auto-create row if missing
        const { error: insertError } = await (supabase as any)
          .from('site_likes')
          .insert({ id: 1, count: 0 });
        if (insertError)
          console.error('Auto-create failed:', insertError.message);
        setUserCount(0);
      }
    };

    fetchCount();

    // check if user already liked
    const clicked = localStorage.getItem('hasClicked');
    if (clicked === 'true') setHasClicked(true);

    // === Realtime listener for INSERT, UPDATE, DELETE ===
    const channel = (supabase as any)
      .channel('realtime-likes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_likes' },
        (payload: any) => {
          if (payload.eventType === 'UPDATE' && payload.new?.count !== undefined) {
            setUserCount(payload.new.count);
          } else if (payload.eventType === 'DELETE') {
            console.warn('⚠️ Row deleted — resetting count');
            setUserCount(0);
            // ✅ Recreate automatically
            (supabase as any)
              .from('site_likes')
              .insert({ id: 1, count: 0 })
              .single();
          } else if (payload.eventType === 'INSERT' && payload.new?.count !== undefined) {
            setUserCount(payload.new.count);
          }
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, []);

  // === Handle Like Click ===
  const handleLikeClick = async () => {
    if (hasClicked) return; // prevent multiple clicks

    const newCount = userCount + 1;
    setUserCount(newCount);
    setHasClicked(true);
    setShowPopup(true);
    localStorage.setItem('hasClicked', 'true');

    const { error } = await (supabase as any)
      .from('site_likes')
      .update({ count: newCount })
      .eq('id', 1);

    if (error) console.error('Supabase update error:', error.message);

    setTimeout(() => setShowPopup(false), 1000);
  };

  // === Format number nicely ===
  const formatNumber = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return (
    <section className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Health Management
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Everything you need to
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              manage your health
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your health journey with AI-powered nutrition tracking,
            personalized diet plans, and smart food scanning. Your complete
            wellness companion.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              variant="hero"
              size="lg"
              className="group"
              onClick={handleGetStartedClick}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
            {/* ❤️ Heart Counter */}
            <div
              className="flex items-center gap-2 relative cursor-pointer select-none"
              onClick={handleLikeClick}
            >
              <Heart
                className={`w-4 h-4 transition-all ${
                  hasClicked
                    ? 'text-green-500 fill-green-500 scale-110'
                    : 'text-primary hover:scale-110'
                }`}
              />
              <span className="text-muted-foreground">
                Trusted by {formatNumber(userCount)}+ users
              </span>

              {/* Popup Animation */}
              {showPopup && (
                <div className="absolute -top-5 right-0 animate-bounce text-primary text-xs font-semibold">
                  <Sparkles className="inline w-3 h-3 mr-1" />
                  +1 Joined!
                </div>
              )}
            </div>

            {/* Privacy Label */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                100% Privacy Protected
              </span>
            </div>

            {/* Insights Label */}
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">AI-Powered Insights</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
