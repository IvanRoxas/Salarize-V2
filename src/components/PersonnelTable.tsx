'use client';

import { useState } from 'react';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import Pagination from '@/components/Pagination';
import { Eye, Edit, Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function PersonnelTable({ employees, role, positions }: { employees: any[], role: string, positions: any[] }) {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  const departmentsMap = new Map();
  positions.forEach(p => {
    if (p.department) {
      departmentsMap.set(p.department.id, p.department);
    }
  });
  const uniqueDepartments = Array.from(departmentsMap.values());

  const filteredEmployees = employees.filter(emp => {
    const term = searchQuery.toLowerCase();
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(term) || emp.email.toLowerCase().includes(term);
    const matchesDept = filterDept === 'All' || emp.position?.department?.id === filterDept;
    
    return matchesSearch && matchesDept;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <select 
          value={filterDept}
          onChange={(e) => {
            setFilterDept(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-auto border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer bg-white"
        >
          <option value="All">All Departments</option>
          {uniqueDepartments.map((dept: any) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
        
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search personnel by name or email..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-grow flex flex-col">
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
          {filteredEmployees.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                No personnel records match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

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
