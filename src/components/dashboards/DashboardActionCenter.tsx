'use client';

import { useState } from 'react';
import { UserPlus, ShieldAlert, ChevronRight } from 'lucide-react';
import RegisterPersonnelModal from '@/components/RegisterPersonnelModal';
import SystemAdminModal from '@/components/SystemAdminModal';

export default function DashboardActionCenter({ positions }: { positions: any[] }) {
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setShowPersonnelModal(true)}
          className="flex items-center justify-between p-5 bg-white border-2 border-violet-100 rounded-xl shadow-sm hover:border-violet-500 hover:bg-violet-50 hover:shadow-md transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-violet-100 text-violet-700 p-3 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <UserPlus className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800">
              Register Personnel
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-violet-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={() => setShowAdminModal(true)}
          className="flex items-center justify-between p-5 bg-white border-2 border-violet-100 rounded-xl shadow-sm hover:border-violet-500 hover:bg-violet-50 hover:shadow-md transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-violet-100 text-violet-700 p-3 rounded-lg group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-800">
              System Roles
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-violet-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {showPersonnelModal && (
        <RegisterPersonnelModal 
          positions={positions} 
          onClose={() => setShowPersonnelModal(false)} 
        />
      )}
      
      {showAdminModal && (
        <SystemAdminModal 
          onClose={() => setShowAdminModal(false)} 
        />
      )}
    </>
  );
}
