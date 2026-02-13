
import React, { useState, useEffect } from 'react';
import { Thought, ThoughtStatus, Weight, Language, CalendarProvider } from './types';
import Nebula from './components/Nebula';
import ActionList from './components/ActionList';
import StillnessView from './components/StillnessView';
import SieveModal from './components/SieveModal';
import SettingsModal from './components/SettingsModal';
import MenuDrawer from './components/MenuDrawer';
import InputBar from './components/InputBar';
import Toast from './components/Toast';
import { t } from './locales';
import { fetchCalendarContext, CalendarSummary } from './services/googleService';

const APP_VERSION = "1.2.0";

function App() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [selectedThought, setSelectedThought] = useState<Thought | null>(null);
  const [view, setView] = useState<'NEBULA' | 'LIST' | 'STILLNESS'>('NEBULA');
  const [calendarProvider, setCalendarProvider] = useState<CalendarProvider>(null);
  const [calendarContext, setCalendarContext] = useState<CalendarSummary | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lang, setLang] = useState<Language>('en'); 
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [undoAction, setUndoAction] = useState<{
    message: string;
    restore: () => void;
  } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    // Correctly using removeEventListener to clean up the resize listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('flux_thoughts');
    let loadedThoughts: Thought[] = [];
    if (saved) {
      loadedThoughts = JSON.parse(saved);
    } else {
      loadedThoughts = [
        { id: '1', content: 'What if the stock market crashes next month?', createdAt: Date.now(), status: ThoughtStatus.UNSORTED, r: 50 },
        { id: '2', content: 'Finishing the project proposal by Friday', createdAt: Date.now(), status: ThoughtStatus.UNSORTED, r: 45 },
        { id: '3', content: 'That awkward comment I made during dinner', createdAt: Date.now(), status: ThoughtStatus.UNSORTED, r: 42 },
        { id: '4', content: 'Booking a flight for my summer vacation', createdAt: Date.now(), status: ThoughtStatus.UNSORTED, r: 48 },
        { id: '5', content: 'The neighbor\'s loud music late at night', createdAt: Date.now(), status: ThoughtStatus.UNSORTED, r: 40 },
      ];
    }

    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const filtered = loadedThoughts.filter(t => {
      if (t.status === ThoughtStatus.COMPLETED && t.completedAt) {
        return now - t.completedAt < oneDay;
      }
      return true;
    });
    setThoughts(filtered);
    
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

  const connectCalendar = (provider: CalendarProvider) => {
    setCalendarProvider(provider);
    if (provider) {
      localStorage.setItem('flux_calendar_provider', provider);
      handleSyncCalendar();
    } else {
      localStorage.removeItem('flux_calendar_provider');
      setCalendarContext(null);
    }
  };

  const addThought = (content: string) => {
    const newThought: Thought = {
      id: Date.now().toString(),
      content,
      createdAt: Date.now(),
      status: ThoughtStatus.UNSORTED,
      r: 45 + Math.random() * 25
    };
    setThoughts(prev => [...prev, newThought]);
  };

  const handleSort = (id: string, status: ThoughtStatus, weight?: Weight, reframing?: string, dueDate?: number) => {
    const originalThought = thoughts.find(t => t.id === id);
    if (!originalThought) return;

    if (status === ThoughtStatus.RELEASED) {
      handleRelease(originalThought);
      return;
    }

    setThoughts(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status, weight, reframedContent: reframing, dueDate };
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

  const handleRelease = (thought: Thought) => {
    setThoughts(prev => prev.filter(t => t.id !== thought.id));
    setUndoAction({
      message: lang === 'zh' ? "思想已从意识中抹除" : "Thought vanished from consciousness",
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
    const originalStatus = thought.status;
    setThoughts(prev => prev.map(t => 
      t.id === thought.id 
        ? { ...t, status: ThoughtStatus.COMPLETED, completedAt: Date.now() } 
        : t
    ));
    
    setUndoAction({
      message: t('toastComplete', lang),
      restore: () => {
        setThoughts(prev => prev.map(t => 
          t.id === thought.id 
            ? { ...t, status: originalStatus, completedAt: undefined } 
            : t
        ));
      }
    });
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
          <div className="hidden md:flex items-center gap-2 mb-1 px-3 py-1 bg-white/5 rounded-full border border-white/5 opacity-40">
             <span className="text-[8px] font-black uppercase tracking-widest">{view}</span>
             <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
          </div>
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
            isCalendarConnected={!!calendarProvider}
            lang={lang}
          />
        )}

        {view === 'STILLNESS' && (
          <StillnessView 
            thoughts={thoughts}
            lang={lang}
            onClearStillness={handleClearStillness}
          />
        )}
      </main>

      {view === 'NEBULA' && <InputBar onSubmit={addThought} lang={lang} />}
      
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
        onConnectCalendar={connectCalendar}
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
