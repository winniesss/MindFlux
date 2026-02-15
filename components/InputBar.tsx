
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [lineCount, setLineCount] = useState(1);
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

  // Handle auto-resize and line count detection
  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      const newHeight = el.scrollHeight;
      el.style.height = `${newHeight}px`;

      // Estimate line count (roughly based on 24px line height)
      const estimatedLines = Math.floor(newHeight / 24);
      setLineCount(estimatedLines);
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

    setText('');
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
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
    <div className={`fixed bottom-0 left-0 right-0 p-3 md:p-8 pb-[max(1.2rem,env(safe-area-inset-bottom)+0.2rem)] bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-50 flex justify-center pointer-events-none transition-all duration-300 ${isExpanded ? 'h-[70vh] items-start pt-20' : ''}`}>
      <form 
        onSubmit={handleSubmit} 
        className={`w-full max-w-3xl flex items-end gap-2 md:gap-4 pointer-events-auto transition-all duration-500 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
      >
        {/* Left Side: Voice/Mic Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`shrink-0 w-11 h-11 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl relative overflow-hidden mb-1 ${
            isListening ? 'bg-rose-500 text-white scale-105' : 'bg-white/5 text-slate-400 border border-white/10'
          }`}
        >
          {isListening ? (
            <span className="absolute inset-0 bg-rose-400 animate-pulse opacity-25"></span>
          ) : (
            <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          )}
        </button>

        {/* Center: Expandable Input Area */}
        <div className={`relative flex-1 bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] overflow-hidden transition-all duration-300 ${isExpanded ? 'flex-1 h-full' : ''}`}>
          
          {/* Top-right: Expand/Collapse toggle */}
          {lineCount >= 3 && (
            <button 
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"
            >
              {isExpanded ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              )}
            </button>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder={isProcessing ? t('syncing', lang) : isListening ? t('listening', lang) : t('inputPlaceholder', lang)}
            className={`w-full bg-transparent p-4 md:p-6 pr-10 text-base md:text-xl font-medium text-white placeholder-slate-600 focus:outline-none transition-all resize-none leading-relaxed min-h-[44px] md:min-h-[64px] max-h-[30vh] overflow-y-auto ${isExpanded ? 'max-h-full h-full' : ''}`}
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          />
        </div>

        {/* Right Side: Send Button */}
        <button 
          type="submit"
          disabled={!text.trim() || isProcessing}
          className={`shrink-0 w-11 h-11 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 mb-1 ${
            text.trim() && !isProcessing 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
              : 'bg-white/5 text-slate-600'
          }`}
        >
          <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      </form>
    </div>
  );
};

export default InputBar;
