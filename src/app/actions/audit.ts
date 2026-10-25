'use server';

import prisma from '@/lib/prisma';
import { secureAction } from '@/lib/security';
import { revalidatePath } from 'next/cache';
import { ACCESS_LOG_ACTIONS } from '@/lib/auditCategories';

export async function generateAuditReport() {
  return secureAction('SECURITY_LOGS', 'READ', async (session) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const accessActionTypes = ['LOGIN_SUCCESS', 'LOGIN_SUCCESS_2FA', 'LOGIN_FAILED', '403_FORBIDDEN', 'UNAUTHORIZED_LOGIN_ATTEMPT', 'UNAUTHORIZED', 'REVOKE ROLE', 'CREATE_ADMIN'];

    const [activeLogs, accessLogs] = await Promise.all([
      prisma.auditLog.findMany({
        where: { 
          is_archived: false,
          action: { notIn: ['LOGIN_SUCCESS', 'LOGIN_SUCCESS_2FA', 'LOGIN_FAILED'] }
        },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.auditLog.findMany({
        where: { action: { in: accessActionTypes } },
        orderBy: { timestamp: 'desc' }
      })
    ]);

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
      activeLogs,
      accessLogs,
      auditorName: session.username
    };
  });
}

export async function acknowledgeAlertsAction() {
  return secureAction('ARCHIVES', 'WRITE', async (session) => {
    await prisma.auditLog.create({
      data: {
        admin_id:        session.id as string,
        admin_name:      session.username as string,
        action:          'ACKNOWLEDGE_ALERTS',
        target_employee: 'System Alert Reset',
        old_value:       'null',
        new_value:       'Acknowledged',
      }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  });
}

export async function archiveAllHistoryAction(expectedCount: number) {
  return secureAction('ARCHIVES', 'WRITE', async (session) => {
    const activeCount = await prisma.auditLog.count({ 
      where: { 
        is_archived: false,
        action: { notIn: [...ACCESS_LOG_ACTIONS] }
      } 
    });

    if (activeCount !== expectedCount) {
      return {
        success: false,
        message: `Count mismatch: expected ${expectedCount} records but found ${activeCount}. Refresh and confirm again.`
      };
    }

    if (activeCount === 0) {
      return { success: false, message: 'No active logs to archive.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.updateMany({
        where: { 
          is_archived: false,
          action: { notIn: [...ACCESS_LOG_ACTIONS] }
        },
        data: { is_archived: true },
      });

      await tx.auditLog.create({
        data: {
          admin_id:        session.id as string,
          admin_name:      session.username as string,
          action:          'ARCHIVE_HISTORY',
          target_employee: 'System Logs',
          old_value:       `${activeCount} active records`,
          new_value:       'Archived',
          is_archived:     false,
        }
      });
    });

    revalidatePath('/', 'layout');
    return { success: true, message: `${activeCount} records archived successfully.` };
  });
}
