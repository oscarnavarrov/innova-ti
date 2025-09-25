import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'
import { useApiCall } from '../hooks/useApiCall'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'

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

interface Role {
  id: number
  name: string
  description?: string | null
  permissions?: any
}

export function UserManagementTest() {
  const [testResults, setTestResults] = useState<string[]>([])
  const { data: users, loading: usersLoading, refetch: refetchUsers } = useApi<User[]>('/users')
  const { data: roles, loading: rolesLoading } = useApi<Role[]>('/roles')
  const { execute, loading: createLoading } = useApiCall()

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testCreateUser = async () => {
    try {
      addTestResult('🧪 Iniciando prueba de creación de usuario...')
      
      const testUser = {
        email: `test.user.${Date.now()}@test.com`,
        password: 'TestPassword123!',
        full_name: `Usuario de Prueba ${Date.now()}`,
        role_id: 2 // Técnico
      }

      addTestResult(`📝 Creando usuario: ${testUser.email}`)
      
      const result = await execute('/users', 'POST', testUser)
      
      if (result) {
        addTestResult(`✅ Usuario creado exitosamente: ${result.full_name}`)
        toast.success('Usuario de prueba creado exitosamente')
        refetchUsers()
      }
    } catch (error) {
      addTestResult(`❌ Error creando usuario: ${error.message}`)
      toast.error('Error al crear usuario de prueba')
      console.error('Test create user error:', error)
    }
  }

  const testUpdateUser = async () => {
    if (!users || users.length === 0) {
      addTestResult('❌ No hay usuarios disponibles para probar la actualización')
      return
    }

    try {
      const userToUpdate = users[0]
      addTestResult(`🧪 Probando actualización del usuario: ${userToUpdate.email}`)
      
      const updateData = {
        email: userToUpdate.email,
        full_name: `${userToUpdate.full_name} (Actualizado)`,
        role_id: userToUpdate.role_id
      }

      const result = await execute(`/users/${userToUpdate.id}`, 'PUT', updateData)
      
      if (result) {
        addTestResult(`✅ Usuario actualizado exitosamente: ${result.full_name}`)
        toast.success('Usuario actualizado exitosamente')
        refetchUsers()
      }
    } catch (error) {
      addTestResult(`❌ Error actualizando usuario: ${error.message}`)
      toast.error('Error al actualizar usuario')
      console.error('Test update user error:', error)
    }
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  if (usersLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos de prueba...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Pruebas del Sistema de Usuarios</CardTitle>
          <CardDescription>
            Herramienta para probar la funcionalidad de gestión de usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            <Button 
              onClick={testCreateUser}
              disabled={createLoading}
            >
              {createLoading ? 'Creando...' : 'Probar Crear Usuario'}
            </Button>
            
            <Button 
              onClick={testUpdateUser}
              disabled={createLoading || !users?.length}
            >
              Probar Actualizar Usuario
            </Button>
            
            <Button 
              variant="outline"
              onClick={clearTestResults}
            >
              Limpiar Resultados
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Users */}
        <Card>
          <CardHeader>
            <CardTitle>👥 Usuarios Actuales ({users?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {users && users.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="secondary">
                      {user.roles?.name || 'Sin rol'}
                    </Badge>
                  </div>
                ))}
                {users.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    ... y {users.length - 5} más
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay usuarios registrados
              </p>
            )}
          </CardContent>
        </Card>

        {/* Available Roles */}
        <Card>
          <CardHeader>
            <CardTitle>🎭 Roles Disponibles ({roles?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {roles && roles.length > 0 ? (
              <div className="space-y-2">
                {roles.map(role => (
                  <div key={role.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="text-sm font-medium">{role.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.description || 'Sin descripción'}
                      </p>
                    </div>
                    <Badge variant="outline">ID: {role.id}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No hay roles configurados
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Resultados de Pruebas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <p key={index} className="text-sm font-mono">
                    {result}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}