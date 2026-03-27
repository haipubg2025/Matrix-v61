import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-sky-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  };

  const bgColors = {
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-rose-500/10 border-rose-500/20',
    info: 'bg-sky-500/10 border-sky-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl min-w-[300px] max-w-md ${bgColors[toast.type]}`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-grow text-sm font-medium text-white/90">{toast.message}</div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4 text-white/40" />
      </button>
    </motion.div>
  );
};
