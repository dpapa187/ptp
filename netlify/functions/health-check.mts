import type { Context, Config } from "@netlify/functions";

/**
 * Health Check Function
 * 
 * This simple function provides a way for your frontend to verify that
 * the backend services are operational and properly configured. It's like
 * a heartbeat monitor for your application's vital systems.
 * 
 * The health check serves several important purposes:
 * - Confirms that Netlify Functions are working
 * - Verifies environment variables are configured
 * - Provides basic system status information
 * - Enables the frontend to show appropriate status indicators
 */

export default async (req: Request, context: Context) => {
  console.log("🏥 Health check requested at:", new Date().toISOString());

  try {
    // Check if critical environment variables are configured
    const openaiKey = Netlify.env.get('OPENAI_API_KEY');
    const anthropicKey = Netlify.env.get('ANTHROPIC_API_KEY');
    
    // Determine which AI providers are available
    const availableProviders = [];
    if (openaiKey) availableProviders.push('openai');
    if (anthropicKey) availableProviders.push('anthropic');

    // Calculate basic system status
    const status = {
      healthy: true,
      timestamp: new Date().toISOString(),
      services: {
        functions: 'operational',
        environment: 'configured',
        aiProviders: availableProviders
      },
      version: '1.0.0',
      deployment: {
        region: context.deploy?.id ? 'netlify' : 'local',
        environment: openaiKey || anthropicKey ? 'production' : 'development'
      }
    };

    console.log("✅ Health check passed:", {
      providers: availableProviders.length,
      environment: status.deployment.environment
    });

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' // Always get fresh status
      }
    });

  } catch (error) {
    console.error("❌ Health check failed:", error);

    // Return error status but don't expose sensitive details
    const errorStatus = {
      healthy: false,
      timestamp: new Date().toISOString(),
      error: 'System health check failed',
      services: {
        functions: 'error',
        environment: 'unknown'
      }
    };

    return new Response(JSON.stringify(errorStatus), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Configure this function to be accessible at a simple, memorable path
export const config: Config = {
  path: "/api/health"
};