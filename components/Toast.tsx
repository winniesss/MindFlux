
import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { t } from '../locales';

interface ToastProps {
  message: string;
  onUndo: () => void;
  onClose: () => void;
  lang: Language;
}

const Toast: React.FC<ToastProps> = ({ message, onUndo, onClose, lang }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 
                  bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-full shadow-2xl 
                  transition-all duration-300 ease-out transform
                  ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
    >
      <span className="text-sm font-medium text-slate-200 tracking-wide">{message}</span>
      <div className="w-px h-4 bg-slate-600/50"></div>
      <button 
        onClick={() => {
          onUndo();
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-sm font-bold text-indigo-400 hover:text-indigo-300 active:scale-95 transition-transform"
      >
        {t('undo', lang)}
      </button>
    </div>
  );
};

export default Toast;
