'use client';

import { useState } from 'react';
import { Plus, ShieldAlert, Trash2 } from 'lucide-react';
import SystemAdminModal from './SystemAdminModal';
import ConfirmModal from './ConfirmModal';
import { revokeAdminAccessAction } from '@/app/actions/admin';
import toast from 'react-hot-toast';

export default function AdminRegistry({ initialAdmins, currentAdminId }: { initialAdmins: any[], currentAdminId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<any>(null);

  const handleRevoke = async () => {
    if (!adminToDelete) return;
    
    const result = await revokeAdminAccessAction(adminToDelete.id);
    if (result.success) {
      toast.success(result.message);
      // Wait a moment and then reload the page to refresh the list natively
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(result.message);
    }
    setAdminToDelete(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold">Admin</span>;
      case 'HR_MANAGER':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">HR Manager</span>;
      case 'AUDITOR':
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">Auditor</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-all duration-200 shadow-sm hover:shadow active:scale-95 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Role</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[13px] border-b border-slate-200 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">System Role</th>
                <th className="px-6 py-4 font-semibold">Registered Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-slate-50">
              {initialAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 flex items-center space-x-3">
                    <ShieldAlert className="w-5 h-5 text-slate-400" />
                    <span>{admin.username}</span>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(admin.role)}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {admin.id !== currentAdminId && (
                      <button
                        onClick={() => setAdminToDelete(admin)}
                        className="inline-flex items-center space-x-1 border border-red-200 text-red-600 hover:border-red-600 hover:bg-red-50 transition-colors px-3 py-1.5 rounded-md text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Revoke Access</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {initialAdmins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No system roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <SystemAdminModal onClose={() => setIsModalOpen(false)} />}
      
      {adminToDelete && (
        <ConfirmModal
          title="Revoke Role Access"
          message={`Are you sure you want to revoke access for ${adminToDelete.username}? This action is irreversible.`}
          confirmText="Revoke Access"
          onConfirm={handleRevoke}
          onCancel={() => setAdminToDelete(null)}
        />
      )}
    </div>
  );
}
