'use client'

import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import type { CredentialResponse } from '@/types/google-one-tap'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { generateNonce } from '@/lib/auth/google-utils'

interface GoogleOneTapProps {
  // Optional: Redirect path after successful login
  redirectTo?: string
  // Optional: Whether to auto-select if user has previously signed in
  autoSelect?: boolean
  // Optional: Context for the sign-in (signin, signup, use)
  context?: 'signin' | 'signup' | 'use'
  // Optional: Callback after successful authentication
  onSuccess?: (data: any) => void
  // Optional: Callback on error
  onError?: (error: any) => void
}

export function GoogleOneTap({
  redirectTo = '/crm',
  autoSelect = true,
  context = 'signin',
  onSuccess,
  onError
}: GoogleOneTapProps) {
  const supabase = createClient()
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [])

  const initializeGoogleOneTap = async () => {
    if (isInitialized) return
    
    console.log('Initializing Google One Tap')
    
    try {
      // Generate nonce for security
      const [nonce, hashedNonce] = await generateNonce()
      
      // Check if there's already an existing session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        onError?.(error)
        return
      }
      
      if (session) {
        console.log('User already logged in, skipping One Tap')
        router.push(redirectTo)
        return
      }

      // Check if client ID is configured
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) {
        console.error('Google Client ID not configured')
        onError?.(new Error('Google Client ID not configured'))
        return
      }

      // Initialize Google One Tap
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: CredentialResponse) => {
          try {
            console.log('Google One Tap response received')
            
            // Sign in with the ID token
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce,
            })
            
            if (error) {
              console.error('Error signing in with Google:', error)
              onError?.(error)
              return
            }
            
            console.log('Successfully logged in with Google One Tap')
            onSuccess?.(data)
            
            // Refresh the router to update the session
            router.refresh()
            // Redirect to the specified path
            router.push(redirectTo)
          } catch (error) {
            console.error('Error during Google One Tap sign in:', error)
            onError?.(error)
          }
        },
        auto_select: autoSelect,
        context: context,
        nonce: hashedNonce,
        // Use FedCM for Chrome's third-party cookie phase-out
        use_fedcm_for_prompt: true,
        // Cancel if user clicks outside
        cancel_on_tap_outside: true,
        // Support for Intelligent Tracking Prevention
        itp_support: true,
      })

      // Display the One Tap UI
      window.google?.accounts.id.prompt((notification) => {
        console.log('One Tap prompt notification:', {
          displayed: notification.isDisplayed?.(),
          notDisplayedReason: notification.getNotDisplayedReason?.(),
          skippedReason: notification.getSkippedReason?.(),
          dismissedReason: notification.getDismissedReason?.(),
        })
      })

      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing Google One Tap:', error)
      onError?.(error)
    }
  }

  return (
    <Script 
      src="https://accounts.google.com/gsi/client" 
      strategy="afterInteractive"
      onReady={initializeGoogleOneTap}
    />
  )
}