import { PrismaClient } from '@prisma/client';
import SalaryRegistry from '@/components/SalaryRegistry';
import { getSession } from '@/app/actions/auth';
import { checkAccess } from '@/lib/security';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export default async function SalaryPage() {
  const session = await getSession();

  // F1 fix: block roles without PAYROLL_OPERATIONS READ (e.g. ADMIN)
  if (!session || !checkAccess(session.role as string, 'PAYROLL_OPERATIONS', 'READ')) {
    redirect('/');
  }

  const employees = await prisma.employee.findMany({
    where: { deleted_at: null },
    include: { position: true },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-slate-800">Salary and Operations Management</h2>
      </div>
      <SalaryRegistry initialEmployees={employees} role={session?.role as string} />
    </div>
  );
}
