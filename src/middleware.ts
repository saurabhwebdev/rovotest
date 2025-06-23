// Note: Firebase Auth state is managed client-side, so we can't use middleware for auth checks
// We'll handle auth redirects in the client components instead

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We'll let client-side components handle auth redirects
  return NextResponse.next();
}

// We're not using middleware for auth protection anymore
export const config = {
  matcher: [],
};