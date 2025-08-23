import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check if environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not found, skipping authentication')
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes configuration
  const protectedRoutes = ['/admin', '/crm']
  const superAdminRoutes = ['/super-admin']
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password']
  const publicRoutes = ['/', '/auth/callback', '/auth/auth-code-error']
  
  const path = request.nextUrl.pathname

  // Check if the path starts with any protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isSuperAdminRoute = superAdminRoutes.some(route => path.startsWith(route))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))
  const isPublicRoute = publicRoutes.includes(path)

  // Super admin route protection
  if (isSuperAdminRoute && user) {
    // Check if user is super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!superAdmin) {
      // Not a super admin, redirect to regular CRM
      return NextResponse.redirect(new URL('/crm', request.url))
    }
  }

  // Handle tenant impersonation for super admins
  if (isProtectedRoute && user && !isSuperAdminRoute) {
    // Check if super admin is impersonating a tenant
    const impersonatingTenantId = request.cookies.get('impersonating_tenant_id')?.value
    const originalSuperAdminId = request.cookies.get('original_super_admin_id')?.value
    
    if (impersonatingTenantId && originalSuperAdminId) {
      // Super admin is impersonating, add tenant context to response headers
      supabaseResponse.headers.set('x-impersonating-tenant-id', impersonatingTenantId)
      supabaseResponse.headers.set('x-original-super-admin-id', originalSuperAdminId)
      
      // Allow access to CRM routes while impersonating
      return supabaseResponse
    }
  }

  // Redirect to login if accessing protected route without authentication
  if ((isProtectedRoute || isSuperAdminRoute) && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('next', path)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && user) {
    // Check if user is super admin to redirect to appropriate dashboard
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    
    const dashboardUrl = superAdmin ? '/super-admin' : '/crm'
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  // Special handling for update-password route - must be authenticated
  if (path === '/auth/update-password' && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}