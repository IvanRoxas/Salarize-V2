'use client';

import { useState } from 'react';
import { ShieldCheck, AlertTriangle, RefreshCcw } from 'lucide-react';
import { revalidateDashboardData } from '@/app/actions/health';

export default function HealthCheckConsole({ 
  anomalousEmployees, 
  totalActiveEmployees,
  highRiskOperationsCount = 0,
  securityAnomaliesCount = 0
}: { 
  anomalousEmployees: any[], 
  totalActiveEmployees: number,
  highRiskOperationsCount?: number,
  securityAnomaliesCount?: number
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date>(new Date());

  const handleManualScan = async () => {
    setIsScanning(true);
    const result = await revalidateDashboardData();
    if (result.success) {
      setLastScanTime(new Date(result.timestamp));
    }
    setIsScanning(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full">
      {anomalousEmployees.length === 0 ? (
        securityAnomaliesCount > 0 ? (
          // --- NON-COMPLIANT STATE (RED/ACTION REQUIRED) ---
          <div className="bg-red-50 rounded-xl p-6 border border-red-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-2.5 rounded-full border border-red-200">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-800 flex items-center">
                    Action Required / Anomalies Detected
                    <span className="ml-3 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                      {totalActiveEmployees} Records Scanned
                    </span>
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Last scan: Today, {formatTime(lastScanTime)}
                  </p>
                  <p className="text-sm mt-1.5">
                    <span className="font-semibold text-slate-700">Issues:</span> <span className="text-red-600 font-semibold">{securityAnomaliesCount} Critical Security Anomalies</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={handleManualScan}
                disabled={isScanning}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 hover:border-red-400 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <RefreshCcw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Manual Scan'}</span>
              </button>
            </div>
          </div>
        ) : (
          // --- COMPLIANT STATE (MINIMAL PURPLE) ---
          <div className="bg-white rounded-xl p-6 border border-violet-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-violet-50 p-2.5 rounded-full border border-violet-100">
                  <ShieldCheck className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800 flex items-center">
                    System Compliant
                    <span className="ml-3 text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
                      {totalActiveEmployees} Records Verified
                    </span>
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Last scan: Today, {formatTime(lastScanTime)}
                  </p>
                  <p className="text-sm mt-1.5">
                    <span className="font-semibold text-slate-700">Issues:</span> 
                    {highRiskOperationsCount > 0 ? (
                      <span className="text-amber-600 font-medium ml-1">{highRiskOperationsCount} High-Risk Ops (Review Pending)</span>
                    ) : (
                      <span className="text-slate-500 ml-1">None</span>
                    )}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleManualScan}
                disabled={isScanning}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-violet-700 bg-violet-50 border border-violet-200 hover:border-violet-400 hover:bg-violet-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <RefreshCcw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Manual Scan'}</span>
              </button>
            </div>
          </div>
        )
      ) : (
        // --- NON-COMPLIANT STATE (ALERT MODE) ---
        <div className="bg-red-50 rounded-xl p-6 border border-red-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-red-700">Compliance Violations Detected: {anomalousEmployees.length}</h4>
                <p className="text-sm text-red-600/80 mt-0.5">Immediate remediation required to align with system parameters.</p>
              </div>
            </div>
            <button 
              onClick={handleManualScan}
              disabled={isScanning}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 hover:border-red-400 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm"
            >
              <RefreshCcw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Run Manual Diagnostic'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {anomalousEmployees.map(emp => {
              return (
                <div key={emp.id} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 font-mono">{emp.first_name} {emp.last_name}</span>
                    <span className="mx-2 text-slate-300">—</span>
                    <span className="text-sm text-slate-600">{emp.position.title} ({emp.position?.department?.name || 'Unknown'})</span>
                  </div>
                  <div className="text-sm font-mono flex items-center bg-red-50 px-4 py-2 rounded-md border border-red-100">
                    <span className="text-slate-500 mr-2">Actual:</span>
                    <span className="font-bold text-red-600 mr-2 text-base">₱{emp.actual_salary?.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">(Expected: ₱{emp.position.min_salary.toLocaleString()} - ₱{emp.position.max_salary.toLocaleString()})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
