import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useApiCall } from '../hooks/useApiCall'
import { useApi } from '../hooks/useApi'
import { toast } from 'sonner@2.0.3'
import { 
  Edit, 
  Loader2, 
  FileText, 
  ExternalLink, 
  Play, 
  Monitor,
  X,
  Info,
  Plus
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

interface Asset {
  id: number
  name: string
  serial_number: string
  asset_types: {
    name: string
  }
}

interface EditFAQDialogProps {
  faq: FAQ
  onSuccess: () => void
  onClose: () => void
}

export function EditFAQDialog({ faq, onSuccess, onClose }: EditFAQDialogProps) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    manual_md: '',
    asset_id: ''
  })
  
  const [referenceLinks, setReferenceLinks] = useState<string[]>([''])
  const [videoUrls, setVideoUrls] = useState<string[]>([''])

  const { data: assets } = useApi<Asset[]>('/assets')
  const { execute, loading } = useApiCall()

  // Categorías predefinidas comunes
  const commonCategories = [
    'Hardware',
    'Software', 
    'Red y Conectividad',
    'Impresión',
    'Email y Comunicaciones',
    'Seguridad',
    'Acceso y Permisos',
    'Instalación',
    'Mantenimiento',
    'Solución de Problemas',
    'Procedimientos'
  ]

  // Inicializar form data cuando el FAQ cambie
  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question || '',
        answer: faq.answer || '',
        category: faq.category || '',
        manual_md: faq.manual_md || '',
        asset_id: faq.asset_id?.toString() || 'none'
      })
      
      setReferenceLinks(
        faq.references_links && faq.references_links.length > 0 
          ? faq.references_links 
          : ['']
      )
      
      setVideoUrls(
        faq.video_urls && faq.video_urls.length > 0 
          ? faq.video_urls 
          : ['']
      )
    }
  }, [faq])

  const handleAddLink = () => {
    setReferenceLinks([...referenceLinks, ''])
  }

  const handleRemoveLink = (index: number) => {
    const newLinks = referenceLinks.filter((_, i) => i !== index)
    setReferenceLinks(newLinks.length === 0 ? [''] : newLinks)
  }

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...referenceLinks]
    newLinks[index] = value
    setReferenceLinks(newLinks)
  }

  const handleAddVideo = () => {
    setVideoUrls([...videoUrls, ''])
  }

  const handleRemoveVideo = (index: number) => {
    const newVideos = videoUrls.filter((_, i) => i !== index)
    setVideoUrls(newVideos.length === 0 ? [''] : newVideos)
  }

  const handleVideoChange = (index: number, value: string) => {
    const newVideos = [...videoUrls]
    newVideos[index] = value
    setVideoUrls(newVideos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error('La pregunta y respuesta son obligatorias')
      return
    }

    try {
      const payload: any = {
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        category: formData.category.trim() || null,
        manual_md: formData.manual_md.trim() || null,
        asset_id: formData.asset_id && formData.asset_id !== 'none' ? parseInt(formData.asset_id) : null,
        references_links: referenceLinks.filter(link => link.trim()).length > 0 
          ? referenceLinks.filter(link => link.trim()) 
          : null,
        video_urls: videoUrls.filter(url => url.trim()).length > 0 
          ? videoUrls.filter(url => url.trim()) 
          : null
      }

      await execute(`/faqs/${faq.id}`, 'PUT', payload)
      onSuccess()
    } catch (error) {
      console.error('Error al actualizar FAQ:', error)
      toast.error('Error al actualizar la FAQ')
    }
  }

  const selectedAsset = assets?.find(asset => asset.id.toString() === formData.asset_id && formData.asset_id !== 'none')

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Editar FAQ</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Modifica la información de la pregunta frecuente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <form onSubmit={handleSubmit} className="pb-4">
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 xs:grid-cols-4 h-auto">
                <TabsTrigger value="basic" className="text-xs sm:text-sm">Básico</TabsTrigger>
                <TabsTrigger value="manual" className="text-xs sm:text-sm">Manual</TabsTrigger>
                <TabsTrigger value="media" className="text-xs sm:text-sm">Multimedia</TabsTrigger>
                <TabsTrigger value="asset" className="text-xs sm:text-sm">Equipo</TabsTrigger>
              </TabsList>

            {/* Información Básica */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Información Básica</CardTitle>
                  <CardDescription className="text-sm">
                    Pregunta, respuesta y categorización
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_question" className="text-sm font-medium">Pregunta *</Label>
                    <Input
                      id="edit_question"
                      placeholder="¿Cómo resuelvo...?"
                      value={formData.question}
                      onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                      required
                      className="h-9 sm:h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_answer" className="text-sm font-medium">Respuesta *</Label>
                    <Textarea
                      id="edit_answer"
                      placeholder="Describe la solución paso a paso..."
                      value={formData.answer}
                      onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                      required
                      rows={5}
                      className="min-h-[120px] resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_category" className="text-sm font-medium">Categoría</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="h-9 sm:h-10">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              <span className="text-sm">{category}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="O escribe una nueva"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="h-9 sm:h-10"
                      />
                    </div>
                    {formData.category && (
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{formData.category}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual en Markdown */}
            <TabsContent value="manual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Manual Detallado
                  </CardTitle>
                  <CardDescription>
                    Documentación técnica en formato Markdown (opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_manual_md">Contenido del Manual</Label>
                    <Textarea
                      id="edit_manual_md"
                      placeholder="# Procedimiento Detallado

## Pasos a seguir:

1. **Primer paso**: Descripción detallada
2. **Segundo paso**: Más información
3. **Tercer paso**: Finalización

## Notas importantes:
- Punto importante 1
- Punto importante 2

## Solución de problemas:
Si encuentras errores..."
                      value={formData.manual_md}
                      onChange={(e) => setFormData(prev => ({ ...prev, manual_md: e.target.value }))}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium mb-1">Formato Markdown</p>
                        <p>Puedes usar encabezados (#), listas, **negritas**, *cursivas*, `código`, y enlaces [texto](url)</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Multimedia */}
            <TabsContent value="media" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Enlaces de referencia */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Enlaces de Referencia
                    </CardTitle>
                    <CardDescription>
                      Documentos y recursos adicionales
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {referenceLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="https://ejemplo.com/documento"
                          value={link}
                          onChange={(e) => handleLinkChange(index, e.target.value)}
                          className="flex-1"
                        />
                        {referenceLinks.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveLink(index)}
                            className="flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddLink}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar enlace
                    </Button>
                  </CardContent>
                </Card>

                {/* URLs de videos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Videos Explicativos
                    </CardTitle>
                    <CardDescription>
                      YouTube, Vimeo u otros videos de apoyo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {videoUrls.map((video, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="https://youtube.com/watch?v=..."
                          value={video}
                          onChange={(e) => handleVideoChange(index, e.target.value)}
                          className="flex-1"
                        />
                        {videoUrls.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveVideo(index)}
                            className="flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVideo}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar video
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Equipo relacionado */}
            <TabsContent value="asset" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Equipo Relacionado
                  </CardTitle>
                  <CardDescription>
                    Vincular esta FAQ con un equipo específico (opcional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_asset_id">Seleccionar Equipo</Label>
                    <Select 
                      value={formData.asset_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, asset_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Buscar por nombre o número de serie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin equipo relacionado</SelectItem>
                        {assets?.map(asset => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{asset.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {asset.asset_types.name}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {asset.serial_number}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAsset && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Monitor className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{selectedAsset.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedAsset.asset_types.name} • {selectedAsset.serial_number}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto h-9 sm:h-10">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto h-9 sm:h-10">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Actualizar FAQ
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}