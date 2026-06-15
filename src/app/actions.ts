'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from './actions/auth';

const validStatuses = ['Active', 'Standby', 'Onboarding', 'Off-duty', 'Terminated'];
const validGenders = ['Male', 'Female', 'Non-binary'];

// Helper to log audit
async function logAudit(action: string, target_employee: string | null = null, old_value: string | null = null, new_value: string | null = null) {
  const session = await getSession();
  if (session) {
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
}

// --- POSITION ACTIONS ---
export async function getPositions() {
  return await prisma.position.findMany({ orderBy: { title: 'asc' } });
}

export async function addPosition(formData: FormData) {
  const title = formData.get('title')?.toString().trim();
  const department = formData.get('department')?.toString().trim();
  const base_salaryRaw = formData.get('base_salary')?.toString();
  const min_salaryRaw = formData.get('min_salary')?.toString();
  const max_salaryRaw = formData.get('max_salary')?.toString();

  if (!title || !department || !base_salaryRaw || !min_salaryRaw || !max_salaryRaw) {
    return { success: false, message: "All position fields are required." };
  }

  const base_salary = parseFloat(base_salaryRaw);
  const min_salary = parseFloat(min_salaryRaw);
  const max_salary = parseFloat(max_salaryRaw);

  try {
    const pos = await prisma.position.create({ 
      data: { title, department_id: department, base_salary, min_salary, max_salary } 
    });
    await logAudit("CREATE_POSITION", null, null, JSON.stringify({ title: pos.title, base_salary: pos.base_salary }));
    revalidatePath('/', 'layout');
    return { success: true, message: `Position "${title}" added.` };
  } catch (e: any) {
    if (e.code === 'P2002') return { success: false, message: "This position already exists." };
    return { success: false, message: "Failed to add position." };
  }
}

export async function deletePosition(id: string) {
  try {
    const pos = await prisma.position.findUnique({ where: { id } });
    await prisma.position.delete({ where: { id } });
    if (pos) {
      await logAudit("DELETE_POSITION", null, pos.title, null);
    }
    revalidatePath('/departments');
    revalidatePath('/manage-employees');
    revalidatePath('/', 'layout');
    return { success: true, message: "Position deleted." };
  } catch {
    return { success: false, message: "Cannot delete: position may be in use." };
  }
}

// --- EMPLOYEE ACTIONS ---
export async function addEmployee(formData: FormData) {
  try {
    const first_name = formData.get('first_name')?.toString().trim();
    const last_name = formData.get('last_name')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const gender = formData.get('gender')?.toString();
    const position_id = formData.get('position')?.toString();
    const salaryRaw = formData.get('actual_salary')?.toString() || formData.get('salary')?.toString();
    const status = formData.get('status')?.toString() || 'Active';

    if (!first_name || !last_name || !email || !gender || !position_id || !salaryRaw) {
      return { success: false, message: "All fields are required." };
    }
    if (!validGenders.includes(gender)) return { success: false, message: "Invalid Gender." };
    if (!validStatuses.includes(status)) return { success: false, message: "Invalid Status." };

    const actual_salary = parseFloat(salaryRaw);
    if (isNaN(actual_salary) || actual_salary < 0) return { success: false, message: "Salary must be a positive number." };

    // Validate position exists in DB
    const position = await prisma.position.findUnique({ where: { id: position_id } });
    if (!position) return { success: false, message: "Invalid position selected." };

    // Pay Grade Validation
    if (actual_salary < position.min_salary || actual_salary > position.max_salary) {
      return { success: false, message: `Salary must be strictly between ₱${position.min_salary} and ₱${position.max_salary} for this position.` };
    }

    const emp = await prisma.employee.create({ 
      data: { first_name, last_name, email, gender, position_id, actual_salary, status } 
    });

    await logAudit("CREATE_EMPLOYEE", `${emp.first_name} ${emp.last_name}`, null, JSON.stringify({ email: emp.email, position: position.title, actual_salary: emp.actual_salary }));

    revalidatePath('/', 'layout');
    return { success: true, message: "Employee added successfully!" };
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, message: "An employee with this email already exists." };
    return { success: false, message: "Failed to add employee." };
  }
}

export async function deleteEmployee(id: string) {
  const session = await getSession();
  if (session?.role === 'AUDITOR') {
    await prisma.auditLog.create({
      data: {
        admin_id: session.id as string,
        admin_name: session.username as string,
        action: '403_FORBIDDEN',
        target_employee: `Employee ID: ${id}`,
        old_value: 'Attempted ARCHIVE',
        new_value: 'BLOCKED',
      },
    });
    throw new Error('403 Forbidden');
  }
  try {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) return { success: false, message: "Employee not found." };

    await prisma.employee.update({ 
      where: { id }, 
      data: { deleted_at: new Date(), status: 'Terminated' } 
    });

    await logAudit("ARCHIVE_EMPLOYEE", `${emp.first_name} ${emp.last_name}`, emp.status, "Terminated");

    revalidatePath('/', 'layout');
    return { success: true, message: "Employee terminated." };
  } catch {
    return { success: false, message: "Failed to terminate employee." };
  }
}

export async function updateSalaryOrStatus(id: string, formData: FormData) {
  const session = await getSession();
  if (session?.role === 'AUDITOR') {
    await prisma.auditLog.create({
      data: {
        admin_id: session.id as string,
        admin_name: session.username as string,
        action: '403_FORBIDDEN',
        target_employee: `Employee ID: ${id}`,
        old_value: 'Attempted UPDATE_SALARY/STATUS',
        new_value: 'BLOCKED',
      },
    });
    throw new Error('403 Forbidden');
  }
  try {
    const salaryRaw = formData.get('actual_salary')?.toString() || formData.get('salary')?.toString();
    const status = formData.get('status')?.toString();
    const dataToUpdate: any = {};

    const emp = await prisma.employee.findUnique({ where: { id }, include: { position: true } });
    if (!emp) return { success: false, message: "Employee not found." };

    if (salaryRaw) {
      const actual_salary = parseFloat(salaryRaw);
      if (isNaN(actual_salary) || actual_salary < 0) return { success: false, message: "Salary must be a valid positive number." };
      
      // Pay Grade Validation
      if (actual_salary < emp.position.min_salary || actual_salary > emp.position.max_salary) {
        return { success: false, message: `Salary must be strictly between ₱${emp.position.min_salary} and ₱${emp.position.max_salary} for this position.` };
      }
      dataToUpdate.actual_salary = actual_salary;
    }
    if (status) {
      if (!validStatuses.includes(status)) return { success: false, message: "Invalid Status." };
      dataToUpdate.status = status;
    }
    if (Object.keys(dataToUpdate).length === 0) return { success: false, message: "No data provided." };

    await prisma.employee.update({ where: { id }, data: dataToUpdate });

    await logAudit("UPDATE_EMPLOYEE", `${emp.first_name} ${emp.last_name}`, JSON.stringify({ actual_salary: emp.actual_salary, status: emp.status }), JSON.stringify(dataToUpdate));

    revalidatePath('/', 'layout');
    return { success: true, message: "Record updated successfully!" };
  } catch {
    return { success: false, message: "Failed to update record." };
  }
}

// --- REPORT DATA ---
export async function getReportData() {
  try {
    const employees = await prisma.employee.findMany({ 
      where: { deleted_at: null }, 
      orderBy: { created_at: 'desc' } 
    });
    const totalEmployees = employees.length;
    const totalPayroll = employees.reduce((sum, emp) => sum + emp.actual_salary, 0);
    return { success: true, employees, summary: { totalEmployees, totalPayroll } };
  } catch {
    return { success: false, message: "Failed to fetch report data." };
  }
}

// --- PAYROLL BREAKDOWN ---
export async function getPayrollBreakdown() {
  try {
    // Only aggregate active, non-deleted employees
    const data = await prisma.employee.groupBy({
      by: ['position_id'],
      where: { deleted_at: null },
      _sum: { actual_salary: true },
      _count: { position_id: true },
    });
    return { success: true, data };
  } catch {
    return { success: false, message: "Failed to fetch breakdown." };
  }
}

// --- AUDIT ACTIONS ---
export async function acknowledgeAlertsAction() {
  const session = await getSession();
  if (session?.role !== 'AUDITOR') {
    throw new Error('403 Forbidden: Only Auditors can acknowledge alerts.');
  }
  
  await prisma.auditLog.create({
    data: {
      admin_id: session.id as string,
      admin_name: session.username as string,
      action: 'ACKNOWLEDGE_ALERTS',
      target_employee: 'System Alert Reset',
      old_value: 'null',
      new_value: 'Acknowledged',
    }
  });
  
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function archiveAllHistoryAction() {
  const session = await getSession();
  if (session?.role !== 'AUDITOR') {
    throw new Error('403 Forbidden: Insufficient privileges to archive history. Only the Auditor is permitted to archive system logs.');
  }

  try {
    await prisma.auditLog.updateMany({
      where: { is_archived: false },
      data: { is_archived: true },
    });
    
    // Create an audit log for the archiving action itself
    await prisma.auditLog.create({
      data: {
        admin_id: session.id as string,
        admin_name: session.username as string,
        action: 'ARCHIVE_HISTORY',
        target_employee: 'System Logs',
        old_value: 'Active',
        new_value: 'Archived',
        is_archived: false, // The new log itself remains active
      }
    });

    revalidatePath('/', 'layout');
    return { success: true, message: 'All active history has been archived.' };
  } catch (error) {
    console.error('Archive History Error:', error);
    return { success: false, message: 'Failed to archive history.' };
  }
}
