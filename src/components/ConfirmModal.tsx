'use client';

import { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [expectedCode, setExpectedCode] = useState('123456');

  useEffect(() => {
    if (require2FA) {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedCode(generatedCode);
      
      toast.success(
        (t) => (
          <div className="flex flex-col text-white">
            <span className="font-bold text-sm">2FA Code Sent!</span>
            <span className="text-xs mt-1">Code: <strong className="text-white text-base tracking-widest">{generatedCode}</strong></span>
          </div>
        ),
        { duration: 10000, id: '2fa-toast' }
      );
    }
  }, [require2FA]);

  const handleConfirm = () => {
    if (require2FA) {
      if (code.trim() !== expectedCode) {
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
            <div className="group mb-8">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 transition-colors group-focus-within:text-violet-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Authentication Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                className={`w-full rounded-xl px-4 py-3 text-center tracking-[0.5em] text-2xl font-bold outline-none transition-all duration-300 shadow-sm border ${
                  error 
                    ? 'bg-red-50/50 border-red-300 text-red-900 focus:bg-white focus:ring-4 focus:ring-red-600/10 focus:border-red-500 hover:border-red-400' 
                    : 'bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white focus:ring-4 focus:ring-violet-600/10 focus:border-violet-500 hover:border-violet-300'
                }`}
                placeholder="123456"
              />
              {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
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
