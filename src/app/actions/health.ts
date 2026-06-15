'use server';

import prisma from '@/lib/prisma';
import { secureAction } from '@/lib/security';

export async function revalidateDashboardData() {
  return secureAction(null, null, async () => {
    const [employeeCount, auditLogCount] = await Promise.all([
      prisma.employee.count(),
      prisma.auditLog.count()
    ]);
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      employeeCount,
      auditLogCount
    };
  });
}
