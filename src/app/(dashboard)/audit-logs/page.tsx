import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import ClearLogsButton from '@/components/ClearLogsButton';
import AuditLogsTable from '@/components/AuditLogsTable';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const session = await getSession();

  // Strict RBAC: Only SUPER_ADMIN and AUDITOR
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'AUDITOR')) {
    redirect('/');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [logs, totalEvents, modificationsToday] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' }
    }),
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: { timestamp: { gte: today } }
    })
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Security Logs</h1>
        {session.role === 'SUPER_ADMIN' && <ClearLogsButton />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-violet-50 border border-violet-100 rounded-lg shadow-sm p-6">
          <p className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-1">Total Security Events</p>
          <p className="text-3xl font-bold text-violet-900">{totalEvents}</p>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-lg shadow-sm p-6">
          <p className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-1">Modifications Today</p>
          <p className="text-3xl font-bold text-violet-900">{modificationsToday}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <AuditLogsTable logs={logs} />
      </div>
    </div>
  );
}
