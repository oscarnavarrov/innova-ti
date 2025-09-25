import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { useApiCall } from '../hooks/useApiCall'
import { toast } from 'sonner@2.0.3'
import { Plus, CalendarDays, User, Monitor } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  role_id: number
}

interface Asset {
  id: number
  name: string
  serial_number?: string
  asset_types: {
    name: string
  }
  asset_status: {
    name: string
  }
}

interface CreateLoanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoanCreated: () => void
}

export function CreateLoanDialog({ open, onOpenChange, onLoanCreated }: CreateLoanDialogProps) {
  const { user, isAuthenticated } = useAuth()
  const { apiCall } = useApiCall()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    asset_id: '',
    user_id: '',
    checkout_date: '',
    expected_checkin_date: '',
    notes: ''
  })

  // APIs para obtener datos
  const { data: profiles } = useApi<Profile[]>('/profiles')
  const { data: allAssets } = useApi<Asset[]>('/assets')

  // Filtrar solo equipos disponibles para préstamo
  const availableAssets = allAssets?.filter(asset => 
    asset.asset_status?.name === 'Disponible'
  ) || []

  // Inicializar fecha de checkout con la fecha actual
  useEffect(() => {
    if (open) {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 7) // Default: 1 semana

      setFormData({
        asset_id: '',
        user_id: '',
        checkout_date: now.toISOString().slice(0, 16),
        expected_checkin_date: tomorrow.toISOString().slice(0, 16),
        notes: ''
      })
    }
  }, [open])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated || !user) {
      toast.error('Debes estar autenticado para crear préstamos')
      return
    }

    if (!formData.asset_id || !formData.user_id || !formData.checkout_date || !formData.expected_checkin_date) {
      toast.error('Todos los campos obligatorios deben ser completados')
      return
    }

    // Validar que la fecha de devolución sea posterior al préstamo
    if (new Date(formData.expected_checkin_date) <= new Date(formData.checkout_date)) {
      toast.error('La fecha de devolución debe ser posterior a la fecha de préstamo')
      return
    }

    setIsSubmitting(true)
    try {
      const loanData = {
        asset_id: parseInt(formData.asset_id),
        user_id: formData.user_id,
        checkout_date: new Date(formData.checkout_date).toISOString(),
        expected_checkin_date: new Date(formData.expected_checkin_date).toISOString(),
        status: 'active',
        notes: formData.notes.trim() || null
      }

      await apiCall('/prestamos', {
        method: 'POST', 
        body: loanData
      })

      toast.success('Préstamo creado exitosamente')
      onLoanCreated()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        asset_id: '',
        user_id: '',
        checkout_date: '',
        expected_checkin_date: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error creating loan:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el préstamo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedAsset = availableAssets.find(asset => asset.id.toString() === formData.asset_id)
  const selectedProfile = profiles?.find(profile => profile.id === formData.user_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Crear Nuevo Préstamo</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Registra un nuevo préstamo de equipo a un docente. Asegúrate de establecer una fecha de devolución apropiada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-4">
            {/* Selección de equipo */}
            <div>
              <Label htmlFor="asset" className="text-sm font-medium">Equipo a Prestar *</Label>
              <Select 
                value={formData.asset_id} 
                onValueChange={(value) => handleInputChange('asset_id', value)}
              >
                <SelectTrigger className="mt-1 w-full h-9 sm:h-10">
                  <SelectValue placeholder="Selecciona un equipo disponible" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets.length === 0 ? (
                    <SelectItem value="no-assets" disabled>
                      No hay equipos disponibles para préstamo
                    </SelectItem>
                  ) : (
                    availableAssets.map(asset => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{asset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {asset.asset_types.name}
                            {asset.serial_number && ` • S/N: ${asset.serial_number}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedAsset && (
                <div className="mt-2 p-2 sm:p-3 bg-muted/50 rounded-lg flex items-center gap-2 overflow-hidden">
                  <Monitor className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="text-xs sm:text-sm min-w-0">
                    <span className="font-medium break-words">{selectedAsset.name}</span>
                    <span className="text-muted-foreground ml-2 break-words">• {selectedAsset.asset_types.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Selección de usuario */}
            <div>
              <Label htmlFor="user" className="text-sm font-medium">Usuario Beneficiario *</Label>
              <Select 
                value={formData.user_id} 
                onValueChange={(value) => handleInputChange('user_id', value)}
              >
                <SelectTrigger className="mt-1 w-full h-9 sm:h-10">
                  <SelectValue placeholder="Selecciona el usuario que recibirá el equipo" />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{profile.full_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {profile.role_id === 1 ? 'Administrador' : 
                           profile.role_id === 2 ? 'Técnico' : 
                           profile.role_id === 3 ? 'Docente' : 'Usuario'}
                        </span>
                      </div>
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
              {selectedProfile && (
                <div className="mt-2 p-2 sm:p-3 bg-muted/50 rounded-lg flex items-center gap-2 overflow-hidden">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="text-xs sm:text-sm min-w-0">
                    <span className="font-medium break-words">{selectedProfile.full_name}</span>
                    <span className="text-muted-foreground ml-2 break-words">
                      • {selectedProfile.role_id === 1 ? 'Administrador' : 
                          selectedProfile.role_id === 2 ? 'Técnico' : 
                          selectedProfile.role_id === 3 ? 'Docente' : 'Usuario'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkout_date" className="text-sm font-medium">Fecha de Préstamo *</Label>
                <Input
                  id="checkout_date"
                  type="datetime-local"
                  value={formData.checkout_date}
                  onChange={(e) => handleInputChange('checkout_date', e.target.value)}
                  className="mt-1 h-9 sm:h-10"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fecha y hora cuando el equipo es entregado
                </p>
              </div>
              
              <div>
                <Label htmlFor="expected_checkin_date" className="text-sm font-medium">Fecha de Devolución Esperada *</Label>
                <Input
                  id="expected_checkin_date"
                  type="datetime-local"
                  value={formData.expected_checkin_date}
                  onChange={(e) => handleInputChange('expected_checkin_date', e.target.value)}
                  className="mt-1 h-9 sm:h-10"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Fecha límite para devolver el equipo
                </p>
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">Notas del Préstamo</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Propósito del préstamo, condiciones especiales, observaciones..."
                rows={3}
                className="mt-1 text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Información adicional sobre el préstamo (opcional)
              </p>
            </div>

            {/* Resumen */}
            {formData.asset_id && formData.user_id && formData.checkout_date && formData.expected_checkin_date && (
              <div className="bg-muted/30 p-3 sm:p-4 rounded-lg space-y-2 overflow-hidden">
                <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                  <CalendarDays className="w-4 h-4 flex-shrink-0" />
                  <span>Resumen del Préstamo</span>
                </h4>
                <div className="text-xs sm:text-sm space-y-1">
                  <p><strong>Equipo:</strong> <span className="break-words">{selectedAsset?.name}</span></p>
                  <p><strong>Para:</strong> <span className="break-words">{selectedProfile?.full_name}</span></p>
                  <p><strong>Desde:</strong> {new Date(formData.checkout_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p><strong>Hasta:</strong> {new Date(formData.expected_checkin_date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric', 
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p><strong>Duración:</strong> {Math.ceil((new Date(formData.expected_checkin_date).getTime() - new Date(formData.checkout_date).getTime()) / (1000 * 60 * 60 * 24))} días</p>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-9 sm:h-10"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.asset_id || !formData.user_id || !formData.checkout_date || !formData.expected_checkin_date}
                className="w-full sm:w-auto h-9 sm:h-10"
              >
                {isSubmitting ? 'Creando...' : 'Crear Préstamo'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}