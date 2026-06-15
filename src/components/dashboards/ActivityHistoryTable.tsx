'use client';

import { useState, useTransition } from 'react';
import { archiveAllHistoryAction } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

function formatValue(val: string | null, diffKeys?: string[]) {
  if (!val) return '-';
  if (val === 'null' || val === 'N/A' || val === 'DELETED') return val;
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'object' && parsed !== null) {
      const ignoredKeys = ['id', 'created_at', 'updated_at', 'deleted_at', 'icon', 'color', 'count', '_count', 'department_id', 'position_id', 'password_hash'];
      let entries = Object.entries(parsed).filter(
        ([k, v]) => !ignoredKeys.includes(k) && v !== null && v !== '' && typeof v !== 'object'
      );

      if (diffKeys && diffKeys.length > 0) {
        entries = entries.filter(([k]) => diffKeys.includes(k));
      }

      if (entries.length === 0) return 'No Changes';

      const formatted = entries
        .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
        .join('\n');
      return formatted || '-';
    }
    return String(parsed);
  } catch (e) {
    return val;
  }
}

function getDiffKeys(oldVal: string | null, newVal: string | null) {
  if (!oldVal || !newVal || oldVal === 'DELETED' || newVal === 'DELETED' || oldVal === 'null' || newVal === 'null') return undefined;
  try {
    const oldObj = JSON.parse(oldVal);
    const newObj = JSON.parse(newVal);
    if (typeof oldObj === 'object' && typeof newObj === 'object') {
      const changedKeys = [];
      const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
      for (const key of allKeys) {
        if (oldObj[key] !== newObj[key]) changedKeys.push(key);
      }
      return changedKeys;
    }
  } catch (e) { }
  return undefined;
}

import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

export default function ActivityHistoryTable({ logs, role }: { logs: any[], role: string }) {
  const [filter, setFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleArchive = () => {
    startTransition(async () => {
      await archiveAllHistoryAction();
      router.refresh();
    });
  };

  const filteredLogs = logs.filter(log => {
    // Action filter
    if (filter === 'Salary Changes' && log.action !== 'UPDATE SALARY') return false;
    if (filter === 'Department Changes' && !['CREATE DEPARTMENT', 'UPDATE DEPARTMENT', 'DELETE DEPARTMENT', 'CREATE POSITION', 'UPDATE POSITION', 'DELETE POSITION'].includes(log.action)) return false;
    if (filter === 'Terminations' && !['ARCHIVE_EMPLOYEE', 'DELETE_EMPLOYEE', 'DELETE EMPLOYEE'].includes(log.action)) return false;

    // Date filter
    if (dateFilter !== 'All Time') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dateFilter === 'Last 24 Hours' && diffDays > 1) return false;
      if (dateFilter === 'Last 7 Days' && diffDays > 7) return false;
      if (dateFilter === 'Last 30 Days' && diffDays > 30) return false;
    }

    // Search query
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const action = (log.action || '').toLowerCase();
      const actor = (log.admin_name || '').toLowerCase();
      const target = (log.target_employee || '').toLowerCase();
      if (!action.includes(term) && !actor.includes(term) && !target.includes(term)) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4 rounded-t-xl">
        <h3 className="font-bold text-slate-800 whitespace-nowrap">Activity History</h3>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}
            className="text-sm border-slate-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500 py-1.5 min-w-[150px] cursor-pointer"
          >
            <option value="All">All Actions</option>
            <option value="Salary Changes">Salary Changes</option>
            <option value="Department Changes">Department Changes</option>
            <option value="Terminations">Terminations</option>
          </select>
          <select 
            value={dateFilter} 
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="text-sm border-slate-300 rounded-md shadow-sm focus:border-violet-500 focus:ring-violet-500 py-1.5 min-w-[130px] cursor-pointer"
          >
            <option value="All Time">All Time</option>
            <option value="Last 24 Hours">Last 24 Hours</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
          {role === 'AUDITOR' && (
            <button 
              onClick={handleArchive}
              disabled={isPending || logs.length === 0}
              className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-md shadow-sm disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              {isPending ? 'Archiving...' : 'Archive History'}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 shadow-sm">
              <th className="px-6 py-4 font-bold w-1/6">Action</th>
              <th className="px-6 py-4 font-bold w-1/6">Admin</th>
              <th className="px-6 py-4 font-bold w-1/5">Target</th>
              <th className="px-6 py-4 font-bold w-1/5">Old Value</th>
              <th className="px-6 py-4 font-bold w-1/5">New Value</th>
              <th className="px-6 py-4 font-bold text-right w-1/6">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedLogs.map(log => {
              
              const getActionBadge = (action: string) => {
                if (action.includes('CREATE') || action.includes('ADDED') || action.includes('SUCCESS')) {
                  return 'bg-violet-50 text-violet-700 border border-violet-200';
                }
                if (action.includes('UPDATE')) {
                  return 'bg-amber-50 text-amber-700 border border-amber-200';
                }
                if (action.includes('DELETE') || action.includes('ARCHIVE') || action.includes('FAILED') || action.includes('UNAUTHORIZED') || action.includes('FORBIDDEN')) {
                  return 'bg-red-50 text-red-700 border border-red-200';
                }
                return 'bg-slate-50 text-slate-700 border border-slate-200';
              };

              return (
              <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${getActionBadge(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                      {log.admin_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{log.admin_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-slate-600 bg-slate-50/30 group-hover:bg-transparent transition-colors">
                  {log.target_employee || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 max-w-[250px]">
                  <div className="whitespace-pre-wrap leading-relaxed">{formatValue(log.old_value, log.action.includes('UPDATE') ? getDiffKeys(log.old_value, log.new_value) : undefined)}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-800 font-medium max-w-[250px]">
                  <div className="whitespace-pre-wrap leading-relaxed">{formatValue(log.new_value, log.action.includes('UPDATE') ? getDiffKeys(log.old_value, log.new_value) : undefined)}</div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-400 text-right whitespace-nowrap align-top">
                  {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            )})}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No active logs found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
