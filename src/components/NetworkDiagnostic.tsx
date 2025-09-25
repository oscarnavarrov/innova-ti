import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { useApiCall } from '../hooks/useApiCall'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner@2.0.3'
import { 
  Wifi, 
  Server, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Info
} from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'pending' | 'warning'
  message: string
  duration?: number
  details?: any
}

export function NetworkDiagnostic() {
  const { apiCall } = useApiCall()
  const { user, isAuthenticated, getToken } = useAuth()
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<DiagnosticResult[]>([])

  const runDiagnostics = async () => {
    setRunning(true)
    setResults([])
    
    const tests: DiagnosticResult[] = []
    
    // Test 1: Network connectivity
    tests.push({
      test: 'Conectividad de Red',
      status: 'pending',
      message: 'Verificando conectividad...'
    })
    setResults([...tests])

    try {
      const startTime = Date.now()
      await fetch('https://httpbin.org/get', { 
        method: 'GET',
        mode: 'cors',
        signal: AbortSignal.timeout(5000) 
      })
      const duration = Date.now() - startTime
      
      tests[0] = {
        test: 'Conectividad de Red',
        status: 'success',
        message: `Conectividad OK (${duration}ms)`,
        duration
      }
    } catch (error) {
      tests[0] = {
        test: 'Conectividad de Red',
        status: 'error',
        message: `Error de conectividad: ${error.message}`,
        details: { error: error.message, online: navigator.onLine }
      }
    }
    setResults([...tests])

    // Test 2: Authentication status
    tests.push({
      test: 'Estado de Autenticación',
      status: 'pending',
      message: 'Verificando autenticación...'
    })
    setResults([...tests])

    const token = getToken()
    if (isAuthenticated && token && user) {
      tests[1] = {
        test: 'Estado de Autenticación',
        status: 'success',
        message: `Autenticado como ${user.full_name}`,
        details: {
          userId: user.id,
          roleId: user.role_id,
          tokenLength: token.length,
          email: user.email
        }
      }
    } else {
      tests[1] = {
        test: 'Estado de Autenticación',
        status: 'error',
        message: 'No autenticado o token inválido',
        details: {
          isAuthenticated,
          hasToken: !!token,
          hasUser: !!user
        }
      }
    }
    setResults([...tests])

    // Test 3: Server health check
    tests.push({
      test: 'Servidor de Aplicación',
      status: 'pending',
      message: 'Verificando servidor...'
    })
    setResults([...tests])

    try {
      const startTime = Date.now()
      const result = await apiCall('/health')
      const duration = Date.now() - startTime
      
      tests[2] = {
        test: 'Servidor de Aplicación',
        status: 'success',
        message: `Servidor OK (${duration}ms)`,
        duration,
        details: result
      }
    } catch (error) {
      tests[2] = {
        test: 'Servidor de Aplicación',
        status: 'error',
        message: `Error del servidor: ${error.message}`,
        details: { error: error.message }
      }
    }
    setResults([...tests])

    // Test 4: Auth endpoint
    tests.push({
      test: 'Endpoint de Autenticación',
      status: 'pending',
      message: 'Verificando endpoint auth...'
    })
    setResults([...tests])

    try {
      const startTime = Date.now()
      const result = await apiCall('/test')
      const duration = Date.now() - startTime
      
      tests[3] = {
        test: 'Endpoint de Autenticación',
        status: 'success',
        message: `Auth endpoint OK (${duration}ms)`,
        duration,
        details: result
      }
    } catch (error) {
      tests[3] = {
        test: 'Endpoint de Autenticación',
        status: 'error',
        message: `Error en auth endpoint: ${error.message}`,
        details: { error: error.message }
      }
    }
    setResults([...tests])

    // Test 5: Database connectivity (profiles endpoint)
    tests.push({
      test: 'Conectividad de Base de Datos',
      status: 'pending',
      message: 'Verificando base de datos...'
    })
    setResults([...tests])

    try {
      const startTime = Date.now()
      const result = await apiCall('/profiles?for_assignment=true')
      const duration = Date.now() - startTime
      
      tests[4] = {
        test: 'Conectividad de Base de Datos',
        status: 'success',
        message: `Base de datos OK (${duration}ms) - ${Array.isArray(result) ? result.length : 0} técnicos encontrados`,
        duration,
        details: { 
          recordCount: Array.isArray(result) ? result.length : 0,
          technicians: result?.map((p: any) => ({ id: p.id, name: p.full_name, role: p.role_id }))
        }
      }
    } catch (error) {
      tests[4] = {
        test: 'Conectividad de Base de Datos',
        status: 'error',
        message: `Error de base de datos: ${error.message}`,
        details: { error: error.message }
      }
    }
    setResults([...tests])

    // Test 6: PATCH endpoint test
    tests.push({
      test: 'Endpoint PATCH (Simulado)',
      status: 'pending',
      message: 'Verificando capacidad de PATCH...'
    })
    setResults([...tests])

    try {
      const startTime = Date.now()
      const patchResult = await apiCall('/test-patch', {
        method: 'PATCH',
        body: { test: 'diagnostic_patch', timestamp: new Date().toISOString() }
      })
      const duration = Date.now() - startTime
      
      tests[5] = {
        test: 'Endpoint PATCH (Simulado)',
        status: 'success',
        message: `PATCH endpoint funcional (${duration}ms)`,
        duration,
        details: patchResult
      }
    } catch (error) {
      tests[5] = {
        test: 'Endpoint PATCH (Simulado)',
        status: 'error',
        message: `Error en PATCH: ${error.message}`,
        details: { error: error.message }
      }
    }
    setResults([...tests])

    setRunning(false)
    
    const hasErrors = tests.some(t => t.status === 'error')
    const hasWarnings = tests.some(t => t.status === 'warning')
    
    if (hasErrors) {
      toast.error('Diagnóstico completado con errores críticos')
    } else if (hasWarnings) {
      toast.warning('Diagnóstico completado con advertencias')
    } else {
      toast.success('Diagnóstico completado exitosamente')
    }
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          Diagnóstico de Red y Conectividad
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Herramienta para diagnosticar problemas de conectividad con el sistema de tickets
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={running}
            className="flex items-center gap-2"
          >
            {running ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            {running ? 'Ejecutando Diagnóstico...' : 'Ejecutar Diagnóstico'}
          </Button>
          
          {results.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Estado:</span>
              <Badge variant="outline">
                {results.filter(r => r.status === 'success').length} OK
              </Badge>
              <Badge variant="outline">
                {results.filter(r => r.status === 'warning').length} Advertencias
              </Badge>
              <Badge variant="outline">
                {results.filter(r => r.status === 'error').length} Errores
              </Badge>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Resultados del Diagnóstico:</h4>
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.test}</p>
                      <p className="text-sm opacity-80">{result.message}</p>
                    </div>
                  </div>
                  {result.duration && (
                    <Badge variant="outline" className="text-xs">
                      {result.duration}ms
                    </Badge>
                  )}
                </div>
                
                {result.details && (
                  <div className="mt-3 p-3 bg-white/50 rounded border">
                    <p className="text-xs font-medium mb-2">Detalles técnicos:</p>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Haz clic en "Ejecutar Diagnóstico" para verificar la conectividad del sistema</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}