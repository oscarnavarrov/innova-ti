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
import { Plus, AlertTriangle } from 'lucide-react'

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

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const PRIORITIES = [
  { value: 'baja', label: 'Baja - Problema menor que no afecta el trabajo' },
  { value: 'media', label: 'Media - Problema que afecta parcialmente el trabajo' },
  { value: 'alta', label: 'Alta - Problema que impide el trabajo normal' },
  { value: 'critica', label: 'Crítica - Problema que requiere atención inmediata' }
]

export function CreateTicketDialog({ open, onOpenChange, onSuccess }: CreateTicketDialogProps) {
  const { user, isAuthenticated } = useAuth()
  const { apiCall } = useApiCall()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    asset_id: 'none',
    assigned_to: 'unassigned'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: assets } = useApi<Asset[]>('/assets?status=available,in_use')

  // Limpiar formulario cuando se abre/cierra el dialog
  useEffect(() => {
    if (!open) {
      setFormData({
        title: '',
        description: '',
        priority: 'media',
        asset_id: 'none',
        assigned_to: 'unassigned'
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
    
    if (!formData.title.trim()) {
      toast.error('El título es obligatorio')
      return
    }

    if (!isAuthenticated || !user) {
      toast.error('Debes estar autenticado para crear un ticket')
      return
    }

    setIsSubmitting(true)

    try {
      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        asset_id: formData.asset_id && formData.asset_id !== 'none' ? parseInt(formData.asset_id) : null,
        assigned_to: formData.assigned_to && formData.assigned_to !== 'unassigned' ? formData.assigned_to : null,
        reported_by: user.id,
        status: 'abierto'
      }

      await apiCall('/tickets', {
        method: 'POST',
        body: ticketData
      })

      toast.success('Ticket creado correctamente')
      onSuccess()
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Obtener técnicos para asignación directamente del endpoint filtrado
  const { data: technicians } = useApi<Profile[]>('/profiles?for_assignment=true')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Crear Nuevo Ticket de Soporte</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Completa el formulario para crear un nuevo ticket de soporte técnico. Proporciona toda la información necesaria para facilitar la resolución del problema.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-4">
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
                  placeholder="Proporciona todos los detalles posibles sobre el problema, incluyendo pasos para reproducirlo, mensajes de error, etc."
                  rows={4}
                  className="mt-1 text-sm resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Incluye información como: ¿cuándo ocurrió?, ¿qué estabas haciendo?, ¿mensajes de error?, etc.
                </p>
              </div>
            </div>

            {/* Prioridad */}
            <div>
              <Label htmlFor="priority" className="text-sm font-medium mb-4">Prioridad</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger className="mt-1 w-full h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">{priority.value.charAt(0).toUpperCase() + priority.value.slice(1)}</span>
                        <span className="text-xs text-muted-foreground">{priority.label.split(' - ')[1]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipo relacionado */}
            <div>
              <Label htmlFor="asset" className="text-sm font-medium mb-4">Equipo Relacionado (Opcional)</Label>
              <Select 
                value={formData.asset_id} 
                onValueChange={(value) => handleInputChange('asset_id', value)}
              >
                <SelectTrigger className="mt-1 w-full h-9 sm:h-10">
                  <SelectValue placeholder="Selecciona un equipo si aplica" />
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

            {/* Asignación */}
            <div>
              <Label htmlFor="assigned_to" className="text-sm font-medium mb-4">Asignar a Técnico (Opcional)</Label>
              <Select 
                value={formData.assigned_to} 
                onValueChange={(value) => handleInputChange('assigned_to', value)}
              >
                <SelectTrigger className="mt-1 w-full h-9 sm:h-10">
                  <SelectValue placeholder="Dejar sin asignar por ahora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Sin asignar</SelectItem>
                  {technicians?.map(tech => (
                    <SelectItem key={tech.id} value={tech.id}>
                      <span className="text-sm">{tech.full_name}</span>
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Puedes asignar el ticket a un técnico específico o dejarlo sin asignar para revisión.
              </p>
            </div>

            {/* Información del usuario */}
            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Información del Reporte</span>
              </h4>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p><strong>Reportado por:</strong> {user?.full_name}</p>
                <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p><strong>Estado inicial:</strong> Abierto</p>
              </div>
            </div>

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
                disabled={isSubmitting || !formData.title.trim()}
                className="w-full sm:w-auto h-9 sm:h-10"
              >
                {isSubmitting ? 'Creando...' : 'Crear Ticket'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}