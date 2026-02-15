
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { t } from '../locales';

interface InputBarProps {
  onSubmit: (content: string) => void;
  lang: Language;
  isProcessing?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSubmit, lang, isProcessing }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((result: any) => result[0].transcript).join('');
        setText(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert(t('browserNoSpeech', lang));
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Mic start failed", e);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    // 1. Force state reset immediately
    setText('');
    
    // 2. Force stop recognition 
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    // 3. UI Blur
    if (inputRef.current) {
      inputRef.current.blur();
    }

    // 4. Trigger logic
    onSubmit(trimmed);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom)+0.5rem)] md:p-12 md:pb-16 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-50 flex justify-center pointer-events-none">
      <form 
        onSubmit={handleSubmit} 
        className={`w-full max-w-2xl flex items-center gap-3 md:gap-6 pointer-events-auto transition-all duration-500 ${isProcessing ? 'opacity-50 scale-[0.98]' : 'opacity-100'}`}
      >
        <button
          type="button"
          onClick={toggleListening}
          className={`shrink-0 w-12 h-12 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative overflow-hidden ${
            isListening ? 'bg-rose-500 text-white scale-110 shadow-rose-500/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
          }`}
        >
          {isListening ? (
            <>
              <span className="absolute inset-0 bg-rose-400 animate-ping opacity-25"></span>
              <div className="w-4 h-4 bg-white rounded-sm relative z-10 animate-pulse"></div>
            </>
          ) : (
            <svg className="w-5 h-5 md:w-9 md:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          )}
        </button>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing}
            placeholder={isProcessing ? t('syncing', lang) : isListening ? t('listening', lang) : t('inputPlaceholder', lang)}
            className="w-full bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[1.2rem] md:rounded-[2.5rem] py-3.5 pl-5 pr-12 md:py-6 md:pl-8 md:pr-24 text-sm md:text-2xl font-medium text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all shadow-2xl appearance-none"
          />
          <button 
            type="submit"
            disabled={!text.trim() || isProcessing}
            className={`absolute right-1.5 top-1.5 bottom-1.5 aspect-square md:right-3 md:top-3 md:bottom-3 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-300 ${
              text.trim() && !isProcessing ? 'bg-indigo-600 text-white opacity-100 scale-100 shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-600 opacity-0 scale-75'
            }`}
          >
            <svg className="w-5 h-5 md:w-9 md:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputBar;
