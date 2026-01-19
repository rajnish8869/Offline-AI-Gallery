
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20';
      default: return 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up transform transition-all">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full flex-shrink-0 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 flex justify-end gap-3 border-t border-slate-700/50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${getVariantStyles()}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
