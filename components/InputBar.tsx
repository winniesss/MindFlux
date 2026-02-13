
import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { t } from '../locales';

interface InputBarProps {
  onSubmit: (content: string) => void;
  lang: Language;
}

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const InputBar: React.FC<InputBarProps> = ({ onSubmit, lang }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript || interimTranscript) {
           setText(finalTranscript || interimTranscript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(t('browserNoSpeech', lang));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 pb-10 md:p-12 md:pb-16 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-40 flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl relative flex items-center gap-4 transition-all">
        
        <button
          type="button"
          onClick={toggleListening}
          className={`relative shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
            isListening 
              ? 'bg-rose-500 text-white ring-4 ring-rose-500/20 scale-110' 
              : 'bg-slate-900/80 text-slate-500 hover:text-white border border-slate-800 hover:border-slate-600'
          }`}
        >
          {isListening ? (
            <>
               <span className="absolute inset-0 rounded-full bg-rose-500 animate-[ping_1.5s_infinite] opacity-50"></span>
               <div className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-sm z-10 animate-pulse"></div>
            </>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 md:h-8 md:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
          )}
        </button>

        <div className="relative flex-1">
            <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isListening ? t('listening', lang) : t('inputPlaceholder', lang)}
            className={`w-full backdrop-blur-3xl border rounded-3xl py-4 pl-6 md:py-6 md:pl-8 pr-16 md:pr-20 text-base md:text-2xl font-medium focus:outline-none transition-all shadow-2xl appearance-none tracking-tight
                ${isListening 
                    ? 'bg-rose-500/5 border-rose-500/30 text-rose-100 placeholder-rose-300/40' 
                    : 'bg-white/5 border-white/10 text-white placeholder-slate-600 focus:bg-white/10 focus:border-white/30'
                }`}
            />
            <button 
            type="submit"
            disabled={!text.trim()}
            className={`absolute right-2 md:right-3 top-2 md:top-3 bottom-2 md:bottom-3 aspect-square rounded-2xl flex items-center justify-center transition-all duration-500 shadow-2xl
                ${text.trim() 
                    ? 'bg-indigo-600 active:bg-indigo-500 text-white scale-100 opacity-100' 
                    : 'bg-slate-800 text-slate-600 scale-90 opacity-0 pointer-events-none'
                }`}
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            </button>
        </div>

      </form>
    </div>
  );
};

export default InputBar;
