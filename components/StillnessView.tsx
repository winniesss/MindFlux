
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
            "Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth."
          </p>
          <div className="flex justify-center mt-8">
            <button 
              onClick={handleCleanse}
              className="px-6 py-2.5 rounded-full bg-indigo-500/5 border border-indigo-500/20 text-indigo-400/60 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/40 transition-all active:scale-95 flex items-center gap-3 group backdrop-blur-sm"
            >
               <svg className={`w-4 h-4 md:w-5 md:h-5 ${isCleansing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('cleanseStillness', lang)}</span>
            </button>
          </div>
        </div>

        <div className={`grid gap-8 md:gap-12 transition-all duration-700 ${isCleansing ? 'opacity-0 scale-95 blur-2xl' : 'opacity-100'}`}>
          {reflectedThoughts.map((t) => (
            <div 
              key={t.id} 
              onClick={() => handleDissipate(t)}
              className={`relative p-8 md:p-12 rounded-[2rem] bg-indigo-950/5 border border-white/5 backdrop-blur-xl group hover:bg-indigo-950/10 hover:border-indigo-500/20 transition-all duration-1000 cursor-pointer overflow-hidden ${vanishingId === t.id ? 'animate-[dissipate_1s_ease-out_forwards]' : ''}`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-[8px] font-black text-indigo-400/40 uppercase tracking-widest">Tap to Dissipate</span>
              </div>

              <p className="text-slate-500 text-sm md:text-xl mb-6 line-through decoration-slate-800/50 opacity-40 italic font-medium">
                {t.content}
              </p>
              
              <div className="flex items-start gap-4 md:gap-6">
                <span className="text-indigo-400 text-2xl md:text-4xl mt-1 animate-pulse">🌙</span>
                <p className="text-indigo-100 text-base md:text-2xl font-semibold leading-snug tracking-tight">
                  {t.stoicQuote || "Accept what you cannot change."}
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
