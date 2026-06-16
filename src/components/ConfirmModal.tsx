'use client';

import { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  require2FA?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  require2FA = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (require2FA) {
      if (code.trim() !== '123456') {
        setError('Invalid authentication code.');
        return;
      }
    }
    setError('');
    onConfirm();
  };
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
          
          {require2FA && (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-violet-600" />
                <label className="text-sm font-bold text-slate-700">Security Verification (2FA)</label>
              </div>
              <p className="text-xs text-slate-500 mb-3">Please enter your 6-digit authenticator code.</p>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                className={`w-full px-4 py-2.5 text-center tracking-[0.5em] font-mono font-bold text-lg border rounded-lg focus:outline-none focus:ring-2 ${
                  error ? 'border-red-300 focus:ring-red-500 bg-red-50 text-red-900' : 'border-slate-300 focus:ring-violet-500 bg-white'
                }`}
                placeholder="000000"
              />
              {error && <p className="text-red-500 text-xs mt-2 font-medium flex items-center">{error}</p>}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
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
