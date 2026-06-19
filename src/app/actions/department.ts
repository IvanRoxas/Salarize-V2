'use server';

import prisma from '@/lib/prisma';
import { secureAction } from '@/lib/security';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters."),
  description: z.string().optional().default(''),
  icon: z.string().optional().default('Building'),
  color: z.string().optional().default('violet')
});

const updateDepartmentSchema = departmentSchema.extend({
  id: z.string().min(1, "Department ID is required.")
});

export async function createDepartmentAction(formData: FormData) {
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'WRITE', async (session) => {
    const parsed = departmentSchema.safeParse({
      name: formData.get('name'),
      description: formData.get('description'),
      icon: formData.get('icon'),
      color: formData.get('color')
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    const { name, description, icon, color } = parsed.data;

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

    revalidatePath('/', 'layout');
    return { success: true, message: 'Department successfully created.' };
  });
}

export async function updateDepartmentAction(formData: FormData) {
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'WRITE', async (session) => {
    const parsed = updateDepartmentSchema.safeParse({
      id: formData.get('id'),
      name: formData.get('name'),
      description: formData.get('description'),
      icon: formData.get('icon'),
      color: formData.get('color')
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    const { id, name, description, icon, color } = parsed.data;

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

    revalidatePath('/', 'layout');
    return { success: true, message: 'Department successfully updated.' };
  });
}

export async function deleteDepartmentAction(id: string) {
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'WRITE', async (session) => {
    const parsedId = z.string().min(1).safeParse(id);
    if (!parsedId.success) {
      return { success: false, message: 'Validation Error: Invalid ID.' };
    }

    const existing = await prisma.department.findUnique({ 
      where: { id: parsedId.data }, 
      include: { _count: { select: { positions: true } } } 
    });
    
    if (!existing) return { success: false, message: 'Department not found.' };

    if (existing._count.positions > 0) {
      return { success: false, message: 'Validation Error: Cannot delete: Department has active job positions. Reassign or delete them first.' };
    }

    await prisma.department.delete({ where: { id: parsedId.data } });

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
    revalidatePath('/manage-employees');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Department successfully deleted.' };
  });
}
