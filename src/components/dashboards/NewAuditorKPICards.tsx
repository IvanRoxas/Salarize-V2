'use client';

import { useState } from 'react';
import { Activity, DollarSign, Building2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 5;

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

function getDiffEntries(log: any) {
  const oldVal = log.old_value;
  const newVal = log.new_value;
  
  const ignoredKeys = ['id', 'created_at', 'updated_at', 'deleted_at', 'icon', 'color', 'count', '_count', 'department_id', 'position_id', 'password_hash'];
  
  let oldEntries: any[] = [];
  let newEntries: any[] = [];
  
  try { oldEntries = Object.entries(JSON.parse(oldVal || '{}')); } catch(e){}
  try { newEntries = Object.entries(JSON.parse(newVal || '{}')); } catch(e){}
  
  oldEntries = oldEntries.filter(([k,v]) => !ignoredKeys.includes(k) && typeof v !== 'object' && v !== null && v !== '');
  newEntries = newEntries.filter(([k,v]) => !ignoredKeys.includes(k) && typeof v !== 'object' && v !== null && v !== '');
  
  const diffKeys = log.action.includes('UPDATE') ? getDiffKeys(oldVal, newVal) : null;
  if (diffKeys && diffKeys.length > 0) {
    oldEntries = oldEntries.filter(([k]) => diffKeys.includes(k));
    newEntries = newEntries.filter(([k]) => diffKeys.includes(k));
  }
  
  const isCreate = log.action.includes('CREATE') || log.action.includes('ADDED');
  const isDelete = log.action.includes('DELETE') || log.action.includes('ARCHIVE');
  
  return {
    oldEntries: isCreate ? [] : oldEntries,
    newEntries: isDelete ? [] : newEntries
  };
}

function GitDiffDisplay({ log }: { log: any }) {
  const { oldEntries, newEntries } = getDiffEntries(log);
  
  return (
    <div className="p-0 border-t border-slate-100 divide-y divide-slate-100 text-sm font-mono w-full">
      {oldEntries.map(([k, v]) => (
        <div key={`old-${k}`} className="px-6 py-3 bg-red-50 text-red-800 flex flex-col sm:flex-row sm:items-baseline sm:gap-4 transition-colors hover:bg-red-100/50">
          <span className="w-48 shrink-0 opacity-70 uppercase tracking-wider text-xs font-bold">- {k.replace(/_/g, ' ')}</span>
          <span className="line-through whitespace-pre-wrap font-medium text-base">{String(v)}</span>
        </div>
      ))}
      
      {newEntries.map(([k, v]) => (
        <div key={`new-${k}`} className="px-6 py-3 bg-emerald-50 text-emerald-800 flex flex-col sm:flex-row sm:items-baseline sm:gap-4 transition-colors hover:bg-emerald-100/50">
          <span className="w-48 shrink-0 opacity-70 uppercase tracking-wider text-xs font-bold">+ {k.replace(/_/g, ' ')}</span>
          <span className="whitespace-pre-wrap font-bold text-base">{String(v)}</span>
        </div>
      ))}
      
      {oldEntries.length === 0 && newEntries.length === 0 && (
        <div className="px-6 py-4 text-slate-500 bg-slate-50 text-center text-sm font-sans italic">
          No detailed business attributes were modified.
        </div>
      )}
    </div>
  );
}

export default function NewAuditorKPICards({
  activeLogsCount,
  salaryAdjustmentsCount,
  departmentalChangesCount,
  salaryAdjustmentsLogs,
  departmentalChangesLogs,
  recentActiveLogs
}: {
  activeLogsCount: number;
  salaryAdjustmentsCount: number;
  departmentalChangesCount: number;
  salaryAdjustmentsLogs: any[];
  departmentalChangesLogs: any[];
  recentActiveLogs: any[];
}) {
  const [activeModal, setActiveModal] = useState<'salary' | 'department' | 'active' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  const filteredDepartmentalChangesLogs = departmentalChangesLogs.filter(log => {
    const { oldEntries, newEntries } = getDiffEntries(log);
    return oldEntries.length > 0 || newEntries.length > 0;
  });

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADDED')) return 'text-violet-700 bg-violet-50 border-violet-200';
    if (action.includes('UPDATE')) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (action.includes('DELETE') || action.includes('ARCHIVE')) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const currentLogs = activeModal === 'salary' ? salaryAdjustmentsLogs : activeModal === 'department' ? filteredDepartmentalChangesLogs : [];
  const totalPages = Math.ceil(currentLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = currentLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
        <div 
          onClick={() => router.push('/activity-history')}
          className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-violet-50 to-white p-8 rounded-2xl shadow-sm border border-violet-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 text-violet-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
            <Activity className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-violet-200/50 p-3 rounded-xl group-hover:bg-violet-200 transition-colors">
                <Activity className="w-6 h-6 text-violet-700" />
              </div>
              <h2 className="text-lg font-bold text-slate-700 uppercase tracking-widest">Active Audit Logs</h2>
            </div>
            <span className="text-7xl font-black text-violet-900 drop-shadow-sm">{activeLogsCount}</span>
          </div>
          <p className="text-sm text-violet-600/80 mt-8 font-semibold flex items-center relative z-10">
            Click to view full Activity History →
          </p>
        </div>

        <div 
          onClick={() => { setActiveModal('salary'); setCurrentPage(1); }}
          className="md:col-span-1 md:row-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-slate-50 transition-all hover:-translate-y-1 group"
        >
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-emerald-100 p-2 rounded-lg group-hover:bg-emerald-200 transition-colors">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salary Adjustments</p>
            </div>
            <span className="text-3xl font-bold text-emerald-600 ml-2">{salaryAdjustmentsCount}</span>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-medium">Last 30 days • Click for details</p>
        </div>

        <div 
          onClick={() => { setActiveModal('department'); setCurrentPage(1); }}
          className="md:col-span-1 md:row-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500 flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-slate-50 transition-all hover:-translate-y-1 group"
        >
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Structure Changes</p>
            </div>
            <span className="text-3xl font-bold text-blue-600 ml-2">{filteredDepartmentalChangesLogs.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-4 font-medium">All unarchived • Click for details</p>
        </div>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10 relative">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                {activeModal === 'salary' && <><div className="p-2 bg-emerald-100 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-700"/></div> Recent Salary Adjustments</>}
                {activeModal === 'department' && <><div className="p-2 bg-blue-100 rounded-lg"><Building2 className="w-5 h-5 text-blue-700"/></div> Department and Position Changes</>}
              </h3>
              <button 
                onClick={() => setActiveModal(null)} 
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto w-full flex-1 custom-scrollbar">
              {currentLogs.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 font-medium shadow-sm">
                  No log entries found.
                </div>
              ) : (
                <div className="space-y-6">
                  {paginatedLogs.map((log: any) => (
                    <div key={log.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                      
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-6 py-4 bg-white border-b border-slate-100 gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200 shadow-sm">
                              {log.admin_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-slate-800">{log.admin_name}</span>
                          </div>
                          <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>
                          <span className="text-sm font-mono font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {log.target_employee || 'System Default'}
                          </span>
                        </div>
                        <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                          {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Card Body (Git Diff UI) */}
                      <GitDiffDisplay log={log} />

                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                            currentPage === i + 1
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="px-6 py-2.5 bg-slate-800 rounded-lg text-sm font-bold text-white hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
