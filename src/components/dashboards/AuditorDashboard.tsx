import prisma from '@/lib/prisma';
import { FileBarChart2, DollarSign, Building2 } from 'lucide-react';
import GenerateComplianceReportButton from '@/components/GenerateComplianceReportButton';
import { getSession } from '@/app/actions/auth';
import NewAuditorKPICards from '@/components/dashboards/NewAuditorKPICards';
import UnifiedActivityLedger from '@/components/dashboards/UnifiedActivityLedger';
import { ACCESS_LOG_ACTIONS } from '@/lib/auditCategories';

function formatValue(val: string | null) {
  if (!val) return '-';
  if (val === 'null') return '-';
  try {
    const parsed = JSON.parse(val);
    if (typeof parsed === 'object' && parsed !== null) {
      // Filter out id, created_at, updated_at
      const formatted = Object.entries(parsed)
        .filter(([k, v]) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(k) && v !== null && v !== '')
        .map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)
        .join(' | ');
      return formatted || '-';
    }
    return String(parsed);
  } catch (e) {
    return val;
  }
}

export default async function AuditorDashboard() {
  const session = await getSession();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    activeLogs,
    activeEmployees,
    rawActiveLogsData,
    salaryAdjustmentsLogs,
    departmentalChangesLogs
  ] = await Promise.all([
    prisma.auditLog.count({ 
      where: { 
        is_archived: false,
        action: { notIn: [...ACCESS_LOG_ACTIONS] }
      } 
    }),
    prisma.employee.findMany({
      where: { status: 'Active', deleted_at: null },
      include: { position: { include: { department: true } } }
    }),
    prisma.auditLog.findMany({
      where: { 
        is_archived: false,
        action: { notIn: [...ACCESS_LOG_ACTIONS] }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    }),
    prisma.auditLog.findMany({
      where: { 
        action: 'UPDATE SALARY',
        timestamp: { gte: thirtyDaysAgo },
        is_archived: false
      },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.auditLog.findMany({
      where: {
        action: { in: ['CREATE DEPARTMENT', 'UPDATE DEPARTMENT', 'DELETE DEPARTMENT', 'CREATE POSITION', 'UPDATE POSITION', 'DELETE POSITION'] },
        is_archived: false
      },
      orderBy: { timestamp: 'desc' }
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
  const totalCompanyPayroll = activeEmployees.reduce((sum, emp) => sum + (emp.actual_salary || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Welcome, {session?.username}!</h1>
        </div>
        <GenerateComplianceReportButton />
      </div>

      {/* Stylized KPI Cards with Modals */}
      <NewAuditorKPICards 
        activeLogsCount={activeLogs}
        salaryAdjustmentsCount={salaryAdjustmentsLogs.length}
        departmentalChangesCount={departmentalChangesLogs.length}
        salaryAdjustmentsLogs={salaryAdjustmentsLogs}
        departmentalChangesLogs={departmentalChangesLogs}
        recentActiveLogs={rawActiveLogsData}
      />

      {/* 3-Column Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 items-start">
        
        {/* Column 1: Departmental Salary Liability */}
        <div className="sticky top-6 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[600px] lg:col-span-1">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2 rounded-t-xl">
            <FileBarChart2 className="w-5 h-5 text-violet-600" />
            <h3 className="font-bold text-slate-800 text-lg">Salary Liability</h3>
          </div>
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {liabilityEntries.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No active salary data available.</div>
            ) : (
              <div className="space-y-6">
                {liabilityEntries.map(([dept, total]) => (
                  <div key={dept} className="flex flex-col space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-semibold text-slate-700">{dept}</span>
                      <span className="text-sm font-bold text-slate-800">₱{total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${totalCompanyPayroll > 0 ? (total / totalCompanyPayroll) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2 & 3: Unified Activity Ledger */}
        <UnifiedActivityLedger logs={rawActiveLogsData} />
      </div>
    </div>
  );
}
