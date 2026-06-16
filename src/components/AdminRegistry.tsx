'use client';

import { useState } from 'react';
import { ShieldAlert, UserCheck, UserX, Search, RotateCcw, Edit2, Check, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { approveAdminAction, suspendAdminAction, restoreUserAccessAction, updateAdminRoleAction } from '@/app/actions/admin';
import toast from 'react-hot-toast';

export default function AdminRegistry({ 
  pendingAdmins, 
  activeAdmins, 
  currentAdminId 
}: { 
  pendingAdmins: any[], 
  activeAdmins: any[], 
  currentAdminId: string 
}) {
  const [adminToProcess, setAdminToProcess] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'suspend' | 'restore' | 'editRole' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for inline editing in Active Roster
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<string>('');
  
  // State to hold the selected role for each pending admin before approving
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});

  const filteredPending = pendingAdmins.filter(admin => 
    admin.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActive = activeAdmins.filter(admin => 
    admin.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleSelect = (adminId: string, role: string) => {
    setPendingRoles(prev => ({ ...prev, [adminId]: role }));
  };

  const executeAction = async () => {
    if (!adminToProcess || !actionType) return;
    
    let result;
    if (actionType === 'approve') {
      const selectedRole = pendingRoles[adminToProcess.id];
      if (!selectedRole) {
        toast.error("Please select a role first.");
        return;
      }
      result = await approveAdminAction(adminToProcess.id, selectedRole);
    } else if (actionType === 'suspend') {
      result = await suspendAdminAction(adminToProcess.id);
    } else if (actionType === 'restore') {
      result = await restoreUserAccessAction(adminToProcess.id);
    } else if (actionType === 'editRole') {
      if (!editingRoleValue) return;
      result = await updateAdminRoleAction(adminToProcess.id, editingRoleValue);
      if (result.success) {
        setEditingRoleId(null);
      }
    }

    if (result?.success) {
      toast.success(result.message);
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(result?.message || 'Action failed.');
    }
    
    setAdminToProcess(null);
    setActionType(null);
  };

  // Replaced by 2FA execution
  const handleSaveRole = async (adminId: string) => {
    // Left empty since it's routed through ConfirmModal now
  };

  const getRoleBadge = (role: string) => {
    if (role === 'UNASSIGNED') return <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">Unassigned</span>;
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold">Super Admin</span>;
      case 'ADMIN':
        return <span className="bg-fuchsia-100 text-fuchsia-700 px-3 py-1 rounded-full text-xs font-bold">Admin</span>;
      case 'HR_MANAGER':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">HR Manager</span>;
      case 'AUDITOR':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Auditor</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{role}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">Pending Approval</span>;
      case 'APPROVED':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>;
      case 'SUSPENDED':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Suspended</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by username..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 shadow-sm transition-shadow"
        />
      </div>

      {/* SECTION 1: Approval Queue */}
      <div className="bg-white rounded-xl shadow-sm border border-violet-200 overflow-hidden">
        <div className="px-5 py-6 border-b border-violet-100 bg-violet-50">
          <h3 className="text-lg font-bold text-violet-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Approval Queue
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[13px] border-b border-slate-200 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">Requested Date</th>
                <th className="px-6 py-4 font-semibold">Role Assignment</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-slate-50">
              {filteredPending.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 flex items-center space-x-3">
                    <ShieldAlert className="w-5 h-5 text-violet-500" />
                    <span>{admin.username}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 block w-full p-2"
                      value={pendingRoles[admin.id] || ""}
                      onChange={(e) => handleRoleSelect(admin.id, e.target.value)}
                    >
                      <option value="" disabled>Select a Role</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                      <option value="ADMIN">Admin</option>
                      <option value="HR_MANAGER">HR Manager</option>
                      <option value="AUDITOR">Auditor</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      disabled={!pendingRoles[admin.id]}
                      onClick={() => { setAdminToProcess(admin); setActionType('approve'); }}
                      className={`inline-flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        pendingRoles[admin.id] 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Approve</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPending.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No pending requests in the queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Active Roster */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-slate-500" />
            Active Roster
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[13px] border-b border-slate-200 uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Username</th>
                <th className="px-6 py-4 font-semibold">System Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-slate-50">
              {filteredActive.map((admin) => (
                <tr key={admin.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${admin.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <span>{admin.username}</span>
                    {admin.id === currentAdminId && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">You</span>}
                  </td>
                  <td className="px-6 py-4">
                    {editingRoleId === admin.id ? (
                      <div className="flex items-center space-x-2">
                        <select
                          className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-violet-500 focus:border-violet-500 block w-full p-1"
                          value={editingRoleValue}
                          onChange={(e) => setEditingRoleValue(e.target.value)}
                        >
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="ADMIN">Admin</option>
                          <option value="HR_MANAGER">HR Manager</option>
                          <option value="AUDITOR">Auditor</option>
                        </select>
                        <button onClick={() => { setAdminToProcess(admin); setActionType('editRole'); }} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded transition-colors"><Check className="w-4 h-4"/></button>
                        <button onClick={() => setEditingRoleId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded transition-colors"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {getRoleBadge(admin.role)}
                        {admin.id !== currentAdminId && admin.status === 'APPROVED' && (
                          <button 
                            onClick={() => { setEditingRoleId(admin.id); setEditingRoleValue(admin.role); }}
                            className="text-slate-400 hover:text-violet-600 hover:bg-violet-50 p-1 rounded transition-colors"
                            title="Edit Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(admin.status)}</td>
                  <td className="px-6 py-4 text-right">
                    {admin.id !== currentAdminId && (
                      admin.status === 'APPROVED' ? (
                        <button
                          onClick={() => { setAdminToProcess(admin); setActionType('suspend'); }}
                          className="inline-flex items-center space-x-1 border border-red-200 text-red-600 hover:border-red-600 hover:bg-red-50 transition-colors px-3 py-1.5 rounded-md text-sm font-medium"
                        >
                          <UserX className="w-4 h-4" />
                          <span>Suspend</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => { setAdminToProcess(admin); setActionType('restore'); }}
                          className="inline-flex items-center space-x-1 border border-emerald-200 text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 transition-colors px-3 py-1.5 rounded-md text-sm font-medium"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Restore Access</span>
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {filteredActive.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No active administrators found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {adminToProcess && actionType && (
        <ConfirmModal
          title={
            actionType === 'approve' ? "Approve Access Request" :
            actionType === 'suspend' ? "Suspend Administrator" : 
            actionType === 'editRole' ? "Confirm Role Change" :
            "Restore Access"
          }
          message={
            actionType === 'approve' ? `Are you sure you want to approve ${adminToProcess.username} and assign them the role of ${pendingRoles[adminToProcess.id] || 'selected'}?` :
            actionType === 'suspend' ? `Are you sure you want to suspend ${adminToProcess.username}? They will lose all access to the system immediately.` :
            actionType === 'editRole' ? `Are you sure you want to change ${adminToProcess.username}'s role to ${editingRoleValue}?` :
            `Are you sure you want to restore access for ${adminToProcess.username}?`
          }
          confirmText={
            actionType === 'approve' ? "Approve" :
            actionType === 'suspend' ? "Suspend" :
            actionType === 'editRole' ? "Update Role" :
            "Restore"
          }
          require2FA={true}
          onConfirm={executeAction}
          onCancel={() => { setAdminToProcess(null); setActionType(null); }}
        />
      )}
    </div>
  );
}
