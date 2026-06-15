'use client';

import { useFormStatus } from 'react-dom';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { createAdminAction } from '@/app/actions/admin';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2.5 px-6 text-sm bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? 'Generating...' : 'Generate Administrator'}
    </button>
  );
}

export default function SystemAdminModal({ onClose }: { onClose: () => void }) {
  const handleCreate = async (formData: FormData) => {
    const result = await createAdminAction(formData);
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-violet-50 px-6 py-4 border-b border-violet-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">System Administrators</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                name="username" 
                required 
                placeholder="e.g. jdoe_admin"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
              <input 
                type="password" 
                name="password" 
                required 
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
              <select 
                name="role" 
                required 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
              >
                <option value="">Select an access level...</option>
                <option value="SUPER_ADMIN">Administrator</option>
                <option value="HR_MANAGER">HR Manager</option>
                <option value="AUDITOR">Internal Auditor</option>
              </select>
            </div>

            <div className="pt-4">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
