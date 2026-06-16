import prisma from '@/lib/prisma';
import Link from 'next/link';
import DashboardCharts from '@/components/DashboardCharts';
import HRActionCenter from './HRActionCenter';
import { getSession } from '@/app/actions/auth';
import { IconMap, ColorMap } from '@/lib/theme';

export default async function HRDashboard() {
  const session = await getSession();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [
    totalActiveStaff,
    recentHires,
    departmentCounts,
    positions,
    pendingOnboarding,
    newHiresThisMonth,
    onboardingQueue,
    departments
  ] = await Promise.all([
    prisma.employee.count({ where: { status: 'Active', deleted_at: null } }),
    prisma.employee.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: { position: true },
    }),
    prisma.employee.groupBy({
      by: ['position_id'],
      where: { deleted_at: null },
      _count: { id: true },
    }),
    prisma.position.findMany({ include: { department: true } }),
    prisma.employee.count({ where: { status: 'Onboarding', deleted_at: null } }),
    prisma.employee.count({ 
      where: { 
        deleted_at: null, 
        created_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } 
      } 
    }),
    prisma.employee.findMany({
      where: {
        status: 'Onboarding',
        deleted_at: null,
      },
      include: { position: true },
      orderBy: { created_at: 'desc' },
      take: 8,
    }),
    prisma.department.findMany()
  ]);

  const getStatusStyle = (status: string | null) => {
    if (status === 'Active') return 'bg-emerald-100 text-emerald-700';
    if (status === 'Onboarding') return 'bg-blue-100 text-blue-700';
    if (status === 'Standby') return 'bg-yellow-100 text-yellow-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Welcome, {session?.username}!</h1>
      </div>

      {/* Top Row: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Active Staff</p>
          <span className="text-4xl font-bold text-slate-800">{totalActiveStaff}</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Onboarding Queue</p>
          <span className="text-4xl font-bold text-blue-600 tracking-tight">{pendingOnboarding}</span>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">New Hires This Month</p>
          <span className="text-4xl font-bold text-slate-800">{newHiresThisMonth}</span>
        </div>
      </div>

      {/* HR Action Center */}
      <HRActionCenter positions={positions} departments={departments} />

      {/* Middle Row: Distribution Charts */}
      <DashboardCharts departmentCounts={departmentCounts} positions={positions} />

      {/* Bottom Row: Recent Hires & Onboarding Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">Recent Hires</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Position and Department</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Date Added</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 text-slate-700">
                {recentHires.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{emp.first_name} {emp.last_name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-medium">{emp.position?.title || 'Unassigned'}</span>
                        {(() => {
                          const deptName = emp.position?.department?.name;
                          if (!deptName) return <span className="text-slate-500 text-xs mt-1">N/A</span>;
                          
                          const iconName = emp.position?.department?.icon || 'Building';
                          const colorName = emp.position?.department?.color || 'slate';
                          const DeptIcon = IconMap[iconName] || IconMap['Building'];
                          const colorTheme = ColorMap[colorName] || ColorMap['slate'];

                          return (
                            <div className={`flex items-center space-x-1 mt-1 ${colorTheme.text}`}>
                              <DeptIcon className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">{deptName}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(emp.status)}`}>
                        {emp.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recentHires.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No recent hires found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Onboarding Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">Onboarding Queue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100 text-slate-700">
                {onboardingQueue.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{emp.first_name} {emp.last_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(emp.status)}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/personnel?edit=${emp.id}`} className="text-violet-600 hover:text-violet-800 text-xs font-semibold">
                        Review &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
                {onboardingQueue.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">No pending onboarding tasks.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
