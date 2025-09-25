import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import { useApi } from '../hooks/useApi'
import { CreateFAQDialog } from './CreateFAQDialog'
import { EditFAQDialog } from './EditFAQDialog'
import { FAQViewDialog } from './FAQViewDialog'
import { toast } from 'sonner@2.0.3'
import { 
  Search, 
  Plus, 
  FileText, 
  Edit, 
  Eye, 
  Tag, 
  Calendar, 
  User, 
  ExternalLink,
  Play,
  Monitor,
  Filter,
  Grid,
  List
} from 'lucide-react'

interface FAQ {
  id: number
  question: string
  answer: string
  category: string | null
  manual_md: string | null
  references_links: string[] | null
  video_urls: string[] | null
  asset_id: number | null
  created_by: string
  created_at: string
  profiles?: {
    full_name: string
  }
  assets?: {
    name: string
    serial_number: string
  }
}

export function FAQsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [viewingFAQ, setViewingFAQ] = useState<FAQ | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: faqs, refetch: refetchFAQs } = useApi<FAQ[]>('/faqs')

  // Obtener categorías únicas
  const categories = faqs ? Array.from(new Set(faqs.map(faq => faq.category).filter(Boolean))) : []

  // Filtrar FAQs
  const filteredFAQs = faqs?.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (faq.category?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory

    return matchesSearch && matchesCategory
  }) || []

  const handleCreateSuccess = () => {
    refetchFAQs()
    setCreateDialogOpen(false)
    toast.success('FAQ creada exitosamente')
  }

  const handleEditSuccess = () => {
    refetchFAQs()
    setEditingFAQ(null)
    toast.success('FAQ actualizada exitosamente')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const FAQCard = ({ faq }: { faq: FAQ }) => (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm sm:text-base line-clamp-2 leading-snug flex-1 min-w-0">
            {faq.question}
          </CardTitle>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingFAQ(faq)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              title="Ver detalles"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingFAQ(faq)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              title="Editar"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
          {faq.category && (
            <Badge variant="secondary" className="text-xs">
              <Tag className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
              <span className="truncate max-w-[100px] sm:max-w-none">{faq.category}</span>
            </Badge>
          )}
          
          {faq.asset_id && faq.assets && (
            <Badge variant="outline" className="text-xs">
              <Monitor className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
              <span className="truncate max-w-[80px] sm:max-w-none">{faq.assets.name}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-3 sm:mb-4">
          {faq.answer}
        </p>
        
        <div className="space-y-2">
          {/* Iconos de recursos - responsive */}
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-muted-foreground">
            {faq.manual_md && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="hidden xs:inline">Manual</span>
              </div>
            )}
            
            {faq.video_urls && faq.video_urls.length > 0 && (
              <div className="flex items-center gap-1">
                <Play className="w-3 h-3 flex-shrink-0" />
                <span className="hidden xs:inline">{faq.video_urls.length} video{faq.video_urls.length > 1 ? 's' : ''}</span>
                <span className="xs:hidden">{faq.video_urls.length}v</span>
              </div>
            )}
            
            {faq.references_links && faq.references_links.length > 0 && (
              <div className="flex items-center gap-1">
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="hidden xs:inline">{faq.references_links.length} enlace{faq.references_links.length > 1 ? 's' : ''}</span>
                <span className="xs:hidden">{faq.references_links.length}e</span>
              </div>
            )}
          </div>
          
          {/* Info de creación */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>{formatDate(faq.created_at)}</span>
            </div>
            
            {faq.profiles && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{faq.profiles.full_name}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const FAQListItem = ({ faq }: { faq: FAQ }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col xs:flex-row xs:items-start gap-2 xs:gap-3 mb-2">
              <h3 className="font-medium text-sm sm:text-base line-clamp-1 flex-1 min-w-0">{faq.question}</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
                {faq.category && (
                  <Badge variant="secondary" className="text-xs">
                    <span className="truncate max-w-[100px] sm:max-w-none">{faq.category}</span>
                  </Badge>
                )}
                {faq.asset_id && (
                  <Badge variant="outline" className="text-xs">
                    <Monitor className="w-3 h-3 mr-1" />
                    <span className="truncate max-w-[80px] sm:max-w-none">
                      {faq.assets?.name || `Equipo #${faq.asset_id}`}
                    </span>
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
              {faq.answer}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
              {faq.manual_md && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="hidden xs:inline">Manual</span>
                </div>
              )}
              
              {faq.video_urls && faq.video_urls.length > 0 && (
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3 flex-shrink-0" />
                  <span className="hidden xs:inline">{faq.video_urls.length} video{faq.video_urls.length > 1 ? 's' : ''}</span>
                  <span className="xs:hidden">{faq.video_urls.length}v</span>
                </div>
              )}
              
              {faq.references_links && faq.references_links.length > 0 && (
                <div className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="hidden xs:inline">{faq.references_links.length} enlace{faq.references_links.length > 1 ? 's' : ''}</span>
                  <span className="xs:hidden">{faq.references_links.length}e</span>
                </div>
              )}
              
              <Separator orientation="vertical" className="h-3 hidden sm:block" />
              
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{formatDate(faq.created_at)}</span>
              </div>
              
              {faq.profiles && (
                <>
                  <Separator orientation="vertical" className="h-3 hidden sm:block" />
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{faq.profiles.full_name}</span>
                  </div>
                </>
              )}
            </div>

            {/* Botones móvil */}
            <div className="flex gap-2 mt-3 lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingFAQ(faq)}
                className="flex-1 h-8 sm:h-9"
              >
                <Eye className="w-4 h-4 mr-2" />
                <span className="text-xs sm:text-sm">Ver</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingFAQ(faq)}
                className="flex-1 h-8 sm:h-9"
              >
                <Edit className="w-4 h-4 mr-2" />
                <span className="text-xs sm:text-sm">Editar</span>
              </Button>
            </div>
          </div>
          
          {/* Panel lateral desktop */}
          <div className="hidden lg:flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingFAQ(faq)}
              className="h-8 w-8 p-0"
              title="Ver detalles"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingFAQ(faq)}
              className="h-8 w-8 p-0"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl truncate">Preguntas Frecuentes (FAQs)</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona las preguntas frecuentes del sistema IT
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden xs:inline">Nueva FAQ</span>
          <span className="xs:hidden">Nueva</span>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar en preguntas, respuestas o categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full xs:w-[160px] sm:w-[180px] h-9 sm:h-10">
                  <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      <span className="text-sm">{category}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none h-9 sm:h-10 flex-1 xs:flex-none"
                >
                  <Grid className="w-4 h-4" />
                  <span className="ml-2 xs:hidden">Tarjetas</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none h-9 sm:h-10 flex-1 xs:flex-none"
                >
                  <List className="w-4 h-4" />
                  <span className="ml-2 xs:hidden">Lista</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Total FAQs</p>
                <p className="text-lg sm:text-2xl font-semibold tabular-nums">{faqs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Categorías</p>
                <p className="text-lg sm:text-2xl font-semibold tabular-nums">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="xs:col-span-2 lg:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Resultados</p>
                <p className="text-lg sm:text-2xl font-semibold tabular-nums">{filteredFAQs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs List/Grid */}
      {filteredFAQs.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">No hay FAQs disponibles</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all' 
                ? 'No se encontraron FAQs que coincidan con los filtros aplicados. Prueba ajustando los criterios de búsqueda.'
                : 'Comienza creando tu primera pregunta frecuente para ayudar a los usuarios.'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear primera FAQ
              </Button>
            )}
            {(searchTerm || selectedCategory !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            : "space-y-3"
        }>
          {filteredFAQs.map(faq => (
            viewMode === 'grid' 
              ? <FAQCard key={faq.id} faq={faq} />
              : <FAQListItem key={faq.id} faq={faq} />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {createDialogOpen && (
        <CreateFAQDialog
          onSuccess={handleCreateSuccess}
          onClose={() => setCreateDialogOpen(false)}
        />
      )}

      {editingFAQ && (
        <EditFAQDialog
          faq={editingFAQ}
          onSuccess={handleEditSuccess}
          onClose={() => setEditingFAQ(null)}
        />
      )}

      {viewingFAQ && (
        <FAQViewDialog
          faq={viewingFAQ}
          onEdit={() => {
            setEditingFAQ(viewingFAQ)
            setViewingFAQ(null)
          }}
          onClose={() => setViewingFAQ(null)}
        />
      )}
    </div>
  )
}