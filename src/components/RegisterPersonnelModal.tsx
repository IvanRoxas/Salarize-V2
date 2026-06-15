'use client';

import { useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { createEmployeeAction } from '@/app/actions/employee';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2.5 px-6 text-sm bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? 'Registering...' : 'Register Personnel'}
    </button>
  );
}

export default function RegisterPersonnelModal({ positions, onClose }: { positions: any[], onClose: () => void }) {
  const [sessionRole, setSessionRole] = useState<string>('SUPER_ADMIN'); // In a real app, pass this down or fetch it
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');

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

  const handleCreate = async (formData: FormData) => {
    const result = await createEmployeeAction(formData);
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-violet-50 px-6 py-4 border-b border-violet-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-slate-800 text-lg">Register Personnel</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form action={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input 
                  type="text" 
                  name="first_name" 
                  required 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input 
                  type="text" 
                  name="last_name" 
                  required 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select 
                  name="gender" 
                  required 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select 
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
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
                  required 
                  disabled={!selectedDeptId}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select Position...</option>
                  {filteredPositions.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select 
                name="status" 
                required 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
              >
                <option value="Onboarding">Onboarding</option>
                <option value="Active">Active</option>
                <option value="Standby">Standby</option>
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
