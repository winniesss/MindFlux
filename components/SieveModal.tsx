
import React, { useState, useEffect, useRef } from 'react';
import { Thought, ThoughtStatus, AnalysisResult, Weight, Language, SubTask } from '../types';
import { analyzeThought } from '../services/geminiService';
import { t } from '../locales';

interface SieveModalProps {
  thought: Thought | null;
  onClose: () => void;
  onSort: (id: string, status: ThoughtStatus, weight?: Weight, reframing?: string, dueDate?: number, subTasks?: SubTask[], stoicQuote?: string, timeEstimate?: string) => void;
  lang: Language;
  calendarSummary?: string;
  calendarConnected?: boolean;
  onConnectCalendar?: () => void;
}

const SieveModal: React.FC<SieveModalProps> = ({ thought, onClose, onSort, lang, calendarSummary, calendarConnected, onConnectCalendar }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isPlanConfirmed, setIsPlanConfirmed] = useState(false);
  const [isVanishAnimation, setIsVanishAnimation] = useState(false);
  const [isFittingTask, setIsFittingTask] = useState(false);
  
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

  useEffect(() => {
    if (thought) {
      setLoading(true);
      setDragX(0);
      setDragY(0);
      setShowSchedule(false);
      setIsPlanConfirmed(false);
      setIsVanishAnimation(false);
      setIsFittingTask(false);
      analyzeThought(thought.content, lang, calendarSummary).then(result => {
        setAnalysis(result);
        setLoading(false);
      });
    } else {
      setAnalysis(null);
    }
  }, [thought, lang, calendarSummary]);

  if (!thought) return null;

  const currentCategory = analysis?.category || (thought.visualState === 'smoke' ? 'LET_THEM' : 'LET_ME');
  const isSmoke = currentCategory === 'LET_THEM';

  const resetDragState = () => {
    setDragX(0);
    setDragY(0);
    setIsDragging(false);
  };

  const handleAction = (direction: 'left' | 'right') => {
    if (direction === 'left') {
       onSort(thought.id, ThoughtStatus.LET_THEM, undefined, analysis?.reframing, undefined, [], analysis?.stoicQuote, analysis?.timeEstimate);
       onClose();
    } else if (direction === 'right') {
       setIsPlanConfirmed(true);
       resetDragState();
    }
  };

  const handleConfirmPlan = () => {
    setIsFittingTask(true);
    setTimeout(() => {
      setIsFittingTask(false);
      setShowSchedule(true);
      resetDragState();
    }, 1200);
  };

  const handleCommit = (timeFrame: 'today' | 'tomorrow' | 'weekend') => {
    let date = new Date();
    if (timeFrame === 'tomorrow') date.setDate(date.getDate() + 1);
    if (timeFrame === 'weekend') {
      const day = date.getDay();
      const diff = day === 0 ? 6 : 6 - day; 
      date.setDate(date.getDate() + diff);
    }

    let hours = 10; 
    let minutes = 0;
    
    if (analysis?.suggestedSlot) {
      const slot = analysis.suggestedSlot;
      const matches = slot.match(/(\d{1,2})[:：]?(\d{2})?/);
      if (matches) {
        hours = parseInt(matches[1]);
        if (matches[2]) minutes = parseInt(matches[2]);
        const isPM = slot.toLowerCase().includes('pm') || slot.includes('下午') || slot.includes('晚上');
        if (isPM && hours < 12) hours += 12;
      }
    }
    
    date.setHours(hours, minutes, 0, 0); 

    const subTasks: SubTask[] = (analysis?.subTasks || []).filter(t => t.trim().length > 0).map(text => ({
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false
    }));

    onSort(thought.id, ThoughtStatus.LET_ME, analysis?.weight || Weight.CASUAL, analysis?.reframing, date.getTime(), subTasks, analysis?.stoicQuote, analysis?.timeEstimate);
    onClose();
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (showSchedule || isPlanConfirmed || isFittingTask) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    startXRef.current = clientX;
    startYRef.current = clientY;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || showSchedule || isPlanConfirmed || isFittingTask) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragX(clientX - startXRef.current);
    setDragY(clientY - startYRef.current);
  };

  const handleTouchEnd = () => {
    if (showSchedule || isPlanConfirmed || isFittingTask) return;
    setIsDragging(false);
    const threshold = 100;
    if (dragX > threshold) handleAction('right');
    else if (dragX < -threshold) handleAction('left');
    else { setDragX(0); setDragY(0); }
  };

  const rotation = dragX * 0.1;
  const opacity = Math.max(0, 1 - Math.abs(dragX) / 300 - Math.abs(dragY) / 300);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-3xl p-4 md:p-6 overflow-hidden transition-all duration-1000 ${isVanishAnimation ? 'bg-black' : ''}`}>
      
      <div className="w-full flex items-center justify-between z-[60] pt-[max(0.5rem,env(safe-area-inset-top))] mb-4">
        <div className="w-10"></div>
        <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
             <span className={`w-1.5 h-1.5 rounded-full ${isSmoke ? 'bg-indigo-400 animate-pulse' : 'bg-amber-400'}`}></span>
             <span className="flux-caption !text-[10px]">{isSmoke ? t('letThem', lang) : t('letMe', lang)}</span>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:text-white transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`w-full text-center px-4 mb-6 transition-all duration-700 ${loading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
           {analysis && !showSchedule && !isPlanConfirmed && !isFittingTask && (
             <p className="text-white italic font-semibold max-w-lg mx-auto flux-h2 line-clamp-4 leading-tight">"{analysis.stoicQuote}"</p>
           )}
           {showSchedule && <h2 className="flux-h1 text-amber-500 mb-2">{analysis?.suggestedSlot}</h2>}
        </div>

        <div className="relative w-full flex-1 flex items-center justify-center overflow-visible">
           {!showSchedule && !isPlanConfirmed && !isFittingTask ? (
              <div 
                className={`w-64 h-64 md:w-80 md:h-80 rounded-full border-2 flex items-center justify-center p-8 text-center z-10 cursor-grab transition-all shadow-xl
                  ${isSmoke ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/10 border-white/20'}
                `}
                style={{ 
                  transform: `translate(${dragX}px, ${dragY}px) rotate(${rotation}deg)`,
                  opacity: opacity,
                  transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onMouseDown={handleTouchStart} onMouseMove={handleTouchMove} onMouseUp={handleTouchEnd} onMouseLeave={handleTouchEnd} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
              >
                <p className="text-white flux-h2 leading-tight tracking-tight line-clamp-5">{thought.content}</p>
              </div>
           ) : isFittingTask ? (
              <div className="animate-pulse flux-h1">🔨</div>
           ) : showSchedule ? (
             <div className="flex flex-col gap-3 w-full max-w-[240px]">
                {['today', 'tomorrow', 'weekend'].map((frame) => (
                   <button key={frame} onClick={() => handleCommit(frame as any)} className="w-full py-4 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 flux-caption !tracking-widest hover:bg-amber-500 hover:text-amber-950 transition-all active:scale-95">{t(frame as any, lang)}</button>
                ))}
             </div>
           ) : isPlanConfirmed ? (
              <div className="flex flex-col items-center gap-6 p-8 bg-amber-500/10 rounded-[2rem] border border-amber-500/20 max-w-sm">
                 <span className="text-5xl">🔨</span>
                 <p className="text-white text-center font-bold text-xl tracking-tight">{t('acceptStrategyTitle', lang)}</p>
                 <button onClick={handleConfirmPlan} className="w-full py-4 rounded-xl bg-amber-500 text-amber-950 flux-caption shadow-lg">{t('yesReady', lang)}</button>
              </div>
           ) : null}
        </div>

        {!showSchedule && !isPlanConfirmed && !isFittingTask && (
          <div className="w-full grid grid-cols-2 gap-3 mt-auto pb-6 max-w-md">
            <button onClick={() => handleAction('left')} className="py-4 rounded-xl bg-indigo-500/10 text-indigo-400 flux-caption flex flex-col items-center gap-1 border border-indigo-500/20 shadow-sm transition-colors hover:bg-indigo-500/20"><span>🐚</span>{t('letThem', lang)}</button>
            <button onClick={() => handleAction('right')} className="py-4 rounded-xl bg-amber-500/10 text-amber-500 flux-caption flex flex-col items-center gap-1 border border-amber-500/20 shadow-sm transition-colors hover:bg-amber-500/20"><span>🔨</span>{t('letMe', lang)}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SieveModal;
