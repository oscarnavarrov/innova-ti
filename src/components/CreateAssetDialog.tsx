import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'
import { useApiCall } from '../hooks/useApiCall'
import { toast } from 'sonner@2.0.3'
import { Plus } from 'lucide-react'

interface AssetStatus {
  id: number
  name: string
}

interface AssetType {
  id: number
  name: string
  description: string | null
}

interface CreateAssetDialogProps {
  onAssetCreated?: () => void
}

export function CreateAssetDialog({ onAssetCreated }: CreateAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    serial_number: '',
    description: '',
    purchase_date: '',
    status_id: '',
    type_id: ''
  })

  const { data: assetStatuses } = useApi<AssetStatus[]>('/asset-status')
  const { data: assetTypes } = useApi<AssetType[]>('/asset-types')
  const { apiCall } = useApiCall()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      serial_number: '',
      description: '',
      purchase_date: '',
      status_id: '',
      type_id: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('El nombre del equipo es obligatorio')
      return
    }

    if (!formData.serial_number.trim()) {
      toast.error('El número de serie es obligatorio')
      return
    }

    if (!formData.status_id) {
      toast.error('El estado del equipo es obligatorio')
      return
    }

    if (!formData.type_id) {
      toast.error('El tipo de equipo es obligatorio')
      return
    }

    setIsSubmitting(true)
    try {
      const assetData = {
        name: formData.name.trim(),
        serial_number: formData.serial_number.trim(),
        description: formData.description.trim() || undefined,
        purchase_date: formData.purchase_date || undefined,
        status_id: parseInt(formData.status_id),
        type_id: parseInt(formData.type_id)
      }

      await apiCall('/assets', {
        method: 'POST',
        body: assetData
      })

      toast.success('Equipo creado correctamente')
      resetForm()
      setOpen(false)
      onAssetCreated?.()
    } catch (error) {
      console.error('Error creating asset:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear el equipo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full xs:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Agregar Equipo</span>
          <span className="xs:hidden">Agregar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader className="px-1 sm:px-0">
          <DialogTitle className="text-lg sm:text-xl">Agregar Nuevo Equipo</DialogTitle>
          <DialogDescription className="text-sm">
            Registra un nuevo equipo en el inventario. Todos los campos marcados con (*) son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name" className="text-sm font-medium">Nombre del Equipo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Laptop Dell Inspiron 15"
                  className="mt-1 h-9 sm:h-10 font-bold font-normal"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="serial_number" className="text-sm font-medium">Número de Serie *</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange('serial_number', e.target.value)}
                  placeholder="Ej: ABC123456789"
                  className="mt-1 h-9 sm:h-10"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción opcional del equipo..."
                  rows={3}
                  className="mt-1 text-sm resize-none"
                />
              </div>

              <div>
                <Label htmlFor="purchase_date" className="text-sm font-medium">Fecha de Compra</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                  className="mt-1 h-9 sm:h-10"
                />
              </div>

              <div>
                <Label htmlFor="type_id" className="text-sm font-medium">Tipo de Equipo *</Label>
                <Select value={formData.type_id} onValueChange={(value) => handleInputChange('type_id', value)}>
                  <SelectTrigger className="mt-1 h-9 sm:h-10">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes?.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{type.name}</span>
                          {type.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-48">
                              {type.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="status_id" className="text-sm font-medium">Estado *</Label>
                <Select value={formData.status_id} onValueChange={(value) => handleInputChange('status_id', value)}>
                  <SelectTrigger className="mt-1 h-9 sm:h-10">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetStatuses?.map(status => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        <span className="text-sm">{status.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm()
                  setOpen(false)
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-9 sm:h-10"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto h-9 sm:h-10">
                {isSubmitting ? 'Creando...' : 'Crear Equipo'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}