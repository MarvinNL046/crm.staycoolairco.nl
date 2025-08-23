import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { extractProviderToken } from '@/lib/auth/google-utils'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/crm'
  
  // Ensure the redirect URL is relative for security
  if (!next.startsWith('/')) {
    next = '/crm'
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // Extract Google OAuth tokens if needed for Google API access
      const googleTokens = extractProviderToken(data.session)
      
      if (googleTokens) {
        // SECURITY: Only log in development mode to prevent sensitive data leaks
        if (process.env.NODE_ENV === 'development') {
          console.log('Google OAuth tokens available:', {
            hasAccessToken: !!googleTokens.provider_token,
            hasRefreshToken: !!googleTokens.provider_refresh_token
          })
        }
        
        // In a production app, you might want to store these tokens securely
        // for later use when accessing Google APIs on behalf of the user
        // For example, storing them in a secure database or session storage
      }

      // Get the current user's profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && process.env.NODE_ENV === 'development') {
        // SECURITY: Only log user details in development mode
        console.log('User logged in successfully:', {
          id: user.id,
          email: user.email,
          provider: user.app_metadata.provider
        })
      }

      // Handle redirect based on environment
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // Local development - no load balancer
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        // Production with load balancer
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        // Production without load balancer
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      // Log the error for debugging
      console.error('Error exchanging code for session:', error)
      
      // Redirect to error page with error details
      const errorUrl = new URL('/auth/auth-code-error', origin)
      if (error?.message) {
        errorUrl.searchParams.set('error', error.message)
      }
      return NextResponse.redirect(errorUrl)
    }
  }

  // No code provided - redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
}