import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is a customer route
  if (pathname.startsWith('/customer') && pathname !== '/customer/login' && pathname !== '/customer/register') {
    // Get token from cookies or Authorization header
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }

    try {
      // Verify simple token (for development)
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check if token is expired
      if (decoded.exp && Date.now() / 1000 > decoded.exp) {
        return NextResponse.redirect(new URL('/customer/login', request.url));
      }
      
      // Check if it's a customer token
      if (decoded.userType !== 'customer') {
        return NextResponse.redirect(new URL('/customer/login', request.url));
      }

      // Add user info to headers for use in pages
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-email', decoded.email);
      requestHeaders.set('x-user-type', decoded.userType);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // Token is invalid, redirect to login
      return NextResponse.redirect(new URL('/customer/login', request.url));
    }
  }

  // Admin routes are protected by client-side AdminProtectedRoute component
  // We don't block them here to allow the client-side auth check to work properly
  // The AdminProtectedRoute will redirect non-admin users to /customer/dashboard
  if (pathname.startsWith('/admin')) {
    // Just check if there's a token - let client-side handle admin verification
    const token = request.cookies.get('access_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      // No token - redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Token exists - let client-side AdminProtectedRoute handle admin verification
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/admin/:path*'
  ]
};
