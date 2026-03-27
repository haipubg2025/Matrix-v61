
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    danger: {
      bg: 'bg-rose-500',
      bgLight: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-500',
      hover: 'hover:bg-rose-400',
      shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.5)]',
      btnShadow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]'
    },
    warning: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-500',
      hover: 'hover:bg-amber-400',
      shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
      btnShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
    },
    info: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-500',
      hover: 'hover:bg-blue-400',
      shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
      btnShadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]'
    }
  };
  
  const cls = colorClasses[type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className={`h-1.5 w-full ${cls.bg} ${cls.shadow}`} />
          
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${cls.bgLight} border ${cls.border} ${cls.text}`}>
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">{title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{message}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-neutral-400 border border-white/10 rounded-xl mono text-[10px] font-black uppercase transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={`flex-1 py-3 ${cls.bg} ${cls.hover} text-black rounded-xl mono text-[10px] font-black uppercase transition-all ${cls.btnShadow}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
          
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 text-neutral-600 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
