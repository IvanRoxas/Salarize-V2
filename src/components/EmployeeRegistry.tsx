'use client';

import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Pencil, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { createEmployeeAction } from '@/app/actions/employee';
import EditEmployeeModal from './EditEmployeeModal';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2.5 px-6 text-base bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? 'Saving...' : 'Save Employee'}
    </button>
  );
}

export default function EmployeeRegistry({
  initialEmployees,
  positions,
  role,
}: {
  initialEmployees: any[];
  positions: { id: string; title: string; min_salary?: number; max_salary?: number }[];
  role: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  useEffect(() => {
    if (editId) {
      const emp = initialEmployees.find(e => e.id === editId);
      if (emp) {
        setEditingEmployee(emp);
      }
    }
  }, [editId, initialEmployees]);

  const totalPages = Math.ceil(initialEmployees.length / itemsPerPage);
  const paginatedEmployees = initialEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddSubmit = async (formData: FormData) => {
    const result = await createEmployeeAction(formData);
    if (result.success) {
      toast.success(result.message);
      setIsModalOpen(false);
    } else {
      toast.error(result.message);
    }
  };

  const statusBadge = (status: string) =>
    status === 'Active' ? 'bg-emerald-100 text-emerald-700'
    : status === 'Onboarding' ? 'bg-blue-100 text-blue-700'
    : status === 'Standby' ? 'bg-yellow-100 text-yellow-700'
    : 'bg-slate-100 text-slate-600';

  const isAuditor = role === 'AUDITOR';



  return (
    <div className="relative">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">All Employees</h3>
          {!isAuditor && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95 text-sm"
            >
              + Add Employee
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs border-b border-slate-200 uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Employee</th>
                <th className="px-6 py-3 font-semibold">Email</th>
                <th className="px-6 py-3 font-semibold">Position</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{emp.first_name} {emp.last_name}</div>
                    <div className="text-xs text-slate-400">{emp.gender}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{emp.email}</td>
                  <td className="px-6 py-4 text-slate-600">{emp.position?.title || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(emp.status)}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setEditingEmployee(emp)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isAuditor 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {isAuditor ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </>
                        ) : (
                          <>
                            <Pencil className="w-4 h-4" />
                            <span>Edit</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 text-sm">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="flex items-center space-x-1 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-all duration-200 shadow-sm active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" /> <span>Previous</span>
            </button>
            <span className="text-slate-500">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="flex items-center space-x-1 px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-all duration-200 shadow-sm active:scale-95"
            >
              <span>Next</span> <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          role={role}
          positions={positions}
          onClose={() => setEditingEmployee(null)}
        />
      )}

      {/* Add Employee Modal */}
      {isModalOpen && !isAuditor && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative z-[9999]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">New Employee</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form action={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                    <input type="text" name="first_name" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                    <input type="text" name="last_name" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input type="email" name="email" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select name="gender" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Non-binary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select name="status" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option>Onboarding</option>
                      <option>Active</option>
                      <option>Standby</option>
                      <option>Off-duty</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                    <select name="position_id" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                      {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary (₱)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      name="actual_salary" 
                      required 
                      disabled={role === 'HR_MANAGER'}
                      placeholder={role === 'HR_MANAGER' ? 'Restricted' : ''}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100 disabled:text-slate-400" 
                    />
                  </div>
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
