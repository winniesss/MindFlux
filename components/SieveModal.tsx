
import React, { useState, useEffect, useRef } from 'react';
import { Thought, ThoughtStatus, AnalysisResult, Weight, Language, SubTask } from '../types';
import { analyzeThought } from '../services/geminiService';
import { t } from '../locales';

interface SieveModalProps {
  thought: Thought | null;
  onClose: () => void;
  onSort: (id: string, status: ThoughtStatus, weight?: Weight, reframing?: string, dueDate?: number, subTasks?: SubTask[], stoicQuote?: string, timeEstimate?: string) => void;
  lang: Language;
}

const SieveModal: React.FC<SieveModalProps> = ({ thought, onClose, onSort, lang }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isPlanConfirmed, setIsPlanConfirmed] = useState(false);
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
      setIsFittingTask(false);
      analyzeThought(thought.content, lang).then(result => {
        setAnalysis(result);
        setLoading(false);
      });
    } else {
      setAnalysis(null);
    }
  }, [thought, lang]);

  if (!thought) return null;

  const currentCategory = analysis?.category || 'LET_ME';
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

    const subTasks: SubTask[] = (analysis?.subTasks || []).map(text => ({
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
    if (dragX > 100) handleAction('right');
    else if (dragX < -100) handleAction('left');
    else { setDragX(0); setDragY(0); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-3xl p-6 md:p-12 overflow-hidden transition-all duration-700">
      <div className="w-full flex items-center justify-between z-10 pt-[env(safe-area-inset-top)]">
        <div className="w-10"></div>
        {!loading && (
          <div className="bg-white/5 px-5 py-2 rounded-full border border-white/10 shadow-lg flex items-center gap-3">
             <span className={`w-2 h-2 rounded-full ${isSmoke ? 'bg-indigo-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`}></span>
             <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSmoke ? 'text-indigo-400' : 'text-amber-400'}`}>
              {isSmoke ? t('letThem', lang) : t('letMe', lang)}
            </span>
          </div>
        )}
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 active:scale-90 shadow-xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`w-full text-center px-4 transition-all duration-700 max-h-[30vh] flex flex-col items-center mb-8 ${loading ? 'opacity-0' : 'opacity-100'}`}>
           {analysis && !showSchedule && !isPlanConfirmed && !isFittingTask && (
             <div className="w-full">
                {isSmoke ? (
                  <p className="text-indigo-100 text-xl md:text-2xl leading-snug font-bold italic max-w-xl mx-auto line-clamp-4">
                    "{analysis.stoicQuote}"
                  </p>
                ) : (
                  <div className="w-full max-w-sm mx-auto space-y-2 text-left">
                    <p className="text-amber-400/50 text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-center">{t('strategyBreakdown', lang)}</p>
                    {analysis.subTasks?.slice(0, 3).map((task, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl px-5 py-3 flex items-center gap-4">
                        <span className="text-[10px] font-black text-amber-500/40">{idx + 1}</span>
                        <p className="text-sm text-slate-200 font-bold truncate">{task}</p>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           )}
           {isFittingTask && (
             <div className="flex flex-col items-center animate-pulse">
                <p className="text-white text-xl md:text-3xl font-black italic">{t('consultingFuture', lang)}</p>
             </div>
           )}
           {showSchedule && (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-amber-500/10 border border-amber-500/30 px-6 py-3 rounded-2xl">
                   <p className="text-amber-400 text-[8px] font-black uppercase tracking-[0.2em] mb-1">{t('recommendedSlot', lang)}</p>
                   <p className="text-white text-3xl font-black">{analysis?.suggestedSlot || "..."}</p>
                </div>
                <p className="text-slate-400 text-lg font-bold italic">{t('commitToWindow', lang)}</p>
              </div>
           )}
        </div>

        <div className="relative w-full flex-1 flex items-center justify-center max-h-[45vh] overflow-visible">
           {!showSchedule && !isPlanConfirmed && !isFittingTask ? (
              <div 
                className={`w-[65vw] h-[65vw] max-w-[300px] max-h-[300px] rounded-full border-2 flex items-center justify-center p-8 text-center z-10 cursor-grab active:cursor-grabbing touch-none select-none transition-all
                  ${isSmoke ? 'bg-indigo-500/10 border-indigo-500/20 shadow-2xl backdrop-blur-3xl' : 'bg-white/5 border-white/10 shadow-xl backdrop-blur-2xl'}
                `}
                style={{ 
                  transform: `translate(${dragX}px, ${dragY}px) rotate(${dragX * 0.1}deg)`,
                  opacity: Math.max(0, 1 - Math.abs(dragX) / 350),
                  transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onMouseDown={handleTouchStart}
                onMouseMove={handleTouchMove}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <p className="text-white font-black text-lg md:text-xl leading-tight line-clamp-6">{thought.content}</p>
              </div>
           ) : showSchedule ? (
             <div className="flex flex-col gap-3 w-full max-w-xs px-6">
                {['today', 'tomorrow', 'weekend'].map((frame) => (
                   <button 
                      key={frame}
                      onClick={() => handleCommit(frame as any)}
                      className="w-full py-5 rounded-2xl bg-slate-900 border border-slate-700 text-amber-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-500 hover:text-amber-950 transition-all active:scale-95 shadow-lg"
                   >
                      {t(frame as any, lang)}
                   </button>
                ))}
                <button onClick={() => setIsPlanConfirmed(false)} className="mt-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('changeStrategy', lang)}</button>
             </div>
           ) : isPlanConfirmed ? (
              <div className="w-full max-w-xs px-6 flex flex-col items-center">
                  <div className="bg-amber-500/5 border border-amber-500/15 p-8 rounded-[3rem] flex flex-col items-center gap-6 w-full shadow-2xl">
                     <p className="text-white text-center font-bold text-lg">{t('acceptStrategyTitle', lang)}</p>
                     <div className="w-full space-y-3">
                        <button onClick={handleConfirmPlan} className="w-full py-4 rounded-xl bg-amber-500 text-amber-950 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg">{t('yesReady', lang)}</button>
                        <button onClick={() => setIsPlanConfirmed(false)} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 font-bold uppercase tracking-widest text-[9px]">{t('notNow', lang)}</button>
                     </div>
                  </div>
              </div>
           ) : null}

           {loading && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full border border-white/5 animate-[ping_2s_infinite]"></div>
             </div>
           )}
        </div>

        {!showSchedule && !isPlanConfirmed && !isFittingTask && (
          <div className="w-full grid grid-cols-2 gap-4 mt-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:max-w-xl">
            <button onClick={() => handleAction('left')} className="py-5 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] font-black uppercase tracking-widest">{t('letThem', lang)}</button>
            <button onClick={() => handleAction('right')} className="py-5 rounded-3xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] font-black uppercase tracking-widest">{t('letMe', lang)}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SieveModal;
