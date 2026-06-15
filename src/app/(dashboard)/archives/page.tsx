import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import AuditLogsTable from '@/components/AuditLogsTable';

export const dynamic = 'force-dynamic';

export default async function ArchivesPage() {
  const session = await getSession();

  // Strict RBAC: Only AUDITOR
  if (!session || session.role !== 'AUDITOR') {
    redirect('/');
  }

  const archivedLogs = await prisma.auditLog.findMany({
    where: { is_archived: true },
    orderBy: { timestamp: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">System Archives</h1>
          <p className="text-slate-500 mt-1">Massive data table of all archived audit logs.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <AuditLogsTable logs={archivedLogs} />
      </div>
    </div>
  );
}
