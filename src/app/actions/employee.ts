'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';

export async function createEmployeeAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { success: false, message: 'Unauthorized. No active session.' };
  }

  // RBAC BLOCK: Only HR Manager can create personnel records
  if (session.role === 'AUDITOR' || session.role === 'SUPER_ADMIN') {
    if (session.role === 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized: System Architect role cannot perform payroll operations.' };
    }
    return { success: false, message: '403 Forbidden: Only HR Managers can create personnel records.' };
  }

  const first_name = formData.get('first_name') as string;
  const last_name = formData.get('last_name') as string;
  const email = formData.get('email') as string;
  const contact = formData.get('contact') as string;
  const position_id = formData.get('position_id') as string;
  const status = formData.get('status') as string;
  const gender = formData.get('gender') as string || 'Not Specified';
  let actual_salary = formData.get('actual_salary') ? Number(formData.get('actual_salary')) : undefined;

  try {
    const position = await prisma.position.findUnique({ where: { id: position_id } });
    if (!position) {
      return { success: false, message: 'Position not found.' };
    }

    if (session.role === 'HR_MANAGER') {
      actual_salary = position.base_salary;
    } else if (actual_salary !== undefined) {
      if (actual_salary < position.min_salary || actual_salary > position.max_salary) {
        return { 
          success: false, 
          message: `Validation Error: Salary must be strictly between ₱${position.min_salary.toLocaleString()} and ₱${position.max_salary.toLocaleString()}.` 
        };
      }
    }

    const newEmployee = await prisma.employee.create({
      data: {
        first_name,
        last_name,
        email,
        gender,
        status,
        position_id,
        actual_salary: actual_salary || position.base_salary,
      },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'CREATE EMPLOYEE',
        target_employee: `${newEmployee.first_name} ${newEmployee.last_name}`,
        old_value: 'NULL',
        new_value: JSON.stringify(newEmployee),
      },
    });

    revalidatePath('/', 'layout');
    return { success: true, message: 'Employee registered securely.' };

  } catch (error: any) {
    console.error('Create Error:', error);
    return { success: false, message: 'Failed to register employee.' };
  }
}

export async function updateEmployeeAction(formData: FormData) {
  const session = await getSession();

  if (!session) {
    return { success: false, message: 'Unauthorized. No active session.' };
  }

  // RBAC BLOCK: Only HR Manager can update personnel records
  if (session.role === 'AUDITOR' || session.role === 'SUPER_ADMIN') {
    if (session.role === 'SUPER_ADMIN') {
      return { success: false, message: 'Unauthorized: System Architect role cannot perform payroll operations.' };
    }
    return { success: false, message: '403 Forbidden: Only HR Managers can modify personnel records.' };
  }

  const id = formData.get('id') as string;
  const first_name = formData.get('first_name') as string;
  const last_name = formData.get('last_name') as string;
  const email = formData.get('email') as string;
  const gender = formData.get('gender') as string;
  const status = formData.get('status') as string;
  const position_id = formData.get('position_id') as string;
  let actual_salary = formData.get('actual_salary') ? Number(formData.get('actual_salary')) : undefined;

  try {
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { position: true },
    });

    if (!existingEmployee) {
      return { success: false, message: 'Employee not found.' };
    }

    const position = await prisma.position.findUnique({ where: { id: position_id } });
    if (!position) {
      return { success: false, message: 'Position not found.' };
    }

    // HR SALARY BLOCK: HR Manager is fully authorized to update salaries
    // BOUNDARY VALIDATION for HR Manager
    if (actual_salary !== undefined) {
      if (actual_salary < position.min_salary || actual_salary > position.max_salary) {
        return { 
          success: false, 
          message: `Validation Error: Salary must be strictly between ₱${position.min_salary.toLocaleString()} and ₱${position.max_salary.toLocaleString()}.` 
        };
      }
    }

    // Capture old values for Audit Log
    const oldValues = {
      first_name: existingEmployee.first_name,
      last_name: existingEmployee.last_name,
      email: existingEmployee.email,
      gender: existingEmployee.gender,
      status: existingEmployee.status,
      position_id: existingEmployee.position_id,
      actual_salary: existingEmployee.actual_salary,
    };

    // Construct new values payload
    const newValues: any = {
      first_name,
      last_name,
      email,
      gender,
      status,
      position_id,
    };

    if (actual_salary !== undefined) {
      newValues.actual_salary = actual_salary;
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: newValues,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'UPDATE EMPLOYEE',
        target_employee: `${updatedEmployee.first_name} ${updatedEmployee.last_name}`,
        old_value: JSON.stringify(oldValues),
        new_value: JSON.stringify(newValues),
      },
    });

    revalidatePath('/', 'layout');
    return { success: true, message: 'Employee updated securely.' };

  } catch (error: any) {
    console.error('Update Error:', error);
    return { success: false, message: 'Failed to update employee.' };
  }
}

export async function terminateEmployeeAction(id: string) {
  const session = await getSession();

  if (!session) {
    return { success: false, message: 'Unauthorized.' };
  }

  // RBAC BLOCK: Only HR_MANAGER can terminate personnel
  if (session.role !== 'HR_MANAGER') {
    return { success: false, message: '403 Forbidden: Insufficient privileges. Only HR Managers can terminate personnel.' };
  }

  try {
    const existingEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!existingEmployee) return { success: false, message: 'Employee not found.' };

    const oldValues = { status: existingEmployee.status, deleted_at: existingEmployee.deleted_at };
    const deletedAt = new Date();
    const newValues = { status: 'Off-duty', deleted_at: deletedAt };

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: newValues,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'DELETE EMPLOYEE',
        target_employee: `${updatedEmployee.first_name} ${updatedEmployee.last_name}`,
        old_value: JSON.stringify(oldValues),
        new_value: JSON.stringify(newValues),
      },
    });

    revalidatePath('/', 'layout');
    return { success: true, message: 'Employee terminated and archived securely.' };
  } catch (error: any) {
    console.error('Terminate Error:', error);
    return { success: false, message: 'Failed to terminate employee.' };
  }
}

export async function updateSalaryAction(employeeId: string, newSalary: number) {
  const session = await getSession();

  if (!session || session.role !== 'HR_MANAGER') {
    return { success: false, message: 'Unauthorized: Only HR Managers can perform salary operations.' };
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { position: true }
    });

    if (!employee || !employee.position) {
      return { success: false, message: 'Employee or assigned position not found.' };
    }

    const position = employee.position;

    if (newSalary < position.min_salary || newSalary > position.max_salary) {
      throw new Error("Salary is outside authorized pay grade boundaries.");
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { actual_salary: newSalary }
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'UPDATE SALARY',
        target_employee: `${employee.first_name} ${employee.last_name}`,
        old_value: JSON.stringify({ actual_salary: employee.actual_salary }),
        new_value: JSON.stringify({ actual_salary: newSalary }),
      }
    });

    revalidatePath('/', 'layout');
    return { success: true, message: 'Salary updated successfully.' };
  } catch (error: any) {
    console.error('Update Salary Error:', error);
    return { success: false, message: error.message || 'Failed to update salary.' };
  }
}
