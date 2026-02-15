
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
           <h2 className="text-amber-500 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase mb-1">{t('letMe', lang)}</h2>
           <p className="text-slate-500 text-xs md:text-base">{lang === 'zh' ? '专注于你能控制的事情。' : 'Focus your energy on what you control.'}</p>
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
      className={`group relative p-5 md:p-8 rounded-3xl border backdrop-blur-md transition-all duration-700 transform overflow-hidden ${
        isCompleted 
          ? 'bg-slate-900/10 border-slate-800/20 opacity-30 grayscale pointer-events-none' 
          : isOverdue 
            ? 'bg-rose-950/10 border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.05)] active:scale-[0.98]' 
            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 active:scale-[0.98]'
      } ${isImploding ? 'animate-[implosion_0.6s_ease-in_forwards]' : ''}`}
    >
       <div className="flex items-start gap-4 md:gap-8">
         <button 
           onClick={() => !isCompleted && handleComplete()}
           className={`shrink-0 w-6 h-6 md:w-10 md:h-10 rounded-full border-2 mt-1.5 transition-all flex items-center justify-center ${
             isCompleted ? 'bg-amber-500 border-amber-500' : 
             isOverdue ? 'border-rose-500/50' : 'border-slate-800 group-hover:border-amber-500'
           } hover:scale-110 active:scale-90`}
         >
           <svg className={`w-3 h-3 md:w-6 md:h-6 text-amber-950 transition-opacity ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
           </svg>
         </button>
         
         <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] ${isCompleted ? 'text-slate-600' : isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                {isCompleted ? (lang === 'zh' ? '已完成' : 'Done') : (thought.dueDate ? new Date(thought.dueDate).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (lang === 'zh' ? '未排程' : 'Unscheduled'))}
              </span>
              {isOverdue && !isCompleted && <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]"></span>}
              {thought.timeEstimate && !isCompleted && (
                <span className="flex items-center gap-1 text-[8px] md:text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {thought.timeEstimate}
                </span>
              )}
            </div>
            
            <p className={`font-bold text-base md:text-2xl leading-tight break-words mb-4 transition-all ${isCompleted ? 'text-slate-700 line-through' : isOverdue ? 'text-rose-50' : 'text-slate-100'}`}>
               {thought.content}
            </p>

            {/* Sub-tasks Section */}
            {!isCompleted && thought.subTasks && thought.subTasks.length > 0 && (
              <div className="space-y-2 mb-4 animate-in slide-in-from-left-2 duration-500">
                {thought.subTasks.map(st => (
                  <div 
                    key={st.id}
                    className="w-full flex items-center gap-3 py-2 px-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group/st"
                  >
                    <button 
                       onClick={(e) => { e.stopPropagation(); toggleSubtask(st.id); }}
                       className={`shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${st.completed ? 'bg-amber-500 border-amber-500' : 'border-slate-700 group-hover/st:border-amber-500/50'}`}
                    >
                       {st.completed && <svg className="w-3 h-3 text-amber-950" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </button>
                    <input 
                       value={st.text}
                       onChange={(e) => editSubtask(st.id, e.target.value)}
                       className={`bg-transparent border-none focus:ring-0 p-0 text-xs md:text-sm font-medium w-full outline-none ${st.completed ? 'text-slate-600 line-through' : 'text-slate-300 placeholder-slate-700'}`}
                       placeholder="..."
                    />
                  </div>
                ))}
              </div>
            )}
            
            {thought.reframedContent && !isCompleted && (
              <div className="flex items-start gap-2 max-w-lg mb-2">
                <span className="text-amber-500/50 text-[10px] md:text-sm mt-0.5">✦</span>
                <p className="text-[9px] md:text-sm text-slate-500 italic leading-relaxed font-medium">
                  {thought.reframedContent}
                </p>
              </div>
            )}
         </div>

         {!isCompleted && (
           <button 
              onClick={handleCalendarClick}
              className="shrink-0 w-8 h-8 md:w-14 md:h-14 rounded-full bg-slate-800/40 border border-slate-700 hover:bg-indigo-600/20 hover:border-indigo-500/50 text-slate-600 hover:text-indigo-300 flex items-center justify-center transition-all shadow-xl mt-1 group/btn"
              title={lang === 'zh' ? '在日历中排程' : 'Schedule in Calendar'}
            >
              <svg className="w-4 h-4 md:w-7 md:h-7 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
           </button>
         )}
       </div>
       <style>{`
          @keyframes implosion {
            0% { transform: scale(1); opacity: 1; filter: brightness(1); }
            50% { transform: scale(0.95); opacity: 0.8; filter: brightness(1.5); }
            100% { transform: scale(0.1); opacity: 0; filter: brightness(5) blur(10px); }
          }
       `}</style>
    </div>
  );
};

export default ActionList;
