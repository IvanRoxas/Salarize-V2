'use client';

import { useState } from 'react';
import { getPayrollBreakdown } from '@/app/actions';
import { X } from 'lucide-react';

export default function PayrollBreakdownButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    setIsLoading(true);
    const result = await getPayrollBreakdown();
    if (result.success && result.data) setData(result.data);
    setIsLoading(false);
    setIsOpen(true);
  };

  const total = data.reduce((s, d) => s + (d._sum.salary || 0), 0);

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-xs text-[var(--color-teal-custom)] font-medium hover:underline transition"
      >
        {isLoading ? 'Loading...' : 'View Breakdown →'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative z-[9999]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Payroll by Department</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {data.map((d, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-slate-800">{d.position}</p>
                    <p className="text-xs text-slate-500">{d._count.position} employees</p>
                  </div>
                  <p className="font-bold text-sm text-slate-800">
                    ₱ {(d._sum.salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between">
              <span className="font-bold text-slate-700">Total Payroll</span>
              <span className="font-bold text-slate-800">
                ₱ {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
