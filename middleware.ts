import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const allowedRoutes = ['/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.startsWith('/data')) {
    return NextResponse.next()
  }

  if (allowedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }

  const url = request.nextUrl.clone()
  url.pathname = '/'
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/:path*'],
}
