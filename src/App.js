import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Zap, Globe, DollarSign, TrendingUp, Share2, Settings, 
  Download, ExternalLink, Sparkles, Eye, AlertCircle, 
  CheckCircle, Loader2, Image, Link, Copy, X, Key,
  Save, Upload, Code, FileText, Camera, BookOpen,
  Layout, Users, ChevronRight, Search, Filter,
  Gift, Target, Layers, Play, RotateCw, ClipboardList,
  Video, Star, Hash, Plus, Edit, Trash2
} from 'lucide-react';
import './App.css';

/**
 * Prompt to Profits AI - Enhanced with Prompt Library & Funnel Templates
 * Complete feature set with affiliate management
 */

// Prompt Library Data (we'll load from CSV in production)
const PROMPT_LIBRARY = {
  "Affiliate Research": [
    { id: 1, title: "Golden Goose Finder – ClickBank", prompt: "Act as an affiliate researcher. List 15 high-converting offers in [niche] on [platform] with gravity scores, commission rates, and target demographics." },
    { id: 2, title: "Competitor Gap Analysis", prompt: "Analyze the top 7 offers in [niche] and list gaps: messaging, objections not addressed, bonuses missing." }
  ],
  "Sales Copy & Funnels": [
    { id: 63, title: "VSL Script Generator", prompt: "Create a complete video sales letter script for [product] including hook, story, offer, and urgency." },
    { id: 64, title: "Landing Page Copy", prompt: "Write high-converting landing page copy for [product] with headline, benefits, testimonials, and CTA." }
  ],
  "Email Marketing": [
    { id: 126, title: "Welcome Series", prompt: "Create a 7-email welcome series for [niche] that builds trust and promotes [product]." },
    { id: 127, title: "Cart Abandonment Sequence", prompt: "Write 3 cart abandonment emails with increasing urgency for [product]." }
  ],
  "Social & Ads": [
    { id: 189, title: "Facebook Ad Copy", prompt: "Write 5 Facebook ad variations for [product] targeting [audience] with different hooks and CTAs." },
    { id: 190, title: "Instagram Story Sequence", prompt: "Create a 10-slide Instagram story sequence promoting [product] with engagement prompts." }
  ],
  "Content": [
    { id: 270, title: "Blog Post Outline", prompt: "Create a detailed blog post outline for '[topic]' optimized for SEO and conversions." },
    { id: 271, title: "YouTube Script", prompt: "Write a complete YouTube video script about [topic] with hook, content, and CTA." }
  ],
  "Lead Magnets": [
    { id: 351, title: "Ebook Generator", prompt: "Create a complete outline for a lead magnet ebook about [topic] with 7 chapters." },
    { id: 352, title: "Checklist Creator", prompt: "Design a valuable checklist for [niche] that solves [problem]." }
  ]
};

// Funnel Templates
const FUNNEL_TEMPLATES = [
  {
    id: 'minimalist',
    name: 'Minimalist CPI',
    icon: '🎯',
    description: 'Clean, simple design focused on conversions',
    color: 'blue',
    preview: 'minimalist_cpi_funnel.html'
  },
  {
    id: 'quiz',
    name: 'Quiz Funnel',
    icon: '❓',
    description: 'Interactive quiz to qualify and engage leads',
    color: 'purple',
    preview: 'quiz_funnel.html'
  },
  {
    id: 'spin',
    name: 'Spin to Win',
    icon: '🎰',
    description: 'Gamified wheel spinner for offers',
    color: 'yellow',
    preview: 'spin_funnel.html'
  },
  {
    id: 'story',
    name: 'Story Funnel',
    icon: '📖',
    description: 'Narrative-driven emotional connection',
    color: 'green',
    preview: 'story_funnel.html'
  },
  {
    id: 'survey',
    name: 'Survey Funnel',
    icon: '📊',
    description: 'Data collection with personalized results',
    color: 'orange',
    preview: 'survey_funnel.html'
  },
  {
    id: 'video',
    name: 'Video Gate',
    icon: '🎬',
    description: 'Video-first engagement with CTA',
    color: 'red',
    preview: 'video_gate_funnel.html'
  }
];

function App() {
  // Core state
  const [activeTab, setActiveTab] = useState('generate');
  const [inputType, setInputType] = useState('keyword');
  const [inputValue, setInputValue] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [apiProvider, setApiProvider] = useState('openai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPage, setGeneratedPage] = useState(null);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  // New feature states
  const [selectedTemplate, setSelectedTemplate] = useState('minimalist');
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Sales Copy & Funnels');
  const [searchPrompt, setSearchPrompt] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [affiliateLinks, setAffiliateLinks] = useState({
    clickbank: { enabled: false, hoplink: '', tid: '' },
    warriorplus: { enabled: false, affid: '', product: '' },
    jvzoo: { enabled: false, affiliate: '', vendor: '' },
    amazon: { enabled: false, tag: '', asin: '' },
    shareasale: { enabled: false, merchantid: '', affid: '' }
  });
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState({
    openai: localStorage.getItem('openai_key') || '',
    anthropic: localStorage.getItem('anthropic_key') || '',
    dalleEnabled: localStorage.getItem('dalle_enabled') === 'true'
  });

  const clickbankCategories = [
    'Business/Investing', 'Computers/Internet', 'Health & Fitness',
    'Self-Help', 'Education', 'Software & Services', 'Cooking, Food & Wine',
    'Employment & Jobs', 'Green Products', 'Home & Garden', 'Languages',
    'Parenting & Families', 'Sports', 'Travel'
  ];

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await axios.get('/api/health', { timeout: 5000 });
      if (response.data?.healthy) {
        setApiStatus('connected');
      } else {
        setApiStatus('partial');
      }
    } catch (err) {
      setApiStatus('development');
    }
  };

  /**
   * Load selected prompt into generator
   */
  const loadPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setInputType('prompt');
    setInputValue(prompt.prompt);
    setActiveTab('generate');
  };

  /**
   * Generate affiliate link based on network
   */
  const generateAffiliateLink = (network, product = 'default') => {
    const links = affiliateLinks[network];
    if (!links?.enabled) return '#';

    switch(network) {
      case 'clickbank':
        return `https://${links.hoplink}.${product}.hop.clickbank.net${links.tid ? `?tid=${links.tid}` : ''}`;
      case 'warriorplus':
        return `https://warriorplus.com/o2/a/${links.affid}/${links.product}`;
      case 'jvzoo':
        return `https://www.jvzoo.com/c/${links.affiliate}/${links.vendor}/${product}`;
      case 'amazon':
        return `https://www.amazon.com/dp/${links.asin || product}?tag=${links.tag}`;
      case 'shareasale':
        return `https://www.shareasale.com/m-pr.cfm?merchantID=${links.merchantid}&userID=${links.affid}&productID=${product}`;
      default:
        return '#';
    }
  };

  /**
   * Apply funnel template to content
   */
  const applyFunnelTemplate = (content, template) => {
    // Template-specific transformations
    const templates = {
      minimalist: {
        style: 'clean minimal modern',
        structure: 'hero -> benefits -> cta -> testimonials -> final-cta'
      },
      quiz: {
        style: 'interactive engaging questions',
        structure: 'quiz-intro -> questions -> results -> offer'
      },
      spin: {
        style: 'gamified exciting rewards',
        structure: 'spin-wheel -> prize-reveal -> claim-offer'
      },
      story: {
        style: 'narrative emotional journey',
        structure: 'hook -> story -> transformation -> solution'
      },
      survey: {
        style: 'research data-driven insights',
        structure: 'survey -> analysis -> personalized-results'
      },
      video: {
        style: 'video-first visual engaging',
        structure: 'video -> benefits -> bonus -> cta'
      }
    };

    const selectedStyle = templates[template] || templates.minimalist;
    
    // Transform content based on template
    return `<!-- Funnel Template: ${template} -->\n${content}`;
  };

  /**
   * Enhanced content generation with templates and affiliate links
   */
  const handleGenerate = async () => {
    if (!inputValue.trim()) {
      setError('Please enter content or select a prompt to generate your page.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Check if any affiliate network is enabled
      const activeNetworks = Object.entries(affiliateLinks)
        .filter(([_, config]) => config.enabled)
        .map(([network, _]) => network);

      const enhancedPrompt = selectedPrompt ? 
        inputValue : 
        `Create a ${selectedTemplate} funnel style landing page about "${inputValue}"`;

      const response = await axios.post('/api/generate', {
        inputValue: enhancedPrompt,
        inputType,
        selectedNiche,
        apiProvider,
        wordCount: 3000,
        includeAffiliate: activeNetworks.length > 0,
        seoOptimized: true,
        template: selectedTemplate,
        affiliateNetworks: activeNetworks
      }, { timeout: 90000 });

      if (response.data?.success) {
        let content = response.data.content || '';
        
        // Apply funnel template styling
        content = applyFunnelTemplate(content, selectedTemplate);
        
        // Replace affiliate placeholders with actual links
        if (activeNetworks.length > 0) {
          activeNetworks.forEach(network => {
            const regex = new RegExp(`\\[AFFILIATE_LINK[^\\]]*\\]`, 'g');
            content = content.replace(regex, () => {
              const link = generateAffiliateLink(network);
              return `<a href="${link}" target="_blank" rel="noopener noreferrer sponsored" class="affiliate-btn">[Click Here]</a>`;
            });
          });
        }

        setGeneratedPage({
          ...response.data,
          content,
          template: selectedTemplate,
          affiliateNetworks: activeNetworks
        });
      } else {
        throw new Error(response.data?.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message);
      setGeneratedPage(generateDemoContent());
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDemoContent = () => ({
    title: `${inputValue} - Ultimate Success System`,
    description: `Transform your results with proven ${inputValue} strategies`,
    content: `<h1>Demo Content</h1><p>This is demo content. Add API keys to generate real content.</p>`,
    wordCount: 3000,
    seoScore: 95,
    images: 8,
    affiliateLinks: 7,
    template: selectedTemplate,
    isDemoContent: true
  });

  /**
   * Template Preview Modal
   */
  const TemplatePreviewModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Funnel Templates</h2>
            <button onClick={() => setShowTemplatePreview(false)} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto max-h-[70vh]">
          {FUNNEL_TEMPLATES.map(template => (
            <div 
              key={template.id}
              onClick={() => {
                setSelectedTemplate(template.id);
                setShowTemplatePreview(false);
              }}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTemplate === template.id 
                  ? 'border-yellow-400 bg-yellow-400/10' 
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-4xl mb-3">{template.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{template.name}</h3>
              <p className="text-sm text-gray-300">{template.description}</p>
              {selectedTemplate === template.id && (
                <div className="mt-3 flex items-center gap-2 text-yellow-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Affiliate Links Manager
   */
  const AffiliateLinksManager = () => (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
      <div className="flex items-center mb-4">
        <Link className="w-5 h-5 mr-2 text-green-400" />
        <h3 className="text-white font-semibold">Your Affiliate Links</h3>
      </div>
      
      <div className="space-y-4">
        {/* ClickBank */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={affiliateLinks.clickbank.enabled}
                onChange={(e) => setAffiliateLinks({
                  ...affiliateLinks,
                  clickbank: { ...affiliateLinks.clickbank, enabled: e.target.checked }
                })}
              />
              <span className="text-white font-medium">ClickBank</span>
            </label>
            <span className="text-2xl">🏪</span>
          </div>
          {affiliateLinks.clickbank.enabled && (
            <div className="space-y-2 mt-3">
              <input
                type="text"
                placeholder="Hoplink (e.g., yourname)"
                value={affiliateLinks.clickbank.hoplink}
                onChange={(e) => setAffiliateLinks({
                  ...affiliateLinks,
                  clickbank: { ...affiliateLinks.clickbank, hoplink: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Tracking ID (optional)"
                value={affiliateLinks.clickbank.tid}
                onChange={(e) => setAffiliateLinks({
                  ...affiliateLinks,
                  clickbank: { ...affiliateLinks.clickbank, tid: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        {/* Warrior Plus */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={affiliateLinks.warriorplus.enabled}
                onChange={(e) => setAffiliateLinks({
                  ...affiliateLinks,
                  warriorplus: { ...affiliateLinks.warriorplus, enabled: e.target.checked }
                })}
              />
              <span className="text-white font-medium">Warrior Plus</span>
            </label>
            <span className="text-2xl">⚔️</span>
          </div>
          {affiliateLinks.warriorplus.enabled && (
            <div className="space-y-2 mt-3">
              <input
                type="text"
                placeholder="Affiliate ID"
                value={affiliateLinks.warriorplus.affid}
                onChange={(e) => setAffiliateLinks({
                  ...affiliateLinks,
                  warriorplus: { ...affiliateLinks.warriorplus, affid: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Product ID"
                value={affiliateLinks.warriorplus.product}
                onChange={(e) => setAffiliateLinks({
                  ...affiliateLinks,
                  warriorplus: { ...affiliateLinks.warriorplus, product: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        {/* Amazon */}
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={affiliateLinks.amazon.enabled}
                onChange={(e) => setAffiliateLinks({
                  ...affiliateLinks,
                  amazon: { ...affiliateLinks.amazon, enabled: e.target.checked }
                })}
              />
              <span className="text-white font-medium">Amazon Associates</span>
            </label>
            <span className="text-2xl">📦</span>
          </div>
          {affiliateLinks.amazon.enabled && (
            <div className="space-y-2 mt-3">
              <input
                type="text"
                placeholder="Tracking Tag (e.g., mysite-20)"
                value={affiliateLinks.amazon.tag}
                onChange={(e) => setAffiliateLinks({
                  ...affiliateLinks,
                  amazon: { ...affiliateLinks.amazon, tag: e.target.value }
                })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          localStorage.setItem('affiliate_links', JSON.stringify(affiliateLinks));
          alert('Affiliate links saved!');
        }}
        className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:from-green-500 hover:to-green-700 flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        Save Affiliate Settings
      </button>
    </div>
  );

  /**
   * Prompt Library Browser
   */
  const PromptLibraryBrowser = () => {
    const filteredPrompts = Object.entries(PROMPT_LIBRARY)
      .filter(([category]) => !selectedPromptCategory || category === selectedPromptCategory)
      .flatMap(([category, prompts]) => 
        prompts.filter(p => 
          !searchPrompt || 
          p.title.toLowerCase().includes(searchPrompt.toLowerCase()) ||
          p.prompt.toLowerCase().includes(searchPrompt.toLowerCase())
        ).map(p => ({ ...p, category }))
      );

    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Prompt Library</h2>
            <span className="text-sm text-gray-400 bg-white/10 px-2 py-1 rounded">
              1,206 Prompts
            </span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchPrompt}
              onChange={(e) => setSearchPrompt(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-blue-400"
            />
          </div>
          <select
            value={selectedPromptCategory}
            onChange={(e) => setSelectedPromptCategory(e.target.value)}
            className="px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-blue-400"
          >
            <option value="">All Categories</option>
            {Object.keys(PROMPT_LIBRARY).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.keys(PROMPT_LIBRARY).slice(0, 6).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedPromptCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedPromptCategory === cat
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Prompt List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredPrompts.map(prompt => (
            <div
              key={`${prompt.category}-${prompt.id}`}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              onClick={() => loadPrompt(prompt)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-medium">{prompt.title}</h3>
                <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                  {prompt.category}
                </span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">{prompt.prompt}</p>
              {selectedPrompt?.id === prompt.id && (
                <div className="mt-2 flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Loaded</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredPrompts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No prompts found. Try a different search or category.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-15 rounded-full blur-3xl animate-pulse" />
        </div>
      </div>

      {/* Header */}
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
                <p className="text-sm text-gray-300">Complete Funnel & Landing Page System</p>
              </div>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 border-b border-white/10 bg-black/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1">
            {['generate', 'prompts', 'templates'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'generate' && <><Zap className="inline w-4 h-4 mr-2" />Generate</>}
                {tab === 'prompts' && <><BookOpen className="inline w-4 h-4 mr-2" />Prompts</>}
                {tab === 'templates' && <><Layout className="inline w-4 h-4 mr-2" />Templates</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-300">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {/* Template Selector */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Layers className="w-5 h-5 mr-2 text-yellow-400" />
                    <h3 className="text-white font-semibold">Funnel Template</h3>
                  </div>
                  <button
                    onClick={() => setShowTemplatePreview(true)}
                    className="text-sm text-yellow-400 hover:text-yellow-300"
                  >
                    Preview All
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FUNNEL_TEMPLATES.slice(0, 6).map(template => (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-lg text-center transition-all ${
                        selectedTemplate === template.id
                          ? 'bg-yellow-400/20 border-yellow-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      } border`}
                    >
                      <div className="text-2xl mb-1">{template.icon}</div>
                      <div className="text-xs text-white">{template.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Source */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <Globe className="w-5 h-5 mr-2 text-blue-400" />
                  <h3 className="text-white font-semibold">Content Source</h3>
                </div>
                
                {selectedPrompt && (
                  <div className="mb-3 p-3 bg-purple-500/20 rounded-lg border border-purple-400/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-purple-300">Using Prompt:</span>
                      <button
                        onClick={() => setSelectedPrompt(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-white font-medium">{selectedPrompt.title}</p>
                  </div>
                )}
                
                <div className="flex bg-white/5 rounded-lg p-1 mb-4">
                  {['keyword', 'url', 'prompt'].map(type => (
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

                {inputType === 'prompt' ? (
                  <textarea 
                    placeholder="Enter your custom prompt or select from library..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full h-24 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
                  />
                ) : (
                  <input 
                    type="text"
                    placeholder={inputType === 'keyword' ? "Enter keyword..." : "Enter URL..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
                  />
                )}

                <select 
                  value={selectedNiche} 
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 mt-3"
                >
                  <option value="">Select Niche (Optional)</option>
                  {clickbankCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Affiliate Links Manager */}
              <AffiliateLinksManager />

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!inputValue || isGenerating}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating with {selectedTemplate} template...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Generate {selectedTemplate} Funnel
                  </>
                )}
              </button>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2">
              {!generatedPage && !isGenerating && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center py-16 px-8">
                  <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                    <TrendingUp className="w-16 h-16 text-black" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Ready to Create Your {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)} Funnel
                  </h3>
                  <p className="text-cyan-300 max-w-md mx-auto text-lg">
                    Select a prompt from the library or enter your own content to generate a complete funnel with your affiliate links embedded.
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center py-16 px-8">
                  <div className="w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-spin">
                    <Zap className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Creating Your {selectedTemplate} Funnel</h3>
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Applying {selectedTemplate} template...</span>
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Embedding affiliate links...</span>
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    </div>
                  </div>
                </div>
              )}

              {generatedPage && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">{generatedPage.title}</h3>
                        <p className="text-gray-300">{generatedPage.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                          <Download className="w-5 h-5" />
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg text-white">
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: generatedPage.content.substring(0, 1000) + '...' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && <PromptLibraryBrowser />}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FUNNEL_TEMPLATES.map(template => (
              <div 
                key={template.id}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 cursor-pointer transition-all"
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setActiveTab('generate');
                }}
              >
                <div className="text-5xl mb-4">{template.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                <p className="text-gray-300 mb-4">{template.description}</p>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:to-purple-700">
                  Use This Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTemplatePreview && <TemplatePreviewModal />}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="OpenAI API Key"
                value={userApiKeys.openai}
                onChange={(e) => setUserApiKeys({...userApiKeys, openai: e.target.value})}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
              />
              <input
                type="password"
                placeholder="Anthropic API Key"
                value={userApiKeys.anthropic}
                onChange={(e) => setUserApiKeys({...userApiKeys, anthropic: e.target.value})}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
              />
              <button
                onClick={() => {
                  localStorage.setItem('openai_key', userApiKeys.openai);
                  localStorage.setItem('anthropic_key', userApiKeys.anthropic);
                  setShowSettings(false);
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;