'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getEmployeesByPositionAction } from '@/app/actions/employee';

export default function PositionEmployeesModal({ position, onClose }: { position: any, onClose: () => void }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      const result = await getEmployeesByPositionAction(position.id);
      if (result.success) {
        setEmployees(result.employees);
      }
      setLoading(false);
    }
    fetchEmployees();
  }, [position.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">Active</span>;
      case 'Standby':
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">Standby</span>;
      case 'Onboarding':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Onboarding</span>;
      case 'Off-duty':
      case 'Terminated':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">{status}</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Assigned Personnel</h3>
            <p className="text-sm text-slate-500">{position.title} - {position.department?.name || 'No Department'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition cursor-pointer p-2 rounded-full hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-0 overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-violet-500" />
              <p>Loading assigned personnel...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No personnel currently assigned to this position.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white text-slate-500 text-[13px] border-b border-slate-200 uppercase tracking-wider sticky top-0">
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Date Assigned</th>
                </tr>
              </thead>
              <tbody className="text-[14px] divide-y divide-slate-50">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{emp.email}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(emp.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
