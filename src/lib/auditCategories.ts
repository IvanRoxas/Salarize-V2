/**
 * Canonical lists of audit log action types.
 *
 * ACCESS_LOG_ACTIONS   → login/security events shown in the Access Logs page
 * ACTIVITY_LOG_ACTIONS → operational events shown in the Activity History page
 *
 * Any action NOT in ACCESS_LOG_ACTIONS is considered an operational action.
 * These lists are the single source of truth — update here and both pages
 * will reflect the change automatically.
 */

export const ACCESS_LOG_ACTIONS = [
  // Authentication
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGIN_SUCCESS_2FA',
  // Authorization denials
  '403_FORBIDDEN',
  'UNAUTHORIZED_LOGIN_ATTEMPT',
  'UNAUTHORIZED',
  // Rate limiting
  'RATE_LIMITED',
  // Account lifecycle (auth-related)
  'ACCOUNT REQUESTED',
  'GENESIS ACCOUNT CREATED',
] as const;

export type AccessLogAction = (typeof ACCESS_LOG_ACTIONS)[number];
