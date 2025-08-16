/**
 * Health Check Function
 *
 * Verifies Netlify Functions + env vars are working.
 * Returns basic status so your UI can show a badge.
 */

export default async (req, context) => {
  try {
    // Basic env var checks (never return actual keys)
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    const availableProviders = [];
    if (openaiKey) availableProviders.push("openai");
    if (anthropicKey) availableProviders.push("anthropic");

    const status = {
      // 👇 add this line so older code that expects `ok` still works
      ok: true,
      healthy: true,
      timestamp: new Date().toISOString(),
      services: {
        functions: "operational",
        environment: "configured",
        aiProviders: availableProviders
      },
      version: "1.0.0",
      deployment: {
        region: context.deploy?.id ? "netlify" : "local",
        environment: openaiKey || anthropicKey ? "production" : "development"
      }
    };

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      healthy: false,
      timestamp: new Date().toISOString(),
      error: "System health check failed",
      services: { functions: "error", environment: "unknown" }
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// Pretty route: /api/health  (also works via /.netlify/functions/health-check)
export const config = { path: "/api/health" };
