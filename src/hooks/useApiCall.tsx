import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { projectId } from '../utils/supabase/info'

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2e05cbde`

interface ApiOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
}

export function useApiCall() {
  const { getToken, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)

  const apiCall = async (endpoint: string, options: ApiOptions = {}) => {
    if (!isAuthenticated) {
      console.error('❌ User not authenticated')
      throw new Error('Usuario no autenticado')
    }

    const { method = 'GET', body, headers = {} } = options
    const token = await getToken()
    
    // Reduced logging for production
    // console.log('🔍 API Call Debug (Hook):', { endpoint, method })
    
    if (!token) {
      console.error('❌ No auth token available from context')
      throw new Error('No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.')
    }

    const config: RequestInit = {
      method,
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      }
    }

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body)
      // console.log('📦 Request body:', body)
    }

    // console.log('🌐 Making request:', { url: `${API_BASE_URL}${endpoint}`, method })

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

      // console.log('📡 Response received:', { status: response.status, statusText: response.statusText })

      if (!response.ok) {
        if (response.status === 401) {
          console.error('❌ 401 Unauthorized - Token invalid or expired, attempting refresh...')
          
          // Try to get a fresh token one more time
          try {
            const freshToken = await getToken()
            if (freshToken && freshToken !== token) {
              console.log('🔄 Got fresh token, retrying request...')
              
              // Retry the request with the fresh token
              const retryConfig: RequestInit = {
                method,
                mode: 'cors',
                headers: {
                  'Authorization': `Bearer ${freshToken}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  ...headers
                }
              }

              if (body && method !== 'GET') {
                retryConfig.body = JSON.stringify(body)
              }

              const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, retryConfig)
              
              if (retryResponse.ok) {
                console.log('✅ Retry with fresh token successful')
                const retryData = await retryResponse.json()
                return retryData
              }
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError)
          }
          
          // If we get here, the token refresh didn't work
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        }
        
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        })
        throw new Error(`Error ${response.status}: ${errorData.error || response.statusText}`)
      }

      // console.log('✅ API Call successful (Hook):', { endpoint, method })
      const responseData = await response.json()
      // console.log('📄 Response data:', responseData)
      return responseData
    } catch (error) {
      console.error('❌ API Call failed (Hook):', { 
        endpoint, 
        method, 
        error: error.message,
        errorName: error.name,
        hasToken: !!token,
        isAuthenticated,
        stack: error.stack
      })
      
      // Enhanced network error handling
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('🌐 Network error details:', {
          url: `${API_BASE_URL}${endpoint}`,
          method,
          hasToken: !!token,
          isAuthenticated,
          userAgent: navigator.userAgent,
          online: navigator.onLine
        })
        
        if (!navigator.onLine) {
          throw new Error('Sin conexión a internet. Verifica tu conexión de red.')
        }
        
        throw new Error(`Error de conexión al servidor. Verifica que el servidor esté funcionando y que no haya problemas de red. Endpoint: ${endpoint}`)
      }
      
      // Handle CORS errors
      if (error.message.includes('CORS')) {
        throw new Error('Error de CORS. El servidor puede no estar configurado correctamente para aceptar requests desde este dominio.')
      }
      
      throw error
    }
  }

  // Create execute function for compatibility with existing components
  const execute = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true)
    try {
      const result = await apiCall(endpoint, { method, body })
      return result
    } finally {
      setLoading(false)
    }
  }

  return { apiCall, execute, loading }
}