import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastItem {
  id: string;
  type?: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg bg-white transition-all animate-in slide-in-from-bottom-3 duration-200 text-xs font-medium',
              toast.type === 'error' && 'border-red-200 text-red-900',
              toast.type === 'success' && 'border-[#E5E5E1] text-[#222321]',
              toast.type === 'info' && 'border-[#E5E5E1] text-[#222321]'
            )}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && (
                <div className="w-5 h-5 rounded-full bg-[#E8EB39] flex items-center justify-center text-[#222321] shrink-0">
                  <CheckCircle2 size={13} className="stroke-[2.5]" />
                </div>
              )}
              {toast.type === 'error' && (
                <AlertCircle size={16} className="text-red-500 shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info size={16} className="text-[#73756F] shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#73756F] hover:text-[#222321] ml-3 p-1 rounded-md"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
