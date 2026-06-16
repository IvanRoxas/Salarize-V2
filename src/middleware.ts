import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing.');
}
const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function middleware(req: NextRequest) {
  const session = req.cookies.get('salarize_session')?.value;
  
  // Define strict Content Security Policy
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

  const applyHeaders = (res: NextResponse) => {
    res.headers.set('Content-Security-Policy', cspHeader);
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    return res;
  };

  // Protect all routes except /login
  if (req.nextUrl.pathname !== '/login') {
    if (!session) {
      return applyHeaders(NextResponse.redirect(new URL('/login', req.url)));
    }
    try {
      await jwtVerify(session, key);
      return applyHeaders(NextResponse.next());
    } catch (err) {
      return applyHeaders(NextResponse.redirect(new URL('/login', req.url)));
    }
  }

  // If at /login but already authenticated, redirect to Dashboard
  if (req.nextUrl.pathname === '/login' && session) {
    try {
      await jwtVerify(session, key);
      return applyHeaders(NextResponse.redirect(new URL('/', req.url)));
    } catch (err) {
      return applyHeaders(NextResponse.next());
    }
  }

  return applyHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
