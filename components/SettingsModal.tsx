
import React, { useState } from 'react';
import { Language, CalendarProvider } from '../types';
import { t } from '../locales';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currentVersion: string;
  calendarProvider: CalendarProvider;
  onConnectCalendar: (provider: CalendarProvider) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  lang, 
  onLanguageChange,
  currentVersion, 
  calendarProvider, 
  onConnectCalendar 
}) => {
  const [checking, setChecking] = useState(false);
  const [updateFound, setUpdateFound] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState<CalendarProvider>(null);

  const languages: { code: Language; label: string; name: string }[] = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'zh', label: 'ZH', name: '中文' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'ja', label: 'JA', name: '日本語' },
    { code: 'fr', label: 'FR', name: 'Français' },
  ];

  if (!isOpen) return null;

  const handleCheckUpdate = () => {
    setChecking(true);
    setStatusMsg('');
    setTimeout(() => {
      setChecking(false);
      setUpdateFound(true);
      setStatusMsg(t('updateAvailable', lang));
    }, 2000);
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleConnect = (provider: CalendarProvider) => {
    if (calendarProvider === provider) {
      onConnectCalendar(null);
      return;
    }
    setIsConnecting(provider);
    setTimeout(() => {
      setIsConnecting(null);
      onConnectCalendar(provider);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[90vh] p-8 md:p-12">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
             <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
             </svg>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">{t('settings', lang)}</h2>

          <div className="space-y-8 text-left">
            
            {/* Language Selection - Segmented Control style */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Locale</p>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                  {languages.find(l => l.code === lang)?.name}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 p-1.5 bg-slate-950/40 rounded-2xl border border-white/5">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => onLanguageChange(l.code)}
                    className={`h-11 rounded-xl text-[10px] font-black transition-all flex items-center justify-center ${
                      lang === l.code 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                    title={l.name}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar Integration Section */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1">Integrations</p>
              <div className="grid grid-cols-1 gap-2.5">
                <button 
                  onClick={() => handleConnect('GOOGLE')}
                  disabled={!!isConnecting}
                  className={`relative flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 group overflow-hidden ${
                    calendarProvider === 'GOOGLE' 
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-white' 
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="text-xs md:text-sm font-bold">{t('connectGoogle', lang)}</span>
                  <div className="flex items-center gap-2">
                    {isConnecting === 'GOOGLE' && <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>}
                    {calendarProvider === 'GOOGLE' && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('connected', lang)}</span>}
                  </div>
                </button>

                <button 
                  onClick={() => handleConnect('APPLE')}
                  disabled={!!isConnecting}
                  className={`relative flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 group overflow-hidden ${
                    calendarProvider === 'APPLE' 
                      ? 'bg-slate-100/10 border-slate-100/30 text-white' 
                      : 'bg-slate-800/40 border-white/5 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="text-xs md:text-sm font-bold">{t('connectApple', lang)}</span>
                  <div className="flex items-center gap-2">
                    {isConnecting === 'APPLE' && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                    {calendarProvider === 'APPLE' && <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('connected', lang)}</span>}
                  </div>
                </button>
              </div>
            </div>

            {/* Version & Update */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center px-5 py-4 bg-slate-800/30 rounded-2xl border border-white/5">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('version', lang)}</span>
                <span className="text-slate-300 text-xs font-black tracking-widest">v{currentVersion}</span>
              </div>
              
              {updateFound ? (
                <button 
                  onClick={handleUpdate}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-amber-950 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-amber-900/20"
                >
                  {t('updateNow', lang)} (v1.2.1)
                </button>
              ) : (
                <button 
                  onClick={handleCheckUpdate}
                  disabled={checking}
                  className="w-full py-4 bg-slate-800/60 hover:bg-slate-700 text-slate-500 hover:text-slate-300 font-black uppercase tracking-widest text-[9px] rounded-2xl transition-all border border-white/5"
                >
                  {checking ? t('checking', lang) : t('checkForUpdates', lang)}
                </button>
              )}
            </div>
          </div>
          
          <div className="pt-4 text-center">
            <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.3em]">Flux Dynamics Systems © 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
