import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import DepartmentRegistry from '@/components/DepartmentRegistry';
import PositionRegistry from '@/components/PositionRegistry';

export const dynamic = 'force-dynamic';

export default async function DepartmentsPage() {
  const session = await getSession();

  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'HR_MANAGER')) {
    redirect('/');
  }

  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { positions: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const positions = await prisma.position.findMany({
    include: {
      department: true,
      _count: {
        select: { employees: { where: { deleted_at: null, status: 'Active' } } }
      }
    },
    orderBy: { title: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-2">
        <h1 className="text-3xl font-bold text-slate-800">Departments</h1>
      </div>

      <DepartmentRegistry initialDepartments={departments} role={session.role} />
      
      <div className="pt-8">
        <PositionRegistry initialPositions={positions} departments={departments} role={session.role} />
      </div>
    </div>
  );
}
