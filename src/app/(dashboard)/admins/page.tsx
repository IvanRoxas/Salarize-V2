import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import AdminRegistry from '@/components/AdminRegistry';

export const dynamic = 'force-dynamic';

export default async function AdminsPage() {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const pendingAdmins = await prisma.admin.findMany({
    where: { status: 'PENDING' },
    select: { id: true, username: true, role: true, status: true, created_at: true },
    orderBy: { created_at: 'asc' }
  });

  const activeAdmins = await prisma.admin.findMany({
    where: { status: { not: 'PENDING' } },
    select: { id: true, username: true, role: true, status: true, created_at: true },
    orderBy: { created_at: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-bold text-slate-800">System Roles</h1>
      </div>
      <AdminRegistry 
        pendingAdmins={pendingAdmins} 
        activeAdmins={activeAdmins} 
        currentAdminId={session.id as string} 
      />
    </div>
  );
}
