'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899'];

export default function HRDepartmentChart({ data }: { data: { name: string, value: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-slate-400 h-[300px] flex items-center justify-center">No department data available.</div>;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any, name: any) => [`${value} Employees`, name]}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
