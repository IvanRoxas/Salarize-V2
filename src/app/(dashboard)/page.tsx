import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import SuperAdminDashboard from '@/components/dashboards/SuperAdminDashboard';
import HRDashboard from '@/components/dashboards/HRDashboard';
import AuditorDashboard from '@/components/dashboards/AuditorDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardTrafficCop({ searchParams }: any) {
  const session = await getSession();
  const params = await searchParams;
  const pageStr = params?.page;
  const page = pageStr ? parseInt(pageStr as string) : 1;

  if (session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN') {
    return <SuperAdminDashboard page={page} />;
  }

  if (session?.role === 'HR_MANAGER') {
    return <HRDashboard />;
  }

  if (session?.role === 'AUDITOR') {
    return <AuditorDashboard />;
  }

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl text-center shadow-sm">
        <h2 className="text-xl font-bold mb-2">Unauthorized Access</h2>
        <p className="text-sm">Your session role is invalid or unauthorized to view this dashboard.</p>
      </div>
    </div>
  );
}
