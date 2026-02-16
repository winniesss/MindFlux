
import React, { useState } from 'react';
import { Thought, ThoughtStatus, Language } from '../types';
import { t } from '../locales';

interface StillnessViewProps {
  thoughts: Thought[];
  lang: Language;
  onClearStillness: () => void;
  onThoughtVanish: (thought: Thought) => void;
}

const StillnessView: React.FC<StillnessViewProps> = ({ thoughts, lang, onClearStillness, onThoughtVanish }) => {
  const [isCleansing, setIsCleansing] = useState(false);
  const [vanishingId, setVanishingId] = useState<string | null>(null);

  const reflectedThoughts = thoughts
    .filter(t => t.status === ThoughtStatus.LET_THEM)
    .sort((a, b) => b.createdAt - a.createdAt);

  const handleCleanse = () => {
    setIsCleansing(true);
    setTimeout(() => {
      onClearStillness();
      setIsCleansing(false);
    }, 800);
  };

  const handleDissipate = (thought: Thought) => {
    setVanishingId(thought.id);
    setTimeout(() => {
      onThoughtVanish(thought);
      setVanishingId(null);
    }, 1000);
  };

  if (reflectedThoughts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 px-10 text-center animate-in fade-in duration-1000">
        <div className="w-20 h-20 md:w-40 md:h-40 rounded-full border border-slate-800/50 flex items-center justify-center mb-8 sm:mb-10 animate-[pulse_4s_infinite]">
          <span className="text-3xl md:text-6xl">🌙</span>
        </div>
        <p className="text-base md:text-3xl tracking-[0.3em] md:tracking-[0.4em] font-black uppercase opacity-60">
          {lang === 'zh' ? '镜面已明' : 'The mirror is clear'}
        </p>
        <p className="text-xs md:text-xl mt-4 opacity-30 font-light italic">
          {lang === 'zh' ? '目前还没有接受任何外部烦恼。' : 'No external worries have been accepted yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pt-[max(6rem,env(safe-area-inset-top)+4rem)] pb-32 sm:pb-52 px-4 sm:px-10 md:px-20">
      <div className="max-w-3xl mx-auto space-y-12 sm:space-y-16">
        <div className="text-center mb-12 sm:mb-20 px-2">
          <h2 className="text-indigo-400 text-[10px] md:text-lg font-black tracking-[0.4em] md:tracking-[0.5em] uppercase mb-4 sm:mb-6 opacity-80">
            {t('letThem', lang)} {lang === 'zh' ? '画廊' : 'Gallery'}
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-3xl leading-relaxed italic font-serif max-w-2xl mx-auto drop-shadow-sm mb-8 sm:mb-10">
            {lang === 'zh' 
              ? '“我们听到的一切都是意见，而非事实。我们看到的一切都是视角，而非真相。”' 
              : '"Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth."'}
          </p>
          <div className="flex justify-center">
            <button 
              onClick={handleCleanse}
              className="px-6 py-3 sm:px-8 sm:py-4 rounded-full bg-indigo-500/5 border border-indigo-500/20 text-indigo-400/60 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/40 transition-all active:scale-95 flex items-center gap-3 sm:gap-4 group backdrop-blur-sm"
            >
               <svg className={`w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 ${isCleansing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               <span className="text-[10px] sm:text-xs md:text-base font-black uppercase tracking-[0.2em]">{t('cleanseStillness', lang)}</span>
            </button>
          </div>
        </div>

        <div className={`grid gap-6 sm:gap-10 md:gap-16 transition-all duration-700 ${isCleansing ? 'opacity-0 scale-95 blur-2xl' : 'opacity-100'}`}>
          {reflectedThoughts.map((t) => (
            <div 
              key={t.id} 
              onClick={() => handleDissipate(t)}
              className={`relative p-8 sm:p-12 md:p-16 rounded-[2rem] sm:rounded-[3rem] bg-indigo-950/5 border border-white/5 backdrop-blur-xl group hover:bg-indigo-950/10 hover:border-indigo-500/20 transition-all duration-1000 cursor-pointer overflow-hidden ${vanishingId === t.id ? 'animate-[dissipate_1s_ease-out_forwards]' : ''}`}
            >
              <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-[8px] sm:text-[10px] md:text-xs font-black text-indigo-400/40 uppercase tracking-widest">{lang === 'zh' ? '点击消散' : 'Tap to Dissipate'}</span>
              </div>

              <p className="text-slate-500 text-sm sm:text-lg md:text-2xl mb-6 sm:mb-10 line-through decoration-slate-800/50 opacity-40 italic font-medium truncate sm:whitespace-normal">
                {t.content}
              </p>
              
              <div className="flex items-start gap-4 sm:gap-8 md:gap-10">
                <span className="text-indigo-400 text-2xl sm:text-4xl md:text-6xl mt-1 animate-pulse shrink-0">🌙</span>
                <p className="text-indigo-100 text-base sm:text-xl md:text-4xl font-bold leading-snug tracking-tighter">
                  {t.stoicQuote || (lang === 'zh' ? "接纳你无法改变的事情。" : "Accept what you cannot change.")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes dissipate {
          0% { transform: scale(1); opacity: 1; filter: blur(0px); }
          50% { transform: translateY(-20px) scale(1.05); opacity: 0.5; filter: blur(10px); }
          100% { transform: translateY(-100px) scale(1.5); opacity: 0; filter: blur(40px); }
        }
      `}</style>
    </div>
  );
};

export default StillnessView;
