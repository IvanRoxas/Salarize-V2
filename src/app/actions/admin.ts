'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { secureAction } from '@/lib/security';
import { z } from 'zod';
import { sendApprovalNotification } from '@/lib/email';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing.');
}
const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

async function verifyStepUpOTP(code: string) {
  const cookieStore = await cookies();
  const stepUpSession = cookieStore.get('salarize_stepup_pending')?.value;

  if (!stepUpSession) return false;

  try {
    const { payload } = await jwtVerify(stepUpSession, key);
    if (payload.code === code) {
      cookieStore.delete('salarize_stepup_pending');
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

const createAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/\d/, "Password must contain at least one number.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character."),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'AUDITOR'], {
    message: "Invalid role specified."
  })
});

const idSchema = z.string().min(1, "ID is required.");
const roleSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'AUDITOR']);

export async function createAdminAction(formData: FormData) {
  return secureAction('SYSTEM_ACCOUNTS', 'WRITE', async (session) => {
    const parsed = createAdminSchema.safeParse({
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role')
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    const { username, email, password, role } = parsed.data;

    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingAdmin) {
      const field = existingAdmin.username === username ? 'Username' : 'Email';
      return { success: false, message: `Validation Error: ${field} is already taken.` };
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        username,
        email,
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
  });
}

export async function revokeAdminAccessAction(adminId: string) {
  return secureAction('SYSTEM_ACCOUNTS', 'WRITE', async (session) => {
    const parsed = idSchema.safeParse(adminId);
    if (!parsed.success) return { success: false, message: 'Validation Error: Invalid ID.' };
    const id = parsed.data;

    if (id === session.id) {
      return { success: false, message: 'Validation Error: Cannot delete own account. System lock prevention.' };
    }

    const adminToDelete = await prisma.admin.findUnique({
      where: { id }
    });

    if (!adminToDelete) {
      return { success: false, message: 'Validation Error: Administrator not found.' };
    }

    await prisma.admin.delete({
      where: { id }
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
  });
}

export async function approveAdminAction(adminId: string, role: string, otp: string) {
  return secureAction('SYSTEM_ACCOUNTS', 'WRITE', async (session) => {
    const parsedId = idSchema.safeParse(adminId);
    const parsedRole = roleSchema.safeParse(role);

    if (!parsedId.success || !parsedRole.success) {
      return { success: false, message: 'Validation Error: Invalid input parameters.' };
    }

    const id = parsedId.data;
    const validatedRole = parsedRole.data;

    const isOTPValid = await verifyStepUpOTP(otp);
    if (!isOTPValid) {
      return { success: false, message: 'Validation Error: Invalid or expired Step-Up OTP.' };
    }

    const adminToApprove = await prisma.admin.findUnique({ where: { id } });
    if (!adminToApprove || adminToApprove.status !== 'PENDING') {
      return { success: false, message: 'Validation Error: Administrator not found or not in pending state.' };
    }

    await prisma.admin.update({
      where: { id },
      data: { status: 'APPROVED', role: validatedRole }
    });

    await prisma.auditLog.create({
      data: {
        admin_id:        (session.id || session.username) as string,
        admin_name:      session.username as string,
        action:          validatedRole === 'SUPER_ADMIN'
                           ? '⚠️ ELEVATED_PRIVILEGE — APPROVE ROLE'
                           : 'APPROVE ROLE',
        target_employee: `Admin ID: ${adminToApprove.id} (${adminToApprove.username})`,
        old_value:       'STATUS: PENDING',
        new_value:       `STATUS: APPROVED, ROLE: ${validatedRole}`,
      },
    });

    await sendApprovalNotification(adminToApprove.email, validatedRole);

    return { success: true, message: 'Administrator approved and assigned role successfully.' };
  });
}

export async function suspendAdminAction(adminId: string, otp: string) {
  return secureAction('SYSTEM_ACCOUNTS', 'WRITE', async (session) => {
    const parsed = idSchema.safeParse(adminId);
    if (!parsed.success) return { success: false, message: 'Validation Error: Invalid ID.' };
    const id = parsed.data;

    // Require 2FA for Super Admin suspending accounts
    if (session.role === 'SUPER_ADMIN') {
      const isOTPValid = await verifyStepUpOTP(otp);
      if (!isOTPValid) {
        return { success: false, message: 'Validation Error: Invalid or expired Step-Up OTP.' };
      }
    }

    if (id === session.id) {
      return { success: false, message: '403 Forbidden: Cannot suspend your own account.' };
    }

    const adminToSuspend = await prisma.admin.findUnique({ where: { id } });
    if (!adminToSuspend) {
      return { success: false, message: 'Validation Error: Administrator not found.' };
    }

    if (adminToSuspend.role === 'SUPER_ADMIN') {
      const activeSuperAdmins = await prisma.admin.count({
        where: { role: 'SUPER_ADMIN', status: 'APPROVED' }
      });
      if (activeSuperAdmins <= 1) {
        return { success: false, message: '403 Forbidden: Cannot suspend the final active Super Administrator.' };
      }
    }

    await prisma.admin.update({
      where: { id },
      data: { status: 'SUSPENDED' }
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: session.role === 'SUPER_ADMIN' ? '⚠️ ELEVATED_PRIVILEGE — SUSPEND ROLE' : 'SUSPEND ROLE',
        target_employee: `Admin ID: ${adminToSuspend.id} (${adminToSuspend.username})`,
        old_value: `STATUS: ${adminToSuspend.status}`,
        new_value: 'STATUS: SUSPENDED',
      },
    });

    return { success: true, message: 'Administrator suspended successfully.' };
  });
}

export async function restoreUserAccessAction(adminId: string) {
  return secureAction('SYSTEM_ACCOUNTS', 'WRITE', async (session) => {
    const parsed = idSchema.safeParse(adminId);
    if (!parsed.success) return { success: false, message: 'Validation Error: Invalid ID.' };
    const id = parsed.data;

    const adminToRestore = await prisma.admin.findUnique({ where: { id } });
    if (!adminToRestore || adminToRestore.status !== 'SUSPENDED') {
      return { success: false, message: 'Validation Error: Administrator not found or not suspended.' };
    }

    await prisma.admin.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    await prisma.auditLog.create({
      data: {
        admin_id: (session.id || session.username) as string,
        admin_name: session.username as string,
        action: 'RESTORE ROLE',
        target_employee: `Admin ID: ${adminToRestore.id} (${adminToRestore.username})`,
        old_value: 'STATUS: SUSPENDED',
        new_value: 'STATUS: APPROVED',
      },
    });

    return { success: true, message: 'Administrator access restored successfully.' };
  });
}

export async function updateAdminRoleAction(adminId: string, newRole: string, otp: string) {
  return secureAction('SYSTEM_ACCOUNTS', 'WRITE', async (session) => {
    const parsedId = idSchema.safeParse(adminId);
    const parsedRole = roleSchema.safeParse(newRole);

    if (!parsedId.success || !parsedRole.success) {
      return { success: false, message: 'Validation Error: Invalid input parameters.' };
    }

    const id = parsedId.data;
    const validatedRole = parsedRole.data;

    const isOTPValid = await verifyStepUpOTP(otp);
    if (!isOTPValid) {
      return { success: false, message: 'Validation Error: Invalid or expired Step-Up OTP.' };
    }

    if (id === session.id) {
      return { success: false, message: '403 Forbidden: Cannot edit your own role.' };
    }

    const adminToEdit = await prisma.admin.findUnique({ where: { id } });
    if (!adminToEdit) {
      return { success: false, message: 'Validation Error: Administrator not found.' };
    }

    if (adminToEdit.role === 'SUPER_ADMIN' && validatedRole !== 'SUPER_ADMIN') {
      const activeSuperAdmins = await prisma.admin.count({
        where: { role: 'SUPER_ADMIN', status: 'APPROVED' }
      });
      if (activeSuperAdmins <= 1) {
        return { success: false, message: '403 Forbidden: Cannot demote the final active Super Administrator.' };
      }
    }

    await prisma.admin.update({
      where: { id },
      data: { role: validatedRole }
    });

    await prisma.auditLog.create({
      data: {
        admin_id:        (session.id || session.username) as string,
        admin_name:      session.username as string,
        action:          validatedRole === 'SUPER_ADMIN'
                           ? '⚠️ ELEVATED_PRIVILEGE — UPDATE ROLE'
                           : 'UPDATE ROLE',
        target_employee: `Admin ID: ${adminToEdit.id} (${adminToEdit.username})`,
        old_value:       `ROLE: ${adminToEdit.role}`,
        new_value:       `ROLE: ${validatedRole}`,
      },
    });

    return { success: true, message: 'Administrator role updated successfully.' };
  });
}
