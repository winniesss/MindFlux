
import React, { useState, useEffect } from 'react';
import { Thought, ThoughtStatus, Weight, Language, CalendarProvider, SubTask } from './types';
import Nebula from './components/Nebula';
import ActionList from './components/ActionList';
import StillnessView from './components/StillnessView';
import SieveModal from './components/SieveModal';
import SettingsModal from './components/SettingsModal';
import MenuDrawer from './components/MenuDrawer';
import InputBar from './components/InputBar';
import ExplosionReview from './components/ExplosionReview';
import Toast from './components/Toast';
import { t } from './locales';
import { fetchCalendarContext, CalendarSummary } from './services/googleService';
import { splitChaos } from './services/geminiService';

const APP_VERSION = "1.4.0";

function App() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [pendingThoughts, setPendingThoughts] = useState<Thought[]>([]);
  const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
  const [view, setView] = useState<'NEBULA' | 'LIST' | 'STILLNESS'>('NEBULA');
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>(null);
  const [calendarContext, setCalendarContext] = useState<CalendarSummary | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lang, setLang] = useState<Language>('en'); 
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  
  const [undoAction, setUndoAction] = useState<{
    message: string;
    restore: () => void;
  } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('flux_thoughts');
    if (saved) {
      setThoughts(JSON.parse(saved));
    }
    
    const savedProvider = localStorage.getItem('flux_calendar_provider') as CalendarProvider;
    if (savedProvider) {
      setCalendarProvider(savedProvider);
      handleSyncCalendar();
    }

    const savedLang = localStorage.getItem('flux_lang') as Language;
    if (savedLang) setLang(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem('flux_thoughts', JSON.stringify(thoughts));
  }, [thoughts]);

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      const context = await fetchCalendarContext();
      setCalendarContext(context);
    } catch (e) {
      console.error("Failed to sync calendar", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('flux_lang', newLang);
  };

  const addThought = async (content: string) => {
    setIsExploding(true);
    try {
      const explodedNodes = await splitChaos(content, lang);
      const newThoughts: Thought[] = explodedNodes.map((node, index) => ({
        id: (Date.now() + index).toString(),
        content: node.content || "",
        createdAt: Date.now(),
        status: ThoughtStatus.UNSORTED,
        r: 45 + Math.random() * 25
      }));
      setPendingThoughts(newThoughts);
    } catch (e) {
      console.error("Semantic Explosion Failed", e);
      const fallback: Thought = {
        id: Date.now().toString(),
        content,
        createdAt: Date.now(),
        status: ThoughtStatus.UNSORTED,
        r: 50
      };
      setThoughts(prev => [...prev, fallback]);
    } finally {
      setIsExploding(false);
    }
  };

  const confirmPendingThoughts = (selectedIds: string[]) => {
    const confirmed = pendingThoughts.filter(t => selectedIds.includes(t.id));
    setThoughts(prev => [...prev, ...confirmed]);
    setPendingThoughts([]);
  };

  const cancelPendingThoughts = () => {
    setPendingThoughts([]);
  };

  const handleSort = (
    id: string, 
    status: ThoughtStatus, 
    weight?: Weight, 
    reframing?: string, 
    dueDate?: number,
    subTasks?: SubTask[],
    stoicQuote?: string
  ) => {
    const originalThought = thoughts.find(t => t.id === id);
    if (!originalThought) return;

    if (status === ThoughtStatus.RELEASED) {
      handleRelease(originalThought);
      return;
    }

    setThoughts(prev => prev.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status, 
          weight, 
          reframedContent: reframing, 
          dueDate,
          subTasks,
          stoicQuote,
          visualState: status === ThoughtStatus.LET_ME ? 'solid' : 'smoke'
        };
      }
      return t;
    }));
    
    const message = status === ThoughtStatus.LET_THEM ? t('toastLetThem', lang) : t('toastLetMe', lang);
    setUndoAction({
      message,
      restore: () => {
        setThoughts(prev => prev.map(t => t.id === id ? originalThought : t));
      }
    });
  };

  const handleUpdateSubtasks = (thoughtId: string, subTasks: SubTask[]) => {
    setThoughts(prev => prev.map(t => 
      t.id === thoughtId ? { ...t, subTasks } : t
    ));
  };

  const handleRelease = (thought: Thought) => {
    setThoughts(prev => prev.filter(t => t.id !== thought.id));
    setUndoAction({
      message: lang === 'zh' ? "思绪已消散" : "Thought dissipated",
      restore: () => {
        setThoughts(prev => [...prev, thought]);
      }
    });
  };

  const handleClearStillness = () => {
    const originalThoughts = [...thoughts];
    setThoughts(prev => prev.filter(t => t.status !== ThoughtStatus.LET_THEM));
    setUndoAction({
      message: t('toastCleanse', lang),
      restore: () => {
        setThoughts(originalThoughts);
      }
    });
  };

  const handleComplete = (thought: Thought) => {
    setThoughts(prev => prev.map(t => 
      t.id === thought.id 
        ? { ...t, status: ThoughtStatus.COMPLETED, completedAt: Date.now() } 
        : t
    ));
  };

  const unsortedCount = thoughts.filter(t => t.status === ThoughtStatus.UNSORTED).length;
  const actionCount = thoughts.filter(t => t.status === ThoughtStatus.LET_ME).length;
  const stillnessCount = thoughts.filter(t => t.status === ThoughtStatus.LET_THEM).length;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
      
      <header className="absolute top-0 left-0 right-0 z-30 px-8 md:px-16 h-24 md:h-32 flex justify-between items-center pointer-events-none safe-area-top">
        <div className="pointer-events-auto flex items-baseline gap-4 group">
          <h1 
            onClick={() => setView('NEBULA')}
            className="text-4xl md:text-5xl font-black tracking-[-0.05em] bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40 transition-all duration-700 group-hover:tracking-widest cursor-pointer active:scale-95 select-none"
          >
            {t('appTitle', lang)}
          </h1>
        </div>
        
        <div className="pointer-events-auto flex items-center gap-4">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/80 border border-white/10 text-white flex flex-col items-center justify-center gap-1 transition-all duration-300 hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-2xl backdrop-blur-xl"
          >
             <div className="w-5 md:w-6 h-0.5 bg-current rounded-full"></div>
             <div className="w-5 md:w-6 h-0.5 bg-current rounded-full"></div>
             <div className="w-5 md:w-6 h-0.5 bg-current rounded-full"></div>
          </button>
        </div>
      </header>

      <main className="absolute inset-0 w-full h-full">
        {view === 'NEBULA' && (
          <Nebula 
            thoughts={thoughts} 
            onThoughtClick={setSelectedThought} 
            onThoughtRelease={handleRelease}
            width={dimensions.width}
            height={dimensions.height}
            lang={lang}
          />
        )}
        
        {view === 'LIST' && (
          <ActionList 
            thoughts={thoughts}
            onComplete={handleComplete}
            onUpdateSubtasks={handleUpdateSubtasks}
            isCalendarConnected={!!calendarProvider}
            lang={lang}
          />
        )}

        {view === 'STILLNESS' && (
          <StillnessView 
            thoughts={thoughts}
            lang={lang}
            onClearStillness={handleClearStillness}
            onThoughtVanish={handleRelease}
          />
        )}

        {isExploding && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 bg-indigo-600/20 border border-indigo-500/30 backdrop-blur-xl rounded-full animate-in slide-in-from-top-4 duration-500">
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shadow-[0_0_8px_#818cf8]"></div>
             <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-indigo-100">Deconstructing Chaos...</p>
          </div>
        )}
      </main>

      {view === 'NEBULA' && <InputBar onSubmit={addThought} lang={lang} isProcessing={isExploding} />}
      
      <ExplosionReview 
        pendingThoughts={pendingThoughts}
        onConfirm={confirmPendingThoughts}
        onCancel={cancelPendingThoughts}
        lang={lang}
      />

      <SieveModal 
        thought={selectedThought} 
        onClose={() => setSelectedThought(null)}
        onSort={handleSort}
        lang={lang}
        calendarSummary={calendarContext?.summary}
      />

      <MenuDrawer 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentView={view}
        setView={setView}
        counts={{ unsorted: unsortedCount, action: actionCount, stillness: stillnessCount }}
        lang={lang}
        calendarProvider={calendarProvider}
        isSyncing={isSyncing}
        onOpenSettings={() => setIsSettingsOpen(true)}
        appVersion={APP_VERSION}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        lang={lang} 
        onLanguageChange={handleLanguageChange}
        currentVersion={APP_VERSION}
        calendarProvider={calendarProvider}
        onConnectCalendar={setCalendarProvider}
      />

      {undoAction && (
        <Toast 
          message={undoAction.message} 
          onUndo={undoAction.restore} 
          onClose={() => setUndoAction(null)} 
          lang={lang}
        />
      )}
    </div>
  );
}

export default App;
