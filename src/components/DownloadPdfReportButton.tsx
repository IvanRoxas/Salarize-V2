'use client';
import { useState } from 'react';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateDepartmentalPdfData } from '@/app/actions/report';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DownloadPdfReportButton() {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const result = await generateDepartmentalPdfData();
    
    if (result.success && result.data) {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("Salarize Payroll Report", 14, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 28);
      
      let currentY = 40;

      Object.entries(result.data).forEach(([deptName, employees]) => {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(deptName, 14, currentY);
        currentY += 6;

        const tableData = employees.map((emp: any) => [
          `${emp.first_name} ${emp.last_name}`,
          emp.position?.title || 'N/A',
          `PHP ${emp.actual_salary.toLocaleString()}`
        ]);

        const totalSalary = employees.reduce((sum: number, emp: any) => sum + emp.actual_salary, 0);
        tableData.push(['', 'Total Liability', `PHP ${totalSalary.toLocaleString()}`]);

        autoTable(doc, {
          startY: currentY,
          head: [['Name', 'Position', 'Salary']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [109, 40, 217] }, // Violet-700
          didDrawPage: (data) => {
            currentY = data.cursor ? data.cursor.y + 15 : currentY;
          }
        });
      });

      doc.save(`Departmental_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF generated successfully");
    } else {
      toast.error(result.message || "Failed to generate PDF");
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      <FileText className="w-4 h-4" />
      {loading ? 'Generating PDF...' : 'Download PDF Report'}
    </button>
  );
}
