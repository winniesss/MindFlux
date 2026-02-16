
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
         <div className="w-24 h-24 md:w-32 lg:w-40 md:h-32 lg:h-40 rounded-full border border-slate-800/50 flex items-center justify-center mb-12 opacity-30">
           <svg className="w-12 h-12 md:w-16 lg:w-20 md:h-16 lg:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" /></svg>
         </div>
         <p className="text-xl md:text-2xl lg:text-3xl tracking-[0.4em] font-black uppercase opacity-60">{t('emptyActions', lang)}</p>
         <p className="text-sm md:text-base lg:text-lg mt-6 opacity-30 font-light italic">{t('emptyActionsSub', lang)}</p>
       </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto pt-24 lg:pt-16 pb-32 px-6 lg:px-16">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-12 lg:mb-16 text-left">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"></div>
             <h2 className="text-amber-500 text-xs md:text-sm lg:text-sm font-black tracking-[0.5em] uppercase">{t('letMe', lang)}</h2>
           </div>
           <p className="text-slate-400 text-lg md:text-xl lg:text-2xl font-black tracking-tight max-w-2xl">{lang === 'zh' ? '专注于你能控制的事情。' : 'Focus energy on what you control.'}</p>
        </div>
        
        {/* Adaptive Grid for Desktop */}
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-8">
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
      className={`group relative p-8 lg:p-8 rounded-[2rem] border backdrop-blur-3xl transition-all duration-700 transform flex flex-col h-full ${
        isCompleted 
          ? 'bg-slate-900/10 border-slate-800/20 opacity-30 grayscale' 
          : isOverdue 
            ? 'bg-rose-950/10 border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.05)]' 
            : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/20'
      } ${isImploding ? 'animate-[implosion_0.6s_ease-in_forwards]' : ''}`}
    >
       <div className="flex items-start gap-6 mb-8">
         <button 
           onClick={() => !isCompleted && handleComplete()}
           className={`shrink-0 w-12 h-12 lg:w-12 lg:h-12 rounded-xl border-2 transition-all flex items-center justify-center ${
             isCompleted ? 'bg-amber-500 border-amber-500' : 
             isOverdue ? 'border-rose-500/60' : 'border-slate-800 group-hover:border-amber-500'
           } hover:scale-105 active:scale-95`}
         >
           <svg className={`w-6 h-6 lg:w-6 lg:h-6 text-amber-950 transition-opacity ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
           </svg>
         </button>
         
         <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`text-[10px] lg:text-[10px] font-black uppercase tracking-[0.25em] ${isCompleted ? 'text-slate-600' : isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                {isCompleted ? (lang === 'zh' ? '已完成' : 'Achieved') : (thought.dueDate ? new Date(thought.dueDate).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (lang === 'zh' ? '自由排程' : 'Open Schedule'))}
              </span>
              {thought.timeEstimate && !isCompleted && (
                <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  {thought.timeEstimate}
                </span>
              )}
            </div>
            <p className={`font-black text-xl lg:text-xl leading-tight tracking-tight break-words transition-all ${isCompleted ? 'text-slate-700 line-through' : isOverdue ? 'text-rose-50' : 'text-slate-100'}`}>
               {thought.content}
            </p>
         </div>
       </div>

       {/* Sub-tasks Section */}
       {!isCompleted && thought.subTasks && thought.subTasks.length > 0 && (
         <div className="space-y-2 mb-8 flex-1">
           {thought.subTasks.map(st => (
             <div 
               key={st.id}
               className="w-full flex items-center gap-4 py-2.5 px-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-white/10 transition-all group/st"
             >
               <button 
                  onClick={(e) => { e.stopPropagation(); toggleSubtask(st.id); }}
                  className={`shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${st.completed ? 'bg-amber-500 border-amber-500' : 'border-slate-800 group-hover/st:border-amber-500/50'}`}
               >
                  {st.completed && <svg className="w-3.5 h-3.5 text-amber-950" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
               </button>
               <input 
                  value={st.text}
                  onChange={(e) => editSubtask(st.id, e.target.value)}
                  className={`bg-transparent border-none focus:ring-0 p-0 text-xs lg:text-xs font-bold w-full outline-none ${st.completed ? 'text-slate-700 line-through' : 'text-slate-300'}`}
               />
             </div>
           ))}
         </div>
       )}

       <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/5">
         <div className="flex-1 mr-4">
           {thought.reframedContent && !isCompleted && (
             <p className="text-[10px] lg:text-[10px] text-slate-500 italic font-bold leading-relaxed line-clamp-2">
               "{thought.reframedContent}"
             </p>
           )}
         </div>
         
         {!isCompleted && (
           <button 
              onClick={handleCalendarClick}
              className="w-10 h-10 lg:w-10 lg:h-10 rounded-full bg-white/5 border border-white/10 hover:bg-indigo-600/20 hover:border-indigo-500/50 text-slate-500 hover:text-indigo-400 flex items-center justify-center transition-all"
              title={t('scheduleNow', lang)}
            >
              <svg className="w-5 h-5 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
           </button>
         )}
       </div>
    </div>
  );
};

export default ActionList;
