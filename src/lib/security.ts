export type Role = 'SUPER_ADMIN' | 'HR_MANAGER' | 'AUDITOR';
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
