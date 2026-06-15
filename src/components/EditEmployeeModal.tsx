'use client';

import { useFormStatus } from 'react-dom';
import { X, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { updateEmployeeAction, terminateEmployeeAction } from '@/app/actions/employee';
import ConfirmModal from '@/components/ConfirmModal';

function SubmitButton({ isAuditor }: { isAuditor: boolean }) {
  const { pending } = useFormStatus();
  if (isAuditor) return null;
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full sm:flex-1 py-2.5 px-6 text-sm bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export default function EditEmployeeModal({
  employee,
  role,
  positions,
  onClose,
}: {
  employee: any;
  role: string;
  positions: any[];
  onClose: () => void;
}) {
  const isAuditor = role === 'AUDITOR';
  const isHR = role === 'HR_MANAGER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const initialDeptId = positions.find(p => p.id === employee.position_id)?.department_id || '';
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDeptId);
  const [selectedPositionId, setSelectedPositionId] = useState(employee.position_id || '');
  
  const departments = useMemo(() => {
    const deptMap = new Map();
    positions.forEach(p => {
      if (p.department) {
        deptMap.set(p.department.id, p.department);
      }
    });
    return Array.from(deptMap.values());
  }, [positions]);

  const filteredPositions = useMemo(() => {
    if (!selectedDeptId) return [];
    return positions.filter(p => p.department_id === selectedDeptId);
  }, [selectedDeptId, positions]);

  const selectedPosition = positions.find(p => p.id === selectedPositionId);

  const maskName = (name: string) => isAuditor ? (name ? name.charAt(0) + '***' : '***') : name;

  const [showConfirm, setShowConfirm] = useState(false);

  const handleUpdate = async (formData: FormData) => {
    formData.append('id', employee.id);
    const result = await updateEmployeeAction(formData);
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleTerminate = async () => {
    setShowConfirm(false);
    const result = await terminateEmployeeAction(employee.id);
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden relative z-[9999]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800 text-lg">
            {isAuditor ? 'Employee Details' : 'Edit Employee'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form action={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input 
                  type="text" 
                  name="first_name" 
                  defaultValue={maskName(employee.first_name)} 
                  disabled={isAuditor || isSuperAdmin}
                  required 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none disabled:bg-slate-50 disabled:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input 
                  type="text" 
                  name="last_name" 
                  defaultValue={maskName(employee.last_name)} 
                  disabled={isAuditor || isSuperAdmin}
                  required 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none disabled:bg-slate-50 disabled:text-slate-500" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  defaultValue={employee.email} 
                  disabled={isAuditor || isSuperAdmin}
                  required 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none disabled:bg-slate-50 disabled:text-slate-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select 
                  name="gender" 
                  defaultValue={employee.gender} 
                  disabled={isAuditor || isSuperAdmin}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Non-binary</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select 
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setSelectedPositionId(''); // Reset position when dept changes
                  }}
                  disabled={isAuditor || isSuperAdmin}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                <select 
                  name="position_id" 
                  value={selectedPositionId}
                  onChange={(e) => setSelectedPositionId(e.target.value)}
                  disabled={isAuditor || isSuperAdmin || !selectedDeptId}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer"
                >
                  <option value="">Select Position...</option>
                  {filteredPositions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select name="status" defaultValue={employee.status} disabled={isAuditor || isSuperAdmin} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer">
                <option>Onboarding</option>
                <option>Active</option>
                <option>Standby</option>
                <option>Off-duty</option>
              </select>
            </div>



            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <SubmitButton isAuditor={isAuditor || isSuperAdmin} />
              
              {isHR && (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="w-full sm:w-auto py-2.5 px-4 text-sm border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Terminate</span>
                </button>
              )}
            </div>
            {isAuditor && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-sm bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {showConfirm && (
        <ConfirmModal
          title="Terminate Employee"
          message="Are you sure you want to terminate this employee? This will set their status to Terminated."
          confirmText="Terminate"
          onConfirm={handleTerminate}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
