'use server';

import prisma from '@/lib/prisma';
import { secureAction } from '@/lib/security';

export async function generatePayrollReport() {
  return secureAction('PAYROLL_OPERATIONS', 'READ', async (session) => {
    const activeEmployees = await prisma.employee.findMany({
      where: { 
        status: 'Active',
        deleted_at: null 
      },
      include: { position: true },
      orderBy: { last_name: 'asc' }
    });

    if (activeEmployees.length === 0) {
      return { success: false, message: 'Validation Error: No active personnel found to export.' };
    }

    const headers = ['First Name', 'Last Name', 'Position', 'Actual Salary (PHP)'];
    const rows = activeEmployees.map(emp => [
      `"${emp.first_name}"`,
      `"${emp.last_name}"`,
      `"${emp.position?.title || 'Unassigned'}"`,
      emp.actual_salary
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'EXPORT PAYROLL DATA',
        target_employee: 'ALL ACTIVE',
        old_value: 'N/A',
        new_value: `${session.username} exported payroll data for ${new Date().toLocaleDateString()}`
      }
    });

    return { success: true, csv: csvContent };
  });
}

export async function generateDepartmentalPdfData() {
  return secureAction('PAYROLL_OPERATIONS', 'READ', async (session) => {
    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'Active', deleted_at: null },
      include: { position: { include: { department: true } } },
      orderBy: { last_name: 'asc' }
    });

    if (activeEmployees.length === 0) {
      return { success: false, message: 'Validation Error: No active personnel found to export.' };
    }

    const grouped: Record<string, any[]> = {};
    activeEmployees.forEach(emp => {
      const deptName = emp.position?.department?.name || 'Unassigned';
      if (!grouped[deptName]) grouped[deptName] = [];
      grouped[deptName].push(emp);
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'EXPORT PDF REPORT',
        target_employee: 'ALL ACTIVE',
        old_value: 'N/A',
        new_value: `${session.username} generated PDF Payroll Report for ${new Date().toLocaleDateString()}`
      }
    });

    return { success: true, data: grouped };
  });
}
