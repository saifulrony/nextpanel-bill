import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/shop',
  '/cart',
  '/checkout',
  '/pricing',
  '/test-api',
  '/test-auth',
];

// Routes that require authentication (admin routes)
const protectedRoutes = [
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔒 Middleware triggered for:', pathname);
  
  // Check if the route is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the route is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Get the access token from cookies
  const accessToken = request.cookies.get('access_token')?.value;
  
  console.log('🔑 Access token present:', !!accessToken);
  console.log('🛡️ Is protected route:', isProtectedRoute);
  console.log('🌍 Is public route:', isPublicRoute);
  
  // If accessing a protected route without authentication
  if (isProtectedRoute && (!accessToken || accessToken.trim() === '')) {
    console.log('❌ Redirecting to login - no valid token');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing public routes while authenticated, allow it
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes with authentication, allow access
  if (isProtectedRoute && accessToken) {
    console.log('✅ Allowing access to protected route');
    return NextResponse.next();
  }
  
  // Default: allow the request
  console.log('✅ Allowing request (default)');
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

