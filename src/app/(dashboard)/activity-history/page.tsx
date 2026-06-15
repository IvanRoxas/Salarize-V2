import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import ActivityHistoryTable from '@/components/dashboards/ActivityHistoryTable';

export const dynamic = 'force-dynamic';

export default async function ActivityHistoryPage() {
  const session = await getSession();

  if (!session || !['AUDITOR', 'SUPER_ADMIN', 'ADMIN'].includes(session.role as string)) {
    redirect('/');
  }

  const rawActiveLogsData = await prisma.auditLog.findMany({
    where: { 
      is_archived: false,
      action: { notIn: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] }
    },
    orderBy: { timestamp: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Activity History</h1>
          <p className="text-slate-500 mt-1">Review operational actions and unarchived system events.</p>
        </div>
      </div>
      
      <ActivityHistoryTable logs={rawActiveLogsData} role={session.role as string} />
    </div>
  );
}
