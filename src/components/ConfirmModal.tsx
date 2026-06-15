'use client';

import { X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-sm mb-6">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm cursor-pointer ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-violet-600 hover:bg-violet-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
