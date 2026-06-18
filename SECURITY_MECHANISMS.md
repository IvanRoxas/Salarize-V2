# Security Threat Prevention Mechanisms

This document details how the Salarize Employee Management System prevents and blocks various security threats.

---

## 1. PARAMETER_TAMPERING Prevention

### Threat Description
Attackers attempt to manipulate input parameters to bypass business logic, such as setting invalid salary values (e.g., -999999) to cause data corruption or financial fraud.

### Prevention Implementation

#### 1.1 Zod Schema Validation
**Location**: `src/app/actions/employee.ts` (lines 8-17)

```typescript
const employeeSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters."),
  last_name: z.string().min(2, "Last name must be at least 2 characters."),
  email: z.string().email("Invalid email format."),
  contact: z.string().optional().default(''),
  position_id: z.string().min(1, "Position ID is required."),
  status: z.string().min(1, "Status is required."),
  gender: z.string().optional().default('Not Specified'),
  actual_salary: z.coerce.number().optional()
});
```

**How it works**:
- Enforces type coercion to ensure numeric values for salary
- Validates string lengths and formats
- Rejects malformed data before it reaches business logic

#### 1.2 Salary Boundary Validation
**Location**: `src/app/actions/employee.ts` (lines 48-61, 126-136, 245-246)

```typescript
// Salary Validation
if (actual_salary !== undefined) {
  if (!checkAccess(session.role as string, 'PAYROLL_OPERATIONS', 'WRITE')) {
    return { success: false, message: '403 Forbidden: Only HR Managers can set custom salaries.' };
  }
  if (actual_salary < position.min_salary || actual_salary > position.max_salary) {
    return { 
      success: false, 
      message: `Validation Error: Salary must be strictly between ₱${position.min_salary.toLocaleString()} and ₱${position.max_salary.toLocaleString()}.` 
    };
  }
}
```

**How it works**:
- Compares salary against position-defined `min_salary` and `max_salary`
- Blocks values outside the authorized pay grade range
- The -999999 attack is blocked because it's below any reasonable minimum salary

#### 1.3 Role-Based Access Control (RBAC)
**Location**: `src/lib/security.ts` (lines 5-38)

```typescript
const RolePermissions: Record<Role, Record<Module, ActionType[]>> = {
  HR_MANAGER: {
    PAYROLL_OPERATIONS: ['READ', 'WRITE'],
    // ... other permissions
  },
  // ... other roles
};
```

**How it works**:
- Only users with `PAYROLL_OPERATIONS` WRITE permission can modify salaries
- Prevents privilege escalation attempts
- Enforces Separation of Duties (SoD)

### Attack Flow Example
1. Attacker submits salary update with value -999999
2. Zod schema coerces value to number
3. Boundary validation checks: -999999 < position.min_salary
4. System returns error: "Validation Error: Salary must be strictly between..."
5. Attack is blocked and logged to audit trail

---

## 2. DATA_EXFILTRATION Prevention

### Threat Description
Attackers attempt to extract large amounts of sensitive data (e.g., 500 records in 10 seconds) by making rapid read requests to the database.

### Prevention Implementation

#### 2.1 WRITE Rate Limiter
**Location**: `src/lib/security.ts` (lines 50-75)

```typescript
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
```

**How it works**:
- Tracks write actions per user in memory
- Limits to 60 write operations per minute per user
- Automatically resets when time window expires
- Returns remaining quota for monitoring

#### 2.2 Rate Limit Enforcement
**Location**: `src/lib/security.ts` (lines 112-134)

```typescript
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
}
```

**How it works**:
- Applied via `secureAction` wrapper on all WRITE operations
- Logs rate limit violations to audit trail
- Returns user-friendly error message

### Current Limitations
⚠️ **READ operations are NOT rate-limited** in the current implementation. The system only protects against:
- Rapid write operations (data modification)
- Bulk data updates
- Mass deletion attempts

**Recommendation**: Implement READ rate limiting to prevent data exfiltration through rapid queries.

---

## 3. SECURITY_SCAN (Port Scan) Prevention

### Threat Description
Attackers perform port scanning and network reconnaissance to identify open ports, services, and potential vulnerabilities.

### Current Implementation Status
❌ **Not Implemented** - The current codebase does not include port scan detection mechanisms.

### Existing Security Measures (Indirect Protection)

#### 3.1 Content Security Policy (CSP)
**Location**: `src/middleware.ts` (lines 15-26)

```typescript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();
```

**How it works**:
- Restricts resource loading to same-origin
- Prevents XSS attacks that could lead to further reconnaissance
- Blocks iframe embedding (clickjacking protection)

#### 3.2 Security Headers
**Location**: `src/middleware.ts` (lines 28-34)

```typescript
const applyHeaders = (res: NextResponse) => {
  res.headers.set('Content-Security-Policy', cspHeader);
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
};
```

**How it works**:
- `X-XSS-Protection`: Enables browser XSS filtering
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing

### Recommendation
Port scan detection typically requires:
- Network-level monitoring (outside application scope)
- Intrusion Detection Systems (IDS)
- Rate limiting on connection attempts
- IP-based blocking for suspicious patterns

For application-level protection, consider:
- Implementing IP-based rate limiting
- Adding request pattern analysis
- Integrating with security services (Cloudflare, AWS WAF)

---

## 4. Additional Security Layers

### 4.1 Login Rate Limiting
**Location**: `src/app/actions/auth.ts` (lines 18-21, 52-59)

```typescript
const rateLimits = new Map<string, { attempts: number, lockUntil: number | null }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

if (rateLimitInfo.lockUntil && now < rateLimitInfo.lockUntil) {
  const remainingTime = Math.ceil((rateLimitInfo.lockUntil - now) / 60000);
  return { success: false, message: `Validation Error: Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.` };
}
```

**Prevents**: Brute force attacks, credential stuffing

### 4.2 Two-Factor Authentication (2FA)
**Location**: `src/app/actions/auth.ts` (lines 139-158)

```typescript
const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
await sendOTP(user.email, otpCode);

const pendingJwt = await new SignJWT({ id: user.id, username: user.username, role: user.role, code: otpCode })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('5m')
  .sign(key);
```

**Prevents**: Session hijacking, unauthorized access even with valid credentials

### 4.3 JWT Session Management
**Location**: `src/app/actions/auth.ts` (lines 196-207)

```typescript
const jwt = await new SignJWT({ id: payload.id, username: payload.username, role: payload.role })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('2h')
  .sign(key);

cookieStore.set('salarize_session', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 2 // 2 hours
});
```

**Prevents**: Session fixation, XSS token theft

### 4.4 Centralized Security Middleware
**Location**: `src/lib/security.ts` (lines 85-149)

```typescript
export async function secureAction<T>(
  moduleName: Module | null,
  actionType: ActionType | null,
  handler: (session: any) => Promise<T>
): Promise<any> {
  const session = await getSession();

  if (!session) {
    return { success: false, message: 'Unauthorized. No active session.' };
  }

  // RBAC gate
  if (moduleName && actionType) {
    if (!checkAccess(session.role as string, moduleName, actionType)) {
      // Log and deny
    }
    // Rate limiting
    if (actionType === 'WRITE') {
      // Apply rate limit
    }
  }

  try {
    return await handler(session);
  } catch (error: any) {
    // Information disclosure mitigation
    return { success: false, message: 'Internal Server Error. Please contact support.' };
  }
}
```

**Prevents**: 
- Unauthorized access
- Privilege escalation
- Information disclosure through error messages

### 4.5 Comprehensive Audit Logging
**Location**: Throughout the application

```typescript
await prisma.auditLog.create({
  data: {
    admin_id: (session.id || session.username) as string,
    admin_name: session.username as string,
    action: 'UPDATE SALARY',
    target_employee: `${employee.first_name} ${employee.last_name}`,
    old_value: JSON.stringify({ actual_salary: employee.actual_salary }),
    new_value: JSON.stringify({ actual_salary: salary }),
  }
});
```

**Provides**: 
- Forensic trail for security incidents
- Compliance evidence
- Attack pattern analysis

---

## 5. Security Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│  1. Network/Infrastructure (Not in scope)                  │
│     - Port scan detection (RECOMMENDED)                     │
│     - DDoS protection                                       │
│     - IP-based filtering                                    │
├─────────────────────────────────────────────────────────────┤
│  2. Application Middleware                                  │
│     - CSP Headers                                           │
│     - Security Headers (XSS, Frame, Content-Type)           │
│     - JWT Session Validation                                │
├─────────────────────────────────────────────────────────────┤
│  3. Authentication & Authorization                         │
│     - Login Rate Limiting (5 attempts / 15 min lock)        │
│     - Two-Factor Authentication (2FA)                       │
│     - Role-Based Access Control (RBAC)                      │
│     - Session Management (httpOnly, secure, sameSite)       │
├─────────────────────────────────────────────────────────────┤
│  4. Input Validation & Business Logic                       │
│     - Zod Schema Validation                                 │
│     - Salary Boundary Validation                            │
│     - Type Coercion                                         │
│     - secureAction Wrapper                                   │
├─────────────────────────────────────────────────────────────┤
│  5. Rate Limiting                                           │
│     - WRITE Rate Limiting (60 actions / minute)             │
│     - READ Rate Limiting (NOT IMPLEMENTED - RECOMMENDED)     │
├─────────────────────────────────────────────────────────────┤
│  6. Monitoring & Auditing                                   │
│     - Comprehensive Audit Logging                           │
│     - Security Event Classification                         │
│     - Activity History Tracking                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Recommendations for Enhancement

### High Priority
1. **Implement READ Rate Limiting**: Add rate limiting for query operations to prevent data exfiltration
2. **Add IP-Based Rate Limiting**: Implement per-IP limits to prevent distributed attacks
3. **Implement Request Pattern Analysis**: Detect anomalous query patterns

### Medium Priority
4. **Add Port Scan Detection**: Integrate with network monitoring tools
5. **Implement CAPTCHA**: Add CAPTCHA for suspicious login patterns
6. **Add Account Lockout Notifications**: Alert users when their account is locked

### Low Priority
7. **Enhance Audit Log Analysis**: Implement automated threat detection from audit logs
8. **Add Security Dashboard**: Real-time security monitoring interface
9. **Implement Security Headers Reporting**: Add security.txt and related standards

---

## 7. Testing Security Mechanisms

The system includes penetration testing simulation scripts:

- `simulate_attacks.js`: Simulates brute force and access control bypass attempts
- `simulate-pen-test.ts`: Injects simulated security logs for testing

These scripts help validate that security mechanisms are working correctly and that audit logs properly capture security events.

---

*Last Updated: June 18, 2026*
*System Version: Salarize Employee Management System v2.0*
