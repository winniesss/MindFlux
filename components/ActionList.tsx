
import React from 'react';
import { Thought, Weight, ThoughtStatus, Language } from '../types';
import { generateGoogleCalendarUrl } from '../services/calendarService';
import { t } from '../locales';

interface ActionListProps {
  thoughts: Thought[];
  onComplete: (thought: Thought) => void;
  isCalendarConnected?: boolean;
  lang: Language;
}

const ActionList: React.FC<ActionListProps> = ({ thoughts, onComplete, isCalendarConnected, lang }) => {
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  // Show active tasks OR tasks completed in the last 24 hours
  const displayThoughts = thoughts.filter(t => 
    t.status === ThoughtStatus.LET_ME || 
    (t.status === ThoughtStatus.COMPLETED && t.completedAt && (Date.now() - t.completedAt < oneDayInMs))
  );

  const sortedThoughts = [...displayThoughts].sort((a, b) => {
    // Completed tasks always at the bottom
    if (a.status === ThoughtStatus.COMPLETED && b.status !== ThoughtStatus.COMPLETED) return 1;
    if (b.status === ThoughtStatus.COMPLETED && a.status !== ThoughtStatus.COMPLETED) return -1;
    
    // Sort by due date, then by creation date
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });

  if (sortedThoughts.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-slate-500 px-10 text-center animate-in fade-in duration-1000">
         <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border border-slate-800 flex items-center justify-center mb-8 opacity-20">
           <svg className="w-8 h-8 md:w-12 md:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
         </div>
         <p className="text-sm md:text-xl tracking-[0.4em] font-black uppercase opacity-60">{t('emptyActions', lang)}</p>
         <p className="text-xs md:text-base mt-3 opacity-40 font-light italic">{t('emptyActionsSub', lang)}</p>
       </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pt-24 md:pt-32 pb-44 px-4 md:px-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="mb-10 text-center sm:text-left px-2">
           <h2 className="text-amber-500 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase mb-1">Commitments</h2>
           <p className="text-slate-500 text-xs md:text-base">Focus your energy on what you control.</p>
        </div>
        {sortedThoughts.map((thought) => (
          <ActionCard 
            key={thought.id} 
            thought={thought} 
            onComplete={onComplete} 
            showCalendar={isCalendarConnected}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
};

const ActionCard: React.FC<{ thought: Thought; onComplete: (t: Thought) => void; showCalendar?: boolean; lang: Language }> = ({ thought, onComplete, showCalendar, lang }) => {
  const isCompleted = thought.status === ThoughtStatus.COMPLETED;
  const isOverdue = !isCompleted && thought.dueDate && thought.dueDate < Date.now();
  const isSoon = !isCompleted && thought.dueDate && thought.dueDate < Date.now() + 86400000;

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;
    const url = generateGoogleCalendarUrl(thought);
    window.open(url, '_blank');
  };

  return (
    <div 
      className={`group relative p-5 md:p-8 rounded-3xl border backdrop-blur-md transition-all duration-700 transform ${
        isCompleted 
          ? 'bg-slate-900/10 border-slate-800/20 opacity-30 grayscale pointer-events-none' 
          : isOverdue 
            ? 'bg-rose-950/10 border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.05)] active:scale-[0.98]' 
            : isSoon
              ? 'bg-amber-950/10 border-amber-500/30 active:scale-[0.98]'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 active:scale-[0.98]'
      }`}
    >
       <div className="flex items-start gap-4 md:gap-8">
         <button 
           onClick={() => !isCompleted && onComplete(thought)}
           className={`shrink-0 w-6 h-6 md:w-10 md:h-10 rounded-full border-2 mt-1.5 transition-all flex items-center justify-center ${
             isCompleted ? 'bg-amber-500 border-amber-500' : 
             isOverdue ? 'border-rose-500/50' : 'border-slate-800 group-hover:border-amber-500'
           } hover:scale-110 active:scale-90`}
         >
           <svg className={`w-3 h-3 md:w-6 md:h-6 text-amber-950 transition-opacity ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
           </svg>
         </button>
         
         <div className="flex-1 min-w-0" onClick={() => !isCompleted && onComplete(thought)}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] ${isCompleted ? 'text-slate-600' : isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                {isCompleted ? 'Done' : (thought.dueDate ? new Date(thought.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unscheduled')}
              </span>
              {isOverdue && !isCompleted && <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]"></span>}
            </div>
            
            <p className={`font-bold text-base md:text-2xl leading-tight break-words mb-3 transition-all ${isCompleted ? 'text-slate-700 line-through' : isOverdue ? 'text-rose-50' : 'text-slate-100'}`}>
               {thought.content}
            </p>
            
            {thought.aiReasoning && !isCompleted && (
              <div className="flex items-start gap-2 max-w-lg">
                <span className="text-amber-500/50 text-[10px] md:text-sm mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">✦</span>
                <p className="text-[9px] md:text-sm text-slate-500 italic leading-relaxed font-medium">
                  {thought.aiReasoning}
                </p>
              </div>
            )}
         </div>

         {!isCompleted && (
           <button 
              onClick={handleCalendarClick}
              className="shrink-0 w-8 h-8 md:w-14 md:h-14 rounded-full bg-slate-800/40 border border-slate-700 hover:bg-indigo-600/20 hover:border-indigo-500/50 text-slate-600 hover:text-indigo-300 flex items-center justify-center transition-all shadow-xl mt-1 group/btn"
              title="Schedule in Calendar"
            >
              <svg className="w-4 h-4 md:w-7 md:h-7 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
           </button>
         )}
       </div>
    </div>
  );
};

export default ActionList;
