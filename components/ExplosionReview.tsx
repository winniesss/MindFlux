
import React, { useState, useEffect } from 'react';
import { Thought, Language } from '../types';
import { t } from '../locales';

interface ExplosionReviewProps {
  pendingThoughts: Thought[];
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
  lang: Language;
}

const ExplosionReview: React.FC<ExplosionReviewProps> = ({ pendingThoughts, onConfirm, onCancel, lang }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (pendingThoughts.length > 0) {
      setSelectedIds(pendingThoughts.map(t => t.id));
    }
  }, [pendingThoughts]);

  if (pendingThoughts.length === 0) return null;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden transform animate-in zoom-in-95 duration-700">
        
        <div className="p-8 md:p-10 border-b border-white/5">
           <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-indigo-400">Deconstruction</h2>
           </div>
           <p className="text-white text-xl md:text-2xl font-bold tracking-tight">I heard these fragments...</p>
           <p className="text-slate-500 text-sm md:text-base mt-1">Select the ones that represent your actual thoughts.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-3">
           {pendingThoughts.map((thought) => (
             <button
               key={thought.id}
               onClick={() => toggleSelection(thought.id)}
               className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 active:scale-[0.98] ${
                 selectedIds.includes(thought.id)
                   ? 'bg-white/5 border-white/20'
                   : 'bg-transparent border-transparent opacity-30'
               }`}
             >
               <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                 selectedIds.includes(thought.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700'
               }`}>
                 {selectedIds.includes(thought.id) && (
                   <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                   </svg>
                 )}
               </div>
               <p className="text-white text-sm md:text-lg font-medium leading-snug flex-1">{thought.content}</p>
             </button>
           ))}
        </div>

        <div className="p-8 md:p-10 border-t border-white/5 bg-slate-950/40 flex flex-col md:flex-row gap-4">
           <button
             onClick={onCancel}
             className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all"
           >
             Discard
           </button>
           <button
             onClick={() => onConfirm(selectedIds)}
             disabled={selectedIds.length === 0}
             className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-[0.3em] text-[10px] md:text-sm hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-30"
           >
             Integrate {selectedIds.length} Items
           </button>
        </div>
      </div>
    </div>
  );
};

export default ExplosionReview;
