'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendOTP } from '@/lib/email';

const prisma = new PrismaClient();

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing.');
}
const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

// In-memory rate limiting storage
const rateLimits = new Map<string, { attempts: number, lockUntil: number | null }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const loginSchema = z.object({
  email: z.string().email("Valid email is required."),
  password: z.string().min(1, "Password is required.")
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/\d/, "Password must contain at least one number.")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character.")
});

const codeSchema = z.string().length(6, "OTP code must be 6 digits.");

export async function loginAction(formData: FormData) {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password')
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    const { email, password } = parsed.data;

    const now = Date.now();
    const rateLimitKey = email.toLowerCase();
    let rateLimitInfo = rateLimits.get(rateLimitKey) || { attempts: 0, lockUntil: null };

    if (rateLimitInfo.lockUntil && now < rateLimitInfo.lockUntil) {
      const remainingTime = Math.ceil((rateLimitInfo.lockUntil - now) / 60000);
      return { success: false, message: `Validation Error: Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.` };
    }

    const activeSuperAdmins = await prisma.admin.count({ where: { role: 'SUPER_ADMIN', status: 'APPROVED' } });
    if (activeSuperAdmins === 0) {
      const defaultUser = process.env.DEFAULT_ADMIN_USER || 'admin';
      const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@salarize.com';
      const defaultPass = process.env.DEFAULT_ADMIN_PASS || 'Admin@123!';
      const hash = await bcrypt.hash(defaultPass, 10);

      const existingAdmin = await prisma.admin.findUnique({ where: { username: defaultUser } });
      if (!existingAdmin) {
        await prisma.admin.create({
          data: { username: defaultUser, email: defaultEmail, password_hash: hash, role: 'SUPER_ADMIN', status: 'APPROVED' }
        });

        await prisma.auditLog.create({
          data: {
            admin_id: 'SYSTEM',
            admin_name: 'SYSTEM',
            action: 'GENESIS ACCOUNT CREATED',
            target_employee: `Username: ${defaultUser}`,
            old_value: 'NULL',
            new_value: 'STATUS: APPROVED'
          }
        });
      }
    }

    const user = await prisma.admin.findUnique({ where: { email } });

    if (!user) {
      rateLimitInfo.attempts += 1;
      if (rateLimitInfo.attempts >= MAX_ATTEMPTS) rateLimitInfo.lockUntil = now + LOCK_TIME_MS;
      rateLimits.set(rateLimitKey, rateLimitInfo);

      await prisma.auditLog.create({
        data: {
          admin_id: 'UNKNOWN',
          admin_name: email,
          action: 'LOGIN_FAILED',
          target_employee: 'SYSTEM',
          old_value: 'N/A',
          new_value: 'Invalid credentials',
        }
      });

      return { success: false, message: 'Invalid credentials.' };
    }

    if (user.status === 'PENDING') {
      return { success: false, message: '403 Forbidden: Account pending approval by an administrator.' };
    }

    if (user.status === 'SUSPENDED') {
      return { success: false, message: '403 Forbidden: Account suspended. Contact a system administrator.' };
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      rateLimitInfo.attempts += 1;
      if (rateLimitInfo.attempts >= MAX_ATTEMPTS) rateLimitInfo.lockUntil = now + LOCK_TIME_MS;
      rateLimits.set(rateLimitKey, rateLimitInfo);

      await prisma.auditLog.create({
        data: {
          admin_id: user.id,
          admin_name: user.username,
          action: 'LOGIN_FAILED',
          target_employee: 'SYSTEM',
          old_value: 'N/A',
          new_value: 'Invalid password',
        }
      });

      return { success: false, message: 'Invalid credentials.' };
    }

    // Reset rate limits on successful login
    rateLimits.delete(rateLimitKey);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await sendOTP(user.email, otpCode);

    const pendingJwt = await new SignJWT({ id: user.id, username: user.username, role: user.role, code: otpCode })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m') // 5 minutes to enter code
      .sign(key);

    const cookieStore = await cookies();
    cookieStore.set('salarize_2fa_pending', pendingJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5 // 5 minutes
    });

    return { success: true, requires2FA: true, message: 'Please enter the 6-digit authentication code sent to your email.' };
  } catch (error) {
    console.error('[Login Error]:', error);
    return { success: false, message: 'Internal Server Error. Please contact support.' };
  }
}

export async function verify2FAAction(formData: FormData) {
  try {
    const parsed = codeSchema.safeParse(formData.get('code'));
    if (!parsed.success) return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    const code = parsed.data;

    const cookieStore = await cookies();
    const pendingSession = cookieStore.get('salarize_2fa_pending')?.value;

    if (!pendingSession) {
      return { success: false, message: 'Validation Error: 2FA session expired. Please log in again.' };
    }

    const { payload } = await jwtVerify(pendingSession, key);

    if (payload.code !== code) {
      return { success: false, message: 'Validation Error: Invalid authentication code.' };
    }

    // Code is valid! Issue the real session cookie
    await prisma.auditLog.create({
      data: {
        admin_id: payload.id as string,
        admin_name: payload.username as string,
        action: 'LOGIN_SUCCESS_2FA',
        target_employee: 'SYSTEM',
        old_value: 'N/A',
        new_value: 'Authenticated with 2FA',
      }
    });

    const jwt = await new SignJWT({ id: payload.id, username: payload.username, role: payload.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(key);

    cookieStore.set('salarize_session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Destroy the pending 2FA token
    cookieStore.delete('salarize_2fa_pending');

    return { success: true, message: 'Authenticated successfully.' };
  } catch (error) {
    console.error('[2FA Error]:', error);
    return { success: false, message: 'Invalid or expired session.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('salarize_session');
  return { success: true };
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('salarize_session')?.value;
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, key);

    // Lightweight DB Check: Verify the admin still exists, role matches, and is APPROVED
    const admin = await prisma.admin.findUnique({
      where: { id: payload.id as string }
    });

    if (!admin || admin.role !== payload.role || admin.status !== 'APPROVED') {
      return null;
    }

    return payload as { id: string, username: string, role: string };
  } catch (error) {
    return null;
  }
}

export async function requestAccessAction(formData: FormData) {
  try {
    const parsed = registerSchema.safeParse({
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password')
    });

    if (!parsed.success) {
      return { success: false, message: `Validation Error: ${parsed.error.issues[0].message}` };
    }

    const { username, email, password } = parsed.data;

    const now = Date.now();
    const rateLimitKey = `req_${username.toLowerCase()}`;
    let rateLimitInfo = rateLimits.get(rateLimitKey) || { attempts: 0, lockUntil: null };

    if (rateLimitInfo.lockUntil && now < rateLimitInfo.lockUntil) {
      const remainingTime = Math.ceil((rateLimitInfo.lockUntil - now) / 60000);
      return { success: false, message: `Validation Error: Account locked due to too many requests. Try again in ${remainingTime} minutes.` };
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { username } });
    if (existingAdmin) {
      rateLimitInfo.attempts += 1;
      if (rateLimitInfo.attempts >= MAX_ATTEMPTS) rateLimitInfo.lockUntil = now + LOCK_TIME_MS;
      rateLimits.set(rateLimitKey, rateLimitInfo);
      return { success: false, message: 'Validation Error: Username is already taken.' };
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.admin.create({
      data: {
        username,
        email,
        password_hash,
        role: 'UNASSIGNED',
        status: 'PENDING'
      }
    });

    await prisma.auditLog.create({
      data: {
        admin_id: 'SYSTEM',
        admin_name: 'SYSTEM',
        action: 'ACCOUNT REQUESTED',
        target_employee: `Username: ${username}`,
        old_value: 'NULL',
        new_value: 'STATUS: PENDING'
      }
    });

    // Reset rate limits on success
    rateLimits.delete(rateLimitKey);

    return { success: true, message: 'Access request submitted successfully. An administrator must approve your account.' };
  } catch (error) {
    console.error('[Request Access Error]:', error);
    return { success: false, message: 'Internal Server Error. Please contact support.' };
  }
}

export async function sendStepUpOTPAction() {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const user = await prisma.admin.findUnique({ where: { id: session.id } });
    if (!user) return { success: false, message: 'User not found' };

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await sendOTP(user.email, otpCode);

    const stepUpJwt = await new SignJWT({ id: user.id, code: otpCode })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(key);

    const cookieStore = await cookies();
    cookieStore.set('salarize_stepup_pending', stepUpJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5 // 5 minutes
    });

    return { success: true, message: 'Step-up OTP sent.' };
  } catch (error) {
    console.error('[StepUp Error]:', error);
    return { success: false, message: 'Failed to send OTP.' };
  }
}
