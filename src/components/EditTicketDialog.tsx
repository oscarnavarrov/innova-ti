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
import { Edit, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface Ticket {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  asset_id?: number
  reported_by: string
  assigned_to?: string
  assets: { 
    id: number
    name: string 
    serial_number?: string
    asset_types?: {
      name: string
    }
  } | null
  reported_by_profile: { 
    id: string
    full_name: string 
  } | null
  assigned_to_profile: { 
    id: string
    full_name: string 
  } | null
}

interface Asset {
  id: number
  name: string
  serial_number?: string
  asset_types: {
    name: string
  }
}

interface Profile {
  id: string
  full_name: string
  role_id: number
}

interface EditTicketDialogProps {
  ticket: Ticket
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PRIORITIES = [
  { value: 'baja', label: 'Baja', description: 'Problema menor que no afecta el trabajo' },
  { value: 'media', label: 'Media', description: 'Problema que afecta parcialmente el trabajo' },
  { value: 'alta', label: 'Alta', description: 'Problema que impide el trabajo normal' },
  { value: 'critica', label: 'Crítica', description: 'Problema que requiere atención inmediata' }
]

const STATUSES = [
  { value: 'abierto', label: 'Abierto', description: 'Ticket recién creado o reabierto', icon: Clock },
  { value: 'en_progreso', label: 'En Progreso', description: 'Se está trabajando en el ticket', icon: AlertTriangle },
  { value: 'pendiente', label: 'Pendiente', description: 'Esperando información o recursos', icon: Clock },
  { value: 'resuelto', label: 'Resuelto', description: 'Problema solucionado, pendiente de cierre', icon: CheckCircle },
  { value: 'cerrado', label: 'Cerrado', description: 'Ticket completamente finalizado', icon: CheckCircle }
]

export function EditTicketDialog({ ticket, open, onOpenChange, onSuccess }: EditTicketDialogProps) {
  const { user, isAuthenticated } = useAuth()
  const { apiCall } = useApiCall()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    status: 'abierto',
    asset_id: 'none',
    assigned_to: 'unassigned'
  })
  const [originalData, setOriginalData] = useState({
    title: '',
    description: '',
    priority: 'media',
    status: 'abierto',
    asset_id: 'none',
    assigned_to: 'unassigned'
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: assets, loading: assetsLoading, error: assetsError } = useApi<Asset[]>('/assets')
  const { data: profiles, loading: profilesLoading, error: profilesError } = useApi<Profile[]>('/profiles?for_assignment=true')

  // Inicializar formulario con datos del ticket
  useEffect(() => {
    if (ticket && open) {
      const initialFormData = {
        title: ticket.title || '',
        description: ticket.description || '',
        priority: ticket.priority?.toLowerCase() || 'media',
        status: ticket.status?.toLowerCase() || 'abierto',
        asset_id: ticket.asset_id ? ticket.asset_id.toString() : 'none',
        assigned_to: ticket.assigned_to || 'unassigned'
      }
      
      setFormData(initialFormData)
      setOriginalData(initialFormData) // Guardamos una copia de los datos originales
      setIsInitialized(true)
    } else if (!open) {
      // Reset initialization state when dialog closes
      setIsInitialized(false)
    }
  }, [ticket, open])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('El título es obligatorio')
      return
    }

    if (!isAuthenticated || !user) {
      toast.error('Debes estar autenticado para editar un ticket')
      return
    }

    setIsSubmitting(true)

    try {
      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        status: formData.status,
        asset_id: formData.asset_id && formData.asset_id !== 'none' ? parseInt(formData.asset_id) : null,
        assigned_to: formData.assigned_to && formData.assigned_to !== 'unassigned' ? formData.assigned_to : null
      }

      await apiCall(`/tickets/${ticket.id}`, {
        method: 'PATCH',
        body: ticketData
      })

      toast.success('Ticket actualizado correctamente')
      onSuccess()
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Los perfiles ya vienen filtrados del servidor (solo técnicos con role_id = 2)
  const technicians = profiles || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Editar Ticket TK{ticket.id.toString().padStart(4, '0')}</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Modifica los detalles del ticket de soporte. Los cambios se guardarán inmediatamente al confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-4">
            {/* Información del ticket */}
            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm sm:text-base">Información del Ticket</h4>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p><strong>ID:</strong> TK{ticket.id.toString().padStart(4, '0')}</p>
                <p><strong>Creado por:</strong> {ticket.reported_by_profile?.full_name}</p>
                <p><strong>Fecha de creación:</strong> {formatDate(ticket.created_at)}</p>
                <p><strong>Última actualización:</strong> {formatDate(ticket.updated_at)}</p>
              </div>
            </div>

            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">Título del Ticket *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Describe brevemente el problema..."
                  className="mt-1 h-9 sm:h-10"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Descripción Detallada</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Proporciona todos los detalles posibles sobre el problema..."
                  rows={4}
                  className="mt-1 text-sm resize-none"
                />
              </div>
            </div>

            {/* Estado y Prioridad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status" className="text-sm font-medium">Estado</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="mt-1 h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(status => {
                      const Icon = status.icon
                      return (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">{status.label}</span>
                              <span className="text-xs text-muted-foreground">{status.description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority" className="text-sm font-medium">Prioridad</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger className="mt-1 h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{priority.label}</span>
                          <span className="text-xs text-muted-foreground">{priority.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Equipo y Asignación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="asset" className="text-sm font-medium">Equipo Relacionado</Label>
                <Select 
                  value={formData.asset_id} 
                  onValueChange={(value) => handleInputChange('asset_id', value)}
                >
                  <SelectTrigger className="mt-1 h-9 sm:h-10">
                    <SelectValue placeholder="Sin equipo específico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin equipo específico</SelectItem>
                    {assets?.map(asset => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{asset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {asset.asset_types.name}
                            {asset.serial_number && ` • S/N: ${asset.serial_number}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assigned_to" className="text-sm font-medium">Asignado a</Label>
                <Select 
                  value={formData.assigned_to} 
                  onValueChange={(value) => handleInputChange('assigned_to', value)}
                >
                  <SelectTrigger className="mt-1 h-9 sm:h-10">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {technicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        <span className="text-sm">{tech.full_name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          {/* Cambios detectados */}
          {isInitialized && (() => {
            const changes = []
            
            if (formData.title !== originalData.title) changes.push('título')
            if (formData.description !== originalData.description) changes.push('descripción')
            if (formData.priority !== originalData.priority) changes.push('prioridad')
            if (formData.status !== originalData.status) changes.push('estado')
            if (formData.asset_id !== originalData.asset_id) changes.push('equipo')
            if (formData.assigned_to !== originalData.assigned_to) changes.push('asignación')

            if (changes.length > 0) {
              return (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Cambios Detectados</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Se modificará: {changes.join(', ')}
                  </p>
                </div>
              )
            }
            return null
          })()}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}