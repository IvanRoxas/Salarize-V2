export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'HR_MANAGER' | 'AUDITOR';
export type Module = 'SYSTEM_ACCOUNTS' | 'ORGANIZATIONAL_STRUCTURE' | 'PERSONNEL_DIRECTORY' | 'PAYROLL_OPERATIONS' | 'SECURITY_LOGS' | 'ARCHIVES';
export type ActionType = 'READ' | 'WRITE';

const RolePermissions: Record<Role, Record<Module, ActionType[]>> = {
  SUPER_ADMIN: {
    SYSTEM_ACCOUNTS: ['READ', 'WRITE'],
    ORGANIZATIONAL_STRUCTURE: ['READ', 'WRITE'],
    PERSONNEL_DIRECTORY: ['READ'],
    PAYROLL_OPERATIONS: ['READ'],
    SECURITY_LOGS: ['READ'],
    ARCHIVES: ['READ'],
  },
  ADMIN: {
    SYSTEM_ACCOUNTS: [],
    ORGANIZATIONAL_STRUCTURE: ['READ', 'WRITE'],
    PERSONNEL_DIRECTORY: ['READ'],
    PAYROLL_OPERATIONS: [],
    SECURITY_LOGS: ['READ'],
    ARCHIVES: [],
  },
  HR_MANAGER: {
    SYSTEM_ACCOUNTS: [],
    ORGANIZATIONAL_STRUCTURE: ['READ'],
    PERSONNEL_DIRECTORY: ['READ', 'WRITE'],
    PAYROLL_OPERATIONS: ['READ', 'WRITE'],
    SECURITY_LOGS: [],
    ARCHIVES: [],
  },
  AUDITOR: {
    SYSTEM_ACCOUNTS: [],
    ORGANIZATIONAL_STRUCTURE: ['READ'],
    PERSONNEL_DIRECTORY: ['READ'],
    PAYROLL_OPERATIONS: ['READ'],
    SECURITY_LOGS: ['READ'],
    ARCHIVES: ['READ', 'WRITE'],
  }
};

/**
 * Validates if a given role has the authority to perform an action on a module.
 * Centralized Role-Gate for SoD compliance.
 */
export function checkAccess(role: string, moduleName: Module, action: ActionType): boolean {
  const permissions = RolePermissions[role as Role];
  if (!permissions) return false;
  
  const modulePermissions = permissions[moduleName];
  if (!modulePermissions) return false;
  
  return modulePermissions.includes(action);
}

/**
 * Centralized secureAction wrapper.
 * Intercepts requests, validates session & role, logs unauthorized access, and scrubs errors.
 */
import { getSession } from '@/app/actions/auth';
import prisma from '@/lib/prisma';

export async function secureAction<T>(
  moduleName: Module | null,
  actionType: ActionType | null,
  handler: (session: any) => Promise<T>
): Promise<any> {
  const session = await getSession();

  if (!session) {
    return { success: false, message: 'Unauthorized. No active session.' };
  }

  // If a specific module/action is required, perform centralized RBAC validation
  if (moduleName && actionType) {
    if (!checkAccess(session.role as string, moduleName, actionType)) {
      // Log the unauthorized attempt
      await prisma.auditLog.create({
        data: {
          admin_id: (session.id || session.username) as string,
          admin_name: session.username as string,
          action: '403_FORBIDDEN',
          target_employee: `Module: ${moduleName}, Action: ${actionType}`,
          old_value: 'N/A',
          new_value: 'Access Denied via secureAction middleware',
        }
      });
      return { success: false, message: '403 Forbidden: Insufficient privileges.' };
    }
  }

  try {
    return await handler(session);
  } catch (error: any) {
    // Information Disclosure mitigation: Scrub error traces
    console.error(`[SecureAction Error] ${moduleName || 'GLOBAL'} ${actionType || 'GLOBAL'}:`, error);
    
    // Check for custom validation errors (from Zod or business logic) which might be safe to return
    if (error.message && error.message.startsWith('Validation Error')) {
      return { success: false, message: error.message };
    }

    return { success: false, message: 'Internal Server Error. Please contact support.' };
  }
}
