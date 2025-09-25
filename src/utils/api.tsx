import { projectId } from './supabase/info'

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2e05cbde`

interface ApiOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
  retries?: number
}

export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {}, retries = 1 } = options
  
  // Get auth token from localStorage with retries
  let token = localStorage.getItem('auth_token')
  
  // Wait a bit and retry if no token (in case of timing issues)
  if (!token && retries > 0) {
    console.warn('⚠️ No token found, waiting and retrying...')
    await new Promise(resolve => setTimeout(resolve, 100))
    token = localStorage.getItem('auth_token')
  }
  
  console.log('🔍 API Call Debug:', {
    endpoint,
    method,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    retriesLeft: retries
  })
  
  if (!token) {
    console.error('❌ No auth token found in localStorage after retries')
    throw new Error('No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.')
  }

  const config: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...headers
    }
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('auth_token')
        console.error('❌ 401 Unauthorized - Token invalid or expired')
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

    console.log('✅ API Call successful:', { endpoint, method })
    return response.json()
  } catch (error) {
    console.error('❌ API Call failed:', { 
      endpoint, 
      method, 
      error: error.message,
      hasToken: !!token 
    })
    throw error
  }
}