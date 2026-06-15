'use client';
import { Download } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { generatePayrollReport } from '@/app/actions/report';

export default function PayrollExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const result = await generatePayrollReport();
    if (result.success && result.csv) {
      // Failsafe Browser Download Logic
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Payroll_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Payroll data exported successfully');
    } else {
      toast.error(result.message || 'Failed to export payroll data');
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className="flex items-center justify-center gap-2 border-2 border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <Download className="w-4 h-4" />
      {loading ? 'Exporting...' : 'Generate Payroll Report'}
    </button>
  );
}
