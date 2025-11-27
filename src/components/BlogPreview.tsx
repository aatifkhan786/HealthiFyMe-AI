import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rss } from "lucide-react";

interface Article {
  id: string;
  title: string;
  description: string;
  link: string;
  image?: string;
}

const BlogPreview = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch 3 random articles from health_trends (using Blog.tsx logic)
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

      // Shuffle & pick random 3
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      const random3 = shuffled.slice(0, 3);

      return random3.map((item: any) => ({
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

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const fetched = await fetchHealthArticles();
        setArticles(fetched);
      } catch (err) {
        console.error("Error fetching preview:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="text-center py-10 text-gray-600">
        Loading latest articles...
      </div>
    );

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-6 text-center">
        {/* ---- Header ---- */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Rss className="w-8 h-8 text-green-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              Latest Health Articles
            </h2>
          </div>
          <p className="text-gray-700 max-w-xl">
            Stay informed with trusted health, fitness, and nutrition updates.
          </p>
        </div>

        {/* ---- 3 Articles ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="overflow-hidden rounded-2xl shadow-md bg-white hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
            >
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  className="h-48 w-full object-cover"
                />
              )}
              <CardContent className="p-5 text-left">
                <CardTitle className="text-md font-semibold mb-2 line-clamp-2 text-gray-900">
                  {article.title}
                </CardTitle>
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {article.description}
                </p>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-600 font-medium text-sm hover:underline"
                >
                  Read more →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ---- View All ---- */}
        <div className="mt-10">
          <Button
            asChild
            className="bg-green-600 text-white hover:bg-green-700 px-6 py-2 rounded-lg shadow-md"
          >
            <Link to="/blog">View All Articles</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
