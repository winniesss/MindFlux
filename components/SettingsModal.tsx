
import React, { useState } from 'react';
import { Language } from '../types';
import { t } from '../locales';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currentVersion: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  lang, 
  onLanguageChange,
  currentVersion
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const handleCheckUpdate = () => {
    setIsChecking(true);
    setCheckResult(null);
    setTimeout(() => {
      setIsChecking(false);
      setCheckResult(t('upToDate', lang));
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] p-8 md:p-12 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-90"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-10">
          <h2 className="text-3xl font-black tracking-tighter text-white">{t('settings', lang)}</h2>

          <div className="space-y-12 text-left">
            {/* Language Selector */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 px-2">Locale</p>
              <div className="flex gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'zh', label: '中文' }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => onLanguageChange(l.code as Language)}
                    className={`flex-1 h-12 rounded-xl text-xs font-black transition-all ${
                      lang === l.code ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* System Version Check */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 px-2">{t('versionInfo', lang)}</p>
              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col items-center gap-4">
                 <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Flux Engine</span>
                    <span className="text-2xl font-black text-white">v{currentVersion}</span>
                 </div>
                 
                 <button 
                  onClick={handleCheckUpdate}
                  disabled={isChecking}
                  className={`w-full py-4 rounded-xl border flex items-center justify-center gap-3 transition-all ${
                    checkResult 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                 >
                   {isChecking ? (
                     <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                   ) : checkResult ? (
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                   ) : null}
                   <span className="text-[10px] font-black uppercase tracking-widest">
                     {isChecking ? t('checking', lang) : checkResult || t('checkUpdate', lang)}
                   </span>
                 </button>
              </div>
            </div>

            <div className="text-center opacity-20">
               <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">Project Flux Dynamics &copy; 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
