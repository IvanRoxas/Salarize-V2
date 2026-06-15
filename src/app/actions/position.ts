'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';

export async function createPositionAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Organizational structure management is restricted to the System Architect.");
  }

  const title = formData.get('title') as string;
  const department_id = formData.get('department_id') as string;
  const base_salary = Number(formData.get('base_salary'));
  const min_salary = Number(formData.get('min_salary'));
  const max_salary = Number(formData.get('max_salary'));

  if (!title || !department_id || isNaN(base_salary) || isNaN(min_salary) || isNaN(max_salary)) {
    return { success: false, message: 'All fields are required and salaries must be numeric.' };
  }

  if (min_salary > max_salary) return { success: false, message: 'Validation Error: Minimum salary cannot exceed maximum salary.' };
  if (base_salary < min_salary || base_salary > max_salary) return { success: false, message: 'Validation Error: Base salary must be between the min and max bounds.' };

  try {
    const existingPosition = await prisma.position.findUnique({ where: { title } });
    if (existingPosition) return { success: false, message: 'A job position with this title already exists.' };

    const newPosition = await prisma.position.create({
      data: { title, department_id, base_salary, min_salary, max_salary },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'CREATE POSITION',
        target_employee: title,
        old_value: 'NULL',
        new_value: JSON.stringify(newPosition),
      },
    });

    revalidatePath('/departments');
    return { success: true, message: 'Job Position successfully created.' };
  } catch (error: any) {
    console.error('Create Position Error:', error);
    return { success: false, message: 'Database error occurred while creating the job position.' };
  }
}

export async function updatePositionAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Organizational structure management is restricted to the System Architect.");
  }

  const id = formData.get('id') as string;
  const title = formData.get('title') as string;
  const department_id = formData.get('department_id') as string;
  const base_salary = Number(formData.get('base_salary'));
  const min_salary = Number(formData.get('min_salary'));
  const max_salary = Number(formData.get('max_salary'));

  if (!id || !title || !department_id || isNaN(base_salary) || isNaN(min_salary) || isNaN(max_salary)) {
    return { success: false, message: 'All fields are required and salaries must be numeric.' };
  }

  if (min_salary > max_salary) return { success: false, message: 'Validation Error: Minimum salary cannot exceed maximum salary.' };
  if (base_salary < min_salary || base_salary > max_salary) return { success: false, message: 'Validation Error: Base salary must be between min and max.' };

  try {
    const existingPosition = await prisma.position.findUnique({ where: { id } });
    if (!existingPosition) return { success: false, message: 'Job Position not found.' };

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: { title, department_id, base_salary, min_salary, max_salary },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'UPDATE POSITION',
        target_employee: title,
        old_value: JSON.stringify(existingPosition),
        new_value: JSON.stringify(updatedPosition),
      },
    });

    revalidatePath('/departments');
    return { success: true, message: 'Job Position successfully updated.' };
  } catch (error: any) {
    console.error('Update Position Error:', error);
    return { success: false, message: 'Database error occurred while updating the job position.' };
  }
}

export async function deletePositionAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Organizational structure management is restricted to the System Architect.");
  }

  try {
    const existingPosition = await prisma.position.findUnique({ where: { id }, include: { _count: { select: { employees: true } } } });
    if (!existingPosition) return { success: false, message: 'Job Position not found.' };

    if (existingPosition._count.employees > 0) {
      return { success: false, message: 'Cannot delete: Job Position has active personnel. Reassign them first.' };
    }

    await prisma.position.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'DELETE POSITION',
        target_employee: existingPosition.title,
        old_value: JSON.stringify(existingPosition),
        new_value: 'DELETED',
      },
    });

    revalidatePath('/departments');
    return { success: true, message: 'Job Position successfully deleted.' };
  } catch (error: any) {
    console.error('Delete Position Error:', error);
    return { success: false, message: 'Database error occurred while deleting the job position.' };
  }
}
