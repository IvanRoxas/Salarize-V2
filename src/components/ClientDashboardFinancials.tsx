'use client';

import { useState } from 'react';

export default function ClientDashboardFinancials({ totalOverhead }: { totalOverhead: number }) {
  const [revenueRaw, setRevenueRaw] = useState<string>('5000000');
  
  const revenue = parseFloat(revenueRaw) || 0;
  const margin = revenue > 0 ? ((revenue - totalOverhead) / revenue) * 100 : 0;
  const isProfitable = margin > 0;

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
        <p className="text-slate-500 font-medium text-sm mb-4">Total Payroll Overhead</p>
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold text-slate-800">
            ₱{totalOverhead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full">
        <p className="text-slate-500 font-medium text-sm mb-4">Mock Gross Revenue</p>
        <div className="relative">
          <span className="absolute left-4 top-3 text-slate-400 font-bold">₱</span>
          <input 
            type="number" 
            value={revenueRaw}
            onChange={(e) => setRevenueRaw(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-3 text-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-emerald-custom)] transition"
          />
        </div>
      </div>

      <div className={`bg-white p-6 rounded-xl shadow-sm border h-full ${isProfitable ? 'border-t-4 border-t-emerald-500' : 'border-t-4 border-t-red-500'}`}>
        <p className="text-slate-500 font-medium text-sm mb-4">Net Profit Margin</p>
        <div className="flex items-baseline space-x-2">
          <span className={`text-4xl font-bold ${isProfitable ? 'text-emerald-500' : 'text-red-500'}`}>
            {margin.toFixed(2)}%
          </span>
        </div>
      </div>
    </>
  );
}
