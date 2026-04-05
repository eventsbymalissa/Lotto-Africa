// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/login', '/register', '/results', '/draw']
const ADMIN_PATHS = ['/admin']
const PLAYER_PATHS = ['/player', '/buy-tickets', '/verify-id']
const VERIFIED_ONLY_PATHS = ['/buy-tickets']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith('/api/auth'))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  const session = await getSessionFromRequest(req)

  // Not logged in — redirect to login
  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Admin-only routes
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/player', req.url))
    }
  }

  // Player routes — must be logged in (already checked above)
  if (PLAYER_PATHS.some(p => pathname.startsWith(p))) {
    if (session.role === 'ADMIN') {
      // Admins can still view player pages
    }
  }

  // Verified-only routes (e.g. buying tickets)
  if (VERIFIED_ONLY_PATHS.some(p => pathname.startsWith(p))) {
    if (session.verificationStatus !== 'VERIFIED' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/verify-id', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
