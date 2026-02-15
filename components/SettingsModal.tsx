
import React, { useState } from 'react';
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
  const [clientId, setClientId] = useState(localStorage.getItem('flux_google_client_id') || '');
  const [showConfig, setShowConfig] = useState(!localStorage.getItem('flux_google_client_id'));
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [copied, setCopied] = useState(false);

  const languages: { code: Language; label: string; name: string }[] = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'zh', label: 'ZH', name: '中文' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'ja', label: 'JA', name: '日本語' },
    { code: 'fr', label: 'FR', name: 'Français' },
  ];

  const handleConnectGoogle = () => {
    const sanitizedId = clientId.trim();
    if (!sanitizedId) {
      setShowConfig(true);
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
        client_id: sanitizedId,
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
          setShowTroubleshooting(true);
        }
      });
      client.requestAccessToken();
    } catch (e) {
      console.error("OAuth init failed", e);
      setIsConnecting(null);
      setShowTroubleshooting(true);
      alert("Failed to initiate Google Login. Please check the Troubleshooting guide.");
    }
  };

  const handleCopyOrigin = () => {
    const origin = window.location.origin;
    navigator.clipboard.writeText(origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveClientId = (val: string) => {
    setClientId(val);
    localStorage.setItem('flux_google_client_id', val.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-y-auto max-h-[90vh] p-8 md:p-14">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 md:top-10 md:right-10 w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="text-center space-y-10 md:space-y-14">
          <h2 className="text-2xl md:text-5xl font-black tracking-tighter text-white">{t('settings', lang)}</h2>

          <div className="space-y-10 text-left">
            {/* Language Selector */}
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 px-2">Locale</p>
              <div className="grid grid-cols-5 gap-2 p-1.5 bg-slate-950/50 rounded-2xl border border-white/5">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => onLanguageChange(l.code)}
                    className={`h-12 rounded-[1rem] text-xs md:text-sm font-black transition-all flex items-center justify-center ${
                      lang === l.code ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Integrations Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Integrations</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                    className={`text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${showTroubleshooting ? 'text-rose-400' : 'text-slate-600 hover:text-rose-400'}`}
                  >
                    {lang === 'zh' ? '故障排查' : '400 Error?'}
                  </button>
                  <button 
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-[10px] md:text-xs font-bold text-slate-600 hover:text-indigo-400 transition-colors uppercase tracking-widest"
                  >
                    {showConfig ? 'Hide Config' : t('setupGuide', lang)}
                  </button>
                </div>
              </div>

              {showTroubleshooting && (
                <div className="p-6 bg-rose-500/5 rounded-[2rem] border border-rose-500/20 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-xs text-rose-300 font-bold uppercase tracking-widest">{lang === 'zh' ? '解决 400 错误' : 'Fixing 400 Error'}</p>
                  <ul className="text-sm text-slate-400 space-y-3 list-disc list-inside leading-relaxed font-medium">
                    <li><b className="text-slate-200">1. Test Users:</b> Go to <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" className="text-indigo-400 underline">OAuth Consent Screen</a> and add your email.</li>
                    <li><b className="text-slate-200">2. Origin Match:</b> Ensure exact URL match in <b>"Authorized JavaScript origins"</b>.</li>
                    <li><b className="text-slate-200">3. Redirect URI:</b> DO NOT set any Redirect URIs for Web apps.</li>
                  </ul>
                </div>
              )}

              {showConfig && (
                <div className="p-7 bg-black/40 rounded-[2rem] border border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t('setupGuide', lang)}</p>
                    <ol className="text-xs md:text-sm text-slate-500 space-y-2 list-decimal list-inside font-medium leading-relaxed">
                      <li>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-indigo-400 underline">Google Cloud Console</a>.</li>
                      <li>Enable <b>Calendar API</b>.</li>
                      <li>Create an <b>OAuth 2.0 Client ID</b> (Web App).</li>
                      <li>Add the URL below to <b>Authorized JavaScript Origins</b>.</li>
                    </ol>
                  </div>

                  <button 
                    onClick={handleCopyOrigin}
                    className={`w-full py-3.5 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                      copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800/50 border-white/5 text-slate-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    <span className="text-xs font-bold uppercase tracking-widest">{copied ? t('originCopied', lang) : t('copyOrigin', lang)}</span>
                  </button>

                  <div className="space-y-3">
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t('enterClientId', lang)}</p>
                     <input 
                      type="text"
                      value={clientId}
                      onChange={(e) => saveClientId(e.target.value)}
                      placeholder="...apps.googleusercontent.com"
                      className="w-full bg-slate-800 border-none rounded-2xl p-4 text-sm text-white placeholder-slate-700 focus:ring-2 focus:ring-indigo-500 font-mono shadow-inner"
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleConnectGoogle}
                disabled={!!isConnecting}
                className={`w-full relative flex items-center justify-between px-8 py-6 rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${
                  calendarProvider === 'GOOGLE' 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-600/40' 
                    : !clientId.trim() 
                      ? 'bg-slate-800/40 border-white/5 text-slate-600 cursor-not-allowed opacity-50'
                      : 'bg-white/5 border-white/15 text-white hover:border-indigo-500/50 hover:bg-indigo-500/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.22-2.18 4.42-1.32 1.32-3.3 2.62-6.66 2.62-5.4 0-9.75-4.4-9.75-9.75s4.35-9.75 9.75-9.75c3.02 0 5.25 1.18 6.9 2.76l2.31-2.31c-2.02-1.92-4.9-3.45-9.21-3.45-8.28 0-15 6.72-15 15s6.72 15 15 15c4.47 0 7.84-1.47 10.47-4.23 2.73-2.73 3.6-6.6 3.6-9.72 0-.6-.06-1.17-.18-1.71h-13.89z"/>
                  </svg>
                  <span className="text-sm md:text-xl font-black uppercase tracking-[0.1em]">
                    {calendarProvider === 'GOOGLE' ? t('connected', lang) : t('connectGoogle', lang)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {isConnecting === 'GOOGLE' && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>}
                  {calendarProvider === 'GOOGLE' && <svg className="w-7 h-7 text-indigo-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                </div>
              </button>
            </div>

            <div className="pt-8 flex justify-between items-center px-2 opacity-30">
              <span className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Flux Dynamics v{currentVersion}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
