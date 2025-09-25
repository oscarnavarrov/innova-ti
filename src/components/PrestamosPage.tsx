import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { LoanDetails } from './LoanDetails'
import { CreateLoanDialog } from './CreateLoanDialog'
import { useApi } from '../hooks/useApi'
import { Plus, Calendar, User, ArrowRight, Search, Filter } from 'lucide-react'

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
    asset_types?: {
      name: string
    }
  } | null
  profiles: { 
    id: string
    full_name: string 
  } | null
}

interface ApiResponse {
  data: Loan[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Calculate current status - SAME LOGIC AS LoanDetails
const calculateLoanStatus = (loan: Loan) => {
  // If explicitly marked as returned, use that
  if (loan.status === 'returned') {
    return 'returned'
  }
  // If there's actual checkin date, it's returned
  if (loan.actual_checkin_date) {
    return 'returned'
  }
  // If not returned and past due date, it's overdue
  if (loan.expected_checkin_date && new Date(loan.expected_checkin_date) < new Date()) {
    return 'overdue'
  }
  // Otherwise use stored status
  return loan.status || 'active'
}

const getEstadoBadge = (loan: Loan) => {
  const status = calculateLoanStatus(loan)
  
  switch (status) {
    case 'returned':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Devuelto</Badge>
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Vencido</Badge>
    case 'active':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Activo</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pendiente</Badge>
    default:
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">{status}</Badge>
  }
}

const getEstadoTexto = (loan: Loan) => {
  const status = calculateLoanStatus(loan)
  
  switch (status) {
    case 'returned': return 'Devuelto'
    case 'overdue': return 'Vencido'  
    case 'active': return 'Activo'
    case 'pending': return 'Pendiente'
    default: return status
  }
}

interface PrestamosPageProps {
  onNavigate?: (page: string, data?: any) => void
}

export function PrestamosPage(props: PrestamosPageProps = {}) {
  const { onNavigate } = props
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [limit, setLimit] = useState(10)
  
  // Build query parameters - Use useMemo to ensure stable reference
  const apiEndpoint = useMemo(() => {
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString()
    })
    
    if (searchQuery.trim()) {
      queryParams.append('search', searchQuery.trim())
    }
    
    if (statusFilter !== 'all') {
      queryParams.append('status', statusFilter)
    }
    
    // Add refresh key to force re-fetch when needed
    queryParams.append('_refresh', refreshKey.toString())
    
    const endpoint = `/prestamos?${queryParams.toString()}`
    console.log('🔍 PrestamosPage: API endpoint built:', endpoint)
    return endpoint
  }, [currentPage, limit, searchQuery, statusFilter, refreshKey])
  
  const { data: response, loading, refetch } = useApi<ApiResponse>(apiEndpoint)
  
  const prestamos = response?.data || []
  const pagination = response?.pagination

  const stats = useMemo(() => {
    if (!prestamos) return { activos: 0, vencidos: 0, devueltosHoy: 0 }
    
    const today = new Date().toDateString()
    
    return prestamos.reduce(
      (acc, loan) => {
        const estado = getEstadoTexto(loan)
        
        if (estado === 'Activo') acc.activos++
        else if (estado === 'Vencido') acc.vencidos++
        
        if (loan.actual_checkin_date && new Date(loan.actual_checkin_date).toDateString() === today) {
          acc.devueltosHoy++
        }
        
        return acc
      },
      { activos: 0, vencidos: 0, devueltosHoy: 0 }
    )
  }, [prestamos])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSearch = (query: string) => {
    console.log('🔍 PrestamosPage: Search query changed to:', query)
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleStatusFilter = (status: string) => {
    console.log('🔍 PrestamosPage: Status filter changed to:', status)
    setStatusFilter(status)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleLoanUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleLoanCreated = () => {
    setRefreshKey(prev => prev + 1)
    setCurrentPage(1) // Go to first page to see the new loan
  }

  const handleLimitChange = (newLimit: string) => {
    console.log('🔍 PrestamosPage: Limit changed to:', newLimit)
    setLimit(parseInt(newLimit))
    setCurrentPage(1) // Reset to first page when changing limit
  }

  const handleViewDetails = (loan: Loan) => {
    setSelectedLoan(loan)
  }

  const handleBackToList = () => {
    setSelectedLoan(null)
  }

  // If viewing details, show LoanDetails component
  if (selectedLoan) {
    return (
      <LoanDetails
        loan={selectedLoan}
        onBack={handleBackToList}
        onUpdate={handleLoanUpdated}
      />
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold truncate">Gestión de Préstamos</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Administra los préstamos de equipos a docentes
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Nuevo Préstamo</span>
          <span className="xs:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : stats.activos}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : stats.vencidos}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold tabular-nums">
                  {loading ? '-' : stats.devueltosHoy}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">Hoy</p>
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
            <span className="truncate">Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 xs:items-end">
            <div className="flex-1 xs:min-w-40">
              <label className="text-xs sm:text-sm font-medium mb-2 block">Estado</label>
              <Select 
                key={`status-filter-${statusFilter}`}
                value={statusFilter} 
                onValueChange={handleStatusFilter}
              >
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="returned">Devuelto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="xs:w-24">
              <label className="text-xs sm:text-sm font-medium mb-2 block">Por página</label>
              <Select 
                key={`limit-filter-${limit}`}
                value={limit.toString()} 
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="h-9 sm:h-10">
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

          {/* Información de resultados */}
          {pagination && (
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 pt-4 border-t">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} préstamos
              </p>
              {pagination.totalPages > 1 && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Página {pagination.page} de {pagination.totalPages}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de préstamos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">
            Lista de Préstamos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 sm:h-24" />
              ))
            ) : prestamos && prestamos.length > 0 ? (
              prestamos.map((prestamo) => (
                <div key={prestamo.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row items-start gap-4">
                    {/* Header móvil */}
                    <div className="flex items-start gap-3 flex-1 w-full">
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg flex-shrink-0">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-2">
                          <h3 className="font-medium text-sm sm:text-base truncate">
                            {prestamo.assets?.name || 'Equipo no disponible'}
                          </h3>
                          <Badge variant="outline" className="text-xs w-fit">
                            PR{prestamo.id.toString().padStart(4, '0')}
                          </Badge>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 truncate">
                          {prestamo.profiles?.full_name || 'Usuario desconocido'}
                        </p>
                        
                        {/* Badge móvil */}
                        <div className="mb-3 lg:hidden">
                          {getEstadoBadge(prestamo)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Préstamo: {formatDate(prestamo.checkout_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Devolución: {formatDate(prestamo.expected_checkin_date)}</span>
                          </div>
                          {prestamo.actual_checkin_date && (
                            <div className="flex items-center gap-1 sm:col-span-2">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Devuelto: {formatDate(prestamo.actual_checkin_date)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Botón móvil */}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(prestamo)}
                          className="w-full sm:w-auto lg:hidden mt-3 h-8 sm:h-9"
                        >
                          <span className="text-xs sm:text-sm">Ver Detalles</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Panel lateral desktop */}
                    <div className="hidden lg:flex items-center gap-4">
                      <div className="flex flex-col items-end gap-2">
                        {getEstadoBadge(prestamo)}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(prestamo)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12 text-muted-foreground">
                <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-4 opacity-50" />
                <h3 className="text-base sm:text-lg font-medium mb-2">No hay préstamos disponibles</h3>
                <p className="text-sm max-w-md mx-auto">
                  {(searchQuery || statusFilter !== 'all') 
                    ? 'No se encontraron préstamos que coincidan con los filtros aplicados.'
                    : 'Aún no se han registrado préstamos de equipos.'
                  }
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                    }}
                    className="mt-4"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
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
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
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
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="h-8 sm:h-9"
                >
                  <span className="hidden xs:inline">Siguiente</span>
                  <span className="xs:hidden">Sig</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Loan Dialog */}
      <CreateLoanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onLoanCreated={handleLoanCreated}
      />
    </div>
  )
}