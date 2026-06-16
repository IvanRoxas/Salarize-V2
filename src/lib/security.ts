export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'HR_MANAGER' | 'AUDITOR';
export type Module = 'SYSTEM_ACCOUNTS' | 'ORGANIZATIONAL_STRUCTURE' | 'PERSONNEL_DIRECTORY' | 'PAYROLL_OPERATIONS' | 'SECURITY_LOGS' | 'ARCHIVES';
export type ActionType = 'READ' | 'WRITE';

const RolePermissions: Record<Role, Record<Module, ActionType[]>> = {
  SUPER_ADMIN: {
    SYSTEM_ACCOUNTS:         ['READ', 'WRITE'],
    ORGANIZATIONAL_STRUCTURE:['READ', 'WRITE'],
    PERSONNEL_DIRECTORY:     ['READ'],
    PAYROLL_OPERATIONS:      ['READ'],
    SECURITY_LOGS:           ['READ'],
    ARCHIVES:                ['READ'],
  },
  ADMIN: {
    SYSTEM_ACCOUNTS:         [],
    ORGANIZATIONAL_STRUCTURE:['READ', 'WRITE'],
    PERSONNEL_DIRECTORY:     ['READ'],
    PAYROLL_OPERATIONS:      [],
    SECURITY_LOGS:           ['READ'],
    ARCHIVES:                [],
  },
  HR_MANAGER: {
    SYSTEM_ACCOUNTS:         [],
    ORGANIZATIONAL_STRUCTURE:['READ'],
    PERSONNEL_DIRECTORY:     ['READ', 'WRITE'],
    PAYROLL_OPERATIONS:      ['READ', 'WRITE'],
    SECURITY_LOGS:           [],
    ARCHIVES:                [],
  },
  AUDITOR: {
    SYSTEM_ACCOUNTS:         [],
    ORGANIZATIONAL_STRUCTURE:['READ'],
    PERSONNEL_DIRECTORY:     ['READ'],
    PAYROLL_OPERATIONS:      ['READ'],
    SECURITY_LOGS:           ['READ'],
    ARCHIVES:                ['READ', 'WRITE'],
  }
};

/**
 * Validates if a given role has the authority to perform an action on a module.
 * Centralized Role-Gate for SoD compliance.
 */
export function checkAccess(role: string, moduleName: Module, action: ActionType): boolean {
  const permissions = RolePermissions[role as Role];
  if (!permissions) return false;
  return permissions[moduleName]?.includes(action) ?? false;
}

// ── F5: Per-user WRITE rate limiter ───────────────────────────────────────────
// Tracks write action counts per authenticated user per minute.
// Resets automatically when the window expires.
// Note: in-memory only — acceptable for a non-deployed school project.
const WRITE_RATE_LIMIT = 60;       // max write actions per window
const WRITE_RATE_WINDOW_MS = 60_000; // 1 minute

type RateBucket = { count: number; windowStart: number };
const writeRateLimitBuckets = new Map<string, RateBucket>();

function checkWriteRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = writeRateLimitBuckets.get(userId);

  if (!bucket || now - bucket.windowStart >= WRITE_RATE_WINDOW_MS) {
    writeRateLimitBuckets.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: WRITE_RATE_LIMIT - 1 };
  }

  if (bucket.count >= WRITE_RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: WRITE_RATE_LIMIT - bucket.count };
}

// ── Centralized secureAction wrapper ─────────────────────────────────────────
/**
 * Intercepts requests, validates session & role, applies rate limiting on WRITE
 * operations, logs unauthorized access, and scrubs internal error traces.
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

  // F1 / RBAC gate: validate module + action permission
  if (moduleName && actionType) {
    if (!checkAccess(session.role as string, moduleName, actionType)) {
      await prisma.auditLog.create({
        data: {
          admin_id:        (session.id || session.username) as string,
          admin_name:      session.username as string,
          action:          '403_FORBIDDEN',
          target_employee: `Module: ${moduleName}, Action: ${actionType}`,
          old_value:       'N/A',
          new_value:       'Access Denied via secureAction middleware',
        }
      });
      return { success: false, message: '403 Forbidden: Insufficient privileges.' };
    }

    // F5: Rate-limit WRITE actions per authenticated user
    if (actionType === 'WRITE') {
      const userId = (session.id || session.username) as string;
      const { allowed, remaining } = checkWriteRateLimit(userId);
      if (!allowed) {
        await prisma.auditLog.create({
          data: {
            admin_id:        userId,
            admin_name:      session.username as string,
            action:          'RATE_LIMITED',
            target_employee: `Module: ${moduleName}`,
            old_value:       'N/A',
            new_value:       `Exceeded ${WRITE_RATE_LIMIT} write actions/minute`,
          }
        });
        return {
          success: false,
          message: 'Too many requests. You have exceeded the write action limit. Please wait a moment.'
        };
      }
      // Remaining is available for future use (e.g., response headers)
      void remaining;
    }
  }

  try {
    return await handler(session);
  } catch (error: any) {
    // Information Disclosure mitigation: scrub internal error traces from the response
    console.error(`[SecureAction Error] ${moduleName || 'GLOBAL'} ${actionType || 'GLOBAL'}:`, error);

    if (error.message?.startsWith('Validation Error')) {
      return { success: false, message: error.message };
    }

    return { success: false, message: 'Internal Server Error. Please contact support.' };
  }
}
