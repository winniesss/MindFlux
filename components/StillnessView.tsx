
import React, { useState } from 'react';
import { Thought, ThoughtStatus, Language } from '../types';
import { t } from '../locales';

interface StillnessViewProps {
  thoughts: Thought[];
  lang: Language;
  onClearStillness: () => void;
}

const StillnessView: React.FC<StillnessViewProps> = ({ thoughts, lang, onClearStillness }) => {
  const [isCleansing, setIsCleansing] = useState(false);

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

  if (reflectedThoughts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 px-10 text-center animate-in fade-in duration-1000">
        <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border border-slate-800/50 flex items-center justify-center mb-8 animate-[pulse_4s_infinite]">
          <span className="text-3xl md:text-5xl">🌙</span>
        </div>
        <p className="text-sm md:text-xl tracking-[0.4em] font-black uppercase opacity-60">The mirror is clear</p>
        <p className="text-xs md:text-base mt-3 opacity-30 font-light italic">No external worries have been accepted yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pt-28 md:pt-40 pb-44 px-6 md:px-12">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center mb-16 px-4">
          <h2 className="text-indigo-400 text-[10px] md:text-xs font-black tracking-[0.5em] uppercase mb-4 opacity-80">{t('letThem', lang)} Gallery</h2>
          <p className="text-slate-400 text-sm md:text-2xl leading-relaxed italic font-serif max-w-2xl mx-auto drop-shadow-sm mb-4">
            "We suffer more often in imagination than in reality."
          </p>
          <p className="text-slate-600 text-[10px] md:text-xs uppercase tracking-widest mt-1 font-bold mb-10">— Seneca</p>

          <div className="flex justify-center mt-8">
            <button 
              onClick={handleCleanse}
              className="px-6 py-2.5 rounded-full bg-indigo-500/5 border border-indigo-500/20 text-indigo-400/60 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/40 transition-all active:scale-95 flex items-center gap-3 group backdrop-blur-sm"
              title={t('cleanseStillness', lang)}
            >
               <svg className={`w-4 h-4 md:w-5 md:h-5 ${isCleansing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform duration-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('cleanseStillness', lang)}</span>
               {isCleansing && <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping"></div>}
            </button>
          </div>
        </div>

        <div className={`grid gap-8 md:gap-12 transition-all duration-700 ${isCleansing ? 'opacity-0 scale-95 blur-2xl pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
          {reflectedThoughts.map((t) => (
            <div key={t.id} className="relative p-8 md:p-12 rounded-[2rem] bg-white/[0.01] border border-white/5 backdrop-blur-xl group hover:bg-white/[0.03] hover:border-indigo-500/20 transition-all duration-700">
              <div className="absolute -top-3 left-8 px-4 py-1 bg-slate-950 border border-white/10 rounded-full text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">
                {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              
              <p className="text-slate-500 text-sm md:text-xl mb-6 line-through decoration-slate-800/50 opacity-40 italic font-medium">
                {t.content}
              </p>
              
              <div className="flex items-start gap-4 md:gap-6">
                <span className="text-indigo-400 text-2xl md:text-4xl mt-1 animate-pulse">✨</span>
                <p className="text-indigo-100 text-base md:text-2xl font-semibold leading-snug tracking-tight">
                  {t.reframedContent || "Let this pass through you without leaving a trace."}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-20 pb-10 text-center opacity-10">
          <div className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-2 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-2 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-2 animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default StillnessView;
