'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_salarize';
const key = new TextEncoder().encode(secretKey);

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, message: 'Missing credentials.' };
  }

  // Seed a SUPER_ADMIN if none exist to prevent lockouts
  const adminCount = await prisma.admin.count();
  if (adminCount === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
      data: { username: 'admin', password_hash: hash, role: 'SUPER_ADMIN' }
    });
  }

  const user = await prisma.admin.findUnique({ where: { username } });
  if (!user) return { success: false, message: 'Invalid credentials.' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return { success: false, message: 'Invalid credentials.' };

  const jwt = await new SignJWT({ id: user.id, username: user.username, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set('salarize_session', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 2 // 2 hours
  });

  return { success: true, message: 'Authenticated successfully.' };
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
    return payload;
  } catch (error) {
    return null;
  }
}
