import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import PayrollOperationsTable from '@/components/PayrollOperationsTable';
import PayrollExportButton from '@/components/PayrollExportButton';
import DownloadPdfReportButton from '@/components/DownloadPdfReportButton';

export const dynamic = 'force-dynamic';

export default async function PayrollPage() {
  const session = await getSession();

  // Strict RBAC: Only HR_MANAGER
  if (!session || session.role !== 'HR_MANAGER') {
    redirect('/');
  }

  // Fetch active/standby employees
  const employees = await prisma.employee.findMany({
    where: { deleted_at: null },
    include: { position: { include: { department: true } } },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Salary and Operations</h1>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <DownloadPdfReportButton />
          <PayrollExportButton />
        </div>
      </div>
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <PayrollOperationsTable initialEmployees={employees} />
      </div>
    </div>
  );
}
