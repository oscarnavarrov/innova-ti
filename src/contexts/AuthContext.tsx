import React, { createContext, useContext, useState, useEffect } from 'react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { supabase } from '../utils/supabase/client'

interface User {
  id: string
  email: string
  full_name: string
  role_id?: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
  getToken: () => Promise<string | null>
  getTokenSync: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2e05cbde`

  // Check for existing session on mount and listen for auth changes
  useEffect(() => {
    checkSession()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          localStorage.removeItem('auth_token')
        } else if (event === 'SIGNED_IN' && session) {
          localStorage.setItem('auth_token', session.access_token)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          localStorage.setItem('auth_token', session.access_token)
          
          // Re-validate with server if we have a user but token was refreshed
          if (user) {
            try {
              const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ access_token: session.access_token })
              })

              if (response.ok) {
                const serverData = await response.json()
                setUser(serverData.user)
              } else {
                await supabase.auth.signOut()
              }
            } catch (error) {
              console.error('Error validating refreshed token:', error)
            }
          }
        }
      }
    )

    // Setup token refresh interval to check session validity
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
          setUser(null)
          localStorage.removeItem('auth_token')
        }
      } catch (error) {
        console.error('Session check error:', error)
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    // Cleanup subscription and interval on unmount
    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, []) // Removed user dependency to prevent loops

  const checkSession = async () => {
    try {
      // Check if there's an active Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        localStorage.removeItem('auth_token')
        setLoading(false)
        return
      }

      if (!session) {
        localStorage.removeItem('auth_token')
        setLoading(false)
        return
      }
      
      // Validate with server to check admin role
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: session.access_token })
      })

      if (response.ok) {
        const serverData = await response.json()
        localStorage.setItem('auth_token', session.access_token)
        setUser(serverData.user)
      } else {
        // Sign out and clear everything
        await supabase.auth.signOut()
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Error checking session:', error)
      localStorage.removeItem('auth_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      
      // Step 1: Authenticate with Supabase from frontend
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {        
        // Handle specific auth errors with user-friendly messages
        if (authError.message.includes('Invalid login credentials')) {
          return { success: false, error: '❌ Credenciales incorrectas. Verifica que tu email y contraseña sean correctos.' }
        }
        if (authError.message.includes('Email not confirmed')) {
          return { success: false, error: '📧 Email no confirmado. Contacta al administrador del sistema para activar tu cuenta.' }
        }
        if (authError.message.includes('User not found')) {
          return { success: false, error: '👤 Usuario no encontrado. Este email no está registrado en el sistema.' }
        }
        if (authError.message.includes('Too many requests')) {
          return { success: false, error: '⏰ Demasiados intentos de acceso. Espera unos minutos antes de intentar nuevamente.' }
        }
        if (authError.message.includes('Email rate limit exceeded')) {
          return { success: false, error: '📨 Límite de intentos excedido. Contacta al administrador si necesitas ayuda.' }
        }
        
        return { success: false, error: '🔐 Error de autenticación: ' + authError.message }
      }

      if (!authData.user || !authData.session) {
        return { success: false, error: 'Error de autenticación' }
      }
      
      // Step 2: Validate admin role with server
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: authData.session.access_token })
      })
      
      const serverData = await response.json()

      if (!response.ok) {        
        // Sign out from Supabase since validation failed
        await supabase.auth.signOut()
        
        // Handle specific error cases with clear messaging
        if (response.status === 403) {
          return { success: false, error: '🛡️ ' + (serverData.error || 'Acceso denegado. Solo los administradores pueden acceder al sistema.') }
        }
        if (response.status === 401) {
          return { success: false, error: '🔑 ' + (serverData.error || 'Token inválido o expirado.') }
        }
        
        return { success: false, error: serverData.error || 'Error de validación en el servidor' }
      }

      if (!serverData.user) {
        await supabase.auth.signOut()
        return { success: false, error: 'Respuesta inválida del servidor' }
      }

      // Store token and user data
      localStorage.setItem('auth_token', authData.session.access_token)
      setUser(serverData.user)
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      
      // Provide user-friendly error messages based on error type
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return { success: false, error: '🌐 Error de conexión. Verifica tu conexión a internet e intenta nuevamente.' }
      }
      if (error.message.includes('timeout')) {
        return { success: false, error: '⏱️ Tiempo de espera agotado. El servidor está tardando en responder.' }
      }
      
      return { success: false, error: '💥 Error técnico: ' + error.message + '. Contacta al soporte técnico si el problema persiste.' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local storage and state
      localStorage.removeItem('auth_token')
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if Supabase logout fails
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }

  const getToken = async () => {
    try {
      // First try to get the current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        localStorage.removeItem('auth_token')
        return null
      }
      
      if (!session) {
        localStorage.removeItem('auth_token')
        return null
      }
      
      // Update localStorage with current token if it's different
      const currentStoredToken = localStorage.getItem('auth_token')
      if (currentStoredToken !== session.access_token) {
        localStorage.setItem('auth_token', session.access_token)
      }
      
      return session.access_token
    } catch (error) {
      console.error('Error getting token:', error)
      localStorage.removeItem('auth_token')
      return null
    }
  }

  const getTokenSync = () => {
    // Fallback synchronous method for immediate access
    return localStorage.getItem('auth_token')
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    getToken,
    getTokenSync
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}