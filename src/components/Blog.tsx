import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Rss } from "lucide-react";

// ---------------------- TYPES ----------------------
interface Profile {
  activity_level?: string | null;
  goal?: string | null;
}

interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  image?: string;
}

// ---------------------- HEADER ----------------------
const PageHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-md">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-6 ml-5">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <span className="font-bold text-lg text-gray-900">
              HealthifyMe AI
            </span>
          </Link>
        </div>

        {/* ✅ Navbar (no search bar) */}
        <nav className="flex items-center gap-2 mr-10">
          <Button variant="ghost" asChild>
            <Link to="/scanner">Scanner</Link>
          </Button>
          {user && (
            <Button variant="ghost" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}
          <Button variant="ghost" onClick={signOut}>
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
};

// ---------------------- FOOTER ----------------------
const Footer = () => (
  <footer className="bg-green-600 text-white py-8 mt-12">
    <div className="container mx-auto text-center space-y-2">
      <p className="text-lg font-semibold">HealthifyMe AI</p>
      <p className="text-sm">
        Your daily health and diet companion. Stay fit, stay healthy!
      </p>
      <p className="text-xs">
        &copy; {new Date().getFullYear()} HealthifyMe AI. All rights reserved.
      </p>
      <p className="text-xs pt-2">Made with ❤️ by Mohammad Aatif Khan</p>
    </div>
  </footer>
);

// ---------------------- MAIN PAGE ----------------------
const Blog = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesVisible, setArticlesVisible] = useState(10);

  // Fetch user profile
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("activity_level, goal")
            .eq("user_id", user.id)
            .single();
          if (error) throw error;
          if (data) setProfile(data as Profile);
        } catch (err) {
          console.error("Error fetching profile:", err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  // ✅ Fetch random 30 articles
  const fetchHealthArticles = async (): Promise<Article[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from("health_trends")
        .select("id, title, description, link, image_url");

      if (error) {
        console.error("Error fetching health_trends:", error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Shuffle & pick random 30
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      const random30 = shuffled.slice(0, 30);

      return random30.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        link: item.link,
        image:
          item.image_url ||
          "https://via.placeholder.com/600x400?text=Health+Article",
      }));
    } catch (err) {
      console.error("Error fetching articles:", err);
      return [];
    }
  };

  // Load articles
  useEffect(() => {
    const fetchAllContent = async () => {
      setLoading(true);
      try {
        const supabaseArticles = await fetchHealthArticles();
        setArticles(supabaseArticles);
      } catch (err) {
        console.error("Error fetching content:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllContent();
  }, [profile]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-medium">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 text-black flex flex-col">
      <PageHeader />

      <main className="container mx-auto px-6 py-12 space-y-16 flex-1">
        {/* ✅ ARTICLES SECTION */}
        <section>
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Rss className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-900">
                Health Articles
              </h2>
            </div>
            <p className="text-gray-700 text-center max-w-xl">
              Stay informed with trusted health, fitness, and nutrition content.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            {articles.slice(0, articlesVisible).map((article) => (
              <Card
                key={article.id}
                className="flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-md bg-white h-40 hover:scale-105 hover:shadow-lg hover:border-2 hover:border-green-500 transition-transform"
              >
                {article.image && (
                  <div className="md:w-1/3 h-full overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4 flex flex-col md:w-2/3">
                  <CardTitle className="text-md font-semibold mb-2 line-clamp-2">
                    {article.title}
                  </CardTitle>
                  <p className="text-xs text-gray-700 line-clamp-3 mb-2">
                    {article.description}
                  </p>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-600 font-medium mt-auto hover:underline"
                  >
                    Read more →
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ✅ Load More Button Fix */}
          {articlesVisible < 30 && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={() =>
                  setArticlesVisible((prev) => Math.min(prev + 5, 30))
                }
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Load More Articles
              </Button>
            </div>
          )}

        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
