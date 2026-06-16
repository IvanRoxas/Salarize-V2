import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import AuditLogsTable from '@/components/AuditLogsTable';
import { ACCESS_LOG_ACTIONS } from '@/lib/auditCategories';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const session = await getSession();

  // Strict RBAC: Only SUPER_ADMIN, ADMIN, and AUDITOR
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'ADMIN' && session.role !== 'AUDITOR')) {
    redirect('/');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [logs, totalEvents, modificationsToday, admins] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: { in: [...ACCESS_LOG_ACTIONS] } },
      orderBy: { timestamp: 'desc' }
    }),
    prisma.auditLog.count({
      where: { action: { in: [...ACCESS_LOG_ACTIONS] } }
    }),
    prisma.auditLog.count({
      where: {
        action: { in: [...ACCESS_LOG_ACTIONS] },
        timestamp: { gte: today }
      }
    }),
    prisma.admin.findMany({ select: { username: true } })
  ]);

  const registeredActors = admins.map(a => a.username);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Access Logs</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-violet-50 border border-violet-100 rounded-lg shadow-sm p-6">
          <p className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-1">Total Access Events</p>
          <p className="text-3xl font-bold text-violet-900">{totalEvents}</p>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-lg shadow-sm p-6">
          <p className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-1">Access Events Today</p>
          <p className="text-3xl font-bold text-violet-900">{modificationsToday}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <AuditLogsTable logs={logs} registeredActors={registeredActors} />
      </div>
    </div>
  );
}
