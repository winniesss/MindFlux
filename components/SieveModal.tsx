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
       onSort(
         thought.id, 
         ThoughtStatus.LET_THEM, 
         undefined, 
         analysis?.reframing, 
         undefined, 
         [], 
         analysis?.stoicQuote,
         analysis?.timeEstimate
       );
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

    onSort(
      thought.id, 
      ThoughtStatus.LET_ME, 
      analysis?.weight || Weight.CASUAL, 
      analysis?.reframing, 
      date.getTime(),
      subTasks,
      analysis?.stoicQuote,
      analysis?.timeEstimate
    );
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
    if (dragX > threshold) {
      handleAction('right');
    } else if (dragX < -threshold) {
      handleAction('left');
    } else {
      setDragX(0);
      setDragY(0);
    }
  };

  const rotation = dragX * 0.1;
  const opacity = Math.max(0, 1 - Math.abs(dragX) / 300 - Math.abs(dragY) / 300);
  const letThemIndicatorOpacity = Math.min(1, Math.max(0, -dragX / 100));
  const letMeIndicatorOpacity = Math.min(1, Math.max(0, dragX / 100));

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-3xl p-4 md:p-8 lg:p-12 overflow-hidden transition-all duration-1000 ${isVanishAnimation ? 'bg-black' : ''}`}>
      
      {/* Header */}
      <div className="w-full flex items-center justify-between z-[60] pt-[max(0.75rem,env(safe-area-inset-top))] mb-4">
        <div className="w-10"></div>
        <div className={`transition-all duration-700 flex flex-col items-center ${loading ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
          <div className="bg-white/5 px-5 py-2 rounded-full border border-white/10 shadow-lg backdrop-blur-md flex items-center gap-3">
             <span className={`w-2 h-2 rounded-full ${isSmoke ? 'bg-indigo-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`}></span>
             <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${isSmoke ? 'text-indigo-400' : 'text-amber-400'}`}>
              {isSmoke ? t('letThem', lang) : t('letMe', lang)}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-all active:scale-90 shadow-xl">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className={`flex-1 flex flex-col items-center justify-center transition-transform duration-1000 ${isVanishAnimation ? 'scale-150 blur-3xl opacity-0' : ''}`}>
        
        {/* Top Content Area - Responsive Heights */}
        <div className={`w-full text-center px-4 transition-all duration-700 max-h-[25vh] flex flex-col items-center justify-center mb-6 lg:mb-10 ${loading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
           {analysis && !showSchedule && !isPlanConfirmed && !isFittingTask && (
             <div className="w-full">
                {isSmoke ? (
                  <div className="animate-in zoom-in-95 duration-700 px-2">
                    <p className="text-indigo-100 text-lg sm:text-xl lg:text-2xl leading-snug font-semibold italic max-w-xl mx-auto line-clamp-4">
                        "{analysis.stoicQuote}"
                    </p>
                  </div>
                ) : (
                  <div className="animate-in slide-in-from-bottom-2 duration-700 w-full max-w-sm mx-auto">
                    <p className="text-amber-400/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">{t('strategyBreakdown', lang)}</p>
                    <div className="space-y-2 text-left">
                       {analysis.subTasks?.slice(0, 3).map((task, idx) => (
                         <div key={idx} className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-3">
                           <span className="text-[10px] font-black text-amber-500/40 shrink-0">{idx + 1}</span>
                           <p className="text-xs md:text-sm text-slate-200 font-bold truncate">{task}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
             </div>
           )}
           {isFittingTask && (
             <div className="flex flex-col items-center animate-in fade-in duration-500">
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-3">{t('fittingLife', lang)}</p>
                <p className="text-white text-xl sm:text-2xl font-black italic opacity-70 tracking-tight">{t('consultingFuture', lang)}</p>
             </div>
           )}
           {showSchedule && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col items-center">
                <div className="bg-amber-500/10 border border-amber-500/30 px-6 py-3 rounded-2xl mb-4 lg:mb-6 inline-block">
                   <p className="text-amber-400 text-[8px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">{t('recommendedSlot', lang)}</p>
                   <p className="text-white text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">{analysis?.suggestedSlot || "..."}</p>
                </div>
                <p className="text-slate-400 text-sm sm:text-lg lg:text-xl font-bold italic">{t('commitToWindow', lang)}</p>
              </div>
           )}
        </div>

        {/* Central Interaction Circle - Adjusted for height constraints */}
        <div className="relative w-full flex-1 flex items-center justify-center max-h-[40vh] sm:max-h-[45vh] lg:max-h-[50vh] overflow-visible my-4">
           {!showSchedule && !isPlanConfirmed && !isFittingTask ? (
             <>
                <div className="absolute left-6 text-indigo-400/40 flex flex-col items-center transition-all z-0 pointer-events-none" style={{ opacity: letThemIndicatorOpacity }}>
                  <span className="text-[10px] font-black tracking-[0.5em] uppercase">{t('letThem', lang)}</span>
                </div>
                <div className="absolute right-6 text-amber-500/40 flex flex-col items-center transition-all z-0 pointer-events-none" style={{ opacity: letMeIndicatorOpacity }}>
                  <span className="text-[10px] font-black tracking-[0.5em] uppercase">{t('letMe', lang)}</span>
                </div>

                <div 
                  className={`w-[70vw] h-[70vw] max-w-[280px] max-h-[280px] sm:max-w-[340px] sm:max-h-[340px] md:max-w-[380px] md:max-h-[380px] rounded-full border-2 flex items-center justify-center p-8 text-center z-10 cursor-grab active:cursor-grabbing touch-none select-none transition-all
                    ${isSmoke 
                        ? 'bg-indigo-500/10 border-indigo-500/20 backdrop-blur-xl shadow-2xl' 
                        : 'bg-white/10 border-white/20 backdrop-blur-2xl shadow-xl'}
                  `}
                  style={{ 
                    transform: `translate(${dragX}px, ${dragY}px) rotate(${rotation}deg)`,
                    opacity: opacity,
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
                  <p className="text-white font-black text-lg sm:text-xl lg:text-2xl leading-tight pointer-events-none tracking-tight break-words max-w-full overflow-hidden line-clamp-6">
                    {thought.content}
                  </p>
                </div>
             </>
           ) : isFittingTask ? (
              <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute w-40 h-40 border border-amber-500/20 rounded-full animate-ping"></div>
                  <div className="w-28 h-28 sm:w-36 rounded-full bg-amber-500 shadow-2xl flex items-center justify-center">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-950">{t('fittingLife', lang)}</span>
                  </div>
              </div>
           ) : showSchedule ? (
             <div className="flex flex-col gap-3 w-full px-6 max-w-xs">
                {['today', 'tomorrow', 'weekend'].map((frame) => (
                   <button 
                      key={frame}
                      onClick={() => handleCommit(frame as any)}
                      className="w-full py-4 sm:py-5 rounded-2xl bg-slate-900 border border-slate-700 text-amber-400 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs hover:bg-amber-500 hover:text-amber-950 transition-all active:scale-95 shadow-lg"
                   >
                      {t(frame as any, lang)}
                   </button>
                ))}
                <button 
                  onClick={() => { setShowSchedule(false); setIsPlanConfirmed(false); setIsFittingTask(false); resetDragState(); }}
                  className="mt-4 text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white"
                >
                  {t('changeStrategy', lang)}
                </button>
             </div>
           ) : isPlanConfirmed ? (
              <div className="w-full max-w-xs px-4 flex flex-col items-center">
                  <div className="bg-amber-500/5 border border-amber-500/15 p-6 sm:p-8 rounded-[2.5rem] flex flex-col items-center gap-6 w-full shadow-2xl backdrop-blur-md">
                     <p className="text-white text-center font-bold text-lg leading-tight tracking-tight">{t('acceptStrategyTitle', lang)}</p>
                     <div className="w-full flex flex-col gap-3">
                        <button 
                           onClick={handleConfirmPlan}
                           className="w-full py-4 rounded-xl bg-amber-500 text-amber-950 font-black uppercase tracking-[0.2em] text-[10px] shadow-lg"
                        >
                           {t('yesReady', lang)}
                        </button>
                        <button 
                           onClick={() => { setIsPlanConfirmed(false); resetDragState(); }}
                           className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 font-bold uppercase tracking-widest text-[9px]"
                        >
                           {t('notNow', lang)}
                        </button>
                     </div>
                  </div>
              </div>
           ) : null}

           {loading && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className={`w-64 h-64 sm:w-80 rounded-full border border-white/5 animate-[ping_3s_infinite]`}></div>
             </div>
           )}
        </div>

        {/* Bottom Options - Responsive Spacing */}
        {!showSchedule && !isPlanConfirmed && !isFittingTask && (
          <div className="w-full grid grid-cols-2 gap-3 mt-auto pb-[max(1.5rem,env(safe-area-inset-bottom)+0.5rem)] lg:pb-8 lg:max-w-xl">
            <button 
              onClick={() => handleAction('left')} 
              className="py-5 sm:py-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/10 active:scale-95 transition-all shadow-md"
            >
              {t('letThem', lang)}
            </button>
            <button 
              onClick={() => handleAction('right')} 
              className="py-5 sm:py-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/10 active:scale-95 transition-all shadow-md"
            >
              {t('letMe', lang)}
            </button>
          </div>
        )}
      </div>
      
      {isVanishAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
           <p className="text-white text-4xl sm:text-6xl font-black uppercase tracking-[0.5em] animate-pulse">{t('released', lang)}</p>
        </div>
      )}
    </div>
  );
};

export default SieveModal;