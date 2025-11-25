

import React, { useState, useEffect, useMemo } from 'react';
import { AppState, ScientificFact, InfographicItem, Language, AIStudio, Audience, ImageModelType } from './types';
import { generateScientificFacts, generateInfographicPlan, generateInfographicImage, generateFactFromConcept } from './services/geminiService';
import { uploadImageToStorage } from './services/imageUploadService';
import { FactCard } from './components/FactCard';
import { GalleryGrid } from './components/GalleryGrid';
import { ImageModal } from './components/ImageModal';
import { Atom, ArrowRight, BookOpen, Loader2, Sparkles, Image as ImageIcon, ArrowLeft, Key, Lightbulb, Filter, Search, Grid3X3, Terminal, Rocket, Star, GraduationCap, Baby, Zap } from 'lucide-react';
import { db } from './db';
import { tx, id } from "@instantdb/react";
import { getTranslation } from './translations';
import { IMAGE_MODEL_FLASH, IMAGE_MODEL_PRO } from './constants';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [audience, setAudience] = useState<Audience>('young');
  const [imageModel, setImageModel] = useState<ImageModelType>(IMAGE_MODEL_PRO);
  const [appState, setAppState] = useState<AppState>('input');
  
  // Search State
  const [searchMode, setSearchMode] = useState<'domain' | 'concept'>('domain');
  const [query, setQuery] = useState('');

  const [facts, setFacts] = useState<ScientificFact[]>([]);
  const [selectedFact, setSelectedFact] = useState<ScientificFact | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentPlan, setCurrentPlan] = useState('');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  
  // Gallery Filter State
  const [filterDomain, setFilterDomain] = useState<string>('All');
  
  // Modal State
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<InfographicItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  const t = getTranslation(language);

  // Database Query
  const { isLoading: isLoadingGallery, error: galleryError, data } = db.useQuery({ 
    infographics: {} 
  });
  
  // Flatten DB data to match InfographicItem[]
  const gallery: InfographicItem[] = useMemo(() => {
    if (!data?.infographics) return [];
    
    return Object.values(data.infographics).map((item: any) => ({
        id: item.id,
        timestamp: item.timestamp,
        imageUrl: item.imageUrl,
        plan: item.plan,
        fact: {
            title: item.title,
            domain: item.domain,
            text: item.text
        }
    })).sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [data]);

  // Derived state for domains
  const uniqueDomains = useMemo(() => {
    const domains = new Set(gallery.map(item => item.fact.domain));
    return Array.from(domains).sort();
  }, [gallery]);

  // Derived state for filtered items
  const filteredGallery = useMemo(() => {
    if (filterDomain === 'All') return gallery;
    return gallery.filter(item => item.fact.domain === filterDomain);
  }, [gallery, filterDomain]);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    if (aistudio) {
        try {
            const hasKey = await aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        } catch (e) {
            console.error("Error checking API key:", e);
            setHasApiKey(false);
        }
    } else {
         // Fallback for environments where aistudio is not injected
         setHasApiKey(true);
    }
    setIsCheckingKey(false);
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio as AIStudio | undefined;
    if (aistudio) {
        try {
            await aistudio.openSelectKey();
            setHasApiKey(true);
        } catch (e: any) {
            if (e.message && e.message.includes("Requested entity was not found")) {
                 setHasApiKey(false);
                 alert("Session expired. Please select the key again.");
            }
            console.error("Error selecting key:", e);
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (searchMode === 'domain') {
        await handleDomainSubmit();
    } else {
        await handleConceptSubmit();
    }
  };

  const handleDomainSubmit = async () => {
    setLoading(true);
    setLoadingMessage(`${t.loadingConsulting} (${query})...`);
    
    try {
      const generatedFacts = await generateScientificFacts(query, language, audience);
      setFacts(generatedFacts);
      setAppState('selection');
    } catch (error) {
      alert(`${t.errorGenFacts}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConceptSubmit = async () => {
    setLoading(true);
    setLoadingMessage(`${t.loadingResearching} (${query})...`);
    
    try {
      const fact = await generateFactFromConcept(query, language, audience);
      // Skip selection, go straight to processing
      await processFactToInfographic(fact);
    } catch (error) {
      alert(`${t.errorGenConcept}`);
      setLoading(false);
    }
  };

  const handleFactSelect = async (fact: ScientificFact) => {
    await processFactToInfographic(fact);
  };

  const processFactToInfographic = async (fact: ScientificFact) => {
    setSelectedFact(fact);
    setAppState('planning');
    setLoading(true);
    
    try {
      setLoadingMessage(t.loadingPlanning);
      const plan = await generateInfographicPlan(fact, language, audience);
      setCurrentPlan(plan);
      
      setAppState('generating');
      setLoadingMessage(t.loadingRendering);
      
      const image = await generateInfographicImage(plan, imageModel);
      setCurrentImage(image);
      setAppState('result');
      
    } catch (error) {
       console.error(error);
       alert(t.errorGenImage);
       setAppState('input');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedFact && currentImage && currentPlan) {
      setLoading(true);
      setLoadingMessage(t.loadingSaving);
      
      try {
        const newItemId = id();
        
        // This will try ImageKit, but return Base64 if it fails so we ALWAYS save
        const imageUrlToSave = await uploadImageToStorage(currentImage, `${newItemId}.png`);
        
        const isUrl = imageUrlToSave.startsWith('http');
        console.log(`Saving to DB. Source: ${isUrl ? 'ImageKit Cloud' : 'Local Base64'}`);

        // Save metadata to InstantDB
        db.transact(tx.infographics[newItemId].update({
            id: newItemId,
            timestamp: Date.now(),
            title: selectedFact.title,
            domain: selectedFact.domain,
            text: selectedFact.text,
            plan: currentPlan,
            imageUrl: imageUrlToSave
        }));
        
        setAppState('gallery');
      } catch (e: any) {
        console.error("Save Operation Failed:", e);
        alert(`${t.errorSave}: ${e.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const updateGalleryItem = (updatedItem: InfographicItem) => {
    // For local updates within the modal before DB sync reflects
    setSelectedGalleryItem(updatedItem);
    
    // Update DB
    db.transact(tx.infographics[updatedItem.id].update({
        imageUrl: updatedItem.imageUrl
    }));
  };

  const renderHeader = () => (
    <header className="w-full h-20 bg-indigo-950/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 border-b border-white/5">
      <div 
        className="flex items-center gap-3 cursor-pointer group" 
        onClick={() => setAppState('input')}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
          <Atom className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight font-space text-white leading-none">
            Science<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Snap</span>
            </span>
            <button 
                onClick={(e) => { e.stopPropagation(); setAudience(audience === 'young' ? 'adult' : 'young'); }}
                className="text-[10px] font-mono tracking-widest uppercase flex items-center gap-1 mt-1 hover:text-white transition-colors text-indigo-300"
            >
                {audience === 'young' ? (
                    <span className="flex items-center gap-1 text-cyan-400"><Baby className="w-3 h-3" /> {t.audienceKids}</span>
                ) : (
                    <span className="flex items-center gap-1 text-fuchsia-400"><GraduationCap className="w-3 h-3" /> {t.audienceAdults}</span>
                )}
            </button>
        </div>
      </div>

      <nav className="flex items-center gap-3">
        {/* Model Toggle */}
        <div className="hidden md:flex bg-indigo-900/50 rounded-full border border-white/10 p-1 mr-2">
            <button 
                onClick={() => setImageModel(IMAGE_MODEL_FLASH)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${imageModel === IMAGE_MODEL_FLASH ? 'bg-amber-400 text-indigo-950 shadow-lg' : 'text-indigo-300 hover:text-white'}`}
                title={t.modelFlash}
            >
                <Zap className="w-3 h-3" />
                <span className="hidden lg:inline">Flash</span>
            </button>
            <button 
                onClick={() => setImageModel(IMAGE_MODEL_PRO)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all flex items-center gap-1 ${imageModel === IMAGE_MODEL_PRO ? 'bg-fuchsia-500 text-white shadow-lg' : 'text-indigo-300 hover:text-white'}`}
                title={t.modelPro}
            >
                <Sparkles className="w-3 h-3" />
                <span className="hidden lg:inline">Pro</span>
            </button>
        </div>

        {/* Language Toggle - Compact */}
        <div className="flex bg-indigo-900/50 rounded-full border border-white/10 p-1">
            <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'en' ? 'bg-white text-indigo-950' : 'text-indigo-200 hover:text-white'}`}
            >
                EN
            </button>
            <button 
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${language === 'fr' ? 'bg-white text-indigo-950' : 'text-indigo-200 hover:text-white'}`}
            >
                FR
            </button>
        </div>

        <button 
            onClick={() => setAppState('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all shadow-md ${
            appState === 'gallery' 
                ? 'bg-fuchsia-600 border-fuchsia-500 text-white shadow-fuchsia-500/30' 
                : 'bg-indigo-800/50 border-white/10 hover:bg-indigo-700/50 text-indigo-200 hover:text-white'
            }`}
        >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">{t.gallery}</span>
        </button>
      </nav>
    </header>
  );

  if (isCheckingKey) {
    return (
        <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Warming up engines...</span>
            </div>
        </div>
    );
  }

  if (!hasApiKey) {
    return (
        <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-indigo-900 p-8 rounded-2xl border border-indigo-700 shadow-2xl shadow-black/50">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Key className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2 font-space text-center">Parental Unlock</h1>
                <p className="text-indigo-200 mb-8 text-center leading-relaxed">
                    To start our science journey, we need a magic key from Google! Ask a parent to help you unlock the app.
                </p>
                <button 
                    onClick={handleSelectKey}
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/30 text-lg"
                >
                    Add Magic Key
                </button>
            </div>
        </div>
    );
  }

  const getPlaceholder = () => {
    switch (searchMode) {
      case 'domain': return t.placeholderDomain;
      case 'concept': return t.placeholderConcept;
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-indigo-950 to-black text-white font-inter">
      {renderHeader()}

      <main className="container mx-auto px-4 py-12 max-w-6xl relative">
        
        {/* Background Decor */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -z-10"></div>

        {/* Loader Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-950/90 backdrop-blur-md transition-all">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-30 animate-ping"></div>
                <Rocket className="relative w-16 h-16 text-white animate-bounce mb-6" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 font-space tracking-wide">Launching Mission...</h2>
            <p className="text-cyan-300 font-mono text-sm uppercase tracking-widest">{loadingMessage}</p>
          </div>
        )}

        {/* View: Input */}
        {appState === 'input' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-4xl mx-auto animate-fade-in">
            
            <div className="text-center mb-10 space-y-4 relative">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-sm text-xs font-bold mb-2 transition-colors ${audience === 'young' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300'}`}>
                    <Star className={`w-3 h-3 ${audience === 'young' ? 'fill-cyan-300' : 'fill-fuchsia-300'}`} />
                    {audience === 'young' ? 'AI for Future Scientists' : 'AI for Lifelong Learners'}
                </div>
                <h2 className="text-5xl md:text-7xl font-bold font-space tracking-tight text-white drop-shadow-lg">
                    {t.heroTitlePrefix} <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400">{t.heroTitleHighlight}</span>
                </h2>
                <p className="text-indigo-200 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                    {t.heroSubtitle}
                </p>
            </div>

            <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl shadow-indigo-500/20 ring-1 ring-white/20">
                {/* Integrated Tabs */}
                <div className="flex gap-2 mb-3 p-1 bg-black/20 rounded-2xl">
                    <button
                        onClick={() => { setSearchMode('domain'); setQuery(''); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            searchMode === 'domain' 
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' 
                            : 'text-indigo-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <BookOpen className="w-4 h-4" />
                        {t.tabDomain}
                    </button>
                    <button
                        onClick={() => { setSearchMode('concept'); setQuery(''); }}
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                            searchMode === 'concept' 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                            : 'text-indigo-300 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Lightbulb className="w-4 h-4" />
                        {t.tabConcept}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="relative group">
                    <div className="relative flex items-center bg-indigo-950/50 rounded-2xl border border-indigo-500/30 focus-within:border-cyan-400 transition-all focus-within:ring-2 focus-within:ring-cyan-400/20">
                        <Search className="w-6 h-6 text-indigo-400 ml-4" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={getPlaceholder()}
                            className="flex-1 bg-transparent border-none text-white px-4 py-5 focus:outline-none placeholder-indigo-400 font-medium text-lg"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={!query.trim()}
                            className="mr-2 px-6 py-3 bg-white text-indigo-950 rounded-xl font-bold hover:bg-cyan-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wide text-sm shadow-lg"
                        >
                            {searchMode === 'domain' ? 'Start' : 'Go!'}
                        </button>
                    </div>
                </form>
            </div>
          </div>
        )}

        {/* View: Fact Selection */}
        {appState === 'selection' && (
           <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                <div>
                    <button onClick={() => setAppState('input')} className="flex items-center gap-2 text-indigo-300 hover:text-white mb-2 text-sm font-bold transition-colors bg-white/5 px-3 py-1 rounded-full w-fit">
                        <ArrowLeft className="w-4 h-4" /> {t.backToInput}
                    </button>
                    <h2 className="text-3xl font-bold font-space text-white">{t.discoveriesIn} <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">{query}</span></h2>
                </div>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {facts.map((fact, index) => (
                <FactCard 
                  key={index} 
                  fact={fact} 
                  index={index} 
                  onSelect={handleFactSelect}
                  labels={{ factLabel: t.factCardLabel, createBtn: t.btnCreateInfographic }}
                />
              ))}
            </div>
          </div>
        )}

        {/* View: Result */}
        {appState === 'result' && currentImage && selectedFact && (
          <div className="flex flex-col lg:flex-row gap-8 animate-fade-in min-h-[80vh]">
             <div className="w-full lg:w-1/3 flex flex-col h-full order-2 lg:order-1">
                <div className="mb-6">
                    <button onClick={() => setAppState(searchMode === 'domain' ? 'selection' : 'input')} className="flex items-center gap-2 text-indigo-300 hover:text-white mb-4 text-sm font-bold bg-white/5 px-4 py-2 rounded-full w-fit transition-colors">
                        <ArrowLeft className="w-4 h-4" /> {t.backToInput}
                    </button>
                    <h2 className="text-3xl font-bold font-space text-white mb-1">Mission Accomplished!</h2>
                    <p className="text-indigo-200 text-sm">{t.basedOn} <span className="font-bold text-cyan-300">{selectedFact.title}</span></p>
                </div>

                <div className="bg-indigo-900/30 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col overflow-hidden flex-grow shadow-xl">
                    <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" />
                            {t.aiPlan}
                        </h3>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar max-h-[300px]">
                        <div className="font-mono text-xs text-indigo-200 whitespace-pre-wrap leading-relaxed opacity-80">
                             {currentPlan}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button 
                        onClick={() => processFactToInfographic(selectedFact)}
                        className="py-4 px-4 rounded-2xl border border-white/20 hover:bg-white/10 text-white transition-colors text-sm font-bold flex items-center justify-center gap-2 backdrop-blur-sm"
                    >
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        {t.btnRegenerate}
                    </button>
                    <button 
                        onClick={handleSave}
                        className="py-4 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:brightness-110 transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/30"
                    >
                        <ImageIcon className="w-5 h-5" />
                        {t.btnSave}
                    </button>
                </div>
             </div>

             <div className="w-full lg:w-2/3 bg-black/20 rounded-3xl border border-white/10 flex items-center justify-center p-8 relative overflow-hidden order-1 lg:order-2 group backdrop-blur-xl">
                 {/* Grid Background Pattern */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                 
                 <img 
                    src={currentImage} 
                    alt="Generated Infographic" 
                    className="relative z-10 max-h-[70vh] w-auto rounded-lg shadow-2xl shadow-black/50 border-4 border-white/10 transform transition-transform duration-700 hover:scale-[1.02]"
                 />
             </div>
          </div>
        )}

        {/* View: Gallery */}
        {appState === 'gallery' && (
          <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-4xl font-bold font-space text-white mb-2 flex items-center gap-3">
                        {t.galleryTitle} <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-spin-slow" />
                    </h2>
                    <p className="text-indigo-200 text-sm">Your personal museum of science art.</p>
                </div>
                <button 
                    onClick={() => setAppState('input')}
                    className="px-6 py-3 bg-white text-indigo-950 rounded-full font-bold hover:bg-cyan-50 transition-colors text-sm flex items-center gap-2 shadow-lg shadow-white/10"
                >
                    <Sparkles className="w-4 h-4 text-fuchsia-500" />
                    {t.btnCreateNew}
                </button>
            </header>

            {/* Filter Section - Improved UI */}
            {gallery.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-8 bg-white/5 p-2 rounded-2xl w-fit">
                    <div className="flex items-center gap-2 text-indigo-300 ml-2 mr-2">
                        <Filter className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Filter:</span>
                    </div>
                    <button 
                        onClick={() => setFilterDomain('All')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                            filterDomain === 'All' 
                            ? 'bg-fuchsia-500 text-white shadow-md' 
                            : 'bg-transparent text-indigo-300 hover:bg-white/5'
                        }`}
                    >
                        {t.filterAll}
                    </button>
                    {uniqueDomains.map(domain => (
                        <button 
                            key={domain}
                            onClick={() => setFilterDomain(domain)}
                            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                                filterDomain === domain
                                ? 'bg-cyan-500 text-white shadow-md' 
                                : 'bg-transparent text-indigo-300 hover:bg-white/5'
                            }`}
                        >
                            {domain}
                        </button>
                    ))}
                </div>
            )}
            
            {isLoadingGallery ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin" />
                </div>
            ) : (
                <GalleryGrid 
                    items={filteredGallery} 
                    emptyMessage={t.galleryEmpty}
                    onItemClick={(item) => {
                        setSelectedGalleryItem(item);
                        setIsModalOpen(true);
                    }} 
                />
            )}
          </div>
        )}

      </main>

      <ImageModal 
        item={selectedGalleryItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={updateGalleryItem}
        model={imageModel}
        labels={{
            details: t.modalDetails,
            domain: t.modalDomain,
            title: t.modalTitle,
            fact: t.modalFact,
            editLabel: t.modalEditLabel,
            placeholderEdit: t.placeholderEdit,
            download: t.btnDownload,
            downloading: t.downloading,
            applyingMagic: t.applyingMagic
        }}
      />
    </div>
  );
};

export default App;