import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------------- CONFIG ---------------------------
const LIFESTYLE_FEEDS = [
  "https://www.health.harvard.edu/rss/feed",
  "https://www.medicalnewstoday.com/rss/nutrition",
  "https://www.webmd.com/rss/food-nutrition.xml",
  "https://www.menshealth.com/fitness/rss/",
  "https://www.womenshealthmag.com/fitness/rss/",
  "https://www.yogajournal.com/feed/",
  "https://www.mindbodygreen.com/rss/feed",
  "https://www.healthline.com/rss/beauty.xml",
  "https://www.shape.com/rss/beauty",
  "https://www.medicalnewstoday.com/rss/general-health",
  "https://www.self.com/feeds/latest.xml",
  "https://www.health.com/feed",
  "https://www.everydayhealth.com/rss.xml",
  "https://www.eatingwell.com/rss/all/",
  "https://www.runnersworld.com/rss/all.xml",
  "https://www.who.int/feeds/entity/emergencies/en/rss.xml", // WHO emergency disease updates
  "https://www.nature.com/subjects/infectious-diseases/rss.xml", // verified scientific journal
  "https://www.news-medical.net/rss/Infectious-Disease.xml", // verified medical source
  "https://www.health.gov.au/news/rss", // Australian health alerts
  "https://www.livestrong.com/rss/",
  "https://www.wellandgood.com/feed/",
  "https://www.byrdie.com/rss",
  "https://www.womensrunning.com/feed/"
];

const DISEASE_FEEDS = [
  "https://www.medicalnewstoday.com/rss/infectious-diseases",
  "https://www.cdc.gov/feeds/rss/infectiousdiseases.xml",
  "https://www.who.int/feeds/entity/emergencies/en/rss.xml",
  "https://www.news-medical.net/rss/Infectious-Disease.xml"
];

const VALID_CATEGORIES = [
  "Nutrition",
  "Fitness",
  "Yoga",
  "Mental Health",
  "Beauty & Skin Care",
  "General Wellness",
  "Healthy Living",
  "Disease & Prevention"
];

const MAX_ARTICLES = 30;
const MAX_DISEASE_ARTICLES = 3;
const GEMINI_MODEL = "gemini-2.5-pro";

// --------------------------- RSS PARSER ---------------------------
function parseRss(rssText: string) {
  const items: any[] = [];
  const itemRegex = /<(item|entry)>([\s\S]*?)<\/(item|entry)>/g;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(rssText)) !== null) {
    const content = itemMatch[2];
    const title = /<title>([\s\S]*?)<\/title>/.exec(content)?.[1]
      ?.replace("<![CDATA[", "")
      ?.replace("]]>", "")
      ?.trim();
    const link =
      /<link>([\s\S]*?)<\/link>/.exec(content)?.[1]?.trim() ||
      /<guid>([\s\S]*?)<\/guid>/.exec(content)?.[1]?.trim() ||
      /<id>([\s\S]*?)<\/id>/.exec(content)?.[1]?.trim();
    const desc = /<description>([\s\S]*?)<\/description>/.exec(content)?.[1]
      ?.replace(/<[^>]*>?/gm, "")
      ?.replace("<![CDATA[", "")
      ?.replace("]]>", "")
      ?.trim();

    const image =
      /<media:content.*?url="([^"]+)"/.exec(content)?.[1] ||
      /<enclosure.*?url="([^"]+)"/.exec(content)?.[1] ||
      /<img.*?src="([^"]+)"/.exec(content)?.[1] ||
      null;

    if (title && link && desc) {
      items.push({
        title,
        link,
        description: desc,
        image_url: image
      });
    }
  }
  return items;
}

// --------------------------- MAIN FUNCTION ---------------------------
serve(async (req) => {
  const url = new URL(req.url);
  const providedKey = url.searchParams.get("secret");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!cronSecret || providedKey !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401
    });
  }

  console.log("🚀 Fetching health + disease feeds...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseKey || !geminiKey)
      throw new Error("Missing environment variables.");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;

    // --------------------------- FETCH LIFESTYLE ---------------------------
    let lifestyleArticles: any[] = [];
    for (const feed of LIFESTYLE_FEEDS) {
      try {
        const res = await fetch(feed, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) continue;
        const text = await res.text();
        lifestyleArticles.push(...parseRss(text));
      } catch (err) {
        console.error(`❌ ${feed} error:`, err.message);
      }
    }

    // --------------------------- FETCH DISEASE ---------------------------
    let diseaseArticles: any[] = [];
    for (const feed of DISEASE_FEEDS) {
      try {
        const res = await fetch(feed, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) continue;
        const text = await res.text();
        diseaseArticles.push(...parseRss(text));
      } catch (err) {
        console.error(`❌ Disease feed error:`, err.message);
      }
    }

    // --------------------------- FILTER POSSIBLE DISEASE ARTICLES ---------------------------
    diseaseArticles = diseaseArticles.filter((a) =>
      /(covid|corona|dengue|virus|flu|infection|outbreak|malaria|nipah|ebola|zika|avian flu|respiratory|disease|public\s+health|illness|fever|epidemic|pandemic|WHO|CDC|vaccine|variant|health\s+alert|health\s+emergency)/i
        .test((a.title + " " + a.description))
    );

    // --------------------------- GEMINI VERIFY REAL DISEASE NEWS ---------------------------
    if (diseaseArticles.length > 0) {
      const verifyPrompt = `
You are a medical news verifier. 
For each title below, return true if it reports a real ongoing disease, outbreak, infection, or health emergency currently affecting people, based on the title content. 
Return JSON: [{"title":"...","is_real":true/false}]

Titles:
${diseaseArticles.map((a, i) => `${i + 1}. ${a.title}`).join("\n")}
`;

      try {
        const verifyRes = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: verifyPrompt }] }] })
        });

        const verifyData = await verifyRes.json();
        const verifyText = verifyData?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        const verified = JSON.parse(verifyText.replace(/```json|```/g, "").trim());
        const validTitles = verified.filter((p: any) => p.is_real).map((p: any) => p.title);
        diseaseArticles = diseaseArticles.filter((a) => validTitles.includes(a.title));
      } catch (err) {
        console.error("⚠️ Gemini verification failed:", err.message);
      }
    }

    // Ensure max 3 verified disease-related
    diseaseArticles = diseaseArticles.sort(() => 0.5 - Math.random()).slice(0, MAX_DISEASE_ARTICLES);

    console.log(`🧬 Verified ${diseaseArticles.length} real disease-related articles.`);

    // --------------------------- COMBINE & CLEAN ---------------------------
    let allArticles = [...lifestyleArticles, ...diseaseArticles];
    allArticles = Array.from(new Map(allArticles.map((a) => [a.link, a])).values());
    allArticles = allArticles.sort(() => 0.5 - Math.random());

    // Guarantee 30 total
    if (allArticles.length < MAX_ARTICLES) {
      console.warn(`⚠️ Only ${allArticles.length} found — duplicating to reach ${MAX_ARTICLES}.`);
      allArticles = [...allArticles, ...allArticles].slice(0, MAX_ARTICLES);
    } else {
      allArticles = allArticles.slice(0, MAX_ARTICLES);
    }

    console.log(`📦 Total articles prepared: ${allArticles.length}`);

    // --------------------------- GEMINI SUMMARIES ---------------------------
    const prompt = `
You are a health journalist AI. For each article, write a 2-line short summary and pick a category from:
${VALID_CATEGORIES.join(", ")}.
Return JSON: [{"title":"...","category":"...","summary":"..."}]

Articles:
${allArticles.map((a, i) => `${i + 1}. ${a.title} - ${a.description}`).join("\n")}
`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    let resultMap: Record<string, any> = {};
    if (geminiRes.ok) {
      const data = await geminiRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        parsed.forEach((p: any) => {
          resultMap[p.title] = { category: p.category, summary: p.summary };
        });
      } catch (err) {
        console.error("⚠️ Gemini parse error:", err.message);
      }
    }

    // --------------------------- PREPARE INSERT ---------------------------
    const toInsert = allArticles.map((a) => ({
      ...a,
      category: resultMap[a.title]?.category || "General Wellness",
      short_summary:
        resultMap[a.title]?.summary ||
        "Stay updated with the latest in health and wellness.",
      is_published: true
    }));

    // --------------------------- CLEAN OLD DATA ---------------------------
    const { data: existing } = await supabase
      .from("health_trends")
      .select("id, inserted_at")
      .order("inserted_at", { ascending: true });

    if (existing && existing.length > 60) {
      const deleteIds = existing.slice(0, existing.length - 60).map((x) => x.id);
      await supabase.from("health_trends").delete().in("id", deleteIds);
      console.log(`🗑 Deleted ${deleteIds.length} old articles.`);
    }

    // --------------------------- UPSERT ---------------------------
    const { error } = await supabase.from("health_trends").upsert(toInsert, {
      onConflict: "link"
    });

    if (error) throw error;

    console.log(`✅ Successfully inserted ${toInsert.length} fresh articles.`);
    return new Response(
      JSON.stringify({
        message: `Scraping complete. ${toInsert.length} new articles (incl. ${diseaseArticles.length} verified disease-related).`
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("💥 Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
