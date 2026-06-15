'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import toast from 'react-hot-toast';
import { Pencil, X } from 'lucide-react';
import { updateSalaryOrStatus } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2.5 px-6 text-base bg-[var(--color-yellow-custom)] hover:bg-yellow-500 text-slate-900 font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? 'Updating...' : 'Save Changes'}
    </button>
  );
}

export default function SalaryRegistry({ initialEmployees, role }: { initialEmployees: any[], role: string }) {
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const handleUpdateSubmit = async (formData: FormData) => {
    if (!selectedEmployee) return;
    const result = await updateSalaryOrStatus(selectedEmployee.id, formData);
    if (result.success) {
      toast.success(result.message);
      setSelectedEmployee(null);
    } else {
      toast.error(result.message);
    }
  };

  const statusBadge = (status: string) =>
    status === 'Active' ? 'bg-emerald-100 text-emerald-700'
    : status === 'Standby' ? 'bg-yellow-100 text-yellow-700'
    : status === 'Terminated' ? 'bg-red-100 text-red-700'
    : 'bg-slate-100 text-slate-600';

  const isAuditor = role === 'AUDITOR';
  const isHR = role === 'HR_MANAGER';

  return (
    <div className="relative">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Compensation Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200 uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Employee</th>
                <th className="px-6 py-3 font-semibold">Position</th>
                <th className="px-6 py-3 font-semibold">Current Salary</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                {!isAuditor && <th className="px-6 py-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {initialEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {emp.first_name} {emp.last_name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{emp.position?.title || 'Unknown'}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    ₱ {emp.actual_salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(emp.status)}`}>
                      {emp.status}
                    </span>
                  </td>
                  {!isAuditor && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200 hover:shadow-md active:scale-95"
                          title="Quick edit"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedEmployee && !isAuditor && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative z-[9999]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Update Record</h3>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-0.5">Editing record for</p>
                <p className="font-bold text-slate-800">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                <p className="text-sm text-slate-500">{selectedEmployee.position?.title}</p>
              </div>
              <form action={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="actual_salary"
                    defaultValue={isHR ? '' : selectedEmployee.actual_salary}
                    required
                    disabled={isHR}
                    placeholder={isHR ? 'Restricted' : ''}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-yellow-custom)] outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={selectedEmployee.status}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-yellow-custom)] outline-none"
                  >
                    <option>Active</option>
                    <option>Standby</option>
                    <option>Off-duty</option>
                    <option>Terminated</option>
                  </select>
                </div>
                <div className="pt-2">
                  <SubmitButton />
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
