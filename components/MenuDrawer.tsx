
import React from 'react';
import { ThoughtStatus, Language } from '../types';
import { t } from '../locales';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'NEBULA' | 'LIST' | 'STILLNESS';
  setView: (view: 'NEBULA' | 'LIST' | 'STILLNESS') => void;
  counts: { unsorted: number; action: number; stillness: number };
  lang: Language;
  onOpenSettings: () => void;
  appVersion: string;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  setView,
  counts,
  lang,
  onOpenSettings,
  appVersion
}) => {
  const handleNav = (view: 'NEBULA' | 'LIST' | 'STILLNESS') => {
    setView(view);
    onClose();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed top-0 right-0 z-[80] h-full w-[85%] max-w-[320px] bg-slate-950/98 border-l border-white/5 backdrop-blur-3xl transition-transform duration-500 ease-out p-8 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase italic">Flux Control</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 space-y-4">
          {[
            { id: 'NEBULA', label: t('chaos', lang), count: counts.unsorted, activeClass: 'bg-white text-slate-950 border-white' },
            { id: 'LIST', label: t('actions', lang), count: counts.action, activeClass: 'bg-amber-500 text-amber-950 border-amber-500 shadow-xl' },
            { id: 'STILLNESS', label: t('stillness', lang), count: counts.stillness, activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xl' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => handleNav(item.id as any)}
              className={`w-full group flex items-center justify-between px-6 py-5 rounded-3xl border transition-all duration-300 ${currentView === item.id ? item.activeClass : 'bg-white/5 border-white/5 text-white/60'}`}
            >
              <span className="text-sm font-black uppercase tracking-[0.1em]">{item.label}</span>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${currentView === item.id ? 'bg-black/10' : 'bg-white/10 text-white/40'}`}>
                {item.count}
              </span>
            </button>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 space-y-6">
          <button 
            onClick={() => { onOpenSettings(); onClose(); }}
            className="w-full py-5 px-6 rounded-3xl bg-white/5 border border-white/5 text-slate-400 flex items-center gap-4 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            <span className="text-xs font-black uppercase tracking-widest">{t('settings', lang)}</span>
          </button>

          <div className="flex justify-between items-center text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] px-2">
            <span>Flux Dynamics</span>
            <span>v{appVersion}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuDrawer;
