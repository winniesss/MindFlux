
import React, { useState } from 'react';
import { Thought, Weight, ThoughtStatus, Language, SubTask } from '../types';
import { generateGoogleCalendarUrl } from '../services/calendarService';
import { t } from '../locales';

interface ActionListProps {
  thoughts: Thought[];
  onComplete: (thought: Thought) => void;
  onUpdateSubtasks: (thoughtId: string, subTasks: SubTask[]) => void;
  isCalendarConnected?: boolean;
  lang: Language;
}

const ActionList: React.FC<ActionListProps> = ({ thoughts, onComplete, onUpdateSubtasks, isCalendarConnected, lang }) => {
  const oneDayInMs = 24 * 60 * 60 * 1000;
  
  const displayThoughts = thoughts.filter(t => 
    t.status === ThoughtStatus.LET_ME || 
    (t.status === ThoughtStatus.COMPLETED && t.completedAt && (Date.now() - t.completedAt < oneDayInMs))
  );

  const sortedThoughts = [...displayThoughts].sort((a, b) => {
    if (a.status === ThoughtStatus.COMPLETED && b.status !== ThoughtStatus.COMPLETED) return 1;
    if (b.status === ThoughtStatus.COMPLETED && a.status !== ThoughtStatus.COMPLETED) return -1;
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt - a.createdAt;
  });

  if (sortedThoughts.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center h-full text-slate-500 px-8 text-center animate-in fade-in duration-1000">
         <div className="w-16 h-16 rounded-full border border-slate-800 flex items-center justify-center mb-6 opacity-30">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
         </div>
         <p className="flux-h2 text-slate-600 tracking-[0.4em] uppercase opacity-60">{t('emptyActions', lang)}</p>
         <p className="flux-body mt-2 opacity-40 font-light italic">{t('emptyActionsSub', lang)}</p>
       </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pt-[max(6rem,env(safe-area-inset-top)+2rem)] pb-32 sm:pb-40 px-4 sm:px-10 md:px-20">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="mb-10 text-center sm:text-left px-2">
           <h2 className="text-amber-500 flux-caption !tracking-[0.5em] mb-2">{t('letMe', lang)}</h2>
           <p className="text-slate-500 flux-body italic">{lang === 'zh' ? '专注于你能控制的事情。' : 'Focus your energy on what you control.'}</p>
        </div>
        {sortedThoughts.map((thought) => (
          <ActionCard 
            key={thought.id} 
            thought={thought} 
            onComplete={onComplete} 
            onUpdateSubtasks={onUpdateSubtasks}
            showCalendar={isCalendarConnected}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
};

const ActionCard: React.FC<{ thought: Thought; onComplete: (t: Thought) => void; onUpdateSubtasks: (id: string, st: SubTask[]) => void; showCalendar?: boolean; lang: Language }> = ({ thought, onComplete, onUpdateSubtasks, showCalendar, lang }) => {
  const [isImploding, setIsImploding] = useState(false);
  const isCompleted = thought.status === ThoughtStatus.COMPLETED;
  const isOverdue = !isCompleted && thought.dueDate && thought.dueDate < Date.now();

  const handleComplete = () => {
    setIsImploding(true);
    setTimeout(() => {
      onComplete(thought);
      setIsImploding(false);
    }, 600);
  };

  const toggleSubtask = (subTaskId: string) => {
    const updated = (thought.subTasks || []).map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateSubtasks(thought.id, updated);
  };

  const editSubtask = (subTaskId: string, text: string) => {
    const updated = (thought.subTasks || []).map(st => 
      st.id === subTaskId ? { ...st, text } : st
    );
    onUpdateSubtasks(thought.id, updated);
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;
    const url = generateGoogleCalendarUrl(thought);
    window.open(url, '_blank');
  };

  return (
    <div 
      className={`group relative p-6 sm:p-8 rounded-[1.5rem] border backdrop-blur-md transition-all duration-700 transform overflow-hidden ${
        isCompleted 
          ? 'bg-slate-900/10 border-slate-800/20 opacity-30 grayscale pointer-events-none' 
          : isOverdue 
            ? 'bg-rose-950/10 border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.05)]' 
            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
      } ${isImploding ? 'animate-[implosion_0.6s_ease-in_forwards]' : ''}`}
    >
       <div className="flex flex-col sm:flex-row items-start gap-6">
         <button 
           onClick={() => !isCompleted && handleComplete()}
           className={`shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-full border-2 transition-all flex items-center justify-center ${
             isCompleted ? 'bg-amber-500 border-amber-500' : 
             isOverdue ? 'border-rose-500/60' : 'border-slate-700 group-hover:border-amber-500'
           } hover:scale-105 active:scale-90`}
         >
           <svg className={`w-6 h-6 md:w-8 md:h-8 text-amber-950 transition-opacity ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
           </svg>
         </button>
         
         <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={`flux-caption !text-[9px] sm:!text-[10px] ${isCompleted ? 'text-slate-600' : isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                {isCompleted ? (lang === 'zh' ? '已完成' : 'Done') : (thought.dueDate ? new Date(thought.dueDate).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (lang === 'zh' ? '未排程' : 'Unscheduled'))}
              </span>
              {isOverdue && !isCompleted && <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-rose-500"></span>}
            </div>
            
            <p className={`flux-h2 mb-6 transition-all ${isCompleted ? 'text-slate-700 line-through' : isOverdue ? 'text-rose-50' : 'text-slate-100'}`}>
               {thought.content}
            </p>

            {!isCompleted && thought.subTasks && thought.subTasks.length > 0 && (
              <div className="space-y-2 mb-6">
                {thought.subTasks.map(st => (
                  <div key={st.id} className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/st">
                    <button onClick={(e) => { e.stopPropagation(); toggleSubtask(st.id); }} className={`shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-amber-500 border-amber-500' : 'border-slate-700 group-hover/st:border-amber-500/50'}`}>
                       {st.completed && <svg className="w-3 h-3 text-amber-950" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </button>
                    <input 
                       value={st.text}
                       onChange={(e) => editSubtask(st.id, e.target.value)}
                       className={`bg-transparent border-none focus:ring-0 p-0 text-sm md:text-base font-bold w-full outline-none ${st.completed ? 'text-slate-700 line-through' : 'text-slate-200 placeholder-slate-800'}`}
                       placeholder="..."
                    />
                  </div>
                ))}
              </div>
            )}
            
            {thought.reframedContent && !isCompleted && (
              <div className="flex items-start gap-3">
                <span className="text-amber-500/50 text-xl">✦</span>
                <p className="text-sm md:text-base text-slate-500 italic leading-relaxed font-semibold">{thought.reframedContent}</p>
              </div>
            )}
         </div>

         {!isCompleted && (
           <button onClick={handleCalendarClick} className="hidden sm:flex shrink-0 w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-800/40 border border-slate-700 hover:bg-indigo-600/20 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-300 items-center justify-center transition-all group/btn">
              <svg className="w-5 h-5 md:w-6 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
           </button>
         )}
       </div>
    </div>
  );
};

export default ActionList;
