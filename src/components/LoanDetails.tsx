import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { useApiCall } from '../hooks/useApiCall'
import { toast } from 'sonner@2.0.3'
import { 
  ArrowLeft, 
  Save,
  Edit,
  Clock, 
  User, 
  Monitor, 
  Calendar, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity
} from 'lucide-react'

interface Loan {
  id: number
  asset_id: number
  user_id: string
  checkout_date: string
  expected_checkin_date: string
  actual_checkin_date: string | null
  status: string
  notes: string | null
  derived_status: string
  assets: { 
    id: number
    name: string 
    serial_number?: string
    description?: string
    asset_types?: {
      name: string
    }
  } | null
  profiles: { 
    id: string
    full_name: string 
  } | null
}

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
}

interface LoanDetailsProps {
  loan: Loan
  onBack: () => void
  onUpdate: () => void
}

const STATUSES = [
  { value: 'active', label: 'Activo', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'overdue', label: 'Vencido', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  { value: 'returned', label: 'Devuelto', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' }
]

const getStatusInfo = (status: string) => {
  return STATUSES.find(s => s.value === status?.toLowerCase()) || 
         { value: status, label: status || 'Sin estado', color: 'bg-gray-100 text-gray-800' }
}

export function LoanDetails({ loan, onBack, onUpdate }: LoanDetailsProps) {
  const { user, isAuthenticated } = useAuth()
  const { apiCall } = useApiCall()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentLoan, setCurrentLoan] = useState(loan)
  const [formData, setFormData] = useState({
    asset_id: loan.asset_id ? loan.asset_id.toString() : '',
    user_id: loan.user_id || '',
    checkout_date: loan.checkout_date ? new Date(loan.checkout_date).toISOString().slice(0, 16) : '',
    expected_checkin_date: loan.expected_checkin_date ? new Date(loan.expected_checkin_date).toISOString().slice(0, 16) : '',
    actual_checkin_date: loan.actual_checkin_date ? new Date(loan.actual_checkin_date).toISOString().slice(0, 16) : '',
    status: loan.status || 'active',
    notes: loan.notes || ''
  })
  
  const { data: profiles } = useApi<Profile[]>('/profiles')
  const { data: assets } = useApi<Asset[]>('/assets')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible'
    
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      // Validate that the date is valid
      if (isNaN(date.getTime())) {
        return formatDate(dateString)
      }
      
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours < 1) return 'Hace menos de una hora'
      if (diffInHours < 24) return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`
      
      return formatDate(dateString)
    } catch (error) {
      console.error('Error formatting relative time:', error)
      return formatDate(dateString)
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loan.id]);

  // Initialize form data when loan changes
  useEffect(() => {
    setCurrentLoan(loan)
    setFormData({
      asset_id: loan.asset_id ? loan.asset_id.toString() : '',
      user_id: loan.user_id || '',
      checkout_date: loan.checkout_date ? new Date(loan.checkout_date).toISOString().slice(0, 16) : '',
      expected_checkin_date: loan.expected_checkin_date ? new Date(loan.expected_checkin_date).toISOString().slice(0, 16) : '',
      actual_checkin_date: loan.actual_checkin_date ? new Date(loan.actual_checkin_date).toISOString().slice(0, 16) : '',
      status: loan.status || 'active',
      notes: loan.notes || ''
    })
  }, [loan])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // Auto-sync logic: 
      // If setting actual_checkin_date, automatically set status to returned
      if (field === 'actual_checkin_date' && value) {
        newData.status = 'returned'
      }
      
      return newData
    })
  }

  const handleSave = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Debes estar autenticado para realizar esta acción')
      return
    }

    if (!formData.asset_id || !formData.user_id) {
      toast.error('El equipo y usuario son obligatorios')
      return
    }

    setIsSaving(true)
    try {
      const loanData = {
        asset_id: parseInt(formData.asset_id),
        user_id: formData.user_id,
        checkout_date: formData.checkout_date ? new Date(formData.checkout_date).toISOString() : null,
        expected_checkin_date: formData.expected_checkin_date ? new Date(formData.expected_checkin_date).toISOString() : null,
        actual_checkin_date: formData.actual_checkin_date ? new Date(formData.actual_checkin_date).toISOString() : null,
        status: formData.status,
        notes: formData.notes.trim() || null
      }

      const updatedLoan = await apiCall(`/prestamos/${loan.id}`, {
        method: 'PATCH',
        body: loanData
      })

      // Update local loan data with the response
      setCurrentLoan(updatedLoan)
      
      // Update form data to reflect the new state
      setFormData({
        asset_id: updatedLoan.asset_id ? updatedLoan.asset_id.toString() : '',
        user_id: updatedLoan.user_id || '',
        checkout_date: updatedLoan.checkout_date ? new Date(updatedLoan.checkout_date).toISOString().slice(0, 16) : '',
        expected_checkin_date: updatedLoan.expected_checkin_date ? new Date(updatedLoan.expected_checkin_date).toISOString().slice(0, 16) : '',
        actual_checkin_date: updatedLoan.actual_checkin_date ? new Date(updatedLoan.actual_checkin_date).toISOString().slice(0, 16) : '',
        status: updatedLoan.status || 'active',
        notes: updatedLoan.notes || ''
      })
      
      toast.success('Préstamo actualizado correctamente')
      setIsEditing(false)
      
      // Only notify parent that data changed, don't reset view
      onUpdate()
    } catch (error) {
      console.error('Error updating loan:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el préstamo')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      asset_id: currentLoan.asset_id ? currentLoan.asset_id.toString() : '',
      user_id: currentLoan.user_id || '',
      checkout_date: currentLoan.checkout_date ? new Date(currentLoan.checkout_date).toISOString().slice(0, 16) : '',
      expected_checkin_date: currentLoan.expected_checkin_date ? new Date(currentLoan.expected_checkin_date).toISOString().slice(0, 16) : '',
      actual_checkin_date: currentLoan.actual_checkin_date ? new Date(currentLoan.actual_checkin_date).toISOString().slice(0, 16) : '',
      status: currentLoan.status || 'active',
      notes: currentLoan.notes || ''
    })
    setIsEditing(false)
  }

  const handleProcessReturn = () => {
    const now = new Date()
    setFormData(prev => ({
      ...prev,
      actual_checkin_date: now.toISOString().slice(0, 16),
      status: 'returned'
    }))
  }

  // Calculate current status - SIMPLIFIED AND FIXED VERSION
  const calculateCurrentStatus = () => {
    // When editing, use form data
    if (isEditing) {
      // If user selected returned, use that
      if (formData.status === 'returned') {
        return 'returned'
      }
      // If there's actual checkin date, it's returned
      if (formData.actual_checkin_date) {
        return 'returned'
      }
      // If not returned and past due date, it's overdue
      if (formData.expected_checkin_date && new Date(formData.expected_checkin_date) < new Date()) {
        return 'overdue'
      }
      // Otherwise use selected status
      return formData.status || 'active'
    }
    
    // When not editing, use current loan data
    // If explicitly marked as returned, use that
    if (currentLoan.status === 'returned') {
      return 'returned'
    }
    // If there's actual checkin date, it's returned
    if (currentLoan.actual_checkin_date) {
      return 'returned'
    }
    // If not returned and past due date, it's overdue
    if (currentLoan.expected_checkin_date && new Date(currentLoan.expected_checkin_date) < new Date()) {
      return 'overdue'
    }
    // Otherwise use stored status
    return currentLoan.status || 'active'
  }

  const currentStatus = calculateCurrentStatus()
  const statusInfo = getStatusInfo(currentStatus)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Button variant="outline" onClick={onBack} className="h-9 sm:h-10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Volver</span>
            <span className="xs:hidden">Atrás</span>
          </Button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold truncate">
              Préstamo PR{currentLoan.id.toString().padStart(4, '0')}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">Detalles del préstamo de equipo</p>
          </div>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          {isEditing ? (
            <>
              <Button 
                onClick={handleCancel}
                variant="outline" 
                disabled={isSaving}
                className="w-full xs:w-auto h-9 sm:h-10"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || !formData.asset_id || !formData.user_id}
                className="w-full xs:w-auto h-9 sm:h-10"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto h-9 sm:h-10">
              <Edit className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Editar Préstamo</span>
              <span className="xs:hidden">Editar</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Detalles del préstamo */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">{isEditing ? 'Editando Préstamo' : 'Detalles del Préstamo'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="asset" className="text-sm font-medium">Equipo *</Label>
                      <Select 
                        value={formData.asset_id} 
                        onValueChange={(value) => handleInputChange('asset_id', value)}
                      >
                        <SelectTrigger className="mt-1 h-9 sm:h-10">
                          <SelectValue placeholder="Seleccionar equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets?.map(asset => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              <div className="flex flex-col items-start">
                                <span className="text-sm">{asset.name}</span>
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
                      <Label htmlFor="user" className="text-sm font-medium">Usuario *</Label>
                      <Select 
                        value={formData.user_id} 
                        onValueChange={(value) => handleInputChange('user_id', value)}
                      >
                        <SelectTrigger className="mt-1 h-9 sm:h-10">
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles?.map(profile => (
                            <SelectItem key={profile.id} value={profile.id}>
                              <span className="text-sm">{profile.full_name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="checkout_date" className="text-sm font-medium">Fecha de Préstamo</Label>
                      <Input
                        id="checkout_date"
                        type="datetime-local"
                        value={formData.checkout_date}
                        onChange={(e) => handleInputChange('checkout_date', e.target.value)}
                        className="mt-1 h-9 sm:h-10"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="expected_checkin_date" className="text-sm font-medium">Fecha Esperada de Devolución</Label>
                      <Input
                        id="expected_checkin_date"
                        type="datetime-local"
                        value={formData.expected_checkin_date}
                        onChange={(e) => handleInputChange('expected_checkin_date', e.target.value)}
                        className="mt-1 h-9 sm:h-10"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-1">
                      <Label htmlFor="actual_checkin_date" className="text-sm font-medium">Fecha Real de Devolución</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="actual_checkin_date"
                          type="datetime-local"
                          value={formData.actual_checkin_date}
                          onChange={(e) => handleInputChange('actual_checkin_date', e.target.value)}
                          className="h-9 sm:h-10"
                        />
                        {!formData.actual_checkin_date && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={handleProcessReturn}
                            className="h-9 sm:h-10 px-2 sm:px-3"
                          >
                            <span className="hidden xs:inline">Ahora</span>
                            <span className="xs:hidden">Ya</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

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
                        {STATUSES.map(status => (
                          <SelectItem 
                            key={status.value} 
                            value={status.value}
                            disabled={status.value === 'overdue'}
                          >
                            <div className="flex items-center gap-2">
                              {status.value === 'active' && <Clock className="w-4 h-4" />}
                              {status.value === 'pending' && <AlertTriangle className="w-4 h-4" />}
                              {status.value === 'overdue' && <AlertTriangle className="w-4 h-4" />}
                              {status.value === 'returned' && <CheckCircle className="w-4 h-4" />}
                              <span className="text-sm">{status.label}</span>
                              {status.value === 'overdue' && (
                                <span className="text-xs text-muted-foreground ml-1">(automático)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Notas adicionales sobre el préstamo..."
                      rows={3}
                      className="mt-1 text-sm resize-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-start gap-2">
                      <Monitor className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground">Equipo:</span>
                        <p className="break-words">{currentLoan.assets?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground">Usuario:</span>
                        <p className="break-words">{currentLoan.profiles?.full_name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground">Préstamo:</span>
                        <p className="break-words">{formatDate(currentLoan.checkout_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground">Devolución esperada:</span>
                        <p className="break-words">{formatDate(currentLoan.expected_checkin_date)}</p>
                      </div>
                    </div>
                    {currentLoan.actual_checkin_date && (
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-muted-foreground">Devuelto:</span>
                          <p className="break-words">{formatDate(currentLoan.actual_checkin_date)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {currentLoan.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2 text-sm sm:text-base">Notas</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {currentLoan.notes}
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Historial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Historial del Préstamo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Evento de inicio del préstamo */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Préstamo iniciado</p>
                      <p className="text-xs text-muted-foreground">
                        {currentLoan.checkout_date ? formatRelativeTime(currentLoan.checkout_date) : 'Fecha no disponible'}
                      </p>
                    </div>
                  </div>
                  <div className="ml-10">
                    <p className="text-sm text-muted-foreground">
                      Equipo <span className="font-medium">{currentLoan.assets?.name || 'N/A'}</span> entregado a{' '}
                      <span className="font-medium">{currentLoan.profiles?.full_name || 'Usuario desconocido'}</span>
                    </p>
                    {currentLoan.checkout_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📅 {formatDate(currentLoan.checkout_date)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Evento de vencimiento (si aplica) */}
                {currentLoan.expected_checkin_date && 
                 new Date(currentLoan.expected_checkin_date) < new Date() && 
                 currentStatus !== 'returned' && (
                  <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">Préstamo vencido</p>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {formatRelativeTime(currentLoan.expected_checkin_date)}
                        </p>
                      </div>
                    </div>
                    <div className="ml-10">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        El equipo debía ser devuelto el {formatDate(currentLoan.expected_checkin_date)}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Evento de devolución */}
                {currentStatus === 'returned' && (
                  <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">Equipo devuelto</p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          {currentLoan.actual_checkin_date 
                            ? formatRelativeTime(currentLoan.actual_checkin_date)
                            : 'Marcado como devuelto'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="ml-10">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Préstamo completado exitosamente
                      </p>
                      {currentLoan.actual_checkin_date && (
                        <>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            📅 {formatDate(currentLoan.actual_checkin_date)}
                          </p>
                          {currentLoan.expected_checkin_date && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {new Date(currentLoan.actual_checkin_date) <= new Date(currentLoan.expected_checkin_date) 
                                ? '✅ Devuelto a tiempo' 
                                : '⚠️ Devuelto con retraso'
                              }
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Estado actual si no está devuelto */}
                {currentStatus !== 'returned' && (
                  <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">En curso</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Estado actual del préstamo</p>
                      </div>
                    </div>
                    <div className="ml-10">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        El equipo sigue en posesión de {currentLoan.profiles?.full_name || 'el usuario'}
                      </p>
                      {currentLoan.expected_checkin_date && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          📅 Devolución esperada: {formatDate(currentLoan.expected_checkin_date)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Estado actual */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm mb-2 block">Estado</label>
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
              </div>

              <div>
                <label className="text-sm mb-2 block">Usuario</label>
                <p className="text-sm">
                  {currentLoan.profiles?.full_name || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información del equipo */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Equipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Equipo:</span>
                <p>{currentLoan.assets?.name || 'N/A'}</p>
                {currentLoan.assets?.asset_types?.name && (
                  <p className="text-xs text-muted-foreground">
                    Tipo: {currentLoan.assets.asset_types.name}
                  </p>
                )}
                {currentLoan.assets?.serial_number && (
                  <p className="text-xs text-muted-foreground">
                    S/N: {currentLoan.assets.serial_number}
                  </p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <span className="text-muted-foreground">ID del Préstamo:</span>
                <p>PR{currentLoan.id.toString().padStart(4, '0')}</p>
              </div>
              
              <div>
                <span className="text-muted-foreground">Duración estimada:</span>
                <p>
                  {Math.ceil((new Date(currentLoan.expected_checkin_date).getTime() - new Date(currentLoan.checkout_date).getTime()) / (1000 * 60 * 60 * 24))} días
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}