'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { clearLogsAction } from '@/app/actions/audit';
import ConfirmModal from '@/components/ConfirmModal';

export default function ClearLogsButton() {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClear = async () => {
    setShowConfirm(false);
    setIsClearing(true);
    const result = await clearLogsAction();
    setIsClearing(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isClearing}
        className="flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors shadow-sm disabled:opacity-50 text-sm cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
        <span>{isClearing ? 'Clearing...' : 'Clear Logs'}</span>
      </button>

      {showConfirm && (
        <ConfirmModal
          title="Clear Security Logs"
          message="Are you sure you want to clear all security logs? This action cannot be undone."
          confirmText="Clear Logs"
          onConfirm={handleClear}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
