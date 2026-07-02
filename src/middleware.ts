/**
 * @file Next.js Middleware
 * Request/response middleware for authentication, authorization, etc.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware to handle authentication and authorization
 */
export function middleware(request: NextRequest) {
  // Middleware implementation will be added later

  return NextResponse.next()
}

/**
 * Configure which routes to apply middleware to
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
