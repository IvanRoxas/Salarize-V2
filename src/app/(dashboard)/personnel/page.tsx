import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import PersonnelTable from '@/components/PersonnelTable';

export const dynamic = 'force-dynamic';

export default async function PersonnelPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const session = await getSession();

  if (!session || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'AUDITOR'].includes(session.role as string)) {
    redirect('/');
  }

  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || '';
  const dept = searchParams.dept || 'All';
  const ITEMS_PER_PAGE = 10;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const whereClause: any = { deleted_at: null };
  
  if (search) {
    whereClause.OR = [
      { first_name: { contains: search } },
      { last_name: { contains: search } },
      { email: { contains: search } }
    ];
  }

  if (dept !== 'All') {
    whereClause.position = { department_id: dept };
  }

  const [totalWorkforce, activePersonnel, recentlyOnboarded, employeesRaw, totalFiltered, positions] = await Promise.all([
    prisma.employee.count({ where: { deleted_at: null } }),
    prisma.employee.count({ where: { status: 'Active', deleted_at: null } }),
    prisma.employee.count({ where: { created_at: { gte: thirtyDaysAgo }, deleted_at: null } }),
    prisma.employee.findMany({
      where: whereClause,
      include: { position: { include: { department: true } } },
      orderBy: { created_at: 'desc' },
      skip,
      take: ITEMS_PER_PAGE
    }),
    prisma.employee.count({ where: whereClause }),
    prisma.position.findMany({ orderBy: { title: 'asc' }, include: { department: true } })
  ]);

  const processedEmployees = employeesRaw.map(emp => {
    return {
      ...emp,
      first_name: emp.first_name,
      last_name: emp.last_name,
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
        <PersonnelTable 
          employees={processedEmployees} 
          role={session.role as string} 
          positions={positions} 
          totalFiltered={totalFiltered}
          initialSearch={search}
          initialDept={dept}
          currentPage={page}
        />
      </div>
    </div>
  );
}
