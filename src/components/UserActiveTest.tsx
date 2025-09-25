import { useState } from 'react'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { useApiCall } from '../hooks/useApiCall'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner@2.0.3'
import { Bug, Loader2, AlertTriangle } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  role_id: number
  active: boolean
  created_at: string
  last_sign_in_at: string | null
  roles?: {
    id: number
    name: string
    description?: string
    permissions?: any
  }
}

export function UserActiveTest() {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [testActive, setTestActive] = useState<boolean>(true)
  
  const { data: users, refetch: refetchUsers } = useApi<User[]>('/users')
  const { execute, loading } = useApiCall()
  const { user: currentUser, logout } = useAuth()

  // Verificar si estamos editando el usuario actual
  const isEditingSelf = currentUser?.id === selectedUserId

  const handleTest = async () => {
    if (!selectedUserId) {
      toast.error('Selecciona un usuario primero')
      return
    }

    const selectedUser = users?.find(u => u.id === selectedUserId)
    if (!selectedUser) {
      toast.error('Usuario no encontrado')
      return
    }

    // Validación especial: no se puede desactivar a sí mismo
    if (isEditingSelf && !testActive) {
      toast.error('No puedes desactivar tu propia cuenta')
      return
    }

    try {
      console.log('🧪 Testing user active update:', {
        userId: selectedUserId,
        currentActive: selectedUser.active,
        newActive: testActive,
        userEmail: selectedUser.email
      })

      const payload = {
        email: selectedUser.email,
        full_name: selectedUser.full_name,
        role_id: selectedUser.role_id,
        active: testActive
      }

      console.log('📤 Payload being sent:', payload)

      const response = await execute(`/users/${selectedUserId}`, 'PUT', payload)
      
      console.log('📥 Response received:', response)
      
      // Si estamos editando el usuario actual, verificar si cambió algo crítico
      if (isEditingSelf) {
        // En el test, cualquier cambio de estado se considera crítico
        const criticalChanges = selectedUser.active !== testActive
        
        if (criticalChanges) {
          toast.success('Tu perfil ha sido actualizado. Serás redirigido al login por seguridad debido a cambios críticos.')
          
          // Esperar un momento para que el usuario vea el mensaje
          setTimeout(async () => {
            await logout()
          }, 2000)
        } else {
          toast.success('Tu perfil ha sido actualizado exitosamente')
          refetchUsers()
        }
      } else {
        toast.success(`Usuario ${testActive ? 'activado' : 'desactivado'} correctamente`)
        refetchUsers()
      }
    } catch (error) {
      console.error('❌ Error en test:', error)
      toast.error('Error al actualizar usuario')
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Test: Estado Activo de Usuarios
        </CardTitle>
        <CardDescription>
          Herramienta de diagnóstico para probar la actualización del campo 'active' en usuarios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alerta si está editando su propio usuario */}
        {isEditingSelf && (
          <Alert className="border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>ℹ️ Información:</strong> Estás editando tu propio usuario. Los cambios críticos (estado activo) causarán logout automático.
            </AlertDescription>
          </Alert>
        )}
        {/* Selector de usuario */}
        <div className="space-y-2">
          <Label>Seleccionar Usuario</Label>
          <select 
            className="w-full p-2 border rounded-md"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">-- Selecciona un usuario --</option>
            {users?.map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email}) - {user.active ? 'ACTIVO' : 'INACTIVO'}
              </option>
            ))}
          </select>
        </div>

        {/* Estado objetivo */}
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="test_active">Estado objetivo</Label>
            <div className="text-xs text-muted-foreground">
              {isEditingSelf && !testActive 
                ? 'No puedes desactivar tu propia cuenta'
                : testActive ? 'Cambiar a ACTIVO' : 'Cambiar a INACTIVO'
              }
            </div>
          </div>
          <Switch
            id="test_active"
            checked={testActive}
            onCheckedChange={setTestActive}
            disabled={isEditingSelf && !testActive}
          />
        </div>

        {/* Información del usuario seleccionado */}
        {selectedUserId && users && (
          <div className="p-3 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Usuario seleccionado:</h4>
            {(() => {
              const user = users.find(u => u.id === selectedUserId)
              if (!user) return <p>Usuario no encontrado</p>
              
              return (
                <div className="space-y-1 text-sm">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Nombre:</strong> {user.full_name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Rol ID:</strong> {user.role_id}</p>
                  <p><strong>Estado actual:</strong> {user.active ? 'ACTIVO ✅' : 'INACTIVO ❌'}</p>
                </div>
              )
            })()}
          </div>
        )}

        {/* Botón de test */}
        <Button 
          onClick={handleTest} 
          disabled={loading || !selectedUserId}
          className="w-full"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Ejecutar Test de Actualización
        </Button>

        {/* Información de debug */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Revisa la consola del navegador para logs detallados</p>
          <p>• Este test actualiza TODOS los campos del usuario</p>
          <p>• Los logs del servidor aparecerán en la consola de Supabase</p>
        </div>
      </CardContent>
    </Card>
  )
}