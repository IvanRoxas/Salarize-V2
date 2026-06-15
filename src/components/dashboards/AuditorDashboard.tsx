import prisma from '@/lib/prisma';
import { AlertCircle, FileBarChart2, ShieldCheck, AlertTriangle } from 'lucide-react';
import GenerateComplianceReportButton from '@/components/GenerateComplianceReportButton';
import HealthCheckConsole from '@/components/dashboards/HealthCheckConsole';

function getRelativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default async function AuditorDashboard() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const [
    totalLogs, 
    archivedRecords, 
    highRiskLogs, 
    activeEmployees,
    logsLast7Days,
    latestLog,
    deletesLast30Days,
    latestDelete,
    criticalAlertsCount
  ] = await Promise.all([
    prisma.auditLog.count(),
    prisma.employee.findMany({
      where: { deleted_at: { not: null } },
      orderBy: { deleted_at: 'desc' },
      include: { position: true },
    }),
    prisma.auditLog.findMany({
      where: {
        action: { in: ['UPDATE_SALARY', 'DELETE_EMPLOYEE', 'CLEARED_LOGS', 'REVOKE ROLE'] }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    }),
    prisma.employee.findMany({
      where: { status: 'Active', deleted_at: null },
      include: { position: { include: { department: true } } }
    }),
    prisma.auditLog.count({
      where: { timestamp: { gte: sevenDaysAgo } }
    }),
    prisma.auditLog.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    }),
    prisma.employee.count({
      where: { deleted_at: { gte: thirtyDaysAgo } }
    }),
    prisma.employee.findFirst({
      where: { deleted_at: { not: null } },
      orderBy: { deleted_at: 'desc' },
      select: { deleted_at: true }
    }),
    prisma.auditLog.count({
      where: {
        action: { in: ['DELETE_EMPLOYEE', 'DELETE EMPLOYEE', 'UNAUTHORIZED', 'REVOKE ROLE'] },
        timestamp: { gte: twentyFourHoursAgo }
      }
    })
  ]);

  // Aggregate Liability
  const liabilityByDept: Record<string, number> = activeEmployees.reduce((acc: any, emp) => {
    const deptName = emp.position?.department?.name || 'Unassigned';
    if (!acc[deptName]) acc[deptName] = 0;
    acc[deptName] += (emp.actual_salary || 0);
    return acc;
  }, {});

  const liabilityEntries = Object.entries(liabilityByDept).sort((a, b) => b[1] - a[1]);

  const anomalousEmployees = activeEmployees.filter(emp => 
    (emp.actual_salary || 0) < emp.position.min_salary || 
    (emp.actual_salary || 0) > emp.position.max_salary
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Auditor Dashboard</h1>
          {/* Subtitle if requested: <p className="text-sm text-slate-500 mt-1">Independent Oversight and Security Monitoring</p> */}
        </div>
        <GenerateComplianceReportButton />
      </div>

      {/* Top Row: KPIs (3-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-violet-600 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Audit Logs</p>
            <span className="text-4xl font-bold text-slate-800">{totalLogs}</span>
            <p className="text-sm font-medium text-emerald-600 mt-2">+{logsLast7Days} in the last 7 days</p>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Latest event: {latestLog ? getRelativeTime(new Date(latestLog.timestamp)) : 'N/A'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-orange-500 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Deleted Records</p>
            <span className="text-4xl font-bold text-slate-800">{archivedRecords.length}</span>
            <p className="text-sm font-medium text-orange-500 mt-2">{deletesLast30Days} archived this month</p>
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Most recent: {latestDelete?.deleted_at ? new Date(latestDelete.deleted_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>

        {criticalAlertsCount > 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-600 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm font-medium text-slate-500">Active Alerts</p>
              </div>
              <span className="text-4xl font-bold text-red-600">{criticalAlertsCount}</span>
              <p className="text-sm font-medium text-red-600 mt-2">Action Required: Critical Events Detected</p>
            </div>
            <p className="text-xs text-slate-400 mt-4">Past 24 hours</p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-medium text-slate-500">Active Alerts</p>
              </div>
              <span className="text-4xl font-bold text-emerald-600">0</span>
              <p className="text-sm font-medium text-emerald-600 mt-2">System Stable: No Anomalies</p>
            </div>
            <p className="text-xs text-slate-400 mt-4">Past 24 hours</p>
          </div>
        )}
      </div>

      {/* Tier 2: Health Check Console (Full Width) */}
      <HealthCheckConsole 
        anomalousEmployees={anomalousEmployees} 
        totalActiveEmployees={activeEmployees.length} 
      />

      {/* Tier 3: Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* High-Risk Anomaly Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-slate-800">High-Risk System Events</h3>
          </div>
          <div className="p-6 flex-1 overflow-auto">
            {highRiskLogs.length === 0 ? (
              <div className="text-center text-slate-400 py-4">No high-risk events detected.</div>
            ) : (
              <div className="space-y-4">
                {highRiskLogs.map(log => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg border border-orange-100 bg-orange-50/50">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 flex items-center">
                        {log.action} 
                        <span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                          {log.admin_name}
                        </span>
                      </p>
                      <p className="text-xs text-slate-600 mt-1 font-mono">Target: {log.target_employee}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departmental Salary Liability */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
            <FileBarChart2 className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-slate-800">Departmental Salary Liability</h3>
          </div>
          <div className="p-6 flex-1">
            {liabilityEntries.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No active salary data available.</div>
            ) : (
              <div className="space-y-5">
                {liabilityEntries.map(([dept, total]) => (
                  <div key={dept} className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-slate-700">{dept}</span>
                      <span className="text-sm font-bold text-slate-800">₱{total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(total / (liabilityEntries[0][1] || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
