'use client'

import { GoogleOneTap } from './GoogleOneTap'
import { usePathname } from 'next/navigation'

interface AuthLayoutProps {
  children: React.ReactNode
  // Enable Google One Tap
  enableOneTap?: boolean
  // Paths where One Tap should not be shown
  excludePaths?: string[]
}

export function AuthLayout({ 
  children, 
  enableOneTap = true,
  excludePaths = ['/auth', '/crm', '/admin']
}: AuthLayoutProps) {
  const pathname = usePathname()
  
  // Check if current path should exclude One Tap
  const shouldShowOneTap = enableOneTap && 
    !excludePaths.some(path => pathname.startsWith(path))

  return (
    <>
      {children}
      {shouldShowOneTap && (
        <GoogleOneTap 
          autoSelect={true}
          context="signin"
          redirectTo="/crm"
        />
      )}
    </>
  )
}