'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { checkAccess } from '@/lib/security';

export async function generatePayrollReport() {
  const session = await getSession();

  // Strict RBAC Verification via Security Matrix
  if (!session || !checkAccess(session.role as string, 'PAYROLL_OPERATIONS', 'READ')) {
    return { success: false, message: '403 Forbidden: Insufficient privileges to export payroll.' };
  }

  try {
    const activeEmployees = await prisma.employee.findMany({
      where: { 
        status: 'Active',
        deleted_at: null 
      },
      include: { position: true },
      orderBy: { last_name: 'asc' }
    });

    if (activeEmployees.length === 0) {
      return { success: false, message: 'No active personnel found to export.' };
    }

    // Generate CSV Structure
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

    // Security Audit Hook
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
  } catch (error) {
    console.error('Export Error:', error);
    return { success: false, message: 'Failed to generate payroll report due to an internal error.' };
  }
}

export async function generateDepartmentalPdfData() {
  const session = await getSession();

  if (!session || !checkAccess(session.role as string, 'PAYROLL_OPERATIONS', 'READ')) {
    return { success: false, message: '403 Forbidden: Insufficient privileges.' };
  }

  try {
    const activeEmployees = await prisma.employee.findMany({
      where: { status: 'Active', deleted_at: null },
      include: { position: { include: { department: true } } },
      orderBy: { last_name: 'asc' }
    });

    if (activeEmployees.length === 0) {
      return { success: false, message: 'No active personnel found to export.' };
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
  } catch (error) {
    console.error('Export Error:', error);
    return { success: false, message: 'Failed to generate payroll report.' };
  }
}
