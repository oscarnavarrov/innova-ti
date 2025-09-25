import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Download, Copy, QrCode } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

// Función para generar QR usando API pública de qr-server.com
const generateQRDataURL = async (text: string, size: number = 200): Promise<string> => {
  try {
    // Usar API pública para generar QR real
    const encodedText = encodeURIComponent(text)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&format=png&bgcolor=FFFFFF&color=000000&margin=10`
    
    // Convertir la imagen a base64 para poder descargarla
    const response = await fetch(qrUrl)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    // Fallback a un QR simple si falla la API
    return generateFallbackQR(text, size)
  }
}

// Fallback QR generator más simple
const generateFallbackQR = (text: string, size: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = size
    canvas.height = size

    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Texto centrado como fallback
    ctx.fillStyle = '#000000'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const lines = text.match(/.{1,20}/g) || [text]
    const lineHeight = 16
    const startY = (size / 2) - ((lines.length - 1) * lineHeight / 2)
    
    lines.forEach((line, index) => {
      ctx.fillText(line, size / 2, startY + (index * lineHeight))
    })

    resolve(canvas.toDataURL())
  })
}

interface QRCodeGeneratorProps {
  data: string
  title: string
  subtitle?: string
  size?: number
  className?: string
}

export function QRCodeGenerator({ 
  data, 
  title, 
  subtitle, 
  size = 200, 
  className = "" 
}: QRCodeGeneratorProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const qrDataRef = useRef<string>('')

  useEffect(() => {
    generateQRDataURL(data, size).then(dataURL => {
      qrDataRef.current = dataURL
      if (imgRef.current) {
        imgRef.current.src = dataURL
      }
    }).catch(console.error)
  }, [data, size])

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(data)
        toast.success('Código copiado al portapapeles')
      } else {
        // Fallback para navegadores sin clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = data
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
          toast.success('Código copiado al portapapeles')
        } catch (err) {
          toast.error('Error al copiar el código')
        }
        
        document.body.removeChild(textArea)
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Error al copiar el código')
    }
  }

  const handleDownloadQR = () => {
    if (qrDataRef.current) {
      const link = document.createElement('a')
      link.download = `qr-${title.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = qrDataRef.current
      link.click()
      toast.success('Código QR descargado')
    }
  }

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      <div className="text-center">
        <img 
          ref={imgRef}
          alt={`Código QR para ${title}`}
          className="mx-auto border rounded-lg shadow-sm bg-white"
          style={{ 
            maxWidth: '100%', 
            height: 'auto', 
            width: Math.min(size, window.innerWidth - 80), 
            height: Math.min(size, window.innerWidth - 80) 
          }}
        />
      </div>
      
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="font-medium text-sm sm:text-base">{title}</h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium text-muted-foreground block">
            Código de identificación
          </label>
          <div className="relative">
            <code className="block p-2 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm font-mono break-all pr-12">
              {data}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              className="absolute top-1 sm:top-2 right-1 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 p-0"
              title="Copiar código"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadQR}
            className="flex-1 h-8 sm:h-9"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="text-xs sm:text-sm">Descargar QR</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyCode}
            className="flex-1 h-8 sm:h-9"
          >
            <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            <span className="text-xs sm:text-sm">Copiar Código</span>
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p className="flex items-center justify-center gap-1">
            <QrCode className="w-3 h-3" />
            <span>Escanea este código con cualquier lector QR</span>
          </p>
          <p>El código identifica únicamente este equipo en el sistema</p>
        </div>
      </div>
    </div>
  )
}

// Componente más simple para mostrar QR en listas
export function QRCodePreview({ 
  data, 
  size = 80 
}: { 
  data: string
  size?: number 
}) {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    generateQRDataURL(data, size).then(dataURL => {
      if (imgRef.current) {
        imgRef.current.src = dataURL
      }
    }).catch(console.error)
  }, [data, size])

  return (
    <img 
      ref={imgRef}
      alt={`QR Code for ${data}`}
      className="border rounded bg-white"
      style={{ 
        maxWidth: '100%', 
        height: 'auto', 
        width: Math.min(size, 120), 
        height: Math.min(size, 120) 
      }}
    />
  )
}