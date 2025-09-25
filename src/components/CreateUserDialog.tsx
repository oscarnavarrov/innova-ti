import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { useApiCall } from '../hooks/useApiCall'
import { useApi } from '../hooks/useApi'
import { toast } from 'sonner@2.0.3'
import { Plus, Users, Loader2 } from 'lucide-react'

interface CreateUserDialogProps {
  onUserCreated: () => void
}

interface Role {
  id: number
  name: string
  description: string | null
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role_id: '',
    active: true,
    password: '',
    confirmPassword: ''
  })

  const { data: roles } = useApi<Role[]>('/roles')
  const { execute, loading } = useApiCall()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.email || !formData.full_name || !formData.password || !formData.role_id) {
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor ingresa un email válido')
      return
    }

    try {
      const payload = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role_id: parseInt(formData.role_id),
        active: formData.active,
        password: formData.password
      }

      await execute('/users', 'POST', payload)
      
      toast.success('Usuario creado exitosamente')
      setOpen(false)
      setFormData({
        email: '',
        full_name: '',
        role_id: '',
        active: true,
        password: '',
        confirmPassword: ''
      })
      onUserCreated()
    } catch (error) {
      console.error('Error al crear usuario:', error)
      toast.error('Error al crear el usuario')
    }
  }

  const selectedRole = roles?.find(role => role.id.toString() === formData.role_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Nuevo Usuario</span>
          <span className="xs:hidden">Nuevo</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Crear Nuevo Usuario</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Agrega un nuevo usuario al sistema. Todos los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            {/* Información básica */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">Nombre Completo *</Label>
                <Input
                  id="full_name"
                  placeholder="Ej: Juan Pérez García"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  required
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: juan.perez@institucion.edu"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role_id" className="text-sm font-medium">Rol del Sistema *</Label>
                <Select value={formData.role_id} onValueChange={(value) => setFormData(prev => ({ ...prev, role_id: value }))}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue placeholder="Selecciona un rol" />
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
                  <Label htmlFor="active" className="text-sm font-medium">Estado del Usuario</Label>
                  <div className="text-xs text-muted-foreground">
                    {formData.active ? 'Usuario activo - puede acceder al sistema' : 'Usuario inactivo - no puede acceder al sistema'}
                  </div>
                </div>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
              </div>
            </div>

            {/* Seguridad */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  className="h-9 sm:h-10"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto h-9 sm:h-10">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-9 sm:h-10">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Crear Usuario
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}