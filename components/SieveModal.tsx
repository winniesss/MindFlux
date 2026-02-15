
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

  const handleVanish = () => {
    setIsVanishAnimation(true);
    setTimeout(() => {
      onSort(thought.id, ThoughtStatus.RELEASED);
      onClose();
    }, 1000);
  };

  const handleAction = (direction: 'left' | 'right' | 'down') => {
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
    } else if (direction === 'down') {
       handleVanish();
    }
  };

  const handleUpdateSubTask = (index: number, val: string) => {
    if (!analysis) return;
    const newTasks = [...(analysis.subTasks || [])];
    newTasks[index] = val;
    setAnalysis({ ...analysis, subTasks: newTasks });
  };

  const handleConfirmPlan = () => {
    setIsFittingTask(true);
    setTimeout(() => {
      setIsFittingTask(false);
      setShowSchedule(true);
      resetDragState();
    }, 1800);
  };

  const handleCommit = (timeFrame: 'today' | 'tomorrow' | 'weekend') => {
    let date = new Date();
    if (timeFrame === 'tomorrow') date.setDate(date.getDate() + 1);
    if (timeFrame === 'weekend') {
      const day = date.getDay();
      const diff = day === 0 ? 6 : 6 - day; 
      date.setDate(date.getDate() + diff);
    }

    // Advanced Time Parsing (Handles 14:00, 2:00 PM, 下午2点 etc.)
    let hours = 10; // Default Morning
    let minutes = 0;
    
    if (analysis?.suggestedSlot) {
      const slot = analysis.suggestedSlot;
      // Extract numbers
      const matches = slot.match(/(\d{1,2})[:：]?(\d{2})?/);
      if (matches) {
        hours = parseInt(matches[1]);
        if (matches[2]) minutes = parseInt(matches[2]);
        
        // Handle PM/下午 indicators
        const isPM = slot.toLowerCase().includes('pm') || slot.includes('下午') || slot.includes('晚上');
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12 && (slot.includes('上午') || slot.toLowerCase().includes('am'))) hours = 0;
      }
    }
    
    // Safety check for Today - if suggested time is past, push to next hour or default
    if (timeFrame === 'today') {
       const now = new Date();
       const targetDate = new Date(date);
       targetDate.setHours(hours, minutes, 0, 0);
       if (targetDate.getTime() <= now.getTime()) {
          // If suggested slot is in the past for today, force next valid hour
          hours = now.getHours() + 1;
          if (hours >= 24) {
             // If past midnight, move to tomorrow morning
             date.setDate(date.getDate() + 1);
             hours = 9;
          }
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
    } else if (dragY > threshold) {
      handleAction('down');
    } else {
      setDragX(0);
      setDragY(0);
    }
  };

  const rotation = dragX * 0.1;
  const opacity = Math.max(0, 1 - Math.abs(dragX) / 300 - Math.abs(dragY) / 300);
  const letThemOpacity = Math.min(1, Math.max(0, -dragX / 150));
  const letMeOpacity = Math.min(1, Math.max(0, dragX / 150));
  const vanishOpacity = Math.min(1, Math.max(0, dragY / 150));

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950/98 backdrop-blur-3xl p-6 md:p-10 overflow-hidden transition-all duration-1000 ${isVanishAnimation ? 'bg-black' : ''}`}>
      
      <div className="w-full flex items-start justify-between z-[60] safe-area-top pt-4">
        <div className="flex-1"></div>
        <div className={`transition-all duration-700 flex flex-col items-center gap-1 ${loading ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
          <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 shadow-2xl backdrop-blur-md flex items-center gap-2">
             <span className={`w-2 h-2 rounded-full ${isSmoke ? 'bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`}></span>
             <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.25em] transition-colors
              ${isSmoke ? 'text-indigo-400' : 'text-amber-400'}`}>
              {isSmoke ? t('letThem', lang) : t('letMe', lang)}
            </span>
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <button onClick={onClose} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10 active:scale-90 shadow-lg">
            <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className={`flex-1 w-full flex flex-col items-center justify-around py-4 max-w-lg transition-transform duration-1000 ${isVanishAnimation ? 'scale-150 blur-3xl opacity-0' : ''}`}>
        
        <div className={`w-full text-center px-4 transition-all duration-700 min-h-[140px] flex flex-col items-center justify-center ${loading ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
           {analysis && !showSchedule && !isFittingTask && (
             <div className="relative p-1 w-full flex flex-col items-center">
                {isSmoke && (
                  <div className="mb-4 flex flex-col items-center animate-in zoom-in-95 duration-700">
                    <span className="text-3xl md:text-4xl mb-2">🐚</span>
                    <p className="text-indigo-200 text-sm md:text-xl leading-relaxed font-semibold italic max-w-sm mx-auto">
                        "{analysis.stoicQuote}"
                    </p>
                  </div>
                )}
                {!isSmoke && !isPlanConfirmed && (
                  <div className="mb-4 flex flex-col items-center animate-in slide-in-from-bottom-2 duration-700 w-full">
                    <div className="flex items-center gap-2 mb-4">
                       <span className="text-amber-500 animate-pulse text-xl">✨</span>
                       <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest">{t('strategyBreakdown', lang)}</span>
                       {analysis.timeEstimate && (
                         <span className="ml-2 px-2 py-0.5 rounded bg-white/10 border border-white/5 text-[9px] font-bold text-slate-400 flex items-center gap-1">
                           <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           {analysis.timeEstimate}
                         </span>
                       )}
                    </div>
                    <div className="space-y-2 text-left w-full max-w-xs">
                       {analysis.subTasks?.map((task, idx) => (
                         <div key={idx} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 group">
                           <span className="text-[10px] font-black text-amber-500/50 shrink-0">{idx + 1}</span>
                           <input 
                              value={task}
                              onChange={(e) => handleUpdateSubTask(idx, e.target.value)}
                              className="bg-transparent border-none focus:ring-0 p-0 text-xs md:text-sm text-slate-200 font-medium w-full placeholder-slate-600 outline-none"
                              placeholder="..."
                           />
                         </div>
                       ))}
                    </div>
                  </div>
                )}
                {isPlanConfirmed && (
                   <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                     <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">{t('planValidated', lang)}</p>
                     <p className="text-slate-300 text-sm">{t('commitmentLevel', lang)}</p>
                   </div>
                )}
             </div>
           )}
           {isFittingTask && (
             <div className="flex flex-col items-center animate-in fade-in duration-500">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                   <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.4em]">{t('fittingLife', lang)}</p>
                </div>
                <p className="text-white text-base md:text-xl font-bold italic opacity-60">{t('consultingFuture', lang)}</p>
             </div>
           )}
           {showSchedule && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col items-center">
                <div className="bg-amber-500/20 border border-amber-500/40 px-8 py-5 rounded-[2.5rem] mb-6 inline-block shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                   <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">{t('recommendedSlot', lang)}</p>
                   <p className="text-white text-xl md:text-2xl font-black">
                      {analysis?.suggestedSlot || "..."}
                   </p>
                </div>
                
                {!calendarConnected && (
                  <button 
                    onClick={onConnectCalendar}
                    className="mb-6 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center gap-2 animate-bounce"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                    {t('connectCalendarGuidance', lang)}
                  </button>
                )}

                <p className="text-slate-400 text-xs md:text-sm font-medium">{t('commitToWindow', lang)}</p>
              </div>
           )}
        </div>

        <div className="relative w-full flex items-center justify-center py-4 flex-1 min-h-[300px]">
           {!showSchedule && !isPlanConfirmed && !isFittingTask ? (
             <>
                <div className="absolute left-1 md:left-6 text-indigo-400 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: letThemOpacity * 0.8, transform: `translateX(${-20 + letThemOpacity * 20}px) scale(${0.7 + letThemOpacity * 0.3})` }}>
                  <span className="text-5xl md:text-6xl mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]">🐚</span>
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">{t('letThem', lang)}</span>
                </div>

                <div className="absolute right-1 md:right-6 text-amber-500 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: letMeOpacity * 0.8, transform: `translateX(${20 - letMeOpacity * 20}px) scale(${0.7 + letMeOpacity * 0.3})` }}>
                  <span className="text-5xl md:text-6xl mb-2 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">🔨</span>
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">{t('letMe', lang)}</span>
                </div>

                <div className="absolute bottom-2 text-rose-500 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: vanishOpacity * 0.8, transform: `translateY(${20 - vanishOpacity * 20}px) scale(${0.7 + vanishOpacity * 0.3})` }}>
                  <span className="text-5xl md:text-6xl mb-2">🔥</span>
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">{t('released', lang)}</span>
                </div>

                <div 
                  className={`w-64 h-64 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full border-2 flex items-center justify-center p-8 sm:p-12 text-center z-10 cursor-grab active:cursor-grabbing touch-none select-none transition-all duration-500
                    ${isSmoke 
                        ? 'bg-indigo-500/10 border-indigo-400/30 backdrop-blur-xl shadow-[0_0_80px_rgba(99,102,241,0.2)]' 
                        : 'bg-gradient-to-br from-white/15 to-white/5 border-white/20 backdrop-blur-2xl shadow-[0_0_100px_rgba(255,255,255,0.05)]'}
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
                  <p className={`text-white font-bold text-base sm:text-lg md:text-3xl leading-snug pointer-events-none tracking-tight break-words max-w-full overflow-hidden line-clamp-6 drop-shadow-lg ${isSmoke ? 'opacity-90' : 'opacity-100'}`}>
                    {thought.content}
                  </p>
                </div>
             </>
           ) : isFittingTask ? (
              <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-1000">
                  <div className="absolute w-80 h-80 border border-amber-500/10 rounded-full animate-[ping_3s_infinite]"></div>
                  <div className="absolute w-64 h-64 border border-amber-500/20 rounded-full animate-[ping_2s_infinite]"></div>
                  <div className="absolute w-48 h-48 border border-amber-500/40 rounded-full animate-[ping_1.5s_infinite]"></div>
                  <div className="w-32 h-32 rounded-full bg-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.4)] flex items-center justify-center text-5xl">🔨</div>
              </div>
           ) : showSchedule ? (
             <div className="flex flex-col gap-4 md:gap-6 w-full px-6 animate-in zoom-in-95 duration-500 max-w-xs">
                {['today', 'tomorrow', 'weekend'].map((frame) => (
                   <button 
                      key={frame}
                      onClick={() => handleCommit(frame as any)}
                      className="group w-full py-5 md:py-8 rounded-3xl bg-slate-900/60 border border-slate-700/50 text-amber-400 font-black uppercase tracking-[0.25em] text-[10px] md:text-sm hover:bg-amber-500 hover:text-amber-950 transition-all active:scale-95 shadow-2xl backdrop-blur-xl"
                   >
                      <span className="block mb-1">{t(frame as any, lang)}</span>
                      {analysis?.suggestedSlot && (
                        <span className="block text-[8px] font-black opacity-60 group-hover:opacity-100 group-hover:text-amber-950 transition-all lowercase italic tracking-tight">{analysis.suggestedSlot}</span>
                      )}
                   </button>
                ))}
                <button 
                  onClick={() => { setShowSchedule(false); setIsPlanConfirmed(false); setIsFittingTask(false); resetDragState(); }}
                  className="mt-4 text-slate-500 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  {t('changeStrategy', lang)}
                </button>
             </div>
           ) : isPlanConfirmed ? (
              <div className="w-full max-w-xs flex flex-col gap-6 animate-in zoom-in-95 duration-500">
                  <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl">
                     <span className="text-6xl animate-bounce">🔨</span>
                     <p className="text-white text-center font-bold text-lg leading-tight">{t('acceptStrategyTitle', lang)}</p>
                     <div className="w-full flex flex-col gap-3">
                        <button 
                           onClick={handleConfirmPlan}
                           className="w-full py-5 rounded-2xl bg-amber-500 text-amber-950 font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all active:scale-95 shadow-xl shadow-amber-500/10"
                        >
                           {t('yesReady', lang)}
                        </button>
                        <button 
                           onClick={() => { setIsPlanConfirmed(false); resetDragState(); }}
                           className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                        >
                           {t('notNow', lang)}
                        </button>
                     </div>
                  </div>
              </div>
           ) : null}

           {loading && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className={`w-64 h-64 sm:w-80 sm:h-80 md:w-[400px] md:h-[400px] rounded-full border-2 animate-[ping_2s_infinite] ${isSmoke ? 'border-indigo-500/20' : 'border-white/10'}`}></div>
             </div>
           )}
        </div>

        {!showSchedule && !isPlanConfirmed && !isFittingTask && (
          <div className="w-full flex flex-col gap-4 md:gap-6 mt-auto px-6 pb-safe-bottom">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleAction('left')} 
                className="py-4 md:py-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-500/10 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>🐚</span>
                {t('letThem', lang)}
              </button>
              <button 
                onClick={() => handleAction('right')} 
                className="py-4 md:py-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-500 text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-amber-500/10 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>🔨</span>
                {t('letMe', lang)}
              </button>
            </div>
            <button 
              onClick={handleVanish} 
              className="py-4 md:py-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-500 text-[11px] md:text-sm font-black uppercase tracking-[0.4em] hover:bg-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <span className="text-xl md:text-2xl">🔥</span>
              {t('totalRelease', lang)}
            </button>
          </div>
        )}
      </div>
      
      {isVanishAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
           <p className="text-white text-3xl md:text-5xl font-black uppercase tracking-[1em] animate-[vanish-text_1s_ease-out_forwards]">{t('released', lang)}</p>
        </div>
      )}

      <style>{`
        @keyframes vanish-text {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); letter-spacing: 0em; }
          50% { opacity: 1; transform: scale(1.1) translateY(0); letter-spacing: 0.6em; }
          100% { opacity: 0; transform: scale(1.8) translateY(-100px); filter: blur(30px); }
        }
        .pb-safe-bottom {
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 24px));
        }
      `}</style>
    </div>
  );
};

export default SieveModal;
