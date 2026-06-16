import { getSession } from "@/app/actions/auth";
import AdminProfile from "@/components/AdminProfile";
import SessionTimeout from "@/components/SessionTimeout";
import RoleBasedSidebar from "@/components/RoleBasedSidebar";
import Link from "next/link";
import { Briefcase, LayoutDashboard, Users, DollarSign } from "lucide-react";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SessionTimeout />
      
      {/* The Sidebar (Left) */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col z-10">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-violet-600 text-white p-1.5 rounded-full flex items-center justify-center shadow-sm">
              <DollarSign className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Salarize</h1>
          </div>
        </div>

        <RoleBasedSidebar role={session?.role as string} />
      </aside>

      {/* The Main Content Area (Right) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* The Top Header bar */}
        <header className="h-20 w-full bg-violet-800 text-white shadow-md flex items-center justify-between px-8 z-20">
          <div className="flex-1"></div>
          {/* The Dropdown Fix (CRITICAL) */}
          <div className="z-[100] relative rounded-lg">
            <AdminProfile username={session?.username as string} role={session?.role as string} />
          </div>
        </header>

        {/* The Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
