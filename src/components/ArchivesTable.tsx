'use client';

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';

const maskPII = (firstName: string | null, lastName: string | null) => {
  const first = firstName ? firstName.charAt(0) + '***' : '***';
  const last = lastName ? lastName.charAt(0) + '***' : '***';
  return `${first} ${last}`;
};

export default function ArchivesTable({ archivedRecords, auditLogs, departments }: { archivedRecords: any[], auditLogs: any[], departments: { name: string }[] }) {
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getDeleteLog = (staff: any) => {
    const name = `${staff.first_name} ${staff.last_name}`;
    return auditLogs.find(log => log.target_employee === name);
  };

  const uniqueDepartments = useMemo(() => {
    return departments.map(d => d.name);
  }, [departments]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    archivedRecords.forEach(r => {
      if (r.deleted_at) {
        years.add(new Date(r.deleted_at).getFullYear().toString());
      }
    });
    return Array.from(years).sort().reverse();
  }, [archivedRecords]);

  const uniqueMonths = useMemo(() => {
    return [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }, []);

  const filteredRecords = useMemo(() => {
    return archivedRecords.filter(staff => {
      if (departmentFilter !== 'All' && staff.position?.department?.name !== departmentFilter) return false;
      
      if (staff.deleted_at) {
        const date = new Date(staff.deleted_at);
        const year = date.getFullYear().toString();
        const month = date.toLocaleString('en-US', { month: 'long' });
        
        if (yearFilter !== 'All' && year !== yearFilter) return false;
        if (monthFilter !== 'All' && month !== monthFilter) return false;
      } else if (yearFilter !== 'All' || monthFilter !== 'All') {
        return false;
      }
      return true;
    });
  }, [archivedRecords, departmentFilter, yearFilter, monthFilter]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when filters change
  const handleDepartmentFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartmentFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleYearFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYearFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleMonthFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonthFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <select 
            value={departmentFilter} 
            onChange={handleDepartmentFilter}
            className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">Filter by Department (All)</option>
            {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
          
          <select 
            value={yearFilter} 
            onChange={handleYearFilter}
            className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">Filter by Year (All)</option>
            {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>

          <select 
            value={monthFilter} 
            onChange={handleMonthFilter}
            className="text-sm border border-slate-200 rounded-md px-3 py-2 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">Filter by Month (All)</option>
            {uniqueMonths.map(month => <option key={month} value={month}>{month}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">Archived Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-3 font-semibold">Masked Identity</th>
                <th className="px-6 py-3 font-semibold">Previous Position</th>
                <th className="px-6 py-3 font-semibold">Termination Date</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 text-slate-700">
              {paginatedRecords.map((staff) => (
                <tr key={staff.id} className="hover:bg-violet-50 transition-colors group">
                  <td className="px-6 py-4 font-medium font-mono group-hover:text-violet-700">
                    {maskPII(staff.first_name, staff.last_name)}
                  </td>
                  <td className="px-6 py-4">{staff.position?.title || 'Unknown'}</td>
                  <td className="px-6 py-4 font-medium text-red-600">
                    {staff.deleted_at ? new Date(staff.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedStaff(staff)}
                      className="text-sm text-purple-600 hover:underline font-medium focus:outline-none"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-4">
          <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-sm text-purple-600 hover:underline disabled:text-slate-400 disabled:no-underline font-medium focus:outline-none"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-sm text-purple-600 hover:underline disabled:text-slate-400 disabled:no-underline font-medium focus:outline-none"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-sm border border-purple-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-purple-100 flex justify-between items-center bg-purple-50/50">
              <h3 className="font-bold text-purple-900">Termination Snapshot</h3>
              <button 
                onClick={() => setSelectedStaff(null)}
                className="text-purple-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Masked Identity</label>
                  <p className="font-mono text-slate-800 font-medium">{maskPII(selectedStaff.first_name, selectedStaff.last_name)}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Termination Date</label>
                  <p className="text-slate-800 font-medium text-red-600">
                    {selectedStaff.deleted_at ? new Date(selectedStaff.deleted_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Final Position & Department</label>
                  <p className="text-slate-800 font-medium">{selectedStaff.position?.title} • {selectedStaff.position?.department?.name || 'Unknown'}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Final Salary (At Deletion)</label>
                  <p className="text-slate-800 font-medium font-mono text-lg">₱{selectedStaff.actual_salary?.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Audit Cross-Reference</label>
                {(() => {
                  const log = getDeleteLog(selectedStaff);
                  if (!log) {
                    return <p className="text-sm text-slate-500 italic">No matching audit log found.</p>;
                  }
                  return (
                    <div className="space-y-1">
                      <p className="text-sm text-slate-700">Authorized by: <span className="font-semibold text-slate-900">{log.admin_name}</span></p>
                      <p className="text-xs text-slate-500 font-mono">Timestamp: {new Date(log.timestamp).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 font-mono">Action: <span className="text-red-600 font-semibold">{log.action}</span></p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-purple-100 bg-purple-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 font-medium transition-colors cursor-pointer text-sm"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
