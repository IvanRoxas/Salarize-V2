'use client';

import { useState } from 'react';
import { Plus, Edit2, Layers } from 'lucide-react';
import CreateDepartmentModal from './CreateDepartmentModal';
import EditDepartmentModal from './EditDepartmentModal';

export default function DepartmentRegistry({ initialDepartments, role }: { initialDepartments: any[], role: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);

  return (
    <div className="space-y-6">
      {role === 'SUPER_ADMIN' && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-all duration-200 shadow-sm hover:shadow active:scale-95 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Department</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialDepartments.map((dept) => (
          <div key={dept.id} className="border-t-4 border-t-violet-500 bg-white shadow-sm rounded-lg p-6 hover:border-violet-300 transition-all duration-300 flex flex-col h-full border border-slate-100 group relative">
            
            {role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => setSelectedDept(dept)}
                className="absolute top-4 right-4 text-slate-300 hover:text-violet-600 hover:bg-violet-50 p-2 rounded-full transition-all duration-200 transform hover:scale-110 cursor-pointer"
                title="Edit Department"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            )}

            <div className="mb-4 pr-10">
              <h3 className="text-xl font-bold text-slate-800 leading-tight">{dept.name}</h3>
              <p className="text-slate-500 text-sm mt-2 line-clamp-2">{dept.description || 'No description provided.'}</p>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-slate-600 text-sm">
              <div className="flex items-center">
                <Layers className="w-5 h-5 text-violet-400 mr-2" />
                <span className="font-medium text-slate-700">
                  {dept._count.positions} Job {dept._count.positions === 1 ? 'Position' : 'Positions'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {initialDepartments.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-lg border border-slate-200 border-dashed">
            No departments created yet.
          </div>
        )}
      </div>

      {isModalOpen && <CreateDepartmentModal onClose={() => setIsModalOpen(false)} />}
      {selectedDept && <EditDepartmentModal department={selectedDept} role={role} onClose={() => setSelectedDept(null)} />}
    </div>
  );
}
