'use server';

import prisma from '@/lib/prisma';

export async function revalidateDashboardData() {
  try {
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
  } catch (error) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      employeeCount: 0,
      auditLogCount: 0
    };
  }
}
