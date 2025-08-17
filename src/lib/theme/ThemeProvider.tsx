'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { lightTheme, darkTheme, type ThemeColors } from './colors'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  colors: ThemeColors
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'staycool-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Resolve the actual theme (light or dark)
  const resolvedTheme: 'light' | 'dark' = 
    theme === 'system' ? getSystemTheme() : theme

  // Get theme colors
  const colors = resolvedTheme === 'dark' ? darkTheme : lightTheme

  // Load theme from storage on mount
  useEffect(() => {
    setMounted(true)
    
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeState(stored as Theme)
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error)
    }
  }, [storageKey])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      // Force re-render when system theme changes
      setThemeState('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    // Remove previous theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    root.classList.add(resolvedTheme)
    
    // Set CSS custom properties for seamless integration
    const cssVars = {
      '--background-primary': colors.background.primary,
      '--background-secondary': colors.background.secondary,
      '--background-tertiary': colors.background.tertiary,
      '--background-elevated': colors.background.elevated,
      '--background-sidebar': colors.background.sidebar,
      '--background-input': colors.background.input,
      
      '--text-primary': colors.text.primary,
      '--text-secondary': colors.text.secondary,
      '--text-tertiary': colors.text.tertiary,
      '--text-inverse': colors.text.inverse,
      '--text-placeholder': colors.text.placeholder,
      '--text-disabled': colors.text.disabled,
      
      '--interactive-primary': colors.interactive.primary,
      '--interactive-primary-hover': colors.interactive.primaryHover,
      '--interactive-primary-active': colors.interactive.primaryActive,
      '--interactive-secondary': colors.interactive.secondary,
      '--interactive-secondary-hover': colors.interactive.secondaryHover,
      '--interactive-danger': colors.interactive.danger,
      '--interactive-danger-hover': colors.interactive.dangerHover,
      
      '--border-primary': colors.border.primary,
      '--border-secondary': colors.border.secondary,
      '--border-input': colors.border.input,
      '--border-focus': colors.border.focus,
      
      '--status-success': colors.status.success,
      '--status-warning': colors.status.warning,
      '--status-error': colors.status.error,
      '--status-info': colors.status.info,
    }

    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }, [resolvedTheme, colors, mounted])

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme)
      setThemeState(newTheme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
      setThemeState(newTheme)
    }
  }

  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    colors,
    setTheme,
    toggleTheme
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Utility hook for getting theme-aware classes
export const useThemeClasses = () => {
  const { resolvedTheme } = useTheme()
  
  return {
    // Background classes
    bgPrimary: resolvedTheme === 'dark' ? 'bg-neutral-950' : 'bg-white',
    bgSecondary: resolvedTheme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-50',
    bgTertiary: resolvedTheme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100',
    bgElevated: resolvedTheme === 'dark' ? 'bg-neutral-900' : 'bg-white',
    bgSidebar: resolvedTheme === 'dark' ? 'bg-neutral-950' : 'bg-neutral-900',
    
    // Text classes
    textPrimary: resolvedTheme === 'dark' ? 'text-neutral-100' : 'text-neutral-900',
    textSecondary: resolvedTheme === 'dark' ? 'text-neutral-300' : 'text-neutral-700',
    textTertiary: resolvedTheme === 'dark' ? 'text-neutral-400' : 'text-neutral-600',
    textInverse: resolvedTheme === 'dark' ? 'text-neutral-900' : 'text-white',
    textPlaceholder: resolvedTheme === 'dark' ? 'text-neutral-500' : 'text-neutral-500',
    textDisabled: resolvedTheme === 'dark' ? 'text-neutral-600' : 'text-neutral-400',
    
    // Border classes
    borderPrimary: resolvedTheme === 'dark' ? 'border-neutral-700' : 'border-neutral-200',
    borderSecondary: resolvedTheme === 'dark' ? 'border-neutral-600' : 'border-neutral-300',
    borderInput: resolvedTheme === 'dark' ? 'border-neutral-600' : 'border-neutral-300',
    
    // Interactive classes
    btnPrimary: resolvedTheme === 'dark' 
      ? 'bg-primary-500 hover:bg-primary-400 text-white' 
      : 'bg-primary-600 hover:bg-primary-700 text-white',
    btnSecondary: resolvedTheme === 'dark'
      ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-100'
      : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900',
  }
}