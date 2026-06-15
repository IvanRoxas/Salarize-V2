'use client';

import { useState } from 'react';
import { Plus, Briefcase, Edit2, Search, User, Users, Shield, Calculator, Code, Monitor, Wrench, Headphones, Truck, Lightbulb, PenTool } from 'lucide-react';
import CreatePositionModal from './CreatePositionModal';
import EditPositionModal from './EditPositionModal';

const IconMap: Record<string, any> = {
  User, Users, Shield, Briefcase, Calculator, Code, Monitor, Wrench, Headphones, Truck, Lightbulb, PenTool
};

const ColorMap: Record<string, { bg: string, text: string }> = {
  violet: { text: 'text-violet-600', bg: 'bg-violet-100' },
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-100' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-100' },
  rose: { text: 'text-rose-600', bg: 'bg-rose-100' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-100' },
  slate: { text: 'text-slate-600', bg: 'bg-slate-100' },
};

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
  const [searchQuery, setSearchQuery] = useState('');

  // Filter positions by department and search query
  const filteredPositions = initialPositions.filter(pos => {
    const matchesDept = filterDept === 'All' || pos.department?.id === filterDept;
    const matchesSearch = pos.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const groupedPositions = filteredPositions.reduce((acc: any, pos: any) => {
    const deptName = pos.department?.name || 'Unassigned';
    if (!acc[deptName]) acc[deptName] = [];
    acc[deptName].push(pos);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 mb-6 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-2xl font-bold text-slate-800 shrink-0 sm:mr-4">Job Positions</h2>
          <select 
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer bg-white shrink-0 w-full sm:w-auto"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-48 shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search positions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-shadow"
            />
          </div>
          {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-violet-700 transition-all duration-200 shadow-sm hover:shadow active:scale-95 text-sm cursor-pointer whitespace-nowrap w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Position</span>
            </button>
          )}
        </div>
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
                {groupedPositions[deptName].map((pos: any) => {
                  const PosIcon = IconMap[pos.icon || 'Briefcase'] || Briefcase;
                  const colorTheme = ColorMap[pos.department?.color || 'violet'] || ColorMap.violet;
                  return (
                    <div key={pos.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorTheme.bg} ${colorTheme.text}`}>
                          <PosIcon className="w-5 h-5" />
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
                      {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
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
                  );
                })}
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
