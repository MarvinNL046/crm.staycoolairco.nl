'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { generateNonce } from '@/lib/auth/google-utils'
import type { CredentialResponse, GsiButtonConfiguration } from '@/types/google-one-tap'

interface GoogleSignInButtonProps {
  // Button customization
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
  // Behavior
  redirectTo?: string
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function GoogleSignInButton({
  type = 'standard',
  theme = 'outline',
  size = 'large',
  text = 'signin_with',
  shape = 'pill',
  logo_alignment = 'left',
  width,
  locale = 'nl',
  redirectTo = '/crm',
  onSuccess,
  onError
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  const [nonce, setNonce] = useState<string>('')
  const [hashedNonce, setHashedNonce] = useState<string>('')

  // Generate nonce on component mount
  useEffect(() => {
    generateNonce().then(([n, h]) => {
      setNonce(n)
      setHashedNonce(h)
    })
  }, [])

  // Create the callback function in the global scope
  useEffect(() => {
    // Define the callback function
    const handleCredentialResponse = async (response: CredentialResponse) => {
      try {
        console.log('Google Sign-In response received')
        
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          nonce: nonce,
        })
        
        if (error) {
          console.error('Error signing in with Google:', error)
          onError?.(error)
          return
        }
        
        console.log('Successfully logged in with Google')
        onSuccess?.(data)
        
        // Refresh and redirect
        router.refresh()
        router.push(redirectTo)
      } catch (error) {
        console.error('Error during Google sign in:', error)
        onError?.(error)
      }
    }

    // Attach to window object so Google can find it
    (window as any).handleGoogleSignIn = handleCredentialResponse

    // Cleanup
    return () => {
      delete (window as any).handleGoogleSignIn
    }
  }, [nonce, supabase, router, redirectTo, onSuccess, onError])

  const initializeGoogleSignIn = () => {
    if (isInitialized || !buttonRef.current || !hashedNonce) return

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      console.error('Google Client ID not configured')
      onError?.(new Error('Google Client ID not configured'))
      return
    }

    try {
      // Initialize Google Sign-In
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: (window as any).handleGoogleSignIn,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
      })

      // Render the button
      const buttonConfig: GsiButtonConfiguration = {
        type,
        theme,
        size,
        text,
        shape,
        logo_alignment,
        locale,
      }

      if (width) {
        buttonConfig.width = width
      }

      window.google?.accounts.id.renderButton(
        buttonRef.current,
        buttonConfig
      )

      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing Google Sign-In button:', error)
      onError?.(error)
    }
  }

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onReady={initializeGoogleSignIn}
      />
      <div 
        ref={buttonRef}
        className="google-signin-button"
        style={{ 
          display: 'inline-block',
          minHeight: size === 'large' ? '44px' : size === 'medium' ? '40px' : '32px' 
        }}
      />
    </>
  )
}