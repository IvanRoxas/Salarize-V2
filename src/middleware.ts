import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super_secret_jwt_key_salarize';
const key = new TextEncoder().encode(secretKey);

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('salarize_session')?.value;

  // Protect all routes except /login
  if (req.nextUrl.pathname !== '/login') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    try {
      await jwtVerify(session, key);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // If at /login but already authenticated, redirect to Dashboard
  if (req.nextUrl.pathname === '/login' && session) {
    try {
      await jwtVerify(session, key);
      return NextResponse.redirect(new URL('/', req.url));
    } catch (err) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
