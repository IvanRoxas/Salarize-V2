import prisma from '@/lib/prisma';
import EmployeeRegistry from '@/components/EmployeeRegistry';
import { getSession } from '@/app/actions/auth';
import SearchBar from '@/components/ui/SearchBar';
import { checkAccess } from '@/lib/security';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getSession();

  // F1 fix: PERSONNEL_DIRECTORY READ required — ADMIN role does not have it
  if (!session || !checkAccess(session.role as string, 'PERSONNEL_DIRECTORY', 'READ')) {
    redirect('/');
  }

  const resolvedParams = await searchParams;
  const query = typeof resolvedParams?.query === 'string' ? resolvedParams.query : '';

  const [employees, positions] = await Promise.all([
    query
      ? prisma.employee.findMany({
          where: {
            deleted_at: null,
            OR: [
              { first_name: { contains: query } },
              { last_name: { contains: query } },
              { email: { contains: query } },
            ],
          },
          include: { position: true },
          orderBy: { created_at: 'desc' },
        })
      : prisma.employee.findMany({ 
          where: { deleted_at: null }, 
          include: { position: true },
          orderBy: { created_at: 'desc' } 
        }),
    prisma.position.findMany({ orderBy: { title: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-slate-800">
          Personnel Directory
        </h2>
        <SearchBar />
      </div>
      <EmployeeRegistry initialEmployees={employees} positions={positions} role={session?.role as string} />
    </div>
  );
}
