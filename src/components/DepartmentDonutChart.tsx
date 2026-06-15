'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DepartmentDonutChart({ data }: { data: any[] }) {
  const COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#94a3b8', '#6366f1', '#ec4899'];

  // Format data for Recharts
  const chartData = data.map((d) => ({
    name: d.position,
    value: d._count.position,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">No data available.</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => [`${value} Employee${value !== 1 ? 's' : ''}`, 'Count']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
