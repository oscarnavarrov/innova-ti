import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useApiCall } from './useApiCall'

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const { apiCall } = useApiCall()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!isAuthenticated) {
        throw new Error('Usuario no autenticado')
      }
      
      const result = await apiCall(endpoint)
      setData(result)
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch if we are authenticated
    if (isAuthenticated) {
      fetchData()
    } else {
      setLoading(false)
      setError('Usuario no autenticado')
    }
  }, [endpoint, isAuthenticated])

  return { data, loading, error, refetch: fetchData }
}