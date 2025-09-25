import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { 
  Eye, 
  Edit, 
  FileText, 
  ExternalLink, 
  Play, 
  Monitor,
  Calendar,
  User,
  Tag,
  Copy,
  Check
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
    asset_types?: {
      name: string
    }
  }
}

interface FAQViewDialogProps {
  faq: FAQ
  onEdit: () => void
  onClose: () => void
}

export function FAQViewDialog({ faq, onEdit, onClose }: FAQViewDialogProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = async (text: string, linkIndex: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(`link-${linkIndex}`)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const renderMarkdown = (markdown: string) => {
    // Simple markdown renderer for basic formatting
    return markdown
      .replace(/^# (.*$)/gim, '<h3 class="text-lg font-semibold mb-3 mt-4 first:mt-0">$1</h3>')
      .replace(/^## (.*$)/gim, '<h4 class="text-base font-semibold mb-2 mt-3">$1</h4>')
      .replace(/^### (.*$)/gim, '<h5 class="text-sm font-semibold mb-2 mt-2">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^\d+\.\s(.*)$/gim, '<li class="ml-4">$1</li>')
      .replace(/^-\s(.*)$/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">$1</a>')
      .replace(/\n/g, '<br>')
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-1 sm:px-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Ver FAQ</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Detalles completos de la pregunta frecuente
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 xs:grid-cols-4 h-auto">
              <TabsTrigger value="content" className="text-xs sm:text-sm">Contenido</TabsTrigger>
              <TabsTrigger value="manual" className="text-xs sm:text-sm">Manual</TabsTrigger>
              <TabsTrigger value="media" className="text-xs sm:text-sm">Multimedia</TabsTrigger>
              <TabsTrigger value="info" className="text-xs sm:text-sm">Información</TabsTrigger>
            </TabsList>

          {/* Contenido Principal */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg lg:text-xl leading-tight">
                      {faq.question}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-3">
                      {faq.category && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          <span className="truncate">{faq.category}</span>
                        </Badge>
                      )}
                      {faq.assets && (
                        <Badge variant="outline" className="text-xs">
                          <Monitor className="w-3 h-3 mr-1" />
                          <span className="truncate">{faq.assets.name}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button onClick={onEdit} size="sm" className="w-full lg:w-auto">
                    <Edit className="w-4 h-4 mr-2" />
                    <span className="text-sm">Editar</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <h4 className="text-sm sm:text-base font-semibold mb-3">Respuesta:</h4>
                  <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Técnico */}
          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Manual Técnico Detallado
                </CardTitle>
                <CardDescription>
                  Documentación técnica en formato Markdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {faq.manual_md ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdown(faq.manual_md) 
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay manual técnico disponible para esta FAQ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multimedia */}
          <TabsContent value="media" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Enlaces de referencia */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Enlaces de Referencia</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Documentos y recursos adicionales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {faq.references_links && faq.references_links.length > 0 ? (
                    <div className="space-y-3">
                      {faq.references_links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-primary hover:underline flex-1 truncate"
                          >
                            {link}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(link, index)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                          >
                            {copiedLink === `link-${index}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">No hay enlaces de referencia</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Videos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Videos Explicativos</span>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Videos de apoyo y tutoriales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {faq.video_urls && faq.video_urls.length > 0 ? (
                    <div className="space-y-3">
                      {faq.video_urls.map((video, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                          <Play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <a 
                            href={video} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs sm:text-sm text-primary hover:underline flex-1 truncate"
                          >
                            {video}
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(video, index + 1000)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                          >
                            {copiedLink === `link-${index + 1000}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm">No hay videos disponibles</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Información */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información general */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de creación</p>
                      <p className="text-sm font-medium">{formatDate(faq.created_at)}</p>
                    </div>
                  </div>

                  {faq.profiles && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Creado por</p>
                        <p className="text-sm font-medium">{faq.profiles.full_name}</p>
                      </div>
                    </div>
                  )}

                  {faq.category && (
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Categoría</p>
                        <Badge variant="secondary" className="mt-1">
                          {faq.category}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Equipo relacionado */}
              {faq.assets && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Equipo Relacionado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Monitor className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{faq.assets.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {faq.assets.asset_types && (
                            <Badge variant="outline" className="text-xs">
                              {faq.assets.asset_types.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {faq.assets.serial_number}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-9 sm:h-10">
              Cerrar
            </Button>
            <Button onClick={onEdit} className="w-full sm:w-auto h-9 sm:h-10">
              <Edit className="w-4 h-4 mr-2" />
              Editar FAQ
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}