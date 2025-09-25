import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { projectId, publicAnonKey } from '../utils/supabase/info'

export function TestConnection() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testHealth = async () => {
    setLoading(true)
    try {
      const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2e05cbde`
      console.log('Testing connection to:', `${API_BASE_URL}/health`)
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      setResult(`Health check: ${response.status} - ${JSON.stringify(data)}`)
      console.log('Health check result:', data)
    } catch (error) {
      setResult(`Error: ${error.message}`)
      console.error('Health check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2e05cbde`
      
      // Use test credentials - replace with actual ones
      const testEmail = "juan.perez@innova.edu" // Replace with your actual test email
      const testPassword = "123456" // Replace with your actual test password
      
      console.log('Testing login with:', testEmail)
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: testEmail, 
          password: testPassword 
        })
      })
      
      const data = await response.json()
      setResult(`Login test: ${response.status} - ${JSON.stringify(data, null, 2)}`)
      console.log('Login test result:', data)
    } catch (error) {
      setResult(`Login error: ${error.message}`)
      console.error('Login test error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Test de Conexión</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button onClick={testHealth} disabled={loading} className="w-full">
            Test Health Check
          </Button>
          <Button onClick={testLogin} disabled={loading} className="w-full">
            Test Login
          </Button>
        </div>
        
        {result && (
          <div className="p-3 bg-muted rounded text-sm">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>Project ID: {projectId}</p>
          <p>Public Key: {publicAnonKey.substring(0, 20)}...</p>
        </div>
      </CardContent>
    </Card>
  )
}