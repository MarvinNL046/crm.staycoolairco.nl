'use client'

import dynamic from 'next/dynamic'

// Dynamically import the theme toggle to ensure it's only rendered on the client
export const SafeThemeToggle = dynamic(
  () => import('./ThemeToggle').then(mod => ({ default: mod.SimpleThemeToggle })),
  { 
    ssr: false,
    loading: () => <div className="h-9 w-9" /> // Placeholder with same size
  }
)