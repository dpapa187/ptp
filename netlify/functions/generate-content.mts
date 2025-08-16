import type { Context, Config } from "@netlify/functions";

/**
 * AI Content Generation Function
 * 
 * This serverless function acts as a secure bridge between your frontend interface
 * and AI services like OpenAI and Anthropic. It keeps your API keys safe on the 
 * server side while providing powerful content generation capabilities to your users.
 * 
 * Key responsibilities:
 * - Validate and sanitize user input
 * - Securely manage API keys using environment variables
 * - Communicate with AI services (OpenAI GPT-4, Anthropic Claude)
 * - Process and format AI responses for the frontend
 * - Handle errors gracefully with helpful messages
 */

export default async (req: Request, context: Context) => {
  console.log("🚀 Content generation request received at:", new Date().toISOString());

  // Security: Only allow POST requests to prevent accidental GET requests
  // that might expose sensitive data in server logs
  if (req.method !== 'POST') {
    console.log("❌ Rejected non-POST request:", req.method);
    return new Response(JSON.stringify({ 
      error: 'Method not allowed. Please use POST requests for content generation.' 
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse and validate the incoming request from your frontend
    const requestData = await req.json();
    const { inputValue, inputType, selectedNiche, apiProvider } = requestData;

    console.log("📝 Processing request:", {
      inputType,
      inputLength: inputValue?.length || 0,
      selectedNiche,
      apiProvider,
      timestamp: new Date().toISOString()
    });

    // Input validation - ensure we have meaningful content to work with
    if (!inputValue || typeof inputValue !== 'string') {
      return new Response(JSON.stringify({
        error: 'Missing or invalid input content. Please provide text to generate content from.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (inputValue.trim().length < 3) {
      return new Response(JSON.stringify({
        error: 'Input content too short. Please provide at least 3 characters for meaningful content generation.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (inputValue.trim().length > 2000) {
      return new Response(JSON.stringify({
        error: 'Input content too long. Please limit your input to 2000 characters or less.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Retrieve API keys from secure environment variables
    // These are set in your Netlify dashboard and never exposed to the frontend
    const openaiKey = Netlify.env.get('OPENAI_API_KEY');
    const anthropicKey = Netlify.env.get('ANTHROPIC_API_KEY');

    console.log("🔐 API Key status:", {
      hasOpenAI: !!openaiKey,
      hasAnthropic: !!anthropicKey,
      requestedProvider: apiProvider
    });

    // Validate that we have the required API key for the selected provider
    if (apiProvider === 'openai' && !openaiKey) {
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your Netlify environment variables.',
        helpUrl: 'https://docs.netlify.com/environment-variables/overview/'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (apiProvider === 'anthropic' && !anthropicKey) {
      return new Response(JSON.stringify({
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your Netlify environment variables.',
        helpUrl: 'https://docs.netlify.com/environment-variables/overview/'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate sophisticated prompts designed to create engaging, natural content
    const systemPrompt = createSystemPrompt(selectedNiche);
    const userPrompt = createUserPrompt(inputValue, inputType, selectedNiche);

    console.log("🎯 Generated prompts for", apiProvider, "- System prompt length:", systemPrompt.length);

    let generatedContent: string;
    let usage: any;

    // Route to the appropriate AI service based on user selection
    const startTime = Date.now();
    
    if (apiProvider === 'openai') {
      const result = await callOpenAI(openaiKey, systemPrompt, userPrompt);
      generatedContent = result.content;
      usage = result.usage;
    } else if (apiProvider === 'anthropic') {
      const result = await callAnthropic(anthropicKey, systemPrompt, userPrompt);
      generatedContent = result.content;
      usage = result.usage;
    } else {
      throw new Error(`Unsupported AI provider: ${apiProvider}. Supported providers are 'openai' and 'anthropic'.`);
    }

    const generationTime = Date.now() - startTime;
    console.log(`✅ Content generated successfully in ${generationTime}ms using ${apiProvider}`);

    // Process the AI response into the format our frontend expects
    const processedContent = processAIResponse(generatedContent, inputValue);

    console.log("📊 Content processing complete:", {
      wordCount: processedContent.wordCount,
      seoScore: processedContent.seoScore,
      affiliateOpportunities: processedContent.affiliateOpportunities,
      generationTimeMs: generationTime
    });

    // Return the processed content to the frontend
    return new Response(JSON.stringify({
      success: true,
      content: processedContent.content,
      title: processedContent.title,
      description: processedContent.description,
      seoScore: processedContent.seoScore,
      suggestedImages: processedContent.suggestedImages,
      affiliateOpportunities: processedContent.affiliateOpportunities,
      apiProvider: apiProvider,
      wordCount: processedContent.wordCount,
      generationTimeMs: generationTime,
      usage: usage // Include usage stats for monitoring
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in content generation:', error);
    
    // Provide helpful error messages without exposing internal details
    let errorMessage = 'Failed to generate content. ';
    let statusCode = 500;

    if (error.message?.includes('API key')) {
      errorMessage += 'API key configuration issue. Please check your environment variables.';
    } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      errorMessage += 'API rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message?.includes('timeout')) {
      errorMessage += 'Request timed out. Please try again with a shorter input.';
      statusCode = 408;
    } else {
      errorMessage += 'Please try again or contact support if the problem persists.';
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      errorCode: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Creates a sophisticated system prompt designed to generate natural,
 * engaging landing page content that doesn't sound AI-generated
 */
function createSystemPrompt(niche?: string): string {
  return `You are an expert copywriter and content strategist who specializes in creating high-converting landing pages. Your writing style is natural, engaging, and authentically human - never robotic or obviously AI-generated.

Core principles for your content:
- Write in first person as if sharing a personal journey or discovery
- Include specific, relatable examples and real-world scenarios  
- Use conversational language with smooth, natural transitions
- Create compelling headlines that immediately grab attention
- Integrate keywords naturally throughout the content flow
- Structure content for maximum readability and user engagement
- Include clear, persuasive calls-to-action that feel organic to the flow
- Write approximately 2500-3500 words of valuable, substantive content
- Focus on benefits and transformation rather than just listing features
- Make readers feel like they're getting advice from a trusted friend

${niche ? `Content context: This is specifically for the ${niche} niche. Tailor your language, examples, and approach to resonate deeply with this audience. Use industry-specific terminology naturally and reference common challenges and goals within this niche.` : ''}

Quality standards:
- Every sentence should provide value or advance the narrative
- Use storytelling to make complex concepts accessible
- Include social proof elements that feel authentic
- Address common objections before they arise
- Create natural opportunities for affiliate product mentions
- End with strong calls-to-action that motivate immediate response

The content should feel like it was written by someone with genuine expertise and personal experience who truly wants to help others succeed.`;
}

/**
 * Creates a targeted user prompt based on the input type and content
 * This function adapts the prompt strategy based on whether the user
 * provided a keyword, URL, or custom prompt
 */
function createUserPrompt(inputValue: string, inputType: string, niche?: string): string {
  const basePrompt = `Create a comprehensive, engaging landing page about: "${inputValue}"`;
  
  let typeSpecificInstructions = '';
  
  switch (inputType) {
    case 'keyword':
      typeSpecificInstructions = `Build compelling content around this keyword phrase. Create a personal story and comprehensive guide that naturally incorporates the keyword throughout without keyword stuffing. Focus on providing genuine value around this topic.`;
      break;
    case 'url':
      typeSpecificInstructions = `Analyze the concept behind this URL and create completely original, unique content inspired by the topic. Ensure the content is 100% original and provides a fresh perspective on the subject matter. Do not copy any existing content.`;
      break;
    case 'prompt':
      typeSpecificInstructions = `Use this as your creative direction and expand it into a full landing page. Take the core concept and develop it into a comprehensive guide with personal stories, actionable advice, and compelling arguments.`;
      break;
  }

  return `${basePrompt}

${typeSpecificInstructions}

Content structure requirements:
1. **Attention-grabbing headline** - Create curiosity and promise transformation
2. **Personal introduction/hook** - Share a relatable story that draws readers in  
3. **Problem identification** - Clearly articulate the challenge your audience faces
4. **Solution presentation** - Present your approach through personal transformation story
5. **Detailed benefits and features** - Explain what readers will gain with specific examples
6. **Social proof elements** - Include realistic testimonial placeholders and success stories
7. **Multiple strategic calls-to-action** - Place them naturally throughout the content
8. **Comprehensive FAQ section** - Address common concerns and objections
9. **Compelling closing** - End with appropriate urgency or exclusive opportunity

Writing guidelines:
- Make it feel authentic and personally written
- Include natural opportunities where affiliate links would fit seamlessly
- Write as someone who has genuinely experienced transformation in this area
- Use specific examples and concrete details rather than vague generalizations
- Create content that people actually want to read, not just scan
- Balance being informative with being persuasive
- Ensure every section flows naturally into the next

The final content should be engaging enough that people want to keep reading, informative enough that they learn something valuable, and persuasive enough that they're motivated to take action.`;
}

/**
 * Makes a secure API call to OpenAI's GPT-4 service
 * Handles authentication, request formatting, and response processing
 */
async function callOpenAI(apiKey: string, systemPrompt: string, userPrompt: string) {
  console.log("🤖 Calling OpenAI API...");
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4', // Use GPT-4 for highest quality content
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.7, // Balance creativity with consistency
      presence_penalty: 0.1, // Encourage diverse content
      frequency_penalty: 0.1, // Reduce repetition
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    console.error("❌ OpenAI API error:", errorMessage);
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }

  const data = await response.json();
  console.log("✅ OpenAI API call successful, tokens used:", data.usage?.total_tokens || 'unknown');
  
  return {
    content: data.choices[0].message.content,
    usage: data.usage
  };
}

/**
 * Makes a secure API call to Anthropic's Claude service
 * Handles authentication, request formatting, and response processing
 */
async function callAnthropic(apiKey: string, systemPrompt: string, userPrompt: string) {
  console.log("🤖 Calling Anthropic API...");
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    console.error("❌ Anthropic API error:", errorMessage);
    throw new Error(`Anthropic API error: ${errorMessage}`);
  }

  const data = await response.json();
  console.log("✅ Anthropic API call successful");
  
  return {
    content: data.content[0].text,
    usage: data.usage
  };
}

/**
 * Processes the raw AI response into a structured format that our frontend expects
 * Extracts metadata, calculates scores, and formats the content appropriately
 */
function processAIResponse(content: string, originalTopic: string) {
  console.log("📝 Processing AI response, content length:", content.length);
  
  // Extract title from content (look for the first heading)
  const lines = content.split('\n').filter(line => line.trim());
  const titleLine = lines.find(line => line.startsWith('#'));
  const title = titleLine?.replace(/^#+\s*/, '') || 
                `${originalTopic.charAt(0).toUpperCase() + originalTopic.slice(1)} - Complete Guide`;
  
  // Generate description from the first substantial paragraph
  const paragraphs = content.split('\n\n').filter(p => p.length > 50 && !p.startsWith('#'));
  let description = paragraphs[0]?.substring(0, 150) + '...' || 
                   `Comprehensive guide to ${originalTopic} with proven strategies and actionable insights.`;
  
  // Clean up description if it starts with markdown formatting
  description = description.replace(/^\*+\s*/, '').replace(/\*+$/, '');

  // Calculate comprehensive metrics
  const wordCount = content.split(/\s+/).length;
  const seoScore = calculateSEOScore(content);
  const suggestedImages = Math.max(4, Math.floor(wordCount / 500));
  const affiliateOpportunities = findAffiliateOpportunities(content);

  console.log("📊 Content analysis complete:", {
    title: title.substring(0, 50) + '...',
    wordCount,
    seoScore,
    suggestedImages,
    affiliateOpportunities
  });

  return {
    content,
    title,
    description,
    wordCount,
    seoScore,
    suggestedImages,
    affiliateOpportunities
  };
}

/**
 * Calculates an SEO score based on content quality indicators
 * This gives users insight into how well-optimized their content is
 */
function calculateSEOScore(content: string): number {
  let score = 70; // Base score for having substantial content

  // Check for proper heading structure (H1, H2, H3, etc.)
  const headings = (content.match(/^#+\s/gm) || []).length;
  if (headings >= 3) score += 8;
  if (headings >= 5) score += 2;

  // Reward longer, more comprehensive content
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 2000) score += 5;
  if (wordCount > 2500) score += 3;
  if (wordCount > 3000) score += 2;

  // Check for good paragraph structure and readability
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
  if (paragraphs.length >= 8) score += 5;
  if (paragraphs.length >= 12) score += 3;

  // Look for FAQ section (great for SEO)
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('frequently asked') || 
      lowerContent.includes('faq') || 
      lowerContent.includes('questions')) {
    score += 5;
  }

  // Check for call-to-action elements
  const ctaPattern = /\b(click|learn more|get started|sign up|download|try|discover)\b/gi;
  const ctaMatches = content.match(ctaPattern) || [];
  if (ctaMatches.length >= 3) score += 3;

  // Look for social proof indicators
  if (lowerContent.includes('testimonial') || 
      lowerContent.includes('review') || 
      content.includes('"') && content.includes('-')) {
    score += 2;
  }

  return Math.min(score, 100);
}

/**
 * Identifies potential affiliate link placement opportunities in the content
 * This helps users understand where they could monetize their content
 */
function findAffiliateOpportunities(content: string): number {
  const opportunityPatterns = [
    /\b(recommend|suggest|use|try|get|buy|purchase|order|check out)\b/gi,
    /\b(click here|learn more|find out|discover|visit|explore)\b/gi,
    /\b(tool|product|service|platform|software|app|system|program)\b/gi,
    /\b(course|training|guide|book|ebook|resource)\b/gi
  ];

  let totalOpportunities = 0;
  
  opportunityPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    totalOpportunities += matches.length;
  });

  // Return a reasonable number of affiliate opportunities (cap at 8 for quality)
  return Math.min(Math.max(totalOpportunities, 2), 8);
}

// Configure the function to use a friendly URL path that's easy to remember
export const config: Config = {
  path: "/api/generate-content"
};