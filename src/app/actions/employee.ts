'use server';

import prisma from '@/lib/prisma';
import { secureAction, checkAccess } from '@/lib/security';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const employeeSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters."),
  last_name: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Invalid email format."),
  contact: z.string().optional().default(''),
  position_id: z.string().min(1, "Position ID is required."),
  status: z.string().min(1, "Status is required."),
  gender: z.string().optional().default('Not Specified'),
  actual_salary: z.coerce.number().optional()
});

const updateEmployeeSchema = employeeSchema.extend({
  id: z.string().min(1, "Employee ID is required.")
});

export async function createEmployeeAction(formData: FormData) {
  return secureAction('PERSONNEL_DIRECTORY', 'WRITE', async (session) => {
    const parsed = employeeSchema.safeParse({
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      contact: formData.get('contact') || undefined,
      position_id: formData.get('position_id'),
      status: formData.get('status'),
      gender: formData.get('gender') || 'Not Specified',
      actual_salary: formData.get('actual_salary') || undefined
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    let { first_name, last_name, email, gender, status, position_id, actual_salary } = parsed.data;

    const position = await prisma.position.findUnique({ where: { id: position_id } });
    if (!position) {
      return { success: false, message: 'Validation Error: Position not found.' };
    }

    // Salary Validation
    if (actual_salary !== undefined) {
      if (!checkAccess(session.role as string, 'PAYROLL_OPERATIONS', 'WRITE')) {
        return { success: false, message: '403 Forbidden: Only HR Managers can set custom salaries.' };
      }
      if (actual_salary < position.min_salary || actual_salary > position.max_salary) {
        return { 
          success: false, 
          message: `Validation Error: Salary must be strictly between ₱${position.min_salary.toLocaleString()} and ₱${position.max_salary.toLocaleString()}.` 
        };
      }
    } else {
      // Default to base_salary if not provided
      actual_salary = position.base_salary;
    }

    const newEmployee = await prisma.employee.create({
      data: {
        first_name,
        last_name,
        email,
        gender,
        status,
        position_id,
        actual_salary: actual_salary,
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
  });
}

export async function updateEmployeeAction(formData: FormData) {
  return secureAction('PERSONNEL_DIRECTORY', 'WRITE', async (session) => {
    const parsed = updateEmployeeSchema.safeParse({
      id: formData.get('id'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      contact: formData.get('contact') || undefined,
      position_id: formData.get('position_id'),
      status: formData.get('status'),
      gender: formData.get('gender') || 'Not Specified',
      actual_salary: formData.get('actual_salary') || undefined
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    const { id, first_name, last_name, email, gender, status, position_id, actual_salary } = parsed.data;

    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { position: true },
    });

    if (!existingEmployee) {
      return { success: false, message: 'Validation Error: Employee not found.' };
    }

    const position = await prisma.position.findUnique({ where: { id: position_id } });
    if (!position) {
      return { success: false, message: 'Validation Error: Position not found.' };
    }

    // BOUNDARY VALIDATION for HR Manager
    if (actual_salary !== undefined && actual_salary !== existingEmployee.actual_salary) {
      if (!checkAccess(session.role as string, 'PAYROLL_OPERATIONS', 'WRITE')) {
        return { success: false, message: '403 Forbidden: Only HR Managers can modify salaries.' };
      }
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
  });
}

export async function terminateEmployeeAction(id: string) {
  return secureAction('PERSONNEL_DIRECTORY', 'WRITE', async (session) => {
    const parsedId = z.string().min(1).safeParse(id);
    if (!parsedId.success) {
      return { success: false, message: 'Validation Error: Invalid ID.' };
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { id: parsedId.data } });
    if (!existingEmployee) return { success: false, message: 'Validation Error: Employee not found.' };

    const oldValues = { status: existingEmployee.status, deleted_at: existingEmployee.deleted_at };
    const deletedAt = new Date();
    const newValues = { status: 'Off-duty', deleted_at: deletedAt };

    const updatedEmployee = await prisma.employee.update({
      where: { id: parsedId.data },
      data: newValues,
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'ARCHIVE_EMPLOYEE',
        target_employee: `${updatedEmployee.first_name} ${updatedEmployee.last_name}`,
        old_value: JSON.stringify(oldValues),
        new_value: JSON.stringify(newValues),
      },
    });

    revalidatePath('/', 'layout');
    return { success: true, message: 'Employee terminated and archived securely.' };
  });
}

export async function updateSalaryAction(employeeId: string, newSalary: number) {
  return secureAction('PAYROLL_OPERATIONS', 'WRITE', async (session) => {
    const parsed = z.object({
      id: z.string().min(1),
      salary: z.coerce.number()
    }).safeParse({ id: employeeId, salary: newSalary });

    if (!parsed.success) {
      return { success: false, message: 'Validation Error: Invalid input data.' };
    }

    const { id, salary } = parsed.data;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { position: true }
    });

    if (!employee || !employee.position) {
      return { success: false, message: 'Validation Error: Employee or assigned position not found.' };
    }

    const position = employee.position;

    if (salary < position.min_salary || salary > position.max_salary) {
      return { success: false, message: "Validation Error: Salary is outside authorized pay grade boundaries." };
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { actual_salary: salary }
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'UPDATE SALARY',
        target_employee: `${employee.first_name} ${employee.last_name}`,
        old_value: JSON.stringify({ actual_salary: employee.actual_salary }),
        new_value: JSON.stringify({ actual_salary: salary }),
      }
    });

    revalidatePath('/', 'layout');
    return { success: true, message: 'Salary updated successfully.' };
  });
}
