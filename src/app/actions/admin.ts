'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/app/actions/auth';

export async function createAdminAction(formData: FormData) {
  const session = await getSession();

  if (!session || session.role === 'HR_MANAGER' || session.role === 'AUDITOR' || session.role !== 'SUPER_ADMIN') {
    return { success: false, message: '403 Forbidden: Only SUPER_ADMIN can create system administrators.' };
  }

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!username || !password || !role) {
    return { success: false, message: 'All fields are required.' };
  }

  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { username }
    });

    if (existingAdmin) {
      return { success: false, message: 'Username is already taken.' };
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password_hash,
        role,
      }
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'CREATE ROLE',
        target_employee: `Admin ID: ${newAdmin.id} (${username})`,
        old_value: 'NULL',
        new_value: JSON.stringify({ username: newAdmin.username, role: newAdmin.role }),
      },
    });

    return { success: true, message: 'System Administrator created successfully.' };

  } catch (error: any) {
    console.error('Create Admin Error:', error);
    return { success: false, message: 'Failed to create System Administrator.' };
  }
}

export async function revokeAdminAccessAction(adminId: string) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    return { success: false, message: '403 Forbidden: Only SUPER_ADMIN can revoke access.' };
  }

  if (adminId === session.id) {
    return { success: false, message: 'Cannot delete own account. System lock prevention.' };
  }

  try {
    const adminToDelete = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!adminToDelete) {
      return { success: false, message: 'Administrator not found.' };
    }

    await prisma.admin.delete({
      where: { id: adminId }
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'REVOKE ROLE',
        target_employee: `Admin Username: ${adminToDelete.username}`,
        old_value: 'ACTIVE',
        new_value: 'REVOKED',
      },
    });

    return { success: true, message: 'Administrator access revoked successfully.' };
  } catch (error: any) {
    console.error('Revoke Admin Error:', error);
    return { success: false, message: 'Failed to revoke administrator access.' };
  }
}
