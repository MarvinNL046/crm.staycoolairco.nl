import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check for Supabase auth cookies with the correct pattern
  // Supabase uses cookies like: sb-<project-ref>-auth-token
  const cookies = request.cookies.getAll()
  
  // Look for any Supabase auth cookies
  const hasAuthCookie = cookies.some(cookie => 
    cookie.name.includes('sb-') && 
    (cookie.name.includes('-auth-token') || cookie.name.includes('-auth-token.0'))
  )

  // protected routes
  if (!hasAuthCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // redirect to dashboard if user is logged in and tries to access auth pages
  if (hasAuthCookie && request.nextUrl.pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}