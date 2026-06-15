'use client';

import { useState } from 'react';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import Pagination from '@/components/Pagination';
import { Eye, Edit } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function PersonnelTable({ employees, role, positions }: { employees: any[], role: string, positions: any[] }) {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(employees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = employees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">Active</span>;
      case 'Standby':
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">Standby</span>;
      case 'Off-duty':
      case 'Terminated':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">{status}</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="overflow-x-auto flex flex-col h-full">
      <table className="w-full text-left flex-grow">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-[13px] border-b border-slate-200 uppercase tracking-wider">
            <th className="px-6 py-4 font-semibold">Employee Name</th>
            <th className="px-6 py-4 font-semibold">Email</th>
            <th className="px-6 py-4 font-semibold">Position / Department</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-[14px] divide-y divide-slate-50">
          {paginatedEmployees.map((emp) => (
            <tr key={emp.id} className="hover:bg-violet-50/50 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-800">
                {emp.first_name} {emp.last_name}
              </td>
              <td className="px-6 py-4 text-slate-500">{emp.email}</td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-slate-800 font-medium">{emp.position?.title || 'Unassigned'}</span>
                  <span className="text-slate-500 text-xs">{emp.position?.department?.name || 'N/A'}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(emp.status)}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => setSelectedEmployee(emp)}
                  className="inline-flex items-center space-x-1 border border-violet-200 text-violet-700 hover:border-violet-600 hover:bg-violet-50 transition-colors px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer"
                >
                  {role === 'AUDITOR' || role === 'SUPER_ADMIN' ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </td>
            </tr>
          ))}
          {employees.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                No personnel records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {selectedEmployee && (
        <EditEmployeeModal 
          employee={selectedEmployee} 
          role={role}
          positions={positions}
          onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}
