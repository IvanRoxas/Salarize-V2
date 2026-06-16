'use server';

import prisma from '@/lib/prisma';
import { secureAction } from '@/lib/security';

// F6 fix: was secureAction(null, null) which skipped RBAC entirely.
// SECURITY_LOGS READ is held by SUPER_ADMIN, ADMIN, and AUDITOR — exactly the
// roles that need dashboard health data. HR_MANAGER does not see this widget.
export async function revalidateDashboardData() {
  return secureAction('SECURITY_LOGS', 'READ', async () => {
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
