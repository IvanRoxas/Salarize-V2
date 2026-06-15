'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';

export async function createDepartmentAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Organizational structure management is restricted to the System Architect.");
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const icon = formData.get('icon') as string || 'Building';
  const color = formData.get('color') as string || 'violet';

  if (!name) {
    return { success: false, message: 'Department name is required.' };
  }

  try {
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) return { success: false, message: 'A department with this name already exists.' };

    const newDept = await prisma.department.create({
      data: { name, description, icon, color },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'CREATE DEPARTMENT',
        target_employee: name,
        old_value: 'NULL',
        new_value: JSON.stringify(newDept),
      },
    });

    revalidatePath('/departments');
    return { success: true, message: 'Department successfully created.' };
  } catch (error: any) {
    console.error('Create Department Error:', error);
    return { success: false, message: 'Database error occurred while creating the department.' };
  }
}

export async function updateDepartmentAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Organizational structure management is restricted to the System Architect.");
  }

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const icon = formData.get('icon') as string || 'Building';
  const color = formData.get('color') as string || 'violet';

  if (!id || !name) {
    return { success: false, message: 'Department name is required.' };
  }

  try {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return { success: false, message: 'Department not found.' };

    const updatedDept = await prisma.department.update({
      where: { id },
      data: { name, description, icon, color },
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'UPDATE DEPARTMENT',
        target_employee: name,
        old_value: JSON.stringify(existing),
        new_value: JSON.stringify(updatedDept),
      },
    });

    revalidatePath('/departments');
    return { success: true, message: 'Department successfully updated.' };
  } catch (error: any) {
    console.error('Update Department Error:', error);
    return { success: false, message: 'Database error occurred while updating the department.' };
  }
}

export async function deleteDepartmentAction(id: string) {
  const session = await getSession();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Organizational structure management is restricted to the System Architect.");
  }

  try {
    const existing = await prisma.department.findUnique({ where: { id }, include: { _count: { select: { positions: true } } } });
    if (!existing) return { success: false, message: 'Department not found.' };

    if (existing._count.positions > 0) {
      return { success: false, message: 'Cannot delete: Department has active job positions. Reassign or delete them first.' };
    }

    await prisma.department.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'DELETE DEPARTMENT',
        target_employee: existing.name,
        old_value: JSON.stringify(existing),
        new_value: 'DELETED',
      },
    });

    revalidatePath('/departments');
    return { success: true, message: 'Department successfully deleted.' };
  } catch (error: any) {
    console.error('Delete Department Error:', error);
    return { success: false, message: 'Database error occurred while deleting the department.' };
  }
}
