import { Component, ReactNode } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🛡️ AuthErrorBoundary caught an error:', error, errorInfo)
    
    // Check if it's an authentication error
    if (
      error.message.includes('Sesión expirada') ||
      error.message.includes('Token') ||
      error.message.includes('401') ||
      error.message.includes('Unauthorized')
    ) {
      console.log('🔐 Authentication error detected, clearing session')
      localStorage.removeItem('auth_token')
      
      // Reload page to trigger fresh authentication check
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }

    this.setState({
      error,
      errorInfo
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message.includes('Sesión expirada') ||
                         this.state.error?.message.includes('Token') ||
                         this.state.error?.message.includes('401')

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                {isAuthError ? 'Sesión Expirada' : 'Error de Aplicación'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isAuthError 
                  ? 'Tu sesión ha expirado. La página se recargará automáticamente para que puedas iniciar sesión nuevamente.'
                  : 'Ha ocurrido un error inesperado. Por favor, recarga la página o contacta al soporte técnico.'
                }
              </p>
              
              {this.state.error && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recargar Página
                </Button>
              </div>

              {isAuthError && (
                <p className="text-xs text-center text-muted-foreground">
                  Recargando automáticamente en 2 segundos...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}