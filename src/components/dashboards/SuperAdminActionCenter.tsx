'use client';

import { useState } from 'react';
import { ShieldAlert, Users, ChevronRight } from 'lucide-react';
import SystemAdminModal from '@/components/SystemAdminModal';
import Link from 'next/link';

export default function SuperAdminActionCenter({ role }: { role?: string }) {
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {role === 'SUPER_ADMIN' && (
          <Link 
            href="/admins"
            className="flex items-center justify-between p-5 bg-white border-2 border-violet-100 rounded-xl shadow-sm hover:border-violet-500 hover:bg-violet-50 hover:shadow-md transition-all duration-200 group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="bg-violet-100 text-violet-700 p-3 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-800">
                System Roles
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-violet-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
          </Link>
        )}

        <Link 
          href="/audit-logs"
          className={`flex items-center justify-between p-5 bg-white border-2 border-violet-100 rounded-xl shadow-sm hover:border-violet-500 hover:bg-violet-50 hover:shadow-md transition-all duration-200 group text-left ${role !== 'SUPER_ADMIN' ? 'md:col-span-2' : ''}`}
        >
          <div className="flex items-center gap-4">
            <div className="bg-violet-100 text-violet-700 p-3 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800">
              Security Logs
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-violet-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </>
  );
}
