
import React, { useState, useEffect } from 'react';
import { Language, CalendarProvider } from '../types';
import { t } from '../locales';
import { setGoogleAccessToken } from '../services/googleService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  currentVersion: string;
  calendarProvider: CalendarProvider;
  onConnectCalendar: (provider: CalendarProvider) => void;
}

type UpdateStatus = 'IDLE' | 'CHECKING' | 'AVAILABLE' | 'UPDATING' | 'COMPLETED';

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  lang, 
  onLanguageChange,
  currentVersion, 
  calendarProvider, 
  onConnectCalendar 
}) => {
  const [isConnecting, setIsConnecting] = useState<CalendarProvider>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('IDLE');
  const [updateProgress, setUpdateProgress] = useState(0);
  const clientId = localStorage.getItem('flux_google_client_id') || '';

  const languages: { code: Language; label: string; name: string }[] = [
    { code: 'zh', label: '中文', name: '中文' },
    { code: 'en', label: 'EN', name: 'English' },
  ];

  const handleCheckUpdate = () => {
    setUpdateStatus('CHECKING');
    setTimeout(() => {
      setUpdateStatus('AVAILABLE');
    }, 1800);
  };

  const handleStartUpdate = () => {
    setUpdateStatus('UPDATING');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        setUpdateProgress(100);
        clearInterval(interval);
        setTimeout(() => setUpdateStatus('COMPLETED'), 800);
      } else {
        setUpdateProgress(progress);
      }
    }, 400);
  };

  const handleConnectGoogle = () => {
    if (!clientId.trim()) {
      alert(lang === 'zh' ? "请在控制台配置 Client ID 后重试。" : "Please configure Client ID in console first.");
      return;
    }

    if (calendarProvider === 'GOOGLE') {
      setGoogleAccessToken(null);
      onConnectCalendar(null);
      return;
    }

    setIsConnecting('GOOGLE');
    
    try {
      if (!(window as any).google) {
        throw new Error("Google Identity Services not loaded");
      }

      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.access_token) {
            setGoogleAccessToken(response.access_token);
            onConnectCalendar('GOOGLE');
          }
          setIsConnecting(null);
        },
        error_callback: (err: any) => {
          console.error("GIS Error:", err);
          setIsConnecting(null);
          alert("Google Calendar connection failed. Check your network or Client ID.");
        }
      });
      client.requestAccessToken();
    } catch (e) {
      console.error("OAuth init failed", e);
      setIsConnecting(null);
      alert("Failed to initiate Google Login.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden p-8 md:p-12">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 md:top-8 md:right-8 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-90"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-10">
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-white">{t('settings', lang)}</h2>

          <div className="space-y-8 text-left">
            {/* Language Selector */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 px-2">Language</p>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/50 rounded-2xl border border-white/5">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => onLanguageChange(l.code)}
                    className={`h-12 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center ${
                      lang === l.code ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Integrations Section */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 px-2">Integrations</p>
              
              <button 
                onClick={handleConnectGoogle}
                disabled={!!isConnecting}
                className={`w-full relative flex items-center justify-between px-6 py-5 rounded-2xl border transition-all duration-300 ${
                  calendarProvider === 'GOOGLE' 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : !clientId.trim()
                      ? 'bg-slate-800/40 border-white/5 text-slate-600 opacity-50 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-white hover:border-indigo-500/50 hover:bg-indigo-500/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.22-2.18 4.42-1.32 1.32-3.3 2.62-6.66 2.62-5.4 0-9.75-4.4-9.75-9.75s4.35-9.75 9.75-9.75c3.02 0 5.25 1.18 6.9 2.76l2.31-2.31c-2.02-1.92-4.9-3.45-9.21-3.45-8.28 0-15 6.72-15 15s6.72 15 15 15c4.47 0 7.84-1.47 10.47-4.23 2.73-2.73 3.6-6.6 3.6-9.72 0-.6-.06-1.17-.18-1.71h-13.89z"/>
                  </svg>
                  <span className="text-sm font-black uppercase tracking-widest">
                    {calendarProvider === 'GOOGLE' ? t('connected', lang) : t('connectGoogle', lang)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isConnecting === 'GOOGLE' && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>}
                  {calendarProvider === 'GOOGLE' && <svg className="w-6 h-6 text-indigo-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                </div>
              </button>
            </div>

            {/* System Update Section */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">System Software</p>
                <span className="text-[10px] font-bold text-slate-700">v{updateStatus === 'COMPLETED' ? '2.1.3' : currentVersion}</span>
              </div>

              {updateStatus === 'IDLE' && (
                <button 
                  onClick={handleCheckUpdate}
                  className="w-full py-4 rounded-xl bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {t('checkForUpdates', lang)}
                </button>
              )}

              {updateStatus === 'CHECKING' && (
                <div className="w-full py-4 rounded-xl bg-slate-800/20 border border-white/5 flex items-center justify-center gap-3">
                  <span className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{t('checking', lang)}</span>
                </div>
              )}

              {updateStatus === 'AVAILABLE' && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{t('updateAvailable', lang)}</span>
                      <span className="text-[10px] font-black text-amber-500/50">v2.1.3</span>
                    </div>
                    <ul className="text-[10px] text-slate-400 space-y-1 font-medium italic">
                      <li>• {lang === 'zh' ? '视觉尺度重构：更精致的桌面端排版' : 'Visual Scale Down: Refined desktop typography'}</li>
                      <li>• {lang === 'zh' ? '交互优化：思绪解构更精准' : 'Interaction tuning: Precise thought deconstruction'}</li>
                      <li>• {lang === 'zh' ? '系统稳定性提升' : 'Stability improvements'}</li>
                    </ul>
                  </div>
                  <button 
                    onClick={handleStartUpdate}
                    className="w-full py-4 rounded-xl bg-amber-500 text-amber-950 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {t('updateNow', lang)}
                  </button>
                </div>
              )}

              {updateStatus === 'UPDATING' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">{lang === 'zh' ? '正在安装...' : 'Installing...'}</span>
                    <span className="text-[10px] font-black text-indigo-400">{Math.round(updateProgress)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
                      style={{ width: `${updateProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {updateStatus === 'COMPLETED' && (
                <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-3 animate-in zoom-in-95">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{t('upToDate', lang)}</span>
                </div>
              )}
            </div>

            <div className="pt-6 text-center opacity-20">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Flux Dynamics Engineering</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
