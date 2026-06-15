'use client';

import { useState, useMemo } from 'react';
import Pagination from '@/components/Pagination';
import { Search } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function AuditLogsTable({ logs }: { logs: any[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('All');
  const [actorFilter, setActorFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))).filter(Boolean), [logs]);
  const uniqueActors = useMemo(() => Array.from(new Set(logs.map(l => l.admin_name))).filter(Boolean), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== 'All' && log.action !== actionFilter) return false;
      if (actorFilter !== 'All' && log.admin_name !== actorFilter) return false;
      
      if (searchQuery) {
        const term = searchQuery.toLowerCase();
        const action = (log.action || '').toLowerCase();
        const actor = (log.admin_name || '').toLowerCase();
        const target = (log.target_employee || '').toLowerCase();
        
        if (!action.includes(term) && !actor.includes(term) && !target.includes(term)) {
          return false;
        }
      }
      
      return true;
    });
  }, [logs, actionFilter, actorFilter, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-xl">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer bg-white"
          >
            <option value="All">All Actions</option>
            {uniqueActions.map((action: any) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <select
            value={actorFilter}
            onChange={(e) => { setActorFilter(e.target.value); setCurrentPage(1); }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer bg-white"
          >
            <option value="All">All Actors</option>
            {uniqueActors.map((actor: any) => (
              <option key={actor} value={actor}>{actor}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[13px] border-b border-slate-200 uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Administrator</th>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Target Record</th>
            </tr>
          </thead>
          <tbody className="text-[14px] divide-y divide-slate-50">
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-violet-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">
                  {log.admin_name}
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {log.target_employee || 'N/A'}
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  No security events match the selected filters.
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
