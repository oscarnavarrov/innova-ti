import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useApi } from '../hooks/useApi'
import { TicketDetails } from './TicketDetails'
import { CreateTicketDialog } from './CreateTicketDialog'
import { 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter,
  Eye,
  User,
  Monitor,
  Calendar
} from 'lucide-react'

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

const PRIORITIES = [
  { value: 'baja', label: 'Baja', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'media', label: 'Media', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'alta', label: 'Alta', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  { value: 'critica', label: 'Crítica', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' }
]

const STATUSES = [
  { value: 'abierto', label: 'Abierto', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  { value: 'en_progreso', label: 'En Progreso', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  { value: 'pendiente', label: 'Pendiente', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' },
  { value: 'resuelto', label: 'Resuelto', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  { value: 'cerrado', label: 'Cerrado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
]

const getPriorityInfo = (priority: string) => {
  return PRIORITIES.find(p => p.value === priority?.toLowerCase()) || 
         { value: priority, label: priority || 'Sin prioridad', color: 'bg-gray-100 text-gray-800' }
}

const getStatusInfo = (status: string) => {
  return STATUSES.find(s => s.value === status?.toLowerCase()) || 
         { value: status, label: status || 'Sin estado', color: 'bg-gray-100 text-gray-800' }
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'abierto':
      return <Clock className="w-4 h-4" />
    case 'en_progreso':
    case 'en progreso':
      return <AlertTriangle className="w-4 h-4" />
    case 'resuelto':
    case 'cerrado':
      return <CheckCircle className="w-4 h-4" />
    case 'pendiente':
      return <Clock className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

export function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const { data: tickets, loading, refetch } = useApi<Ticket[]>('/tickets')

  // Filtrar tickets
  const filteredTickets = useMemo(() => {
    if (!tickets) return []
    
    return tickets.filter(ticket => {
      const matchesSearch = !searchTerm || 
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toString().includes(searchTerm) ||
        ticket.assets?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.reported_by_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || ticket.status?.toLowerCase() === statusFilter
      const matchesPriority = priorityFilter === 'all' || ticket.priority?.toLowerCase() === priorityFilter
      
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, searchTerm, statusFilter, priorityFilter])

  // Paginación
  const totalItems = filteredTickets.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTickets = filteredTickets.slice(startIndex, endIndex)

  // Estadísticas
  const stats = useMemo(() => {
    if (!tickets) return { abiertos: 0, enProgreso: 0, resueltos: 0, total: 0 }
    
    return tickets.reduce(
      (acc, ticket) => {
        const status = ticket.status?.toLowerCase()
        acc.total++
        if (status === 'abierto') acc.abiertos++
        else if (status === 'en_progreso' || status === 'en progreso') acc.enProgreso++
        else if (status === 'resuelto' || status === 'cerrado') acc.resueltos++
        return acc
      },
      { abiertos: 0, enProgreso: 0, resueltos: 0, total: 0 }
    )
  }, [tickets])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleTicketCreated = () => {
    refetch()
    setIsCreateDialogOpen(false)
    setCurrentPage(1) // Go to first page to see the new ticket
  }

  const handleItemsPerPageChange = (newItemsPerPage: string) => {
    setItemsPerPage(parseInt(newItemsPerPage))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const handleTicketUpdated = () => {
    refetch()
    // Don't reset selectedTicket, let TicketDetails manage its own state
  }

  // Vista de detalles del ticket
  if (selectedTicket) {
    return (
      <TicketDetails 
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
        onUpdate={handleTicketUpdated}
      />
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold truncate">Tickets de Soporte</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gestiona los tickets de mantenimiento y soporte técnico
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Nuevo Ticket</span>
          <span className="xs:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : stats.abiertos}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Abiertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : stats.enProgreso}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">En Progreso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : stats.resueltos}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Resueltos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : stats.total}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Filter className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Filtros y Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por título, ID, equipo o usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2 lg:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full xs:w-36 sm:w-40 h-9 sm:h-10">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full xs:w-36 sm:w-40 h-9 sm:h-10">
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  {PRIORITIES.map(priority => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-full xs:w-20 h-9 sm:h-10">
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

          {/* Resultados y estadísticas móvil */}
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 pt-4 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mostrando {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} 
              {filteredTickets.length !== stats.total && ` de ${stats.total} total`}
            </p>
            {totalPages > 1 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de tickets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">
            Lista de Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 sm:h-32" />
              ))
            ) : currentTickets && currentTickets.length > 0 ? (
              currentTickets.map((ticket) => {
                const priorityInfo = getPriorityInfo(ticket.priority)
                const statusInfo = getStatusInfo(ticket.status)
                
                return (
                  <div key={ticket.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row items-start gap-4">
                      {/* Header móvil */}
                      <div className="flex items-start gap-3 flex-1 w-full">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex-shrink-0">
                          {getStatusIcon(ticket.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-2">
                            <h3 className="font-semibold text-sm sm:text-lg truncate">{ticket.title}</h3>
                            <Badge variant="outline" className="text-xs w-fit">
                              TK{ticket.id.toString().padStart(4, '0')}
                            </Badge>
                          </div>
                          
                          {/* Badges móvil */}
                          <div className="flex flex-wrap gap-2 mb-3 lg:hidden">
                            <Badge className={`${priorityInfo.color} text-xs`}>
                              {priorityInfo.label}
                            </Badge>
                            <Badge className={`${statusInfo.color} text-xs`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{ticket.assets?.name || 'Sin equipo asignado'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Por: {ticket.reported_by_profile?.full_name || 'Desconocido'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{formatDate(ticket.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Asignado: {ticket.assigned_to_profile?.full_name || 'Sin asignar'}</span>
                            </div>
                          </div>

                          {ticket.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                              {ticket.description}
                            </p>
                          )}
                          
                          {/* Botón móvil */}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTicket(ticket)}
                            className="w-full sm:w-auto lg:hidden h-8 sm:h-9"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            <span className="text-xs sm:text-sm">Ver Detalles</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Panel lateral desktop */}
                      <div className="hidden lg:flex flex-col items-end gap-3 ml-4">
                        <div className="flex flex-col gap-2">
                          <Badge className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No hay tickets disponibles</h3>
                <p className="text-sm max-w-md mx-auto">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'No se encontraron tickets que coincidan con los filtros aplicados.'
                    : 'Aún no se han creado tickets de soporte.'
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                  }}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
              <div className="flex justify-center items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="h-8 sm:h-9"
                >
                  <span className="hidden xs:inline">Anterior</span>
                  <span className="xs:hidden">Ant</span>
                </Button>
                
                <div className="flex items-center gap-1">
                  {/* Paginación simplificada para móvil */}
                  <div className="sm:hidden">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 min-w-8"
                    >
                      {currentPage}
                    </Button>
                  </div>
                  
                  {/* Paginación completa para desktop */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-9 min-w-9"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="h-8 sm:h-9"
                >
                  <span className="hidden xs:inline">Siguiente</span>
                  <span className="xs:hidden">Sig</span>
                </Button>
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground order-first sm:order-last">
                {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTicketDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleTicketCreated}
      />
    </div>
  )
}