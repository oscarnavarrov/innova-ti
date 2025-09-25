import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './ui/pagination'
import { useApi } from '../hooks/useApi'
import { QRCodeGenerator } from './QRCodeGenerator'
import { CreateAssetDialog } from './CreateAssetDialog'
import { CreateAssetTypeDialog } from './CreateAssetTypeDialog'
import { EditAssetDialog } from './EditAssetDialog'
import { Search, Plus, Monitor, Laptop, Printer, Tablet, Calendar, MapPin, Wrench, Clock, FileText, User, CheckCircle, AlertCircle, XCircle, Settings, Filter, SortAsc, SortDesc, Edit } from 'lucide-react'

interface Asset {
  id: number
  name: string
  qr_code: string
  serial_number: string | null
  description: string | null
  purchase_date: string | null
  status_id: number
  type_id: number
  created_at: string
  asset_types: { id: number; name: string; description: string | null } | null
  asset_status: { id: number; name: string } | null
  // Información de préstamo actual (si existe)
  current_loan?: {
    id: number
    user_id: string
    checkout_date: string
    expected_checkin_date: string | null
    status: string | null
    profiles: { full_name: string } | null
  } | null
}

const getEstadoBadge = (estado: string, hasActiveLoan: boolean = false) => {
  // Override status if there's an active loan
  const realEstado = hasActiveLoan ? 'En Préstamo' : estado;
  
  switch (realEstado) {
    case 'Disponible':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Disponible</Badge>
    case 'En Préstamo':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">En Préstamo</Badge>
    case 'En Uso':
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">En Uso</Badge>
    case 'En Mantenimiento':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">En Mantenimiento</Badge>
    case 'Retirado':
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Retirado</Badge>
    default:
      return <Badge variant="secondary">{realEstado}</Badge>
  }
}

// Nueva función para determinar el estado de disponibilidad para préstamo
const getEstadoDisponibilidad = (equipo: Asset) => {
  const estado = equipo.asset_status?.name || 'Desconocido';
  
  // Si tiene préstamo activo, está prestado (prioridad máxima)
  if (equipo.current_loan) {
    return {
      disponible: false,
      category: 'prestado',
      badge: <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">En Préstamo</Badge>,
      mensaje: 'Este equipo está actualmente prestado a un docente',
      descripcion: 'El equipo no puede ser reasignado hasta que sea devuelto',
      detalles: {
        usuario: equipo.current_loan.profiles?.full_name || 'Usuario desconocido',
        fecha: equipo.current_loan.checkout_date,
        esperada: equipo.current_loan.expected_checkin_date
      }
    };
  }
  
  // Manejo de estados según la BD
  switch (estado) {
    case 'Disponible':
      return {
        disponible: true,
        category: 'disponible',
        badge: <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Disponible</Badge>,
        mensaje: 'Este equipo está disponible para préstamo',
        descripcion: 'El equipo puede ser asignado a docentes que lo soliciten',
        detalles: null
      };
      
    case 'En Uso':
      return {
        disponible: false,
        category: 'en_uso',
        badge: <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">En Uso</Badge>,
        mensaje: 'Este equipo está en uso institucional',
        descripcion: 'El equipo está siendo utilizado internamente por la institución y no está disponible para préstamo',
        detalles: null
      };
      
    case 'En Mantenimiento':
      return {
        disponible: false,
        category: 'mantenimiento',
        badge: <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">En Mantenimiento</Badge>,
        mensaje: 'Este equipo está en mantenimiento',
        descripcion: 'El equipo requiere reparación o mantenimiento y no puede ser prestado',
        detalles: null
      };
      
    case 'Retirado':
      return {
        disponible: false,
        category: 'retirado',
        badge: <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Retirado</Badge>,
        mensaje: 'Este equipo ha sido retirado del inventario',
        descripcion: 'El equipo ya no está en servicio activo y ha sido dado de baja del inventario',
        detalles: null
      };
      
    default:
      return {
        disponible: false,
        category: 'desconocido',
        badge: <Badge variant="secondary">{estado}</Badge>,
        mensaje: `Estado del equipo: ${estado}`,
        descripcion: 'Estado no reconocido en el sistema',
        detalles: null
      };
  }
}

const getTipoIcon = (tipo: string) => {
  const lowerType = tipo.toLowerCase()
  if (lowerType.includes('laptop') || lowerType.includes('portátil')) {
    return <Laptop className="w-4 h-4" />
  }
  if (lowerType.includes('monitor') || lowerType.includes('pantalla')) {
    return <Monitor className="w-4 h-4" />
  }
  if (lowerType.includes('proyector')) {
    return <Printer className="w-4 h-4" />
  }
  if (lowerType.includes('tablet') || lowerType.includes('ipad')) {
    return <Tablet className="w-4 h-4" />
  }
  return <Monitor className="w-4 h-4" />
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Función para obtener estilos contextuales según el estado
const getEstilosContextuales = (category: string) => {
  switch (category) {
    case 'disponible':
      return {
        bgClass: 'bg-green-50 dark:bg-green-950',
        borderClass: 'border-green-200 dark:border-green-800',
        textClass: 'text-green-800 dark:text-green-200'
      };
    case 'en_uso':
      return {
        bgClass: 'bg-orange-50 dark:bg-orange-950',
        borderClass: 'border-orange-200 dark:border-orange-800',
        textClass: 'text-orange-800 dark:text-orange-200'
      };
    case 'mantenimiento':
      return {
        bgClass: 'bg-red-50 dark:bg-red-950',
        borderClass: 'border-red-200 dark:border-red-800',
        textClass: 'text-red-800 dark:text-red-200'
      };
    case 'retirado':
      return {
        bgClass: 'bg-gray-50 dark:bg-gray-950',
        borderClass: 'border-gray-200 dark:border-gray-800',
        textClass: 'text-gray-800 dark:text-gray-200'
      };
    case 'prestado':
      return {
        bgClass: 'bg-blue-50 dark:bg-blue-950',
        borderClass: 'border-blue-200 dark:border-blue-800',
        textClass: 'text-blue-800 dark:text-blue-200'
      };
    default:
      return {
        bgClass: 'bg-muted',
        borderClass: 'border-border',
        textClass: 'text-muted-foreground'
      };
  }
}

function EquipoDetalleDialog({ equipo }: { equipo: Asset }) {
  return (
    <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col">
      <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
        <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-left">
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex-shrink-0">
            {getTipoIcon(equipo.asset_types?.name || '')}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl truncate">{equipo.name}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              ID: {equipo.id} • {equipo.asset_types?.name || 'Sin tipo'}
            </p>
          </div>
        </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">
          Información completa del equipo incluyendo detalles generales, estado de préstamo y código QR.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 min-h-0 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Tabs defaultValue="general" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-9 sm:h-10 flex-shrink-0">
            <TabsTrigger value="general" className="text-xs sm:text-sm">General</TabsTrigger>
            <TabsTrigger value="prestamo" className="text-xs sm:text-sm">Préstamo</TabsTrigger>
            <TabsTrigger value="qr" className="text-xs sm:text-sm">QR</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-1 pb-2">
            <TabsContent value="general" className="space-y-4 sm:space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Campo name */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="text-sm break-words">{equipo.name}</p>
                </div>

                {/* Campo serial_number */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Número de Serie</label>
                  <p className="font-mono text-xs sm:text-sm bg-muted px-2 py-1 rounded break-all">
                    {equipo.serial_number || 'N/A'}
                  </p>
                </div>

                {/* Campo description */}
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Descripción</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {equipo.description || 'Sin descripción'}
                  </p>
                </div>

                {/* Campo purchase_date */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Fecha de Compra</label>
                  <p className="text-xs sm:text-sm">{formatDate(equipo.purchase_date)}</p>
                </div>

                {/* Campo status_id */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Estado (ID: {equipo.status_id})
                  </label>
                  <div>{getEstadoBadge(equipo.asset_status?.name || 'Desconocido', !!equipo.current_loan)}</div>
                </div>

                {/* Campo type_id */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Tipo de Equipo (ID: {equipo.type_id})
                  </label>
                  <div className="flex items-center gap-2">
                    {getTipoIcon(equipo.asset_types?.name || '')}
                    <span className="text-xs sm:text-sm">{equipo.asset_types?.name || 'Sin tipo'}</span>
                  </div>
                  {equipo.asset_types?.description && (
                    <p className="text-xs text-muted-foreground">{equipo.asset_types.description}</p>
                  )}
                </div>

                {/* Campo created_at */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                  <p className="text-xs sm:text-sm">{formatDate(equipo.created_at)}</p>
                </div>

                {/* Campo qr_code */}
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Código QR</label>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">{equipo.qr_code}</p>
                </div>

                {/* Estado de Disponibilidad */}
                <div className="lg:col-span-2">
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Estado de Disponibilidad</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6">
                      {(() => {
                        const estadoDisponibilidad = getEstadoDisponibilidad(equipo);
                        
                        return (
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {estadoDisponibilidad.badge}
                              {equipo.current_loan?.expected_checkin_date && 
                               new Date(equipo.current_loan.expected_checkin_date) < new Date() && (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                  Vencido
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                                {estadoDisponibilidad.mensaje}
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {estadoDisponibilidad.descripcion}
                              </p>
                            </div>
                            
                            {estadoDisponibilidad.detalles && (() => {
                              const estilos = getEstilosContextuales(estadoDisponibilidad.category);
                              return (
                                <div className={`space-y-2 p-2 sm:p-3 ${estilos.bgClass} border ${estilos.borderClass} rounded-lg overflow-hidden`}>
                                  <div className="space-y-1.5 sm:space-y-2">
                                    <p className="text-xs sm:text-sm break-words">
                                      <span className="font-medium">Prestado a:</span>{' '}
                                      <span className="break-words">{estadoDisponibilidad.detalles.usuario}</span>
                                    </p>
                                    <p className="text-xs sm:text-sm">
                                      <span className="font-medium">Fecha de préstamo:</span>{' '}
                                      {formatDate(estadoDisponibilidad.detalles.fecha)}
                                    </p>
                                    {estadoDisponibilidad.detalles.esperada && (
                                      <p className="text-xs sm:text-sm">
                                        <span className="font-medium">Devolución esperada:</span>{' '}
                                        {formatDate(estadoDisponibilidad.detalles.esperada)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prestamo" className="space-y-4 sm:space-y-6 mt-0">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Estado de Disponibilidad y Préstamo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {(() => {
                    const estadoDisponibilidad = getEstadoDisponibilidad(equipo);
                    
                    if (equipo.current_loan) {
                      // Equipo prestado
                      return (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              En Préstamo
                            </Badge>
                            {equipo.current_loan.expected_checkin_date && 
                             new Date(equipo.current_loan.expected_checkin_date) < new Date() && (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                Vencido
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Usuario</label>
                              <p className="font-medium text-xs sm:text-sm break-words leading-relaxed">
                                {equipo.current_loan.profiles?.full_name || 'Usuario desconocido'}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs sm:text-sm font-medium text-muted-foreground">ID de Préstamo</label>
                              <p className="font-mono text-xs sm:text-sm">{equipo.current_loan.id}</p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Fecha de Préstamo</label>
                              <p className="text-xs sm:text-sm">{formatDate(equipo.current_loan.checkout_date)}</p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Devolución Esperada</label>
                              <p className="text-xs sm:text-sm">{formatDate(equipo.current_loan.expected_checkin_date)}</p>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <label className="text-xs sm:text-sm font-medium text-muted-foreground">Estado del Préstamo</label>
                              <p className="capitalize text-xs sm:text-sm">{equipo.current_loan.status || 'activo'}</p>
                            </div>
                          </div>
                          
                          {equipo.current_loan.expected_checkin_date && 
                           new Date(equipo.current_loan.expected_checkin_date) < new Date() && (
                            <div className="mt-4 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg overflow-hidden">
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-medium text-yellow-800 dark:text-yellow-200 block">
                                    Préstamo Vencido
                                  </span>
                                  <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 mt-1 break-words">
                                    Este equipo debería haber sido devuelto el {formatDate(equipo.current_loan.expected_checkin_date)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      // Sin préstamo activo
                      const getIconoEstado = (category: string) => {
                        switch (category) {
                          case 'disponible':
                            return { icon: CheckCircle, color: 'text-green-500', title: 'Equipo Disponible' };
                          case 'en_uso':
                            return { icon: Settings, color: 'text-orange-500', title: 'Equipo en Uso Institucional' };
                          case 'mantenimiento':
                            return { icon: Wrench, color: 'text-red-500', title: 'Equipo en Mantenimiento' };
                          case 'retirado':
                            return { icon: XCircle, color: 'text-gray-500', title: 'Equipo Retirado' };
                          default:
                            return { icon: AlertCircle, color: 'text-muted-foreground', title: 'Estado Desconocido' };
                        }
                      };
                      
                      const { icon, color, title } = getIconoEstado(estadoDisponibilidad.category);
                      const estilos = getEstilosContextuales(estadoDisponibilidad.category);
                      
                      return (
                        <div className={`p-3 sm:p-4 lg:p-6 ${estilos.bgClass} border ${estilos.borderClass} rounded-lg overflow-hidden`}>
                          <div className="text-center">
                            {React.createElement(icon, { 
                              className: `w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mx-auto mb-3 sm:mb-4 ${color}` 
                            })}
                            <div className="mb-3 sm:mb-4">
                              {estadoDisponibilidad.badge}
                            </div>
                            <h3 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                              {title}
                            </h3>
                            <div className="space-y-2 sm:space-y-3 max-w-sm sm:max-w-md mx-auto">
                              <p className="text-xs sm:text-sm font-medium leading-relaxed">
                                {estadoDisponibilidad.mensaje}
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {estadoDisponibilidad.descripcion}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4 sm:space-y-6 mt-0">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                    <Monitor className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">Código QR del Equipo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="max-w-xs sm:max-w-md mx-auto">
                    <QRCodeGenerator
                      data={equipo.qr_code}
                      title={equipo.name}
                      subtitle={`${equipo.asset_types?.name || 'Equipo'} • ID: ${equipo.id}`}
                      size={200}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DialogContent>
  )
}

export function EquiposPage() {
  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: equipos, loading } = useApi<Asset[]>(`/assets?_refresh=${refreshKey}`)
  
  // Obtener tipos de equipos directamente desde la BD
  const { data: assetTypes } = useApi<{ id: number; name: string; description: string | null }[]>(`/asset-types?_refresh=${refreshKey}`)

  // Lógica de filtrado y ordenación
  const filteredAndSortedEquipos = useMemo(() => {
    if (!equipos) return []

    let filtered = equipos.filter(equipo => {
      // Filtro de búsqueda
      const matchesSearch = 
        equipo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipo.asset_types?.name.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtro de estado
      let matchesStatus = true
      if (statusFilter !== 'all') {
        const equipoState = getEstadoDisponibilidad(equipo)
        switch (statusFilter) {
          case 'disponible':
            matchesStatus = equipoState.category === 'disponible'
            break
          case 'prestado':
            matchesStatus = equipoState.category === 'prestado'
            break
          case 'en_uso':
            matchesStatus = equipoState.category === 'en_uso'
            break
          case 'mantenimiento':
            matchesStatus = equipoState.category === 'mantenimiento'
            break
          case 'retirado':
            matchesStatus = equipoState.category === 'retirado'
            break
        }
      }

      // Filtro de tipo
      const matchesType = typeFilter === 'all' || 
        equipo.asset_types?.name.toLowerCase().includes(typeFilter.toLowerCase())

      return matchesSearch && matchesStatus && matchesType
    })

    // Ordenación
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'type':
          aValue = a.asset_types?.name?.toLowerCase() || ''
          bValue = b.asset_types?.name?.toLowerCase() || ''
          break
        case 'status':
          aValue = a.asset_status?.name?.toLowerCase() || ''
          bValue = b.asset_status?.name?.toLowerCase() || ''
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [equipos, searchTerm, statusFilter, typeFilter, sortBy, sortOrder])

  // Paginación
  const totalItems = filteredAndSortedEquipos.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEquipos = filteredAndSortedEquipos.slice(startIndex, endIndex)

  // Obtener tipos únicos para el filtro desde la BD
  const availableTypes = useMemo(() => {
    if (!assetTypes) return []
    return assetTypes.map(type => type.name).sort()
  }, [assetTypes])

  // Función para manejar actualizaciones de equipos
  const handleAssetUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  // Función para manejar edición de equipos
  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
    setEditDialogOpen(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold truncate">Gestión de Equipos</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Administra el inventario de equipos tecnológicos
          </p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <CreateAssetTypeDialog onAssetTypeCreated={handleAssetUpdated} />
          <CreateAssetDialog onAssetCreated={handleAssetUpdated} />
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : equipos?.length || 0}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Equipos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : equipos?.filter(e => getEstadoDisponibilidad(e).category === 'disponible').length || 0}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Disponibles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : equipos?.filter(e => getEstadoDisponibilidad(e).category === 'prestado').length || 0}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">En Préstamo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-red-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : equipos?.filter(e => getEstadoDisponibilidad(e).category === 'mantenimiento').length || 0}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Mantenimiento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y controles */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, serie o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col xs:flex-row gap-2 lg:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full xs:w-36 sm:w-40 h-9 sm:h-10">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="prestado">En Préstamo</SelectItem>
                  <SelectItem value="en_uso">En Uso</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="retirado">Retirado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full xs:w-36 sm:w-40 h-9 sm:h-10">
                  <Monitor className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {availableTypes.map(type => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full xs:w-32 sm:w-36 h-9 sm:h-10">
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4 mr-2" />
                  ) : (
                    <SortDesc className="w-4 h-4 mr-2" />
                  )}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="type">Tipo</SelectItem>
                  <SelectItem value="status">Estado</SelectItem>
                  <SelectItem value="created_at">Fecha</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="h-9 sm:h-10 px-3"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Resultados y paginación móvil */}
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mt-4 pt-4 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mostrando {Math.min(startIndex + 1, totalItems)} - {Math.min(endIndex, totalItems)} de {totalItems} equipos
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">
                Items por página:
              </span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de equipos */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-3 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : currentEquipos.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12">
            <div className="text-center">
              <Monitor className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No se encontraron equipos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No hay equipos que coincidan con los filtros seleccionados.
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setTypeFilter('all')
              }}>
                Limpiar filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {currentEquipos.map((equipo) => {
            const estadoDisponibilidad = getEstadoDisponibilidad(equipo)
            
            return (
              <Card key={equipo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Icono y info básica */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex-shrink-0">
                        {getTipoIcon(equipo.asset_types?.name || '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{equipo.name}</h3>
                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mt-1">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            ID: {equipo.id}
                          </p>
                          <span className="hidden xs:inline text-muted-foreground">•</span>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {equipo.asset_types?.name || 'Sin tipo'}
                          </p>
                          {equipo.serial_number && (
                            <>
                              <span className="hidden xs:inline text-muted-foreground">•</span>
                              <p className="text-xs sm:text-sm font-mono text-muted-foreground">
                                {equipo.serial_number}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {estadoDisponibilidad.badge}
                          {equipo.current_loan?.expected_checkin_date && 
                           new Date(equipo.current_loan.expected_checkin_date) < new Date() && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                              Vencido
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Información de préstamo (móvil) */}
                    {equipo.current_loan && (
                      <div className="w-full sm:hidden p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Préstamo Activo</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Usuario:</span> {equipo.current_loan.profiles?.full_name || 'Desconocido'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Desde:</span> {formatDate(equipo.current_loan.checkout_date)}
                        </p>
                        {equipo.current_loan.expected_checkin_date && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Hasta:</span> {formatDate(equipo.current_loan.expected_checkin_date)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Información de préstamo (desktop) */}
                    {equipo.current_loan && (
                      <div className="hidden sm:block p-3 bg-muted/50 rounded-lg min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Préstamo Activo</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {equipo.current_loan.profiles?.full_name || 'Usuario desconocido'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(equipo.current_loan.checkout_date)} - {formatDate(equipo.current_loan.expected_checkin_date)}
                        </p>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-8 sm:h-9">
                            <FileText className="w-4 h-4 mr-2" />
                            <span className="hidden xs:inline">Ver Detalles</span>
                            <span className="xs:hidden">Detalles</span>
                          </Button>
                        </DialogTrigger>
                        <EquipoDetalleDialog equipo={equipo} />
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAsset(equipo)}
                        className="flex-1 sm:flex-none h-8 sm:h-9"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        <span className="hidden xs:inline">Editar</span>
                        <span className="xs:hidden">Edit</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground order-2 sm:order-1">
            Página {currentPage} de {totalPages}
          </p>
          <Pagination className="order-1 sm:order-2">
            <PaginationContent className="flex-wrap gap-1">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* Páginas dinámicas para móvil */}
              {window.innerWidth < 640 ? (
                // Móvil: mostrar solo página actual
                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>
              ) : (
                // Desktop: mostrar más páginas
                <>
                  {currentPage > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}
                  
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(currentPage - 1)}>
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationLink isActive>{currentPage}</PaginationLink>
                  </PaginationItem>
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(currentPage + 1)}>
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Dialog de edición */}
      {editingAsset && (
        <EditAssetDialog
          asset={editingAsset}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onAssetUpdated={handleAssetUpdated}
        />
      )}
    </div>
  )
}