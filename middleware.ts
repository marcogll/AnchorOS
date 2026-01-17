/**
 * @description Middleware for protecting Aperture routes
 * Only users with admin, manager, or staff roles can access Aperture
 */

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Temporarily disable middleware authentication
  // Rely on client-side AuthProvider for protection
  // TODO: Implement proper server-side session validation with Supabase SSR

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/aperture/:path*',
    '/api/aperture/:path*',
  ],
}
