"use client";

import { useState, useRef } from 'react';
import { getReportData } from '@/app/actions';
import { flushSync } from 'react-dom';

export default function GenerateReportButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      const response = await getReportData();
      if (response.success && response.employees) {
        
        // Force synchronous render of the hidden report data
        flushSync(() => {
          setReportData(response);
        });

        // Dynamically import html2pdf
        const html2pdf = (await import('html2pdf.js')).default;

        if (reportRef.current) {
          const opt = {
            margin:       0.5,
            filename:     'salarize_corporate_report.pdf',
            image:        { type: 'jpeg' as const, quality: 0.98 },
            html2canvas:  { 
              scale: 2,
              onclone: (clonedDoc: Document) => {
                // Remove all stylesheets in the clone to prevent html2canvas from crashing on Tailwind v4's OKLCH/LAB colors
                const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
                styles.forEach(s => s.remove());
              }
            },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
          };

          await html2pdf().set(opt).from(reportRef.current).save();
        }

        // Cleanup
        setReportData(null);
      } else {
        alert(response.message || 'Failed to fetch report data.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while generating the PDF report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleDownload}
        disabled={isGenerating}
        className={`bg-[var(--color-emerald-custom)] text-white px-6 py-2.5 text-base rounded-lg font-medium shadow-sm transition ${isGenerating ? 'opacity-75 cursor-not-allowed' : 'hover:bg-emerald-600'}`}
      >
        {isGenerating ? 'Generating PDF...' : 'Generate Report'}
      </button>

      {/* Hidden Print Layout */}
      {reportData && (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
          <div ref={reportRef} style={{ width: '800px', padding: '40px', backgroundColor: '#ffffff', color: '#1e293b', fontFamily: 'sans-serif' }}>
            <div style={{ borderBottom: '2px solid #1e293b', paddingBottom: '16px', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Salarize Administrative Systems</h1>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', marginBottom: 0 }}>
                Official Corporate Departments and Payroll Report — Generated on {new Date().toLocaleString()}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '48px', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <div>
                <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Total Headcount</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{reportData.summary.totalEmployees}</p>
              </div>
              <div>
                <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Total Monthly Payroll</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                  ₱ {reportData.summary.totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Employee Name</th>
                  <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Position</th>
                  <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '12px 8px', fontWeight: 'bold', textAlign: 'right' }}>Base Salary</th>
                </tr>
              </thead>
              <tbody>
                {reportData.employees.map((emp: any, idx: number) => (
                  <tr key={emp.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #e2e8f0' }}>
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #e2e8f0' }}>{emp.position}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #e2e8f0' }}>{emp.status}</td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '500' }}>
                      ₱ {emp.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
              Confidential Document. For internal administrative use only.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
