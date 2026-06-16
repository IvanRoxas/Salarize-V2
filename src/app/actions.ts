'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ACCESS_LOG_ACTIONS } from '@/lib/auditCategories';
import { secureAction } from '@/lib/security';

const validStatuses = ['Active', 'Standby', 'Onboarding', 'Off-duty', 'Terminated'];
const validGenders = ['Male', 'Female', 'Non-binary'];

// Helper to log audit — only called from within an already-authed secureAction context
async function logAudit(
  session: any,
  action: string,
  target_employee: string | null = null,
  old_value: string | null = null,
  new_value: string | null = null
) {
  await prisma.auditLog.create({
    data: {
      admin_id: session.id as string,
      admin_name: session.username as string,
      action,
      target_employee,
      old_value,
      new_value,
    }
  });
}

// --- POSITION ACTIONS ---
// F10 fix: was unauthenticated, now wrapped with secureAction + RBAC
export async function getPositions() {
  // Read-only listing — any authenticated session may retrieve positions
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'READ', async () => {
    return prisma.position.findMany({ orderBy: { title: 'asc' } });
  });
}

export async function addPosition(formData: FormData) {
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'WRITE', async (session) => {
    const title = formData.get('title')?.toString().trim();
    const department = formData.get('department')?.toString().trim();
    const base_salaryRaw = formData.get('base_salary')?.toString();
    const min_salaryRaw = formData.get('min_salary')?.toString();
    const max_salaryRaw = formData.get('max_salary')?.toString();

    if (!title || !department || !base_salaryRaw || !min_salaryRaw || !max_salaryRaw) {
      return { success: false, message: 'All position fields are required.' };
    }

    const base_salary = parseFloat(base_salaryRaw);
    const min_salary  = parseFloat(min_salaryRaw);
    const max_salary  = parseFloat(max_salaryRaw);

    if (isNaN(base_salary) || isNaN(min_salary) || isNaN(max_salary)) {
      return { success: false, message: 'Salary values must be valid numbers.' };
    }
    if (min_salary > base_salary || base_salary > max_salary) {
      return { success: false, message: 'Salary range must satisfy: min ≤ base ≤ max.' };
    }

    const pos = await prisma.position.create({
      data: { title, department_id: department, base_salary, min_salary, max_salary }
    });
    await logAudit(session, 'CREATE_POSITION', null, null, JSON.stringify({ title: pos.title, base_salary: pos.base_salary }));
    revalidatePath('/', 'layout');
    return { success: true, message: `Position "${title}" added.` };
  });
}

export async function deletePosition(id: string) {
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'WRITE', async (session) => {
    const pos = await prisma.position.findUnique({ where: { id } });
    if (!pos) return { success: false, message: 'Position not found.' };

    await prisma.position.delete({ where: { id } });
    await logAudit(session, 'DELETE_POSITION', null, pos.title, null);
    revalidatePath('/departments');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Position deleted.' };
  });
}

// --- EMPLOYEE ACTIONS ---
export async function addEmployee(formData: FormData) {
  return secureAction('PERSONNEL_DIRECTORY', 'WRITE', async (session) => {
    const first_name  = formData.get('first_name')?.toString().trim();
    const last_name   = formData.get('last_name')?.toString().trim();
    const email       = formData.get('email')?.toString().trim();
    const gender      = formData.get('gender')?.toString();
    const position_id = formData.get('position')?.toString();
    const salaryRaw   = formData.get('actual_salary')?.toString() || formData.get('salary')?.toString();
    const status      = formData.get('status')?.toString() || 'Active';

    if (!first_name || !last_name || !email || !gender || !position_id || !salaryRaw) {
      return { success: false, message: 'All fields are required.' };
    }
    if (!validGenders.includes(gender))   return { success: false, message: 'Invalid Gender.' };
    if (!validStatuses.includes(status))  return { success: false, message: 'Invalid Status.' };

    const actual_salary = parseFloat(salaryRaw);
    if (isNaN(actual_salary) || actual_salary < 0)
      return { success: false, message: 'Salary must be a positive number.' };

    const position = await prisma.position.findUnique({ where: { id: position_id } });
    if (!position) return { success: false, message: 'Invalid position selected.' };

    if (actual_salary < position.min_salary || actual_salary > position.max_salary) {
      return {
        success: false,
        message: `Salary must be between ₱${position.min_salary} and ₱${position.max_salary} for this position.`
      };
    }

    const emp = await prisma.employee.create({
      data: { first_name, last_name, email, gender, position_id, actual_salary, status }
    });

    await logAudit(
      session, 'CREATE_EMPLOYEE',
      `${emp.first_name} ${emp.last_name}`,
      null,
      JSON.stringify({ email: emp.email, position: position.title, actual_salary: emp.actual_salary })
    );

    revalidatePath('/', 'layout');
    return { success: true, message: 'Employee added successfully!' };
  });
}

export async function deleteEmployee(id: string) {
  // F10 fix: was only blocking AUDITOR. Now uses PERSONNEL_DIRECTORY WRITE which
  // correctly allows: SUPER_ADMIN, HR_MANAGER. Blocks: ADMIN, AUDITOR.
  return secureAction('PERSONNEL_DIRECTORY', 'WRITE', async (session) => {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) return { success: false, message: 'Employee not found.' };

    await prisma.employee.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'Terminated' }
    });

    await logAudit(session, 'ARCHIVE_EMPLOYEE', `${emp.first_name} ${emp.last_name}`, emp.status, 'Terminated');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Employee terminated.' };
  });
}

export async function updateSalaryOrStatus(id: string, formData: FormData) {
  // F10 fix: was only blocking AUDITOR. Now uses PAYROLL_OPERATIONS WRITE which
  // correctly allows: HR_MANAGER. Blocks: ADMIN, AUDITOR, SUPER_ADMIN (READ only).
  return secureAction('PAYROLL_OPERATIONS', 'WRITE', async (session) => {
    const salaryRaw = formData.get('actual_salary')?.toString() || formData.get('salary')?.toString();
    const status    = formData.get('status')?.toString();
    const dataToUpdate: Record<string, any> = {};

    const emp = await prisma.employee.findUnique({ where: { id }, include: { position: true } });
    if (!emp) return { success: false, message: 'Employee not found.' };

    if (salaryRaw) {
      const actual_salary = parseFloat(salaryRaw);
      if (isNaN(actual_salary) || actual_salary < 0)
        return { success: false, message: 'Salary must be a valid positive number.' };
      if (actual_salary < emp.position.min_salary || actual_salary > emp.position.max_salary) {
        return {
          success: false,
          message: `Salary must be between ₱${emp.position.min_salary} and ₱${emp.position.max_salary} for this position.`
        };
      }
      dataToUpdate.actual_salary = actual_salary;
    }

    if (status) {
      if (!validStatuses.includes(status)) return { success: false, message: 'Invalid Status.' };
      dataToUpdate.status = status;
    }

    if (Object.keys(dataToUpdate).length === 0)
      return { success: false, message: 'No data provided.' };

    await prisma.employee.update({ where: { id }, data: dataToUpdate });

    await logAudit(
      session, 'UPDATE_EMPLOYEE',
      `${emp.first_name} ${emp.last_name}`,
      JSON.stringify({ actual_salary: emp.actual_salary, status: emp.status }),
      JSON.stringify(dataToUpdate)
    );

    revalidatePath('/', 'layout');
    return { success: true, message: 'Record updated successfully!' };
  });
}

// --- REPORT DATA ---
// F2 fix: was unauthenticated. Now requires PAYROLL_OPERATIONS READ.
// Allows: SUPER_ADMIN, HR_MANAGER, AUDITOR. Blocks: ADMIN.
export async function getReportData() {
  return secureAction('PAYROLL_OPERATIONS', 'READ', async () => {
    const employees = await prisma.employee.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' }
    });
    const totalPayroll = employees.reduce((sum, emp) => sum + emp.actual_salary, 0);
    return { success: true, employees, summary: { totalEmployees: employees.length, totalPayroll } };
  });
}

// F2 fix: was unauthenticated. Same RBAC as getReportData.
export async function getPayrollBreakdown() {
  return secureAction('PAYROLL_OPERATIONS', 'READ', async () => {
    const data = await prisma.employee.groupBy({
      by: ['position_id'],
      where: { deleted_at: null },
      _sum: { actual_salary: true },
      _count: { position_id: true },
    });
    return { success: true, data };
  });
}

// --- AUDIT ACTIONS ---
export async function acknowledgeAlertsAction() {
  // AUDITOR-only: secureAction with ARCHIVES WRITE covers this correctly
  return secureAction('ARCHIVES', 'WRITE', async (session) => {
    await prisma.auditLog.create({
      data: {
        admin_id:        session.id as string,
        admin_name:      session.username as string,
        action:          'ACKNOWLEDGE_ALERTS',
        target_employee: 'System Alert Reset',
        old_value:       'null',
        new_value:       'Acknowledged',
      }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  });
}

// F8 fix: Bulk archive now requires the caller to confirm the exact count of records
// they intend to archive. If the count doesn't match the live unarchived count, the
// action is rejected — preventing accidental or malicious mass-archiving.
export async function archiveAllHistoryAction(expectedCount: number) {
  return secureAction('ARCHIVES', 'WRITE', async (session) => {
    // Count unarchived operational logs before proceeding
    const activeCount = await prisma.auditLog.count({ 
      where: { 
        is_archived: false,
        action: { notIn: [...ACCESS_LOG_ACTIONS] }
      } 
    });

    if (activeCount !== expectedCount) {
      return {
        success: false,
        message: `Count mismatch: expected ${expectedCount} records but found ${activeCount}. Refresh and confirm again.`
      };
    }

    if (activeCount === 0) {
      return { success: false, message: 'No active logs to archive.' };
    }

    await prisma.auditLog.updateMany({
      where: { 
        is_archived: false,
        action: { notIn: [...ACCESS_LOG_ACTIONS] }
      },
      data: { is_archived: true },
    });

    // The archiving action itself is logged and NOT archived (is_archived: false)
    await prisma.auditLog.create({
      data: {
        admin_id:        session.id as string,
        admin_name:      session.username as string,
        action:          'ARCHIVE_HISTORY',
        target_employee: 'System Logs',
        old_value:       `${activeCount} active records`,
        new_value:       'Archived',
        is_archived:     false,
      }
    });

    revalidatePath('/', 'layout');
    return { success: true, message: `${activeCount} records archived successfully.` };
  });
}
