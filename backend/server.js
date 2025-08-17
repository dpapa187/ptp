import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    healthy: true,
    timestamp: new Date().toISOString(),
    services: { functions: "operational", environment: "configured", aiProviders: [] },
    version: "1.0.0",
    deployment: { region: "render", environment: "production" }
  });
});

// Minimal placeholder; replace with your real logic or proxy to OpenAI/Anthropic
app.post("/api/generate", async (req, res) => {
  const { inputValue = "Your Topic", template = "minimalist" } = req.body || {};
  const html = `<!doctype html><html><body><h1>${template} — ${inputValue}</h1><p>Demo content from backend. Wire your AI here.</p></body></html>`;
  res.json({
    success: true,
    title: `${inputValue} — Generated (Demo)`,
    description: "Demo from Render backend",
    content: html,
    wordCount: 800,
    seoScore: 90,
    suggestedImages: 3,
    affiliateOpportunities: 4,
    apiProvider: "demo"
  });
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`API listening on ${port}`));

