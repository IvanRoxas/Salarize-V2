import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import ActivityHistoryTable from '@/components/dashboards/ActivityHistoryTable';
import { ACCESS_LOG_ACTIONS } from '@/lib/auditCategories';

export const dynamic = 'force-dynamic';

export default async function ActivityHistoryPage() {
  const session = await getSession();

  if (!session || !['AUDITOR', 'SUPER_ADMIN', 'ADMIN'].includes(session.role as string)) {
    redirect('/');
  }

  // Exclude ALL access-log action types — login attempts, 403s, rate limits,
  // and account lifecycle events belong in the Access Logs page, not here.
  const rawActiveLogsData = await prisma.auditLog.findMany({
    where: {
      is_archived: false,
      action: { notIn: [...ACCESS_LOG_ACTIONS] }
    },
    orderBy: { timestamp: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Activity History</h1>
        </div>
      </div>

      <ActivityHistoryTable logs={rawActiveLogsData} role={session.role as string} />
    </div>
  );
}
