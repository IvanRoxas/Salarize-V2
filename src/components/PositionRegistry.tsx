'use client';

import { useState } from 'react';
import { Plus, Briefcase, Edit2 } from 'lucide-react';
import CreatePositionModal from './CreatePositionModal';
import EditPositionModal from './EditPositionModal';

export default function PositionRegistry({ 
  initialPositions, 
  departments,
  role 
}: { 
  initialPositions: any[], 
  departments: any[],
  role: string 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState<any>(null);
  const [filterDept, setFilterDept] = useState<string>('All');

  // Group positions by department
  const filteredPositions = filterDept === 'All' 
    ? initialPositions 
    : initialPositions.filter(pos => pos.department?.id === filterDept);

  const groupedPositions = filteredPositions.reduce((acc: any, pos: any) => {
    const deptName = pos.department?.name || 'Unassigned';
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(pos);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-6">
          <h2 className="text-2xl font-bold text-slate-800">Job Positions</h2>
          
          <select 
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer bg-white"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        
        {role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-all duration-200 shadow-sm hover:shadow active:scale-95 text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Position</span>
          </button>
        )}
      </div>

      <div className="space-y-8">
        {Object.keys(groupedPositions).length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-lg border border-slate-200 border-dashed">
            No job positions found for the selected department.
          </div>
        ) : (
          Object.keys(groupedPositions).map((deptName) => (
            <div key={deptName} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-700">{deptName}</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {groupedPositions[deptName].map((pos: any) => (
                  <div key={pos.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{pos.title}</h4>
                        <div className="text-sm text-slate-500 mt-0.5 flex space-x-4">
                          <span>Base: ₱{pos.base_salary.toLocaleString()}</span>
                          <span className="text-slate-300">|</span>
                          <span>Range: ₱{pos.min_salary.toLocaleString()} - ₱{pos.max_salary.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {pos._count.employees} Active Personnel
                      </span>
                      {role === 'SUPER_ADMIN' && (
                        <button 
                          onClick={() => setSelectedPos(pos)}
                          className="text-slate-400 hover:text-violet-600 p-2 rounded hover:bg-violet-50 cursor-pointer transition-colors"
                          title="Edit Position"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && <CreatePositionModal departments={departments} onClose={() => setIsModalOpen(false)} />}
      {selectedPos && <EditPositionModal position={selectedPos} departments={departments} role={role} onClose={() => setSelectedPos(null)} />}
    </div>
  );
}
