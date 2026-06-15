import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import PersonnelTable from '@/components/PersonnelTable';

export const dynamic = 'force-dynamic';

export default async function PersonnelPage() {
  const session = await getSession();

  if (!session || !['SUPER_ADMIN', 'HR_MANAGER', 'AUDITOR'].includes(session.role as string)) {
    redirect('/');
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalWorkforce, activePersonnel, recentlyOnboarded, employeesRaw, positions] = await Promise.all([
    prisma.employee.count({ where: { deleted_at: null } }),
    prisma.employee.count({ where: { status: 'Active', deleted_at: null } }),
    prisma.employee.count({ where: { created_at: { gte: thirtyDaysAgo }, deleted_at: null } }),
    prisma.employee.findMany({
      where: { deleted_at: null },
      include: { position: { include: { department: true } } },
      orderBy: { created_at: 'desc' }
    }),
    prisma.position.findMany({ orderBy: { title: 'asc' }, include: { department: true } })
  ]);

  const maskPII = (name: string) => {
    return name ? name.charAt(0) + '***' : '***';
  };

  const processedEmployees = employeesRaw.map(emp => {
    return {
      ...emp,
      first_name: session.role === 'AUDITOR' ? maskPII(emp.first_name) : emp.first_name,
      last_name: session.role === 'AUDITOR' ? maskPII(emp.last_name) : emp.last_name,
      actual_salary: session.role === 'HR_MANAGER' ? null : emp.actual_salary,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Manage Employees</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 border-l-4 border-violet-500">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Company Workforce</p>
          <p className="text-3xl font-bold text-slate-800">{totalWorkforce}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 border-l-4 border-violet-500">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Active Personnel</p>
          <p className="text-3xl font-bold text-slate-800">{activePersonnel}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 border-l-4 border-violet-500">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Recently Onboarded</p>
          <p className="text-3xl font-bold text-slate-800">{recentlyOnboarded}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <PersonnelTable employees={processedEmployees} role={session.role as string} positions={positions} />
      </div>
    </div>
  );
}
