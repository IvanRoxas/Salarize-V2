import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import ArchivesTable from '@/components/ArchivesTable';

export const dynamic = 'force-dynamic';

export default async function ArchivesPage() {
  const session = await getSession();

  // Strict RBAC: Only AUDITOR
  if (!session || session.role !== 'AUDITOR') {
    redirect('/');
  }

  const archivedRecords = await prisma.employee.findMany({
    where: { deleted_at: { not: null } },
    orderBy: { deleted_at: 'desc' },
    include: { position: { include: { department: true } } },
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { action: 'DELETE EMPLOYEE' }
  });

  const departments = await prisma.department.findMany({
    select: { name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Data Retention Archives</h1>
        </div>
      </div>

      <ArchivesTable archivedRecords={archivedRecords} auditLogs={auditLogs} departments={departments} />
    </div>
  );
}
