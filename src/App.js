import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { apiUrl } from './api'; // <-- add this

// ...

useEffect(() => {
  // Health check
  axios.get(apiUrl('/api/health'), { timeout: 5000 })
    .then(res => setApiStatus(res.data?.healthy ? 'connected' : 'partial'))
    .catch(() => setApiStatus('development'));
}, []);

// ...

const handleGenerate = async () => {
  // ...
  const res = await axios.post(
    apiUrl('/api/generate'),
    {
      inputValue: enhancedPrompt,
      inputType,
      selectedNiche,
      apiProvider,
      wordCount: 1500,     // keep moderate to avoid timeouts
      includeAffiliate: activeNetworks.length > 0,
      seoOptimized: true,
      template: selectedTemplate,
      affiliateNetworks: activeNetworks
    },
    { timeout: 90000 }
  );
  // ...
};


/**
 * ===== API Base =====
 * If you deploy a separate backend, set REACT_APP_API_URL in your environment
 * e.g. https://your-backend.onrender.com
 * Otherwise leave empty and rely on site redirects (/api/* -> functions).
 */
const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
const api = {
  health: `${apiBase}/api/health`,
  generate: `${apiBase}/api/generate`,
};

const CLICKBANK_CATEGORIES = [
  'Business/Investing', 'Computers/Internet', 'Health & Fitness',
  'Self-Help', 'Education', 'Software & Services', 'Cooking, Food & Wine',
  'Employment & Jobs', 'Green Products', 'Home & Garden', 'Languages',
  'Parenting & Families', 'Sports', 'Travel'
];

const FUNNEL_TEMPLATES = [
  { id: 'minimalist', name: 'Minimalist CPI', icon: '🎯', desc: 'Clean, conversion-first' },
  { id: 'quiz',       name: 'Quiz Funnel',     icon: '❓', desc: 'Qualify & engage' },
  { id: 'spin',       name: 'Spin to Win',     icon: '🎰', desc: 'Gamified leads' },
  { id: 'story',      name: 'Story Funnel',    icon: '📖', desc: 'Narrative-driven' },
  { id: 'survey',     name: 'Survey Funnel',   icon: '📊', desc: 'Personalized results' },
  { id: 'video',      name: 'Video Gate',      icon: '🎬', desc: 'Video-first CTA' },
];

// Small prompt library sample (you can expand later)
const PROMPT_LIBRARY = {
  'Sales Copy & Funnels': [
    { id: 1, title: 'Landing Page Copy', prompt: 'Write a high-converting landing page for [product] targeting [audience]. Include headline, subheads, bullets, social proof and strong CTAs.' },
    { id: 2, title: 'VSL Script', prompt: 'Create a full VSL script for [product] with hook, story, solution, proof, offer, bonuses, scarcity and CTA.' }
  ],
  'Affiliate Research': [
    { id: 3, title: 'ClickBank Offer Scan', prompt: 'List 12 top ClickBank offers in [niche] with gravity, avg $/sale, commission %, and ideal audience.' }
  ]
};

function App() {
  // UI state
  const [activeTab, setActiveTab] = useState('generate');
  const [apiStatus, setApiStatus] = useState('checking'); // checking | connected | development | error
  const [error, setError] = useState(null);

  // Generator state
  const [inputType, setInputType] = useState('keyword'); // keyword | url | prompt
  const [inputValue, setInputValue] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('');
  const [apiProvider, setApiProvider] = useState('openai'); // openai | anthropic
  const [targetWordCount, setTargetWordCount] = useState(1500);
  const [selectedTemplate, setSelectedTemplate] = useState('minimalist');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPage, setGeneratedPage] = useState(null);

  // Prompts library UI
  const [selectedPromptCategory, setSelectedPromptCategory] = useState('Sales Copy & Funnels');
  const [searchPrompt, setSearchPrompt] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);

  // Affiliate links (stored locally)
  const [affiliateLinks, setAffiliateLinks] = useState(() => {
    try {
      const saved = localStorage.getItem('affiliate_links');
      return saved ? JSON.parse(saved) : {
        clickbank:   { enabled: false, hoplink: '', tid: '' },
        warriorplus: { enabled: false, affid: '', product: '' },
        jvzoo:       { enabled: false, affiliate: '', vendor: '' },
        amazon:      { enabled: false, tag: '', asin: '' },
        shareasale:  { enabled: false, merchantid: '', affid: '' }
      };
    } catch {
      return {
        clickbank:   { enabled: false, hoplink: '', tid: '' },
        warriorplus: { enabled: false, affid: '', product: '' },
        jvzoo:       { enabled: false, affiliate: '', vendor: '' },
        amazon:      { enabled: false, tag: '', asin: '' },
        shareasale:  { enabled: false, merchantid: '', affid: '' }
      };
    }
  });

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKeys, setUserApiKeys] = useState({
    openai: localStorage.getItem('openai_key') || '',
    anthropic: localStorage.getItem('anthropic_key') || ''
  });

  // ===== Health check =====
  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get(api.health, { timeout: 6000 });
        if (res.data?.healthy) setApiStatus('connected');
        else setApiStatus('development');
      } catch {
        // When no backend/functions exist, don’t hard-fail the UI
        setApiStatus('development');
      }
    };
    check();
  }, []);

  // ===== Helpers =====
  const activeNetworks = useMemo(
    () => Object.entries(affiliateLinks).filter(([, v]) => v.enabled).map(([k]) => k),
    [affiliateLinks]
  );

  const generateAffiliateLink = (network, product = 'default') => {
    const cfg = affiliateLinks[network];
    if (!cfg?.enabled) return '#';
    switch (network) {
      case 'clickbank':
        // https://HOPLINK.VENDOR.hop.clickbank.net?tid=TRACK
        return `https://${cfg.hoplink || 'yourid'}.${product}.hop.clickbank.net${cfg.tid ? `?tid=${encodeURIComponent(cfg.tid)}` : ''}`;
      case 'warriorplus':
        return `https://warriorplus.com/o2/a/${cfg.affid || 'AFF'}/${cfg.product || 'PRODUCT'}`;
      case 'jvzoo':
        return `https://www.jvzoo.com/c/${cfg.affiliate || 'AFF'}/${cfg.vendor || 'VENDOR'}/${product}`;
      case 'amazon':
        return `https://www.amazon.com/dp/${cfg.asin || product}?tag=${cfg.tag || 'yourtag-20'}`;
      case 'shareasale':
        return `https://www.shareasale.com/m-pr.cfm?merchantID=${cfg.merchantid || 'MID'}&userID=${cfg.affid || 'AFF'}&productID=${product}`;
      default:
        return '#';
    }
  };

  const applyFunnelTemplate = (content, template) =>
    `<!-- Funnel Template: ${template} -->\n${content}`;

  const generateDemoContent = (topic = 'Your Topic') => ({
    title: `${topic} — Complete Guide (Demo)`,
    description: `Demo content preview for “${topic}”. Connect your backend/API to generate real copy.`,
    content: `<section><h1>${topic} — Demo</h1><p>This is demo content rendered while your API is not available.</p><p>Add your API keys on the server and try again.</p></section>`,
    wordCount: 800,
    seoScore: 90,
    images: 3,
    affiliateLinks: activeNetworks.length,
    template: selectedTemplate,
    isDemoContent: true
  });

  // ===== Generate handler =====
  const handleGenerate = async () => {
    setError(null);

    if (!inputValue.trim()) {
      setError('Please enter a keyword, URL or prompt.');
      return;
    }
    setIsGenerating(true);

    try {
      const enhancedPrompt = selectedPrompt ? inputValue :
        (inputType === 'prompt'
          ? inputValue
          : `Create a ${selectedTemplate} style landing page about "${inputValue}". Include compelling headlines, benefits, proof, CTAs, and embed [AFFILIATE_LINK] placeholders where offers should appear.`);

      const res = await axios.post(
        api.generate,
        {
          inputValue: enhancedPrompt,
          inputType,
          selectedNiche,
          apiProvider,
          wordCount: targetWordCount,
          includeAffiliate: activeNetworks.length > 0,
          seoOptimized: true,
          template: selectedTemplate,
          affiliateNetworks: activeNetworks
        },
        { timeout: 90000, headers: { 'Content-Type': 'application/json' } }
      );

      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Generation failed');
      }

      let content = String(res.data.content || '');
      if (activeNetworks.length > 0) {
        const rx = /\[AFFILIATE_LINK[^\]]*\]/g;
        content = content.replace(rx, () => {
          const link = generateAffiliateLink(activeNetworks[0]);
          return `<a href="${link}" target="_blank" rel="noopener noreferrer sponsored" class="affiliate-btn">Click Here</a>`;
        });
      }

      content = applyFunnelTemplate(content, selectedTemplate);

      setGeneratedPage({
        title: res.data.title || `${inputValue} — Generated Landing Page`,
        description: res.data.description || 'AI-generated landing page content.',
        content,
        wordCount: res.data.wordCount || targetWordCount,
        seoScore: res.data.seoScore || 92,
        images: res.data.suggestedImages || 4,
        affiliateLinks: res.data.affiliateOpportunities || activeNetworks.length,
        isDemoContent: false,
        apiProvider: res.data.apiProvider || apiProvider,
        template: selectedTemplate
      });
    } catch (e) {
      console.error('Generation error:', e);
      setError(e.message || 'Failed to generate content.');
      setGeneratedPage(generateDemoContent(inputValue));
    } finally {
      setIsGenerating(false);
    }
  };

  // ===== Small components =====
  const StatusBadge = () => {
    const map = {
      connected: { color: 'bg-green-500/10 text-green-300 border-green-400/40', text: 'API Connected', icon: CheckCircle },
      development: { color: 'bg-yellow-500/10 text-yellow-300 border-yellow-400/40', text: 'Development Mode', icon: AlertCircle },
      error: { color: 'bg-red-500/10 text-red-300 border-red-400/40', text: 'API Error', icon: AlertCircle },
      checking: { color: 'bg-blue-500/10 text-blue-300 border-blue-400/40', text: 'Checking…', icon: Loader2 },
    };
    const cfg = map[apiStatus] || map.checking;
    const Icon = cfg.icon;
    return (
      <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-2 ${cfg.color}`}>
        <Icon className={`w-3 h-3 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />
        {cfg.text}
      </div>
    );
  };

  const AffiliateLinksManager = () => (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
      <div className="flex items-center mb-4">
        <LinkIcon className="w-5 h-5 mr-2 text-green-400" />
        <h3 className="text-white font-semibold">Your Affiliate Links</h3>
      </div>

      {[
        { key: 'clickbank', label: 'ClickBank', fields: [
          { f: 'hoplink', ph: 'Hoplink (yourid)' },
          { f: 'tid', ph: 'Tracking ID (optional)' },
        ]},
        { key: 'warriorplus', label: 'Warrior Plus', fields: [
          { f: 'affid', ph: 'Affiliate ID' },
          { f: 'product', ph: 'Product ID' },
        ]},
        { key: 'jvzoo', label: 'JVZoo', fields: [
          { f: 'affiliate', ph: 'Affiliate Username' },
          { f: 'vendor', ph: 'Vendor Username' },
        ]},
        { key: 'amazon', label: 'Amazon Associates', fields: [
          { f: 'tag', ph: 'Tracking Tag (mysite-20)' },
          { f: 'asin', ph: 'Default ASIN (optional)' },
        ]},
      ].map(block => (
        <div key={block.key} className="p-4 bg-white/5 rounded-lg mb-3">
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={affiliateLinks[block.key]?.enabled || false}
                onChange={e => setAffiliateLinks(prev => ({
                  ...prev,
                  [block.key]: { ...prev[block.key], enabled: e.target.checked }
                }))}
              />
              <span className="text-white font-medium">{block.label}</span>
            </label>
            <span className="text-2xl">🔗</span>
          </div>
          {affiliateLinks[block.key]?.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {block.fields.map(field => (
                <input
                  key={field.f}
                  type="text"
                  placeholder={field.ph}
                  value={affiliateLinks[block.key]?.[field.f] || ''}
                  onChange={e => setAffiliateLinks(prev => ({
                    ...prev,
                    [block.key]: { ...prev[block.key], [field.f]: e.target.value }
                  }))}
                  className="w-full bg-slate-800 border border-slate-600 text-white rounded px-3 py-2 text-sm"
                />
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={() => {
          localStorage.setItem('affiliate_links', JSON.stringify(affiliateLinks));
          alert('Affiliate links saved!');
        }}
        className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg hover:from-green-500 hover:to-green-700 flex items-center justify-center gap-2"
      >
        Save Affiliate Settings
      </button>
    </div>
  );

  const PromptLibraryBrowser = () => {
    const filtered = Object.entries(PROMPT_LIBRARY)
      .filter(([cat]) => !selectedPromptCategory || cat === selectedPromptCategory)
      .flatMap(([cat, items]) =>
        items
          .filter(p =>
            !searchPrompt ||
            p.title.toLowerCase().includes(searchPrompt.toLowerCase()) ||
            p.prompt.toLowerCase().includes(searchPrompt.toLowerCase())
          )
          .map(p => ({ ...p, category: cat }))
      );

    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Prompt Library</h2>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search prompts…"
              value={searchPrompt}
              onChange={(e) => setSearchPrompt(e.target.value)}
              className="w-full px-3 py-3 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-blue-400"
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

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filtered.map(p => (
            <div
              key={`${p.category}-${p.id}`}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedPrompt(p);
                setInputType('prompt');
                setInputValue(p.prompt);
                setActiveTab('generate');
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-medium">{p.title}</h3>
                <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded">
                  {p.category}
                </span>
              </div>
              <p className="text-sm text-gray-300 line-clamp-2">{p.prompt}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400">No prompts found.</div>
          )}
        </div>
      </div>
    );
  };

  // ===== UI =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      {/* background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-15 rounded-full blur-3xl animate-pulse" />
        </div>
      </div>

      {/* header */}
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
                <p className="text-sm text-gray-300">AI-Powered Landing Page & Funnel Builder</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <StatusBadge />
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
      </div>

      {/* tabs */}
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
                {tab === 'templates' && <><Layers className="inline w-4 h-4 mr-2" />Templates</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* main */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-300">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Generate */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* left */}
            <div className="lg:col-span-1 space-y-6">
              {/* template */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <Layers className="w-5 h-5 mr-2 text-yellow-400" />
                  <h3 className="text-white font-semibold">Funnel Template</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {FUNNEL_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-3 rounded-lg text-center transition-all border ${
                        selectedTemplate === t.id
                          ? 'bg-yellow-400/20 border-yellow-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-2xl mb-1">{t.icon}</div>
                      <div className="text-[11px] leading-tight text-white">{t.name.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* content source */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <Globe className="w-5 h-5 mr-2 text-blue-400" />
                  <h3 className="text-white font-semibold">Content Source</h3>
                </div>

                <div className="flex bg-white/5 rounded-lg p-1 mb-4">
                  {['keyword', 'url', 'prompt'].map(type => (
                    <button
                      key={type}
                      onClick={() => { setInputType(type); setSelectedPrompt(null); }}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        inputType === type ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>

                {selectedPrompt && (
                  <div className="mb-3 p-3 bg-purple-500/20 rounded-lg border border-purple-400/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-purple-300">Using Prompt:</span>
                      <button onClick={() => setSelectedPrompt(null)} className="text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-white font-medium">{selectedPrompt.title}</p>
                  </div>
                )}

                {inputType === 'prompt' ? (
                  <textarea
                    placeholder="Enter your custom prompt or pick one from the library…"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full h-24 bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={inputType === 'keyword' ? 'Enter keyword…' : 'Enter URL…'}
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
                  {CLICKBANK_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <select
                    value={apiProvider}
                    onChange={(e) => setApiProvider(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>

                  <select
                    value={targetWordCount}
                    onChange={(e) => setTargetWordCount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
                  >
                    <option value="500">500 (Fast)</option>
                    <option value="800">800 (Quick)</option>
                    <option value="1200">1,200 (Standard)</option>
                    <option value="1500">1,500 (Extended)</option>
                    <option value="2000">2,000 (Pro — may timeout)</option>
                  </select>
                </div>

                <div className="mt-3 bg-blue-500/10 rounded-lg border border-blue-500/30 p-3">
                  <p className="text-xs text-blue-300 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    In production, copy is generated by your server with your API keys.
                  </p>
                </div>
              </div>

              {/* affiliates */}
              <AffiliateLinksManager />

              <button
                onClick={handleGenerate}
                disabled={!inputValue || isGenerating}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Generate {selectedTemplate} Funnel
                  </>
                )}
              </button>
            </div>

            {/* right */}
            <div className="lg:col-span-2 space-y-6">
              {!generatedPage && !isGenerating && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center py-16 px-8">
                  <div className="w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                    <TrendingUp className="w-16 h-16 text-black" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Ready to Create?</h3>
                  <p className="text-cyan-300 max-w-md mx-auto text-lg">
                    Enter a keyword, URL or prompt, choose a template, and generate a full landing page with affiliate placements.
                  </p>
                </div>
              )}

              {isGenerating && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl text-center py-16 px-8">
                  <div className="w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-spin">
                    <Zap className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Crafting Your Page…</h3>
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Applying template…</span>
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Embedding affiliate links…</span>
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
                        <button
                          onClick={() => {
                            const blob = new Blob(
                              [generatedPage.content],
                              { type: 'text/html;charset=utf-8' }
                            );
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'landing.html';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
                          title="Export HTML"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <a
                          href="about:blank"
                          onClick={(e) => {
                            e.preventDefault();
                            const w = window.open('', '_blank');
                            w.document.write(generatedPage.content);
                            w.document.close();
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg text-white"
                        >
                          Preview
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="text-2xl font-bold text-yellow-400">{generatedPage.wordCount}</div>
                        <div className="text-sm text-gray-300">Words</div>
                      </div>
                      <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="text-2xl font-bold text-green-400">{generatedPage.seoScore}</div>
                        <div className="text-sm text-gray-300">SEO Score</div>
                      </div>
                      <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="text-2xl font-bold text-blue-400">{generatedPage.images}</div>
                        <div className="text-sm text-gray-300">Images</div>
                      </div>
                      <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="text-2xl font-bold text-purple-400">{generatedPage.affiliateLinks}</div>
                        <div className="text-sm text-gray-300">Affiliate Spots</div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div
                        className="prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: generatedPage.content }}
                      />
                    </div>

                    <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2 text-green-300">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">
                          {generatedPage.isDemoContent
                            ? 'Demo content shown — connect your backend/API to generate real copy.'
                            : 'Generated content ready to use.'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompts */}
        {activeTab === 'prompts' && <PromptLibraryBrowser />}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FUNNEL_TEMPLATES.map(t => (
              <div
                key={t.id}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 cursor-pointer transition-all"
                onClick={() => { setSelectedTemplate(t.id); setActiveTab('generate'); }}
              >
                <div className="text-5xl mb-4">{t.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{t.name}</h3>
                <p className="text-gray-300 mb-4">{t.desc}</p>
                <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg hover:from-purple-500 hover:to-purple-700">
                  Use This Template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* settings modal */}
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
                placeholder="OpenAI API Key (stored locally)"
                value={userApiKeys.openai}
                onChange={(e) => setUserApiKeys({ ...userApiKeys, openai: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2"
              />
              <input
                type="password"
                placeholder="Anthropic API Key (stored locally)"
                value={userApiKeys.anthropic}
                onChange={(e) => setUserApiKeys({ ...userApiKeys, anthropic: e.target.value })}
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
                Save Settings (Local)
              </button>
              <p className="text-xs text-gray-400">
                Keys saved here are only for your browser. In production, keys should live on the server.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
