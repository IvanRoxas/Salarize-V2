'use server';

import prisma from '@/lib/prisma';
import { secureAction } from '@/lib/security';

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
