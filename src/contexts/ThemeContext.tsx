import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme
      console.log('Initializing theme from localStorage:', stored)
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setThemeState(stored)
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      console.log('Applying theme:', theme)
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark')

      let actualTheme = theme
      
      // If system theme, detect the actual theme
      if (theme === 'system') {
        actualTheme = mediaQuery.matches ? 'dark' : 'light'
      }

      // Apply the theme class
      if (actualTheme === 'dark') {
        root.classList.add('dark')
      }
      // For light theme, we don't need to add a class since it's the default

      // Also set a data attribute for debugging
      root.setAttribute('data-theme', actualTheme)
      
      console.log('Theme applied - Theme:', theme, 'Actual:', actualTheme, 'Classes:', root.classList.toString())
    }

    // Apply theme immediately
    applyTheme()

    // Always clean up any existing listener first
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme()
      }
    }

    // Only listen for system changes if theme is 'system'
    if (theme === 'system') {
      mediaQuery.addEventListener('change', handleSystemChange)
    }

    // Cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    console.log('Setting theme from', theme, 'to', newTheme)
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
    setThemeState(newTheme)
  }

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}