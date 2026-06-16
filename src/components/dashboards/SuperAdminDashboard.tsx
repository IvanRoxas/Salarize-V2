import prisma from '@/lib/prisma';
import SuperAdminActionCenter from './SuperAdminActionCenter';
import Link from 'next/link';
import { getSession } from '@/app/actions/auth';
import { ACCESS_LOG_ACTIONS } from '@/lib/auditCategories';

export default async function SuperAdminDashboard({ page = 1 }: { page?: number }) {
  const session = await getSession();
  const ITEMS_PER_PAGE = 5;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [
    totalEmployees,
    activeStaff,
    totalLogs,
    feedTotalLogs,
    recentLogs,
  ] = await Promise.all([
    prisma.employee.count({ where: { deleted_at: null } }),
    prisma.employee.count({ where: { status: 'Active', deleted_at: null } }),
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { action: { notIn: [...ACCESS_LOG_ACTIONS] } } }),
    // Operational activity only — login/security events go to Access Logs
    prisma.auditLog.findMany({
      take: ITEMS_PER_PAGE,
      skip,
      where: { action: { notIn: [...ACCESS_LOG_ACTIONS] } },
      orderBy: { timestamp: 'desc' },
    })
  ]);

  const totalPages = Math.ceil(feedTotalLogs / ITEMS_PER_PAGE);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADDED')) return 'text-violet-600 font-semibold';
    if (action.includes('UPDATE')) return 'text-yellow-600 font-semibold';
    if (action.includes('DELETE')) return 'text-red-600 font-semibold';
    return 'text-slate-600 font-semibold';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Welcome, {session?.username}!</h1>
      </div>

      {/* Top Row: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Company Workforce</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-800">{totalEmployees}</span>
            <span className="text-lg text-slate-400 font-medium">Personnel</span>
          </div>
          <p className="text-sm text-emerald-600 mt-2 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded-md">{activeStaff} currently active</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">System Activity</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-slate-800">{totalLogs}</span>
            <span className="text-lg text-slate-400 font-medium">Total Events</span>
          </div>
          <p className="text-sm text-violet-600 mt-2 font-medium bg-violet-50 inline-block px-2 py-0.5 rounded-md">As of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Action Center - Refactored for SoD */}
      <SuperAdminActionCenter role={session?.role as string} />

      {/* Bottom Row: System Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">System Activity Feed</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Action</th>
                <th className="px-6 py-3 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 text-slate-700">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {new Date(log.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4 font-medium">{log.admin_name}</td>
                  <td className="px-6 py-4">
                    <span className={getActionColor(log.action)}>{log.action}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{log.target_employee || 'N/A'}</td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No recent activity.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
            <div className="text-sm text-slate-500">
              Page <span className="font-semibold text-slate-800">{page}</span> of <span className="font-semibold text-slate-800">{totalPages}</span>
            </div>
            <div className="flex space-x-2">
              {page > 1 ? (
                <Link href={`/?page=${page - 1}`} scroll={false} className="px-4 py-2 text-sm font-semibold text-violet-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                  Previous
                </Link>
              ) : (
                <button disabled className="px-4 py-2 text-sm font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-md cursor-not-allowed">
                  Previous
                </button>
              )}
              {page < totalPages ? (
                <Link href={`/?page=${page + 1}`} scroll={false} className="px-4 py-2 text-sm font-semibold text-violet-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
                  Next
                </Link>
              ) : (
                <button disabled className="px-4 py-2 text-sm font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-md cursor-not-allowed">
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
