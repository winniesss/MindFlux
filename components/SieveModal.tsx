
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
        if (!isPM && hours === 12 && (slot.includes('上午') || slot.toLowerCase().includes('am'))) hours = 0;
      }
    }
    
    if (timeFrame === 'today') {
       const now = new Date();
       const targetDate = new Date(date);
       targetDate.setHours(hours, minutes, 0, 0);
       if (targetDate.getTime() <= now.getTime()) {
          hours = now.getHours() + 1;
          if (hours >= 24) {
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
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950/98 backdrop-blur-3xl p-6 md:p-12 overflow-hidden transition-all duration-1000 ${isVanishAnimation ? 'bg-black' : ''}`}>
      
      <div className="w-full flex items-start justify-between z-[60] safe-area-top pt-6">
        <div className="flex-1"></div>
        <div className={`transition-all duration-700 flex flex-col items-center gap-2 ${loading ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
          <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-2xl backdrop-blur-md flex items-center gap-3">
             <span className={`w-3 h-3 rounded-full ${isSmoke ? 'bg-indigo-400 animate-pulse shadow-[0_0_12px_#818cf8]' : 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'}`}></span>
             <span className={`text-xs md:text-sm font-black uppercase tracking-[0.3em] transition-colors
              ${isSmoke ? 'text-indigo-400' : 'text-amber-400'}`}>
              {isSmoke ? t('letThem', lang) : t('letMe', lang)}
            </span>
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <button onClick={onClose} className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10 active:scale-90 shadow-lg">
            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className={`flex-1 w-full flex flex-col items-center justify-around py-6 max-w-xl transition-transform duration-1000 ${isVanishAnimation ? 'scale-150 blur-3xl opacity-0' : ''}`}>
        
        <div className={`w-full text-center px-4 transition-all duration-700 min-h-[160px] flex flex-col items-center justify-center ${loading ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'}`}>
           {analysis && !showSchedule && !isFittingTask && (
             <div className="relative p-2 w-full flex flex-col items-center">
                {isSmoke && (
                  <div className="mb-6 flex flex-col items-center animate-in zoom-in-95 duration-700">
                    <span className="text-4xl md:text-6xl mb-4">🐚</span>
                    <p className="text-indigo-100 text-lg md:text-3xl leading-relaxed font-semibold italic max-w-lg mx-auto drop-shadow-lg">
                        "{analysis.stoicQuote}"
                    </p>
                  </div>
                )}
                {!isSmoke && !isPlanConfirmed && (
                  <div className="mb-6 flex flex-col items-center animate-in slide-in-from-bottom-2 duration-700 w-full">
                    <div className="flex items-center gap-3 mb-6">
                       <span className="text-amber-500 animate-pulse text-2xl">✨</span>
                       <span className="text-amber-400 text-xs font-black uppercase tracking-widest">{t('strategyBreakdown', lang)}</span>
                       {analysis.timeEstimate && (
                         <span className="ml-3 px-3 py-1 rounded-lg bg-white/10 border border-white/5 text-[10px] md:text-sm font-bold text-slate-300 flex items-center gap-2">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           {analysis.timeEstimate}
                         </span>
                       )}
                    </div>
                    <div className="space-y-3 text-left w-full max-w-sm">
                       {analysis.subTasks?.map((task, idx) => (
                         <div key={idx} className="bg-white/5 border border-white/10 rounded-[1.2rem] px-5 py-3.5 flex items-center gap-4 group">
                           <span className="text-sm font-black text-amber-500/60 shrink-0">{idx + 1}</span>
                           <input 
                              value={task}
                              onChange={(e) => handleUpdateSubTask(idx, e.target.value)}
                              className="bg-transparent border-none focus:ring-0 p-0 text-sm md:text-xl text-slate-200 font-medium w-full placeholder-slate-600 outline-none"
                              placeholder="..."
                           />
                         </div>
                       ))}
                    </div>
                  </div>
                )}
                {isPlanConfirmed && (
                   <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                     <p className="text-amber-400 text-xs font-black uppercase tracking-widest mb-2">{t('planValidated', lang)}</p>
                     <p className="text-slate-300 text-base md:text-xl font-medium">{t('commitmentLevel', lang)}</p>
                   </div>
                )}
             </div>
           )}
           {isFittingTask && (
             <div className="flex flex-col items-center animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                   <p className="text-amber-400 text-xs md:text-sm font-black uppercase tracking-[0.4em]">{t('fittingLife', lang)}</p>
                </div>
                <p className="text-white text-lg md:text-3xl font-bold italic opacity-70">{t('consultingFuture', lang)}</p>
             </div>
           )}
           {showSchedule && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col items-center">
                <div className="bg-amber-500/20 border border-amber-500/40 px-10 py-6 rounded-[3rem] mb-8 inline-block shadow-[0_0_60px_rgba(245,158,11,0.25)]">
                   <p className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] mb-3 opacity-80">{t('recommendedSlot', lang)}</p>
                   <p className="text-white text-2xl md:text-4xl font-black tracking-tight">
                      {analysis?.suggestedSlot || "..."}
                   </p>
                </div>
                
                {!calendarConnected && (
                  <button 
                    onClick={onConnectCalendar}
                    className="mb-8 px-6 py-3 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/25 transition-all flex items-center gap-3 animate-bounce"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                    {t('connectCalendarGuidance', lang)}
                  </button>
                )}

                <p className="text-slate-400 text-sm md:text-lg font-medium">{t('commitToWindow', lang)}</p>
              </div>
           )}
        </div>

        <div className="relative w-full flex items-center justify-center py-6 flex-1 min-h-[350px]">
           {!showSchedule && !isPlanConfirmed && !isFittingTask ? (
             <>
                <div className="absolute left-2 md:left-8 text-indigo-400 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: letThemOpacity * 0.9, transform: `translateX(${-30 + letThemOpacity * 30}px) scale(${0.8 + letThemOpacity * 0.2})` }}>
                  <span className="text-6xl md:text-8xl mb-3 drop-shadow-[0_0_20px_rgba(99,102,241,0.7)]">🐚</span>
                  <span className="text-[10px] md:text-xs font-black tracking-widest uppercase">{t('letThem', lang)}</span>
                </div>

                <div className="absolute right-2 md:right-8 text-amber-500 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: letMeOpacity * 0.9, transform: `translateX(${30 - letMeOpacity * 30}px) scale(${0.8 + letMeOpacity * 0.2})` }}>
                  <span className="text-6xl md:text-8xl mb-3 drop-shadow-[0_0_20px_rgba(245,158,11,0.7)]">🔨</span>
                  <span className="text-[10px] md:text-xs font-black tracking-widest uppercase">{t('letMe', lang)}</span>
                </div>

                <div className="absolute bottom-4 text-rose-500 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: vanishOpacity * 0.9, transform: `translateY(${30 - vanishOpacity * 30}px) scale(${0.8 + vanishOpacity * 0.2})` }}>
                  <span className="text-6xl md:text-8xl mb-3">🔥</span>
                  <span className="text-[10px] md:text-xs font-black tracking-widest uppercase">{t('released', lang)}</span>
                </div>

                <div 
                  className={`w-72 h-72 sm:w-80 sm:h-80 md:w-[420px] md:h-[420px] rounded-full border-2 flex items-center justify-center p-10 sm:p-14 text-center z-10 cursor-grab active:cursor-grabbing touch-none select-none transition-all duration-500
                    ${isSmoke 
                        ? 'bg-indigo-500/15 border-indigo-400/40 backdrop-blur-2xl shadow-[0_0_100px_rgba(99,102,241,0.25)]' 
                        : 'bg-gradient-to-br from-white/20 to-white/5 border-white/25 backdrop-blur-3xl shadow-[0_0_120px_rgba(255,255,255,0.08)]'}
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
                  <p className={`text-white font-black text-xl sm:text-2xl md:text-4xl leading-tight pointer-events-none tracking-tight break-words max-w-full overflow-hidden line-clamp-6 drop-shadow-2xl ${isSmoke ? 'opacity-90' : 'opacity-100'}`}>
                    {thought.content}
                  </p>
                </div>
             </>
           ) : isFittingTask ? (
              <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-1000">
                  <div className="absolute w-[400px] h-[400px] border border-amber-500/10 rounded-full animate-[ping_3s_infinite]"></div>
                  <div className="absolute w-80 h-80 border border-amber-500/20 rounded-full animate-[ping_2s_infinite]"></div>
                  <div className="absolute w-64 h-64 border border-amber-500/40 rounded-full animate-[ping_1.5s_infinite]"></div>
                  <div className="w-40 h-40 rounded-full bg-amber-500 shadow-[0_0_100px_rgba(245,158,11,0.5)] flex items-center justify-center text-7xl">🔨</div>
              </div>
           ) : showSchedule ? (
             <div className="flex flex-col gap-5 md:gap-8 w-full px-8 animate-in zoom-in-95 duration-500 max-w-sm">
                {['today', 'tomorrow', 'weekend'].map((frame) => (
                   <button 
                      key={frame}
                      onClick={() => handleCommit(frame as any)}
                      className="group w-full py-6 md:py-10 rounded-[2rem] bg-slate-900/70 border border-slate-700/60 text-amber-400 font-black uppercase tracking-[0.3em] text-xs md:text-lg hover:bg-amber-500 hover:text-amber-950 transition-all active:scale-95 shadow-2xl backdrop-blur-2xl"
                   >
                      <span className="block mb-2">{t(frame as any, lang)}</span>
                      {analysis?.suggestedSlot && (
                        <span className="block text-[10px] md:text-sm font-black opacity-60 group-hover:opacity-100 group-hover:text-amber-950 transition-all lowercase italic tracking-tight">{analysis.suggestedSlot}</span>
                      )}
                   </button>
                ))}
                <button 
                  onClick={() => { setShowSchedule(false); setIsPlanConfirmed(false); setIsFittingTask(false); resetDragState(); }}
                  className="mt-6 text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  {t('changeStrategy', lang)}
                </button>
             </div>
           ) : isPlanConfirmed ? (
              <div className="w-full max-w-sm flex flex-col gap-8 animate-in zoom-in-95 duration-500">
                  <div className="bg-amber-500/15 border border-amber-500/30 p-10 md:p-14 rounded-[3rem] flex flex-col items-center gap-8 shadow-[0_0_60px_rgba(0,0,0,0.5)]">
                     <span className="text-7xl md:text-8xl animate-bounce">🔨</span>
                     <p className="text-white text-center font-black text-xl md:text-3xl leading-snug">{t('acceptStrategyTitle', lang)}</p>
                     <div className="w-full flex flex-col gap-4">
                        <button 
                           onClick={handleConfirmPlan}
                           className="w-full py-6 rounded-[1.5rem] bg-amber-500 text-amber-950 font-black uppercase tracking-[0.25em] text-sm md:text-lg hover:scale-105 transition-all active:scale-95 shadow-xl shadow-amber-500/15"
                        >
                           {t('yesReady', lang)}
                        </button>
                        <button 
                           onClick={() => { setIsPlanConfirmed(false); resetDragState(); }}
                           className="w-full py-5 rounded-[1.5rem] bg-white/5 border border-white/15 text-slate-400 font-black uppercase tracking-widest text-xs md:text-sm hover:bg-white/10 transition-all"
                        >
                           {t('notNow', lang)}
                        </button>
                     </div>
                  </div>
              </div>
           ) : null}

           {loading && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className={`w-80 h-80 sm:w-[400px] sm:h-[400px] md:w-[500px] md:h-[500px] rounded-full border-2 animate-[ping_2.5s_infinite] ${isSmoke ? 'border-indigo-500/25' : 'border-white/15'}`}></div>
             </div>
           )}
        </div>

        {!showSchedule && !isPlanConfirmed && !isFittingTask && (
          <div className="w-full flex flex-col gap-5 md:gap-8 mt-auto px-8 pb-safe-bottom">
            <div className="grid grid-cols-2 gap-5">
              <button 
                onClick={() => handleAction('left')} 
                className="py-5 md:py-8 rounded-[1.8rem] border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-xs md:text-sm font-black uppercase tracking-widest hover:bg-indigo-500/20 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <span className="text-xl">🐚</span>
                {t('letThem', lang)}
              </button>
              <button 
                onClick={() => handleAction('right')} 
                className="py-5 md:py-8 rounded-[1.8rem] border border-amber-500/40 bg-amber-500/10 text-amber-500 text-xs md:text-sm font-black uppercase tracking-widest hover:bg-amber-500/20 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <span className="text-xl">🔨</span>
                {t('letMe', lang)}
              </button>
            </div>
            <button 
              onClick={handleVanish} 
              className="py-6 md:py-10 rounded-[2rem] border border-rose-500/50 bg-rose-500/15 text-rose-400 text-sm md:text-lg font-black uppercase tracking-[0.5em] hover:bg-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl"
            >
              <span className="text-2xl md:text-4xl">🔥</span>
              {t('totalRelease', lang)}
            </button>
          </div>
        )}
      </div>
      
      {isVanishAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
           <p className="text-white text-4xl md:text-7xl font-black uppercase tracking-[1.2em] animate-[vanish-text_1.2s_ease-out_forwards]">{t('released', lang)}</p>
        </div>
      )}
    </div>
  );
};

export default SieveModal;
