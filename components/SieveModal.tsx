
import React, { useState, useEffect, useRef } from 'react';
import { Thought, ThoughtStatus, AnalysisResult, Weight, Language } from '../types';
import { analyzeThought } from '../services/geminiService';
import { t } from '../locales';

interface SieveModalProps {
  thought: Thought | null;
  onClose: () => void;
  onSort: (id: string, status: ThoughtStatus, weight?: Weight, reframing?: string, dueDate?: number) => void;
  lang: Language;
  calendarSummary?: string;
}

const SieveModal: React.FC<SieveModalProps> = ({ thought, onClose, onSort, lang, calendarSummary }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [isVanishAnimation, setIsVanishAnimation] = useState(false);
  
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
      setIsVanishAnimation(false);
      analyzeThought(thought.content, lang, calendarSummary).then(result => {
        setAnalysis(result);
        setLoading(false);
      });
    } else {
      setAnalysis(null);
    }
  }, [thought, lang, calendarSummary]);

  if (!thought) return null;

  const handleVanish = () => {
    setIsVanishAnimation(true);
    setTimeout(() => {
      onSort(thought.id, ThoughtStatus.RELEASED);
      onClose();
    }, 1000);
  };

  const handleAction = (direction: 'left' | 'right' | 'down') => {
    if (direction === 'left') {
       onSort(thought.id, ThoughtStatus.LET_THEM, undefined, analysis?.reframing);
       onClose();
    } else if (direction === 'right') {
       setShowSchedule(true);
    } else if (direction === 'down') {
       handleVanish();
    }
  };

  const handleCommit = (timeFrame: 'today' | 'tomorrow' | 'weekend') => {
    let date = new Date();
    if (timeFrame === 'tomorrow') date.setDate(date.getDate() + 1);
    if (timeFrame === 'weekend') {
      const day = date.getDay();
      const diff = day === 0 ? 6 : 6 - day; 
      date.setDate(date.getDate() + diff);
    }
    date.setHours(18, 0, 0, 0); 

    onSort(thought.id, ThoughtStatus.LET_ME, analysis?.weight || Weight.CASUAL, undefined, date.getTime());
    onClose();
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (showSchedule) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    startXRef.current = clientX;
    startYRef.current = clientY;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || showSchedule) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragX(clientX - startXRef.current);
    setDragY(clientY - startYRef.current);
  };

  const handleTouchEnd = () => {
    if (showSchedule) return;
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
      
      {/* Header Area: Tag and Close Button */}
      <div className="w-full flex items-start justify-between z-[60] safe-area-top pt-2">
        <div className="flex-1"></div>
        <div className={`transition-all duration-700 mt-2 ${loading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {analysis && (
            <div className="flex flex-col items-center gap-1">
               <span className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.25em] shadow-2xl border transition-colors
                ${analysis.category === 'LET_THEM' ? 'bg-indigo-950/50 text-indigo-400 border-indigo-500/40' : 'bg-amber-950/50 text-amber-400 border-amber-500/40'}`}>
                {analysis.category === 'LET_THEM' ? t('letThem', lang) : t('letMe', lang)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 flex justify-end">
          <button onClick={onClose} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-all hover:bg-white/10 active:scale-90">
            <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Content Area: Adaptive Flex */}
      <div className={`flex-1 w-full flex flex-col items-center justify-around py-2 max-w-lg transition-transform duration-1000 ${isVanishAnimation ? 'scale-150 blur-3xl opacity-0' : ''}`}>
        
        {/* Insight Section */}
        <div className={`w-full text-center px-4 transition-all duration-700 min-h-[100px] flex items-center justify-center ${loading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
           {analysis && !showSchedule && (
             <p className="text-slate-200 text-sm md:text-lg lg:text-xl leading-relaxed font-semibold italic drop-shadow-sm max-w-sm mx-auto">
                "{analysis.category === 'LET_THEM' ? analysis.reframing : analysis.reasoning}"
             </p>
           )}
           {showSchedule && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h3 className="text-amber-400 text-xs md:text-sm font-black uppercase tracking-[0.3em] mb-1">{t('letMe', lang)}</h3>
                 <p className="text-slate-300 text-xs md:text-base">When will you commit to this task?</p>
              </div>
           )}
        </div>

        {/* Central Interaction Area */}
        <div className="relative w-full flex items-center justify-center py-2 flex-1 min-h-[250px]">
           {!showSchedule ? (
             <>
                {/* Swipe Indicators */}
                <div className="absolute left-0 md:left-4 text-indigo-400 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: letThemOpacity * 0.8, transform: `translateX(${-20 + letThemOpacity * 20}px) scale(${0.7 + letThemOpacity * 0.3})` }}>
                  <span className="text-4xl md:text-5xl mb-2">🌙</span>
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">{t('letThem', lang)}</span>
                </div>

                <div className="absolute right-0 md:right-4 text-amber-500 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: letMeOpacity * 0.8, transform: `translateX(${20 - letMeOpacity * 20}px) scale(${0.7 + letMeOpacity * 0.3})` }}>
                  <span className="text-4xl md:text-5xl mb-2">💎</span>
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">{t('letMe', lang)}</span>
                </div>

                <div className="absolute bottom-0 text-rose-500 flex flex-col items-center transition-all duration-300 pointer-events-none z-0" style={{ opacity: vanishOpacity * 0.8, transform: `translateY(${20 - vanishOpacity * 20}px) scale(${0.7 + vanishOpacity * 0.3})` }}>
                  <span className="text-4xl md:text-5xl mb-1">🔥</span>
                  <span className="text-[8px] md:text-[10px] font-black tracking-widest uppercase">{lang === 'zh' ? '抹除' : 'Vanish'}</span>
                </div>

                {/* Main Bubble: Responsive Size with cap for small screens */}
                <div 
                  className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-2xl flex items-center justify-center p-8 sm:p-10 text-center shadow-[0_0_80px_rgba(255,255,255,0.05)] z-10 cursor-grab active:cursor-grabbing touch-none select-none hover:border-white/40 transition-colors"
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
                  <p className="text-white font-bold text-sm sm:text-base md:text-2xl leading-snug pointer-events-none tracking-tight break-words max-w-full overflow-hidden line-clamp-5">
                    {thought.content}
                  </p>
                </div>
             </>
           ) : (
             <div className="flex flex-col gap-3 md:gap-4 w-full px-6 animate-in zoom-in-95 duration-500 max-w-xs">
                {['today', 'tomorrow', 'weekend'].map((frame) => (
                   <button 
                      key={frame}
                      onClick={() => handleCommit(frame as any)}
                      className="w-full py-4 md:py-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-amber-400 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs hover:bg-amber-500 hover:text-amber-950 transition-all active:scale-95 shadow-xl"
                   >
                      {t(frame as any, lang)}
                   </button>
                ))}
             </div>
           )}

           {loading && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-full border border-indigo-500/20 animate-[ping_2s_infinite]"></div>
             </div>
           )}
        </div>

        {/* Bottom Actions Area with Safe Padding */}
        {!showSchedule && (
          <div className="w-full flex flex-col gap-3 md:gap-4 mt-auto mb-4 px-4 pb-safe">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleAction('left')} className="py-3.5 md:py-5 rounded-xl border border-indigo-900/40 bg-indigo-950/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900/30 active:scale-95 transition-all">{t('letThem', lang)}</button>
              <button onClick={() => handleAction('right')} className="py-3.5 md:py-5 rounded-xl border border-amber-900/40 bg-amber-950/20 text-amber-500 text-[10px] font-black uppercase tracking-widest hover:bg-amber-900/30 active:scale-95 transition-all">{t('letMe', lang)}</button>
            </div>
            <button 
              onClick={handleVanish} 
              className="py-3.5 md:py-5 rounded-xl border border-rose-900/40 bg-rose-950/10 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 group shadow-lg"
            >
              <span className="group-hover:animate-pulse">🔥</span>
              {lang === 'zh' ? '彻底释放' : 'Total Release'}
            </button>
          </div>
        )}
      </div>
      
      {isVanishAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
           <p className="text-white text-2xl md:text-3xl font-black uppercase tracking-[0.6em] md:tracking-[1em] animate-[vanish-text_1s_ease-out_forwards]">Released</p>
        </div>
      )}

      <style>{`
        @keyframes vanish-text {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); letter-spacing: 0em; }
          50% { opacity: 1; transform: scale(1.1) translateY(0); letter-spacing: 0.6em; }
          100% { opacity: 0; transform: scale(1.5) translateY(-50px); filter: blur(20px); }
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 24px);
        }
      `}</style>
    </div>
  );
};

export default SieveModal;
