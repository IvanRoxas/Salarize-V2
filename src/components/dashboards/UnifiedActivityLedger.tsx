'use client';

import { useState } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

export default function UnifiedActivityLedger({ logs }: { logs: any[] }) {
  const [filter, setFilter] = useState<'All' | 'Salary' | 'Structure'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const formatValue = (val: string | null, diffKeys?: string[]) => {
    if (!val || val === 'null' || val === 'N/A' || val === 'DELETED') return null;
    try {
      const parsed = JSON.parse(val);
      if (typeof parsed === 'object' && parsed !== null) {
        const ignoredKeys = ['id', 'created_at', 'updated_at', 'deleted_at', 'count', '_count', 'department_id', 'position_id', 'password_hash'];
        let entries = Object.entries(parsed).filter(
          ([k, v]) => !ignoredKeys.includes(k) && v !== null && v !== '' && typeof v !== 'object'
        );
        if (diffKeys && diffKeys.length > 0) {
          entries = entries.filter(([k]) => diffKeys.includes(k));
        }
        return entries;
      }
      return [[val, val]]; // fallback
    } catch (e) {
      return null;
    }
  };

  const getDiffKeys = (oldVal: string | null, newVal: string | null) => {
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
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADDED')) return 'text-violet-700 bg-violet-50 border-violet-200';
    if (action.includes('UPDATE')) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (action.includes('DELETE') || action.includes('ARCHIVE')) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const getTimelineDotColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADDED')) return 'bg-violet-500';
    if (action.includes('UPDATE')) return 'bg-amber-500';
    if (action.includes('DELETE') || action.includes('ARCHIVE')) return 'bg-red-500';
    return 'bg-slate-400';
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'All') return true;
    if (filter === 'Salary') return log.action.includes('SALARY');
    if (filter === 'Structure') return ['DEPARTMENT', 'POSITION'].some(t => log.action.includes(t));
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px] col-span-1 lg:col-span-2">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-lg">Activity Ledger</h3>
        </div>
        
        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-lg">
          {['All', 'Salary', 'Structure'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f as any); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                filter === f 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {paginatedLogs.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400 font-medium">
            No activity found for this filter.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-indigo-100 ml-4 space-y-8 pb-4 pt-2">
            {paginatedLogs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white ${getTimelineDotColor(log.action)}`} />

                <div className="flex flex-col sm:flex-row sm:items-start gap-3 transition-all group-hover:translate-x-1">
                  <div className="flex flex-col gap-1 w-full">
                    {/* Top Row: Action & Target */}
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <p className="text-base font-bold text-slate-800 leading-tight">
                        {log.target_employee || 'System Component'}
                      </p>
                    </div>

                    {/* Diff/Payload Row */}
                    {(log.action.includes('CREATE') || log.action.includes('UPDATE') || log.action.includes('DELETE')) && (
                      <div className="mt-1 mb-2 text-xs font-mono w-full">
                        {(() => {
                          const isCreate = log.action.includes('CREATE') || log.action.includes('ADDED');
                          const isDelete = log.action.includes('DELETE') || log.action.includes('ARCHIVE');
                          const diffKeys = log.action.includes('UPDATE') ? getDiffKeys(log.old_value, log.new_value) : undefined;
                          
                          const oldEntries = formatValue(log.old_value, diffKeys) || [];
                          const newEntries = formatValue(log.new_value, diffKeys) || [];

                          if (oldEntries.length === 0 && newEntries.length === 0) return <span className="text-slate-400 italic">No attributes changed</span>;

                          return (
                            <div className="flex flex-col gap-1 w-full max-w-[90%]">
                              {!isCreate && oldEntries.map(([k, v]) => (
                                <div key={`old-${k}`} className="px-3 py-1.5 bg-red-50 text-red-800 rounded flex gap-2 w-full transition-colors">
                                  <span className="shrink-0 opacity-70 uppercase tracking-wider font-bold">- {String(k).replace(/_/g, ' ')}:</span>
                                  <span className="line-through whitespace-pre-wrap font-medium">{String(v)}</span>
                                </div>
                              ))}
                              
                              {!isDelete && newEntries.map(([k, v]) => (
                                <div key={`new-${k}`} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded flex gap-2 w-full transition-colors">
                                  <span className="shrink-0 opacity-70 uppercase tracking-wider font-bold">+ {String(k).replace(/_/g, ' ')}:</span>
                                  <span className="whitespace-pre-wrap font-bold">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Bottom Row: Admin & Timestamp */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 ml-1">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-300">
                        {log.admin_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-600">{log.admin_name}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium">
                        {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Controls - ALWAYS VISIBLE */}
      <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-white rounded-b-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {totalPages === 0 ? (
              <button className="w-8 h-8 rounded-lg text-sm font-bold bg-indigo-600 text-white cursor-default">
                1
              </button>
            ) : (
              Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                    currentPage === i + 1
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(Math.max(1, totalPages), p + 1))}
            disabled={currentPage >= Math.max(1, totalPages)}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
