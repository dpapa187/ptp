/**
 * Generate Content Function
 *
 * Reads API keys from environment variables and calls the selected provider.
 * Expects a POST JSON body:
 * {
 *   "inputValue": "keto recipes",
 *   "inputType": "keyword",
 *   "selectedNiche": "health",
 *   "apiProvider": "openai" | "anthropic",
 *   "wordCount": 1200,
 *   "includeAffiliate": true,
 *   "seoOptimized": true
 * }
 */

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export default async (req) => {
  // Enforce POST, return JSON (this is the tweak you asked for)
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      inputValue = "",
      inputType = "keyword",
      selectedNiche = "",
      apiProvider = "openai",
      wordCount = 1200,
      includeAffiliate = true,
      seoOptimized = true
    } = body;

    if (!inputValue || String(inputValue).trim().length < 3) {
      return json({ success: false, error: "Invalid input" }, 400);
    }

    const prompt = `
You are a conversion-focused copywriter. Create a ${wordCount}-word landing page about:
Topic/Seed: "${inputValue}"
Type: ${inputType}
Niche: ${selectedNiche || "general"}
Must be ${seoOptimized ? "SEO-optimized" : "plain"} and include ${includeAffiliate ? "affiliate callouts where relevant" : "no affiliate mentions"}.
Return compelling title + meta description + full body copy.
    `.trim();

    let usedProvider = apiProvider;
    let title = "";
    let description = "";
    let content = "";

    if (apiProvider === "openai") {
      const key = process.env.OPENAI_API_KEY;
      if (!key) return json({ success: false, error: "Missing OPENAI_API_KEY" }, 500);

      const resp = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You write high-converting landing pages with clear structure." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!resp.ok) {
        const errTxt = await resp.text();
        return json({ success: false, error: errTxt || "OpenAI error" }, resp.status);
      }

      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content || "";
      ({ title, description, content } = sliceContent(text));

    } else if (apiProvider === "anthropic") {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return json({ success: false, error: "Missing ANTHROPIC_API_KEY" }, 500);

      const resp = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!resp.ok) {
        const errTxt = await resp.text();
        return json({ success: false, error: errTxt || "Anthropic error" }, resp.status);
      }

      const data = await resp.json();
      const text = data?.content?.[0]?.text || "";
      ({ title, description, content } = sliceContent(text));

    } else {
      usedProvider = "openai";
      return json({ success: false, error: "Unknown provider" }, 400);
    }

    // Simple metrics so your UI has numbers
    const wc = Math.max(800, Math.min(wordCount, content.split(/\s+/).length));
    const seoScore = 90;
    const images = 6;
    const affiliate = 5;

    return json({
      success: true,
      apiProvider: usedProvider,
      title,
      description,
      content,
      wordCount: wc,
      seoScore,
      suggestedImages: images,
      affiliateOpportunities: affiliate
    });

  } catch (err) {
    return json({ success: false, error: String(err) }, 500);
  }
};

// Pretty route: /api/generate  (also works via /.netlify/functions/generate-content)
export const config = { path: "/api/generate" };

/* ---------------- helpers ---------------- */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

function sliceContent(text) {
  const lines = String(text).split("\n");
  const first = lines.find(l => l.trim().length > 0) || "AI Landing Page";
  const cleanTitle = first.replace(/^#\s*/, "").trim();
  const desc = "AI-generated landing page content";
  return { title: cleanTitle, description: desc, content: text };
}
