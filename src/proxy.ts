import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'presensistimi-secret-key-32-chars-long-secure-token',
  });

  const { pathname } = request.nextUrl;

  // Jika belum login dan mengakses area terproteksi
  const isAuthRoute =
    pathname.startsWith('/pegawai') ||
    pathname.startsWith('/atasan') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard');

  if (isAuthRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login dan mencoba mengakses /login
  if (pathname === '/login' && token) {
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else if (token.role === 'ATASAN') {
      return NextResponse.redirect(new URL('/atasan/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/pegawai/dashboard', request.url));
    }
  }

  // Pengarah rute root /dashboard berdasarkan role
  if (pathname === '/dashboard' && token) {
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else if (token.role === 'ATASAN') {
      return NextResponse.redirect(new URL('/atasan/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/pegawai/dashboard', request.url));
    }
  }

  // Proteksi Khusus Role ADMIN
  if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Proteksi Khusus Role ATASAN (Admin juga boleh mengakses)
  if (
    pathname.startsWith('/atasan') &&
    token?.role !== 'ATASAN' &&
    token?.role !== 'ADMIN'
  ) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Admin tidak mengakses area presensi personal pegawai (arahkan ke admin dashboard)
  if (pathname.startsWith('/pegawai') && token?.role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/atasan/:path*',
    '/pegawai/:path*',
    '/dashboard/:path*',
    '/login',
  ],
};
