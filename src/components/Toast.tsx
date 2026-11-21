import React from 'react';
import { Sparkles, CheckCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 mx-auto max-w-sm px-4 z-50 pointer-events-none flex justify-center animate-fade-in-up">
      <div className="bg-stone-900/95 text-white px-4 py-3 rounded-2xl shadow-xl border border-stone-800 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold backdrop-blur-md">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
      </div>
    </div>
  );
};
