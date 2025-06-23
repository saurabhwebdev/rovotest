// Note: Firebase Auth state is managed client-side, so we can't use middleware for auth checks
// We'll handle auth redirects in the client components instead

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // We'll let client-side components handle auth redirects
  // This prevents refresh loops and conflicts with Firebase Auth
  return NextResponse.next();
}

// We're not using middleware for auth protection anymore
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
    '/((?!api|_next/static|_next/image|favicon.ico|sounds).*)',
  ],
};