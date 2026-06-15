'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { HexColorMap } from '@/lib/theme';

interface Position {
  id: string;
  title: string;
  department?: { id: string, name: string, color?: string | null } | null;
}

interface DepartmentCount {
  position_id: string;
  _count: { id: number };
}

interface DashboardChartsProps {
  departmentCounts: DepartmentCount[];
  positions: Position[];
}

const COLORS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export default function DashboardCharts({ departmentCounts, positions }: DashboardChartsProps) {
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // Process Department Data
  const departmentData = useMemo(() => {
    const map = new Map<string, { value: number, color: string }>();
    departmentCounts.forEach((dc) => {
      const pos = positions.find(p => p.id === dc.position_id);
      const deptName = pos?.department?.name || 'Unassigned';
      const colorName = pos?.department?.color || 'slate';
      
      const current = map.get(deptName) || { value: 0, color: colorName };
      current.value += dc._count.id;
      map.set(deptName, current);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, value: data.value, color: data.color }))
      .sort((a, b) => b.value - a.value);
  }, [departmentCounts, positions]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(departmentData.map(d => d.name)));
  }, [departmentData]);

  // Set default selected department on mount
  if (selectedDept === 'All' && uniqueDepartments.length > 0 && uniqueDepartments[0] !== 'Unassigned') {
    // Select the first valid department by default, or fallback
    const firstValid = uniqueDepartments.find(d => d !== 'Unassigned') || uniqueDepartments[0];
    if (selectedDept !== firstValid) {
      setSelectedDept(firstValid);
    }
  }

  // Process Position Data based on Selected Department
  const positionData = useMemo(() => {
    const map = new Map<string, { value: number, color: string }>();
    departmentCounts.forEach((dc) => {
      const pos = positions.find(p => p.id === dc.position_id);
      const deptName = pos?.department?.name || 'Unassigned';
      if (selectedDept === 'All' || deptName === selectedDept) {
        const title = pos?.title || 'Unknown Position';
        const colorName = pos?.department?.color || 'slate';
        const current = map.get(title) || { value: 0, color: colorName };
        current.value += dc._count.id;
        map.set(title, current);
      }
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, value: data.value, color: data.color }))
      .sort((a, b) => b.value - a.value);
  }, [departmentCounts, positions, selectedDept]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Department Distribution Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-96">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Department Distribution</h3>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Position Distribution Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-96">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-lg font-bold text-slate-800">Job Positions</h3>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="border-2 border-violet-100 bg-violet-50 text-violet-800 font-semibold text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none cursor-pointer transition-colors"
          >
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 w-full relative">
          {positionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {positionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 font-medium">
              No positions assigned in this department.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
