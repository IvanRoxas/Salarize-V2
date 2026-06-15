'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { updateSalaryAction } from '@/app/actions/employee';
import { Search } from 'lucide-react';

export default function PayrollOperationsTable({ initialEmployees }: { initialEmployees: any[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [editingSalaries, setEditingSalaries] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = employees.filter(emp => {
    const term = searchQuery.toLowerCase();
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    return fullName.includes(term);
  });

  const handleSalaryChange = (id: string, value: string) => {
    const parsed = parseFloat(value);
    setEditingSalaries(prev => ({
      ...prev,
      [id]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleSave = async (employee: any) => {
    const newSalary = editingSalaries[employee.id];
    if (newSalary === undefined) return;

    setSavingId(employee.id);
    const result = await updateSalaryAction(employee.id, newSalary);
    setSavingId(null);

    if (result.success) {
      toast.success(result.message);
      // Update local state to reflect the change
      setEmployees(employees.map(emp => emp.id === employee.id ? { ...emp, actual_salary: newSalary } : emp));
      // Remove from editing state to show it's synced
      setEditingSalaries(prev => {
        const next = { ...prev };
        delete next[employee.id];
        return next;
      });
    } else {
      toast.error(result.message);
    }
  };

  const handleUndo = (employeeId: string) => {
    setEditingSalaries(prev => {
      const next = { ...prev };
      delete next[employeeId];
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="text-emerald-600 font-medium">{status}</span>;
      case 'Standby':
        return <span className="text-amber-600 font-medium">{status}</span>;
      default:
        return <span className="text-slate-600 font-medium">{status}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col w-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search employees by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse bg-white">
        <thead>
          <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
            <th className="px-4 py-3 font-semibold">Employee Name</th>
            <th className="px-4 py-3 font-semibold">Position / Department</th>
            <th className="px-4 py-3 font-semibold">Current Salary (₱)</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100">
          {filteredEmployees.map((emp) => {
            const min = emp.position?.min_salary || 0;
            const max = emp.position?.max_salary || 0;
            const currentEditing = editingSalaries[emp.id];
            const isEditing = currentEditing !== undefined;
            const displayValue = isEditing ? currentEditing : emp.actual_salary;
            const isOutOfBounds = displayValue < min || displayValue > max;
            const hasChanged = isEditing && currentEditing !== emp.actual_salary;

            return (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {emp.first_name} {emp.last_name}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-slate-700 font-medium">{emp.position?.title || 'Unassigned'}</span>
                    <span className="text-slate-500 text-xs">{emp.position?.department?.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col space-y-1">
                    <input
                      type="number"
                      value={isEditing ? currentEditing : emp.actual_salary}
                      onChange={(e) => handleSalaryChange(emp.id, e.target.value)}
                      className={`w-32 border rounded-md px-2 py-1 text-sm outline-none transition-colors ${
                        isOutOfBounds 
                          ? 'border-red-300 focus:border-red-500 bg-red-50 text-red-900' 
                          : 'border-slate-300 focus:border-violet-500 bg-white text-slate-900'
                      }`}
                    />
                    {isOutOfBounds && (
                      <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">
                        Out of Bounds ({min} - {max})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(emp.status)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {hasChanged && (
                      <button
                        onClick={() => handleUndo(emp.id)}
                        disabled={savingId === emp.id}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                      >
                        Undo
                      </button>
                    )}
                    <button
                      onClick={() => handleSave(emp)}
                      disabled={!hasChanged || isOutOfBounds || savingId === emp.id}
                      className="text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors px-3 py-1.5 rounded disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                    >
                      {savingId === emp.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {filteredEmployees.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                No active personnel match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
