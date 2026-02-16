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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      const newHeight = el.scrollHeight;
      el.style.height = `${newHeight}px`;
    }
  }, [text]);

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

    if (isListening || recognitionRef.current) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {}
      setIsListening(false);
    }

    setText('');
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom)+0.75rem)] bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-50 flex justify-center pointer-events-none">
      <form 
        onSubmit={handleSubmit} 
        className={`w-full max-w-4xl flex items-end gap-3 md:gap-4 pointer-events-auto transition-all duration-500 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
      >
        <button
          type="button"
          onClick={toggleListening}
          className={`shrink-0 h-[56px] w-[56px] md:h-16 md:w-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative overflow-hidden ${
            isListening ? 'bg-rose-500 text-white' : 'bg-slate-900 border border-white/10 text-slate-400'
          }`}
        >
          {isListening ? (
            <span className="absolute inset-0 bg-rose-400 animate-pulse opacity-25"></span>
          ) : (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          )}
        </button>

        <div className="relative flex-1 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[28px] md:rounded-[32px] overflow-hidden transition-all duration-300 flex flex-col min-h-[56px] md:min-h-[64px]" style={{ height: text ? 'auto' : '56px' }}>
          <div className="flex-1 flex items-center">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              placeholder={isProcessing ? t('syncing', lang) : isListening ? t('listening', lang) : t('inputPlaceholder', lang)}
              className="w-full bg-transparent p-0 px-6 py-[16px] md:px-8 md:py-[18px] text-base md:text-lg font-bold text-white placeholder:text-slate-600/60 placeholder:font-medium focus:outline-none transition-all resize-none leading-relaxed md:leading-relaxed min-h-[56px] md:min-h-[64px] max-h-[30vh] overflow-y-auto"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={!text.trim() || isProcessing}
          className={`shrink-0 h-[56px] w-[56px] md:h-16 md:w-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            text.trim() && !isProcessing 
              ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' 
              : 'bg-slate-900 border border-white/5 text-slate-700'
          }`}
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      </form>
    </div>
  );
};

export default InputBar;