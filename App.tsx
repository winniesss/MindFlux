
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

const APP_VERSION = "1.5.1";

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
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    // Fixed removeResizeListener to removeEventListener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('flux_thoughts');
    if (saved) setThoughts(JSON.parse(saved));
    const savedLang = localStorage.getItem('flux_lang') as Language;
    if (savedLang) setLang(savedLang || 'en');
    const savedCal = localStorage.getItem('flux_calendar_provider') as CalendarProvider;
    if (savedCal) setCalendarProvider(savedCal);
  }, []);

  useEffect(() => {
    localStorage.setItem('flux_thoughts', JSON.stringify(thoughts));
  }, [thoughts]);

  const addThought = async (content: string) => {
    if (isExploding) return;
    setIsExploding(true);
    try {
      const explodedNodes = await splitChaos(content, lang);
      if (explodedNodes.length === 1 && (explodedNodes[0].content === content || !explodedNodes[0].content)) {
        const newThought: Thought = {
          id: Date.now().toString(),
          content: content.trim(),
          createdAt: Date.now(),
          status: ThoughtStatus.UNSORTED,
          r: 45 + Math.random() * 15
        };
        setThoughts(prev => [...prev, newThought]);
      } else {
        const newThoughts: Thought[] = explodedNodes.map((node, index) => ({
          id: (Date.now() + index).toString(),
          content: node.content || "",
          createdAt: Date.now(),
          status: ThoughtStatus.UNSORTED,
          r: 40 + Math.random() * 20
        }));
        setPendingThoughts(newThoughts);
      }
    } catch (e) {
      setThoughts(prev => [...prev, { id: Date.now().toString(), content, createdAt: Date.now(), status: ThoughtStatus.UNSORTED, r: 50 }]);
    } finally {
      setIsExploding(false);
    }
  };

  const handleSetCalendar = (provider: CalendarProvider) => {
    setCalendarProvider(provider);
    if (provider) localStorage.setItem('flux_calendar_provider', provider);
    else localStorage.removeItem('flux_calendar_provider');
  };

  const confirmPendingThoughts = (selectedIds: string[]) => {
    const confirmed = pendingThoughts.filter(t => selectedIds.includes(t.id));
    setThoughts(prev => [...prev, ...confirmed]);
    setPendingThoughts([]);
  };

  const handleSort = (id: string, status: ThoughtStatus, weight?: Weight, reframing?: string, dueDate?: number, subTasks?: SubTask[], stoicQuote?: string, timeEstimate?: string) => {
    setThoughts(prev => prev.map(t => t.id === id ? { ...t, status, weight, reframedContent: reframing, dueDate, subTasks, stoicQuote, timeEstimate, visualState: status === ThoughtStatus.LET_ME ? 'solid' : 'smoke' } : t));
  };

  const handleRelease = (thought: Thought) => {
    setThoughts(prev => prev.filter(t => t.id !== thought.id));
    setUndoAction({ message: lang === 'zh' ? "思绪已消散" : "Thought dissipated", restore: () => setThoughts(prev => [...prev, thought]) });
  };

  const unsortedCount = thoughts.filter(t => t.status === ThoughtStatus.UNSORTED).length;
  const actionCount = thoughts.filter(t => t.status === ThoughtStatus.LET_ME).length;
  const stillnessCount = thoughts.filter(t => t.status === ThoughtStatus.LET_THEM).length;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-950 text-white overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-40 px-6 pt-[max(1rem,env(safe-area-inset-top))] h-24 flex justify-between items-center pointer-events-none">
        <h1 onClick={() => setView('NEBULA')} className="pointer-events-auto text-2xl md:text-5xl font-black tracking-tighter cursor-pointer active:scale-95 drop-shadow-2xl">FLUX</h1>
        <button onClick={() => setIsMenuOpen(true)} className="pointer-events-auto w-10 h-10 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1 active:scale-90 shadow-lg">
           <div className="w-5 h-0.5 bg-white rounded-full"></div>
           <div className="w-5 h-0.5 bg-white rounded-full"></div>
           <div className="w-5 h-0.5 bg-white rounded-full"></div>
        </button>
      </header>

      <main className="absolute inset-0">
        {view === 'NEBULA' && <Nebula thoughts={thoughts} onThoughtClick={setSelectedThought} onThoughtRelease={handleRelease} width={dimensions.width} height={dimensions.height} lang={lang} />}
        {view === 'LIST' && <ActionList thoughts={thoughts} onComplete={(t) => setThoughts(prev => prev.map(p => p.id === t.id ? { ...p, status: ThoughtStatus.COMPLETED, completedAt: Date.now() } : p))} onUpdateSubtasks={(id, st) => setThoughts(prev => prev.map(p => p.id === id ? { ...p, subTasks: st } : p))} lang={lang} />}
        {view === 'STILLNESS' && <StillnessView thoughts={thoughts} lang={lang} onClearStillness={() => setThoughts(prev => prev.filter(t => t.status !== ThoughtStatus.LET_THEM))} onThoughtVanish={handleRelease} />}
      </main>

      {view === 'NEBULA' && <InputBar onSubmit={addThought} lang={lang} isProcessing={isExploding} />}
      
      <ExplosionReview pendingThoughts={pendingThoughts} onConfirm={confirmPendingThoughts} onCancel={() => setPendingThoughts([])} lang={lang} />
      <SieveModal thought={selectedThought} onClose={() => setSelectedThought(null)} onSort={handleSort} lang={lang} calendarConnected={!!calendarProvider} onConnectCalendar={() => setIsSettingsOpen(true)} />
      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} currentView={view} setView={setView} counts={{ unsorted: unsortedCount, action: actionCount, stillness: stillnessCount }} lang={lang} calendarProvider={calendarProvider} isSyncing={isSyncing} onOpenSettings={() => setIsSettingsOpen(true)} appVersion={APP_VERSION} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} lang={lang} onLanguageChange={(l) => { setLang(l); localStorage.setItem('flux_lang', l); }} currentVersion={APP_VERSION} calendarProvider={calendarProvider} onConnectCalendar={handleSetCalendar} />
      {undoAction && <Toast message={undoAction.message} onUndo={undoAction.restore} onClose={() => setUndoAction(null)} lang={lang} />}
    </div>
  );
}

export default App;
