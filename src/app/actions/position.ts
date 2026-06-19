'use server';

import prisma from '@/lib/prisma';
import { secureAction } from '@/lib/security';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const positionSchema = z.object({
  title: z.string().min(2, "Position title must be at least 2 characters."),
  department_id: z.string().min(1, "Department ID is required."),
  icon: z.string().optional().default('Briefcase'),
  base_salary: z.coerce.number(),
  min_salary: z.coerce.number(),
  max_salary: z.coerce.number(),
}).refine(data => data.min_salary <= data.max_salary, {
  message: "Minimum salary cannot exceed maximum salary.",
  path: ["min_salary"]
}).refine(data => data.base_salary >= data.min_salary && data.base_salary <= data.max_salary, {
  message: "Base salary must be between the min and max bounds.",
  path: ["base_salary"]
});

const updatePositionSchema = z.intersection(
  z.object({ id: z.string().min(1, "Position ID is required.") }),
  positionSchema
);

export async function createPositionAction(formData: FormData) {
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'WRITE', async (session) => {
    const parsed = positionSchema.safeParse({
      title: formData.get('title'),
      department_id: formData.get('department_id'),
      icon: formData.get('icon'),
      base_salary: formData.get('base_salary'),
      min_salary: formData.get('min_salary'),
      max_salary: formData.get('max_salary')
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    const { title, department_id, icon, base_salary, min_salary, max_salary } = parsed.data;

    const existingPosition = await prisma.position.findUnique({ where: { title } });
    if (existingPosition) return { success: false, message: 'A job position with this title already exists.' };

    const newPosition = await prisma.position.create({
      data: { title, department_id, icon, base_salary, min_salary, max_salary },
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

    revalidatePath('/', 'layout');
    return { success: true, message: 'Job Position successfully created.' };
  });
}

export async function updatePositionAction(formData: FormData) {
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'WRITE', async (session) => {
    const parsed = updatePositionSchema.safeParse({
      id: formData.get('id'),
      title: formData.get('title'),
      department_id: formData.get('department_id'),
      icon: formData.get('icon'),
      base_salary: formData.get('base_salary'),
      min_salary: formData.get('min_salary'),
      max_salary: formData.get('max_salary')
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    const { id, title, department_id, icon, base_salary, min_salary, max_salary } = parsed.data;

    const existingPosition = await prisma.position.findUnique({ where: { id } });
    if (!existingPosition) return { success: false, message: 'Job Position not found.' };

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: { title, department_id, icon, base_salary, min_salary, max_salary },
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

    revalidatePath('/', 'layout');
    return { success: true, message: 'Job Position successfully updated.' };
  });
}

export async function deletePositionAction(id: string) {
  return secureAction('ORGANIZATIONAL_STRUCTURE', 'WRITE', async (session) => {
    const parsedId = z.string().min(1).safeParse(id);
    if (!parsedId.success) {
      return { success: false, message: 'Validation Error: Invalid ID.' };
    }

    const existingPosition = await prisma.position.findUnique({ 
      where: { id: parsedId.data }, 
      include: { _count: { select: { employees: true } } } 
    });
    if (!existingPosition) return { success: false, message: 'Job Position not found.' };

    if (existingPosition._count.employees > 0) {
      return { success: false, message: 'Validation Error: Cannot delete: Job Position has active personnel. Reassign them first.' };
    }

    await prisma.position.delete({ where: { id: parsedId.data } });

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

    revalidatePath('/', 'layout');
    return { success: true, message: 'Job Position successfully deleted.' };
  });
}
