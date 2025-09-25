import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { useApiCall } from '../hooks/useApiCall'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner@2.0.3'
import { Edit, Users, Loader2, AlertTriangle, Info } from 'lucide-react'

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
  description: string | null
}

interface EditUserDialogProps {
  user: User
  onUserUpdated: () => void
  onClose: () => void
}

export function EditUserDialog({ user, onUserUpdated, onClose }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role_id: '',
    active: true,
    newPassword: '',
    confirmNewPassword: ''
  })

  const { data: roles } = useApi<Role[]>('/roles')
  const { execute, loading } = useApiCall()
  const { user: currentUser, logout } = useAuth()

  // Verificar si estamos editando el usuario actual
  const isEditingSelf = currentUser?.id === user.id

  // Función para determinar si hay cambios críticos que requieren logout
  const hasCriticalChanges = () => {
    if (!isEditingSelf) return false
    
    return (
      formData.email.trim() !== user.email ||           // Cambió email
      !!formData.newPassword ||                          // Cambió contraseña  
      parseInt(formData.role_id) !== user.role_id ||     // Cambió rol
      formData.active !== user.active                    // Cambió estado activo
    )
  }

  // Inicializar form data cuando el usuario cambie
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        role_id: user.role_id?.toString() || '',
        active: user.active !== undefined ? user.active : true,
        newPassword: '',
        confirmNewPassword: ''
      })
    }
  }, [user, roles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.email || !formData.full_name || !formData.role_id) {
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }

    // Validación especial: no se puede desactivar a sí mismo
    if (isEditingSelf && !formData.active) {
      toast.error('No puedes desactivar tu propia cuenta')
      return
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmNewPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor ingresa un email válido')
      return
    }

    try {
      const payload: any = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role_id: parseInt(formData.role_id),
        active: formData.active
      }

      // Solo incluir contraseña si se proporcionó una nueva
      if (formData.newPassword) {
        payload.password = formData.newPassword
      }

      await execute(`/users/${user.id}`, 'PUT', payload)
      
      // Si estamos editando el usuario actual, verificar si cambió algo crítico
      if (isEditingSelf) {
        if (hasCriticalChanges()) {
          toast.success('Tu perfil ha sido actualizado. Serás redirigido al login por seguridad debido a cambios críticos.')
          
          // Esperar un momento para que el usuario vea el mensaje
          setTimeout(async () => {
            await logout()
          }, 2000)
        } else {
          // Solo cambió el nombre u otros campos no críticos
          toast.success('Tu perfil ha sido actualizado exitosamente')
          onUserUpdated()
        }
      } else {
        toast.success('Usuario actualizado exitosamente')
        onUserUpdated()
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      toast.error('Error al actualizar el usuario')
    }
  }

  const selectedRole = roles?.find(role => role.id.toString() === formData.role_id)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Editar Usuario</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Modifica la información del usuario. Los campos con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            {/* Alertas especiales */}
            {isEditingSelf && (
              <Alert className={hasCriticalChanges() 
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800"
                : "border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800"
              }>
                {hasCriticalChanges() ? <AlertTriangle className="h-4 w-4 flex-shrink-0" /> : <Info className="h-4 w-4 flex-shrink-0" />}
                <AlertDescription className="text-xs sm:text-sm">
                  <strong>Editando tu propio perfil:</strong> 
                  {hasCriticalChanges() 
                    ? " Has realizado cambios críticos que requerirán logout por seguridad."
                    : " Los cambios de nombre no requieren logout. Cambios de email, contraseña, rol o estado sí lo requieren."
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Información básica */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name" className="text-sm font-medium">Nombre Completo *</Label>
                <Input
                  id="edit_full_name"
                  placeholder="Ej: Juan Pérez García"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_email" className="text-sm font-medium">Correo Electrónico *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  placeholder="Ej: juan.perez@institucion.edu"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_role_id" className="text-sm font-medium">Rol del Sistema *</Label>
                <Select 
                  value={formData.role_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role_id: value }))}
                  disabled={!roles}
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder={!roles ? "Cargando roles..." : "Selecciona un rol"} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <span className="text-sm">{role.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRole?.description && (
                  <p className="text-xs text-muted-foreground">
                    {selectedRole.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-2 xs:space-y-0 xs:space-x-2">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="edit_active" className="text-sm font-medium">Estado del Usuario</Label>
                  <div className="text-xs text-muted-foreground">
                    {isEditingSelf 
                      ? 'No puedes desactivar tu propia cuenta' 
                      : formData.active 
                        ? 'Usuario activo - puede acceder al sistema' 
                        : 'Usuario inactivo - no puede acceder al sistema'
                    }
                  </div>
                </div>
                <Switch
                  id="edit_active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  disabled={isEditingSelf}
                />
              </div>
            </div>

            {/* Cambiar contraseña */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Cambiar Contraseña (Opcional)</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Deja estos campos vacíos si no deseas cambiar la contraseña
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_newPassword" className="text-sm font-medium">Nueva Contraseña</Label>
                <Input
                  id="edit_newPassword"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.newPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_confirmNewPassword" className="text-sm font-medium">Confirmar Nueva Contraseña</Label>
                <Input
                  id="edit_confirmNewPassword"
                  type="password"
                  placeholder="Repite la nueva contraseña"
                  value={formData.confirmNewPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                  className="h-9 sm:h-10"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto h-9 sm:h-10">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-9 sm:h-10">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Actualizar Usuario
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}