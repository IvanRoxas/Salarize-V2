'use server';

import prisma from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';

export async function clearLogsAction() {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    return { success: false, message: 'Unauthorized: Only Administrators can clear logs.' };
  }

  try {
    await prisma.auditLog.deleteMany({});
    
    // Log the clear action itself
    await prisma.auditLog.create({
      data: {
        admin_id: session.id as string,
        admin_name: session.username as string,
        action: 'CLEARED_LOGS',
        target_employee: 'SYSTEM'
      }
    });

    revalidatePath('/audit-logs');
    return { success: true, message: 'Logs cleared successfully.' };
  } catch (error) {
    return { success: false, message: 'Failed to clear logs.' };
  }
}

export async function generateAuditReport() {
  const session = await getSession();

  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'AUDITOR')) {
    return { success: false, message: 'Unauthorized: Cannot generate compliance report.' };
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.auditLog.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      orderBy: { timestamp: 'desc' }
    });

    // Create Audit Log hook
    await prisma.auditLog.create({
      data: {
        admin_id: session.id as string,
        admin_name: session.username as string,
        action: 'GENERATE_COMPLIANCE_REPORT',
        target_employee: 'SYSTEM',
        old_value: null,
        new_value: 'Generated 30-day PDF compliance report'
      }
    });

    return { 
      success: true, 
      logs,
      auditorName: session.username
    };
  } catch (error) {
    console.error('Failed to generate audit report:', error);
    return { success: false, message: 'Failed to generate audit report.' };
  }
}

