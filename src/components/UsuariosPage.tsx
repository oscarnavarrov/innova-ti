import { useState, useMemo } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'
import { CreateUserDialog } from './CreateUserDialog'
import { EditUserDialog } from './EditUserDialog'
import { UserManagementTest } from './UserManagementTest'
import { UserActiveTest } from './UserActiveTest'
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  User, 
  Wrench,
  Trash2,
  Edit,
  Eye,
  Calendar,
  Clock,
  Mail,
  Bug
} from 'lucide-react'

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
  description?: string | null
  permissions?: any
}

export function UsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showTestMode, setShowTestMode] = useState(false)
  const itemsPerPage = 10

  const { data: users, loading: usersLoading, refetch: refetchUsers } = useApi<User[]>('/users')
  const { data: roles } = useApi<Role[]>('/roles')

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    if (!users) return []
    
    return users.filter(user => {
      const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || user.role_id.toString() === roleFilter
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.active) ||
                           (statusFilter === 'inactive' && !user.active)
      
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredUsers, currentPage])

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const handleUserCreated = () => {
    refetchUsers()
  }

  const handleUserUpdated = () => {
    refetchUsers()
    setEditingUser(null)
  }

  const getRoleBadge = (roleName: string | null, roleId: number) => {
    const roleColor = {
      1: 'bg-red-100 text-red-800',      // Administrador
      2: 'bg-blue-100 text-blue-800',    // Técnico  
      3: 'bg-green-100 text-green-800'   // Docente
    }[roleId] || 'bg-gray-100 text-gray-800'

    const roleIcon = {
      1: Shield,
      2: Wrench,
      3: User
    }[roleId] || User

    const IconComponent = roleIcon

    return (
      <Badge variant="secondary" className={roleColor}>
        <IconComponent className="w-3 h-3 mr-1" />
        {roleName || 'Sin rol'}
      </Badge>
    )
  }

  const getStatusBadge = (active: boolean) => (
    <Badge variant={active ? 'default' : 'secondary'}>
      {active ? 'Activo' : 'Inactivo'}
    </Badge>
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  // Show test mode if enabled
  if (showTestMode) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 mb-2 text-xl sm:text-2xl">
              <Bug className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="truncate">Pruebas del Sistema de Usuarios</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Modo de pruebas para verificar la funcionalidad de usuarios
            </p>
          </div>
          
          <Button variant="outline" onClick={() => setShowTestMode(false)} className="w-full sm:w-auto">
            <span className="hidden xs:inline">Volver a Gestión Normal</span>
            <span className="xs:hidden">Volver</span>
          </Button>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <UserActiveTest />
          <UserManagementTest />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 mb-2 text-xl sm:text-2xl">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="truncate">Gestión de Usuarios</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Administra los usuarios del sistema y sus roles
          </p>
        </div>
        
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">

          <CreateUserDialog onUserCreated={handleUserCreated} />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="sm:col-span-3 lg:col-span-1">
              <label className="text-xs sm:text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10"
                />
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">Rol</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {roles?.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <span className="text-sm">{role.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Información de resultados */}
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 pt-4 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mostrando {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
              {users && filteredUsers.length !== users.length && ` de ${users.length} total`}
            </p>
            {totalPages > 1 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base">
            Lista de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedUsers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No hay usuarios disponibles</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No se encontraron usuarios que coincidan con los filtros aplicados.'
                  : 'Aún no hay usuarios registrados en el sistema.'
                }
              </p>
              {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setRoleFilter('all')
                    setStatusFilter('all')
                  }}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {paginatedUsers.map(user => (
                <Card key={user.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row items-start gap-4">
                    {/* Header móvil */}
                    <div className="flex items-start gap-3 flex-1 w-full">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-2">
                          <h3 className="font-medium text-sm sm:text-base truncate">{user.full_name}</h3>
                          <div className="flex flex-wrap gap-2">
                            {getRoleBadge(user.roles?.name || null, user.role_id)}
                            {getStatusBadge(user.active)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Creado: {formatDate(user.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:col-span-2 xl:col-span-1">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Último: {formatDateTime(user.last_sign_in_at)}</span>
                          </div>
                        </div>

                        {/* Botones móvil */}
                        <div className="flex gap-2 mt-3 lg:hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowDetails(true)
                            }}
                            className="flex-1 h-8 sm:h-9"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            <span className="text-xs sm:text-sm">Ver</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="flex-1 h-8 sm:h-9"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            <span className="text-xs sm:text-sm">Editar</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Panel lateral desktop */}
                    <div className="hidden lg:flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDetails(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
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

      {/* User Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Detalles del Usuario</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Información completa del usuario seleccionado
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selectedUser && (
              <div className="space-y-4 sm:space-y-6 pb-4">
                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm sm:text-base">Información Personal</h3>
                    
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Nombre completo</label>
                      <p className="text-xs sm:text-sm break-words">{selectedUser.full_name}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-xs sm:text-sm break-all">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-sm sm:text-base">Información del Sistema</h3>
                    
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Rol</label>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(selectedUser.roles?.name || null, selectedUser.role_id)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Estado</label>
                      <div>{getStatusBadge(selectedUser.active)}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Fecha de registro</label>
                      <p className="text-xs sm:text-sm">{formatDate(selectedUser.created_at)}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-muted-foreground">Último acceso</label>
                      <p className="text-xs sm:text-sm break-words">{formatDateTime(selectedUser.last_sign_in_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onUserUpdated={handleUserUpdated}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  )
}