'use client';

import { useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { acknowledgeAlertsAction } from '@/app/actions';

interface AuditorKPICardsProps {
  totalLogs: number;
  logsLast7Days: number;
  latestLogDate: string | null;
  archivedRecordsCount: number;
  deletesLast30Days: number;
  latestDeleteDate: string | null;
  highRiskOperationsCount: number;
  securityAnomaliesCount: number;
  
  // Modal Details
  recentLogs: any[];
  deletedRecords: any[];
  highRiskOperations: any[];
  securityAnomalies: any[];
}



export default function AuditorKPICards({
  totalLogs,
  logsLast7Days,
  latestLogDate,
  archivedRecordsCount,
  deletesLast30Days,
  latestDeleteDate,
  highRiskOperationsCount,
  securityAnomaliesCount,
  recentLogs,
  deletedRecords,
  highRiskOperations,
  securityAnomalies
}: AuditorKPICardsProps) {
  const [activeModal, setActiveModal] = useState<'logs' | 'deleted' | 'high_risk' | 'anomalies' | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    await acknowledgeAlertsAction();
    setActiveModal(null);
    setIsAcknowledging(false);
  };

  const getRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADDED')) return 'text-violet-600 font-semibold';
    if (action.includes('UPDATE')) return 'text-yellow-600 font-semibold';
    if (action.includes('DELETE') || action.includes('UNAUTHORIZED') || action.includes('REVOKE')) return 'text-red-600 font-semibold';
    return 'text-slate-600 font-semibold';
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Audit Logs */}
        <div 
          onClick={() => setActiveModal('logs')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-violet-600 flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-slate-50 transition-all hover:-translate-y-1"
        >
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Audit Logs</p>
            <span className="text-4xl font-bold text-slate-800">{totalLogs}</span>
            <p className="text-sm font-medium text-emerald-600 mt-2">+{logsLast7Days} in the last 7 days</p>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Latest event: {getRelativeTime(latestLogDate)}
          </p>
        </div>



        {/* Card 3: High-Risk Operations */}
        {highRiskOperationsCount > 0 ? (
          <div 
            onClick={() => setActiveModal('high_risk')}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500 flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-slate-50 transition-all hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-medium text-slate-500">High-Risk Ops</p>
              </div>
              <span className="text-4xl font-bold text-amber-600">{highRiskOperationsCount}</span>
              <p className="text-sm font-medium text-amber-600 mt-2">Review pending</p>
            </div>
            <p className="text-xs text-slate-400 mt-4">Routine actions</p>
          </div>
        ) : (
          <div 
            onClick={() => setActiveModal('high_risk')}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-slate-50 transition-all hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-medium text-slate-500">High-Risk Ops</p>
              </div>
              <span className="text-4xl font-bold text-emerald-600">0</span>
              <p className="text-sm font-medium text-emerald-600 mt-2">All ops reviewed</p>
            </div>
            <p className="text-xs text-slate-400 mt-4">Past 24 hours</p>
          </div>
        )}

        {/* Card 4: Security Anomalies */}
        {securityAnomaliesCount > 0 ? (
          <div 
            onClick={() => setActiveModal('anomalies')}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-600 flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-slate-50 transition-all hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm font-medium text-slate-500">Security Anomalies</p>
              </div>
              <span className="text-4xl font-bold text-red-600">{securityAnomaliesCount}</span>
              <p className="text-sm font-medium text-red-600 mt-2">Action required</p>
            </div>
            <p className="text-xs text-slate-400 mt-4">Critical threats</p>
          </div>
        ) : (
          <div 
            onClick={() => setActiveModal('anomalies')}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex flex-col justify-between cursor-pointer hover:shadow-md hover:bg-slate-50 transition-all hover:-translate-y-1"
          >
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-medium text-slate-500">Security Anomalies</p>
              </div>
              <span className="text-4xl font-bold text-emerald-600">0</span>
              <p className="text-sm font-medium text-emerald-600 mt-2">System Secure</p>
            </div>
            <p className="text-xs text-slate-400 mt-4">Past 24 hours</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                {activeModal === 'logs' && 'Recent Audit Logs (Last 10)'}
                {activeModal === 'deleted' && 'Recently Archived Records'}
                {activeModal === 'high_risk' && 'High-Risk Operations (Past 24h)'}
                {activeModal === 'anomalies' && 'Security Anomalies (Past 24h)'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    {activeModal === 'deleted' ? (
                      <>
                        <th className="px-6 py-3 font-semibold">Employee Name</th>
                        <th className="px-6 py-3 font-semibold">Department</th>
                        <th className="px-6 py-3 font-semibold">Date Archived</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-3 font-semibold">Timestamp</th>
                        <th className="px-6 py-3 font-semibold">Admin</th>
                        <th className="px-6 py-3 font-semibold">Action</th>
                        <th className="px-6 py-3 font-semibold">Target</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 text-slate-700">
                  {activeModal === 'logs' && recentLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium">{log.admin_name}</td>
                      <td className="px-6 py-4"><span className={getActionColor(log.action)}>{log.action}</span></td>
                      <td className="px-6 py-4 font-mono text-xs">{log.target_employee || 'N/A'}</td>
                    </tr>
                  ))}
                  {activeModal === 'logs' && recentLogs.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No logs found.</td></tr>
                  )}

                  {activeModal === 'deleted' && deletedRecords.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium font-mono">{emp.first_name} {emp.last_name}</td>
                      <td className="px-6 py-4">{emp.position?.department?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">{new Date(emp.deleted_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {activeModal === 'deleted' && deletedRecords.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">No archived records found.</td></tr>
                  )}

                  {activeModal === 'high_risk' && highRiskOperations.map((log: any) => (
                    <tr key={log.id} className="hover:bg-amber-50/50 bg-amber-50/20">
                      <td className="px-6 py-4 text-amber-700">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{log.admin_name}</td>
                      <td className="px-6 py-4"><span className={getActionColor(log.action)}>{log.action}</span></td>
                      <td className="px-6 py-4 font-mono text-xs">{log.target_employee || 'N/A'}</td>
                    </tr>
                  ))}
                  {activeModal === 'high_risk' && highRiskOperations.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No high-risk operations pending review.</td></tr>
                  )}

                  {activeModal === 'anomalies' && securityAnomalies.map((log: any) => (
                    <tr key={log.id} className="hover:bg-red-50/50 bg-red-50/20">
                      <td className="px-6 py-4 text-red-700">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{log.admin_name}</td>
                      <td className="px-6 py-4"><span className={getActionColor(log.action)}>{log.action}</span></td>
                      <td className="px-6 py-4 font-mono text-xs">{log.target_employee || 'N/A'}</td>
                    </tr>
                  ))}
                  {activeModal === 'anomalies' && securityAnomalies.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">System secure. No anomalies detected.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              {((activeModal === 'high_risk' && highRiskOperationsCount > 0) || (activeModal === 'anomalies' && securityAnomaliesCount > 0)) ? (
                <button 
                  onClick={handleAcknowledge}
                  disabled={isAcknowledging}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {isAcknowledging ? 'Acknowledging...' : 'Acknowledge Alerts'}
                </button>
              ) : <div />}
              <button 
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
