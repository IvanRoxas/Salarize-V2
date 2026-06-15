'use client';

import { useState } from 'react';
import { Plus, Edit2, Layers, X, Search, Building, Users, Monitor, Shield, Code, Calculator, Cpu, Globe, Briefcase } from 'lucide-react';
import CreateDepartmentModal from './CreateDepartmentModal';
import EditDepartmentModal from './EditDepartmentModal';

import { IconMap, ColorMap } from '@/lib/theme';

export default function DepartmentRegistry({ initialDepartments, role }: { initialDepartments: any[], role: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [positionsModalDept, setPositionsModalDept] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = initialDepartments.filter(dept => {
    const term = searchQuery.toLowerCase();
    return dept.name.toLowerCase().includes(term) || (dept.description && dept.description.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Departments</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
            />
          </div>
          {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-all duration-200 shadow-sm hover:shadow active:scale-95 text-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Department</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept) => {
          const DeptIcon = IconMap[dept.icon || 'Building'] || Building;
          const colorTheme = ColorMap[dept.color || 'violet'] || ColorMap.violet;

          return (
            <div key={dept.id} className={`border-t-4 ${colorTheme.border} bg-white shadow-sm rounded-lg p-6 ${colorTheme.hover} transition-all duration-300 flex flex-col h-full border border-slate-100 group relative`}>
              
              {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                <button 
                  onClick={() => setSelectedDept(dept)}
                  className={`absolute top-4 right-4 text-slate-300 ${colorTheme.btnTextHover} ${colorTheme.btnBgHover} hover:ring-2 ${colorTheme.btnRingHover} hover:ring-offset-1 p-2 rounded-full transition-all duration-200 transform hover:scale-110 cursor-pointer`}
                  title="Edit Department"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}

              <div className="mb-4 pr-10 flex items-start space-x-3">
                <div className={`mt-1 p-2 rounded-lg ${colorTheme.bg} ${colorTheme.text}`}>
                  <DeptIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 leading-tight">{dept.name}</h3>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{dept.description || 'No description provided.'}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
                <div 
                  className={`flex items-center p-2 -ml-2 rounded-md transition-colors ${role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HR_MANAGER' ? `cursor-pointer ${colorTheme.bg} text-slate-600 ${colorTheme.text}` : 'text-slate-600'}`}
                  onClick={() => {
                    if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HR_MANAGER') {
                      setPositionsModalDept(dept);
                    }
                  }}
                >
                  <Layers className={`w-5 h-5 mr-2 ${role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'HR_MANAGER' ? colorTheme.text : 'text-slate-400'}`} />
                  <span className="font-medium">
                    {dept._count.positions} Job {dept._count.positions === 1 ? 'Position' : 'Positions'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredDepartments.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-lg border border-slate-200 border-dashed">
            No departments match your search.
          </div>
        )}
      </div>

      {isModalOpen && <CreateDepartmentModal onClose={() => setIsModalOpen(false)} />}
      {selectedDept && <EditDepartmentModal department={selectedDept} role={role} onClose={() => setSelectedDept(null)} />}

      {positionsModalDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">
                Positions in {positionsModalDept.name}
              </h3>
              <button onClick={() => setPositionsModalDept(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="px-6 py-3 font-semibold">Title</th>
                    <th className="px-6 py-3 font-semibold">Base Salary</th>
                    <th className="px-6 py-3 font-semibold">Salary Range</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 text-slate-700">
                  {positionsModalDept.positions && positionsModalDept.positions.length > 0 ? (
                    positionsModalDept.positions.map((pos: any) => (
                      <tr key={pos.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">{pos.title}</td>
                        <td className="px-6 py-4 font-medium text-emerald-600">₱{pos.base_salary.toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          ₱{pos.min_salary.toLocaleString()} - ₱{pos.max_salary.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-400">No positions assigned to this department yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setPositionsModalDept(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
