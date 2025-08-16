import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Zap, Globe, DollarSign, TrendingUp, Share2, Settings, 
  Download, ExternalLink, Sparkles, Eye, AlertCircle, 
  CheckCircle, Loader2 
} from 'lucide-react';
import './App.css';

/**
 * Main application component for Prompt to Profits AI
 * This component manages the entire user interface and coordinates
 * communication with the backend AI generation services
 */
function App() {
  // Core application state management
  const [inputType, setInputType] = useState('keyword');
  const [inputValue, setInputValue] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [apiProvider, setApiProvider] = useState('openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPage, setGeneratedPage] = useState(null);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  // Configuration data for the application
  const clickbankCategories = [
    'Business/Investing', 'Computers/Internet', 'Health & Fitness',
    'Self-Help', 'Education', 'Software & Services', 'Cooking, Food & Wine',
    'Employment & Jobs', 'Green Products', 'Home & Garden', 'Languages',
    'Parenting & Families', 'Sports', 'Travel'
  ];

  const affiliateNetworks = [
    { name: 'ClickBank', icon: '🏪', status: 'Active', description: 'Digital products with high commissions' },
    { name: 'Warrior Plus', icon: '⚔️', status: 'Active', description: 'Internet marketing and tools platform' },
    { name: 'JVZoo', icon: '🦓', status: 'Active', description: 'Software and digital product network' },
    { name: 'Amazon Associates', icon: '📦', status: 'Active', description: 'Physical products with trusted brand' }
  ];

  /**
   * Check if our backend API is working when the component loads
   * This helps us show appropriate status messages to users
   */
  useEffect(() => {
    checkApiStatus();
  }, []);

  /**
   * Function to verify that our Netlify functions are working properly
   * In production, this will confirm the backend is accessible
   */
  const checkApiStatus = async () => {
    try {
      // Attempt to reach our health check endpoint
      const response = await axios.get('/.netlify/functions/health-check', {
        timeout: 5000 // 5 second timeout
      });
      
      if (response.status === 200) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.log('API check result:', error.message);
      // In development, this is expected since functions may not be running
      setApiStatus('development');
    }
  };

  /**
   * Main content generation function
   * This handles the entire flow from user input to displaying results
   */
  const handleGenerate = async () => {
    // Validate user input before proceeding
    if (!inputValue.trim()) {
      setError('Please enter some content to generate your landing page.');
      return;
    }

    if (inputValue.trim().length < 3) {
      setError('Please enter at least 3 characters for better content generation.');
      return;
    }

    // Clear any previous errors and start the generation process
    setIsGenerating(true);
    setError(null);

    try {
      console.log('Starting content generation with:', {
        inputType,
        inputValue: inputValue.substring(0, 50) + '...', // Log partial input for debugging
        selectedNiche,
        apiProvider
      });

      // Make the API call to our serverless function
      const response = await axios.post('/.netlify/functions/generate-content', {
        inputValue: inputValue.trim(),
        inputType,
        selectedNiche,
        apiProvider,
        // Additional parameters for content customization
        wordCount: 3000,
        includeAffiliate: true,
        seoOptimized: true
      }, {
        timeout: 60000, // 60 second timeout for AI generation
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        // Process successful API response
        const processedContent = {
          title: response.data.title,
          description: response.data.description,
          content: response.data.content,
          wordCount: response.data.wordCount,
          seoScore: response.data.seoScore,
          images: response.data.suggestedImages,
          affiliateLinks: response.data.affiliateOpportunities,
          socialShares: 0,
          isDemoContent: false,
          apiProvider: response.data.apiProvider
        };

        setGeneratedPage(processedContent);
        console.log(`Successfully generated ${processedContent.wordCount} words using ${response.data.apiProvider}`);
        
      } else {
        throw new Error(response.data.error || 'Unknown error occurred during generation');
      }

    } catch (error) {
      console.error('Generation error:', error);
      
      let errorMessage = 'Failed to generate content. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'The request timed out. Please try again.';
      } else if (error.response?.status === 404) {
        errorMessage += 'API endpoint not found. Make sure the serverless function is deployed.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error. Please check your API keys and try again.';
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else {
        errorMessage += error.message;
      }

      // Show demo content as fallback with clear explanation
      const demoContent = generateDemoContent(inputValue, selectedNiche);
      setGeneratedPage(demoContent);
      setError(`${errorMessage} (Showing demo content as fallback)`);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate demonstration content when the API is not available
   * This ensures users can still see how the interface works
   */
  const generateDemoContent = (topic, niche) => {
    const wordCount = Math.floor(Math.random() * 1000) + 2500;
    const seoScore = Math.floor(Math.random() * 15) + 85;
    
    return {
      title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} - Complete Guide & Proven Strategies (Demo)`,
      description: `This is demonstration content showing how your AI-generated landing page would appear. In production, this would be unique content created by ${apiProvider === 'openai' ? 'OpenAI GPT-4' : 'Anthropic Claude'}.`,
      content: `# ${topic.charAt(0).toUpperCase() + topic.slice(1)} - Your Complete Success Guide

## Introduction: Why This Guide Changes Everything

*[This is demo content showing the structure and quality of AI-generated landing pages. Your production version will create completely unique, engaging content based on your specific inputs.]*

When I first started exploring ${topic}, I had no idea how transformative this journey would become. Like many people, I was skeptical about whether the strategies I'd heard about actually worked in the real world.

After months of research, testing, and implementation, I've discovered a system that consistently delivers results. This guide contains everything I wish I had known when I started.

## The Problem Most People Face

Here's what I discovered: 95% of people approaching ${topic} make the same critical mistakes that keep them from achieving their goals. They either:

- Jump in without a clear strategy or roadmap
- Follow outdated advice that no longer works in today's market
- Give up too early before seeing meaningful results
- Focus on tactics instead of building solid fundamentals

## My Personal Breakthrough Story

Three months ago, everything changed when I implemented the system I'm about to share with you. The results were so dramatic that I knew I had to document this process for others who are struggling with the same challenges I faced.

## The Complete Strategy Framework

### Step 1: Foundation Building
The first thing you need to understand about ${topic} is that sustainable success comes from building the right foundation. Most people skip this crucial step and wonder why they struggle later.

### Step 2: Advanced Techniques  
Once you've mastered the basics, these advanced strategies will accelerate your progress exponentially and help you achieve results faster than you thought possible.

### Step 3: Scaling and Optimization
This is where most people plateau, but here's how to break through to the next level and achieve consistent, long-term success.

## Real Results from Real People

"This approach completely transformed my results in just 30 days. I wish I had found this guide sooner. The difference is incredible." - Sarah M.

"I went from struggling to seeing consistent success. The strategies actually work!" - Mike T.

## Your Next Steps

Ready to get started? Here's exactly what you need to do next to begin your transformation...

*[In production, AI will generate 3000+ words of unique, personalized content based on your specific inputs and niche selection.]*`,
      wordCount,
      seoScore,
      images: Math.max(4, Math.floor(wordCount / 400)),
      affiliateLinks: Math.floor(Math.random() * 6) + 3,
      socialShares: 0,
      isDemoContent: true
    };
  };

  /**
   * Component to display the current API connection status
   * This helps users understand whether they're seeing real or demo content
   */
  const StatusBadge = () => {
    const statusConfig = {
      connected: { 
        color: 'bg-green-500/10 text-green-400 border-green-400', 
        text: 'API Connected', 
        icon: CheckCircle 
      },
      development: { 
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-400', 
        text: 'Development Mode', 
        icon: AlertCircle 
      },
      error: { 
        color: 'bg-red-500/10 text-red-400 border-red-400', 
        text: 'API Error', 
        icon: AlertCircle 
      },
      checking: { 
        color: 'bg-blue-500/10 text-blue-400 border-blue-400', 
        text: 'Checking...', 
        icon: Loader2 
      }
    };

    const config = statusConfig[apiStatus];
    const IconComponent = config.icon;

    return (
      <div className={`px-3 py-1 rounded-full border text-sm font-medium ${config.color} flex items-center gap-2`}>
        <IconComponent className={`w-3 h-3 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />
        {config.text}
      </div>
    );
  };

  /**
   * Component to display error messages in a user-friendly way
   * This helps users understand what went wrong and what they can do about it
   */
  const ErrorDisplay = () => {
    if (!error) return null;

    return (
      <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-yellow-300 mb-2">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Notice:</span>
        </div>
        <p className="text-sm text-yellow-200">{error}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        </div>
      </div>

      {/* Application Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Prompt to Profits AI
                </h1>
                <p className="text-sm text-gray-300">AI-Powered Landing Page Generator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <StatusBadge />
              <button className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Application Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <ErrorDisplay />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Panel - Input Controls */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Content Source Configuration */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <Globe className="w-5 h-5 mr-2 text-blue-400" />
                <h3 className="text-white font-semibold">Content Source</h3>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Choose how you want to generate your landing page content
              </p>
              
              {/* Input Type Tabs */}
              <div className="flex bg-white/5 rounded-lg p-1 mb-4">
                {['keyword', 'url', 'prompt'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setInputType(type)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      inputType === type 
                        ? 'bg-white/20 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Input Field */}
              <div className="mb-4">
                {inputType === 'prompt' ? (
                  <textarea 
                    placeholder="Enter your custom prompt for content generation..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full h-24 bg-slate-800 border border-slate-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:bg-slate-700 focus:border-blue-400 resize-none"
                  />
                ) : (
                  <input 
                    type="text"
                    placeholder={
                      inputType === 'keyword' 
                        ? "Enter your keyword (e.g., productivity tips, healthy cooking)"
                        : "Enter URL to analyze (https://example.com)"
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:bg-slate-700 focus:border-blue-400"
                  />
                )}
              </div>

              {/* Niche Selection */}
              <select 
                value={selectedNiche} 
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 focus:bg-slate-700 focus:border-blue-400"
              >
                <option value="">Select Target Niche (Optional)</option>
                {clickbankCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Provider Selection */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                <h3 className="text-white font-semibold">AI Provider</h3>
              </div>
              
              <select 
                value={apiProvider} 
                onChange={(e) => setApiProvider(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 focus:bg-slate-700 focus:border-blue-400 mb-3"
              >
                <option value="openai">OpenAI GPT-4 - Versatile & Reliable</option>
                <option value="anthropic">Anthropic Claude - Natural & Human-like</option>
              </select>
              
              <div className="bg-blue-500/10 rounded-lg border border-blue-500/30 p-3">
                <p className="text-xs text-blue-300 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Production version uses your API keys to generate unique content
                </p>
              </div>
            </div>

            {/* Affiliate Networks Display */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                <h3 className="text-white font-semibold">Affiliate Networks</h3>
              </div>
              
              <div className="space-y-3">
                {affiliateNetworks.map((network) => (
                  <div key={network.name} className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{network.icon}</span>
                        <span className="text-white text-sm font-medium">{network.name}</span>
                      </div>
                      <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                        {network.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 ml-8">{network.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!inputValue || isGenerating}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  Generate Landing Page
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Results Display */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Welcome State */}
            {!generatedPage && !isGenerating && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center py-16 px-8">
                <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                  <TrendingUp className="w-16 h-16 text-black" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Ready to Create High-Converting Pages?</h3>
                <p className="text-cyan-300 max-w-md mx-auto text-lg mb-8">
                  Enter your content idea to generate a professional landing page with AI-powered copywriting optimized for conversions.
                </p>
                <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">3000+</div>
                    <div className="text-sm text-gray-400">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">SEO</div>
                    <div className="text-sm text-gray-400">Optimized</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">Ready</div>
                    <div className="text-sm text-gray-400">To Deploy</div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center py-16 px-8 shadow-2xl shadow-cyan-500/30">
                <div className="w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-spin">
                  <Zap className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">AI is Crafting Your Content</h3>
                <p className="text-cyan-300 mb-6">
                  Using {apiProvider === 'openai' ? 'OpenAI GPT-4' : 'Anthropic Claude'} to generate your landing page...
                </p>
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-300">Analyzing topic and niche...</span>
                    <span className="text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-300">Generating compelling content...</span>
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-400">Optimizing for SEO...</span>
                    <span className="text-gray-500">⏳</span>
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {generatedPage && (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center p-4 hover:bg-white/10 transition-colors">
                    <div className="text-3xl font-bold text-yellow-400">{generatedPage.wordCount}</div>
                    <div className="text-sm text-gray-300">Words</div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center p-4 hover:bg-white/10 transition-colors">
                    <div className="text-3xl font-bold text-green-400">{generatedPage.seoScore}</div>
                    <div className="text-sm text-gray-300">SEO Score</div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center p-4 hover:bg-white/10 transition-colors">
                    <div className="text-3xl font-bold text-blue-400">{generatedPage.images}</div>
                    <div className="text-sm text-gray-300">AI Images</div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center p-4 hover:bg-white/10 transition-colors">
                    <div className="text-3xl font-bold text-purple-400">{generatedPage.affiliateLinks}</div>
                    <div className="text-sm text-gray-300">Affiliate Spots</div>
                  </div>
                </div>

                {/* Generated Content Display */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl shadow-cyan-500/30">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <h3 className="text-white font-semibold">Generated Landing Page</h3>
                        {generatedPage.isDemoContent && (
                          <span className="text-yellow-400 bg-yellow-400/10 text-xs px-2 py-1 rounded border border-yellow-400/30">
                            Demo Content
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors text-sm">
                          <Download className="w-4 h-4" />
                          Export HTML
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors text-sm">
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-lg hover:from-cyan-500 hover:to-blue-600 transition-colors text-sm">
                          <ExternalLink className="w-4 h-4" />
                          Live Preview
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-2xl font-bold text-white mb-2">{generatedPage.title}</h4>
                        <p className="text-cyan-300 mb-4">{generatedPage.description}</p>
                      </div>
                      
                      {/* Content Preview */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-40 rounded-lg mb-4 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">Hero Section Preview</span>
                        </div>
                        <div className="text-gray-300 text-sm whitespace-pre-line max-h-64 overflow-y-auto bg-black/20 p-4 rounded-lg">
                          {generatedPage.content.substring(0, 1000)}
                          {generatedPage.content.length > 1000 && '...\n\n[Content continues...]'}
                        </div>
                      </div>

                      {/* Deployment Status */}
                      <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                        <div className="flex items-center gap-2 text-green-300">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-medium">
                            {generatedPage.isDemoContent 
                              ? 'Demo Content Ready - Deploy with real API keys for production content'
                              : 'Content Ready for Deployment to Netlify'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;