import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

// simple health check
app.get("/api/health", (req, res) => {
  res.json({ healthy: true });
});

// generation endpoint (stub for now)
app.post("/api/generate", async (req, res) => {
  try {
    // eventually call OpenAI/Anthropic here with req.body
    res.json({
      success: true,
      content: `<h1>Generated Landing Page</h1><p>This came from your backend API.</p>`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
