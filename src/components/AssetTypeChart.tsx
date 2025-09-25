import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'
import { Skeleton } from './ui/skeleton'
import { Monitor, Laptop, Printer, Tablet, Smartphone, HardDrive } from 'lucide-react'
import { memo } from 'react'

interface AssetTypeData {
  name: string
  cantidad: number
}

// Colores para diferentes tipos de equipos
const typeColors = [
  '#3b82f6', // Azul
  '#10b981', // Verde esmeralda  
  '#f59e0b', // Ámbar
  '#ef4444', // Rojo
  '#8b5cf6', // Púrpura
  '#06b6d4', // Cian
  '#f97316', // Naranja
  '#84cc16', // Lima
  '#ec4899', // Rosa
  '#6b7280'  // Gris
]

const getTypeIcon = (name: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('laptop') || lowerName.includes('portátil')) {
    return <Laptop className="w-3 h-3 inline mr-1" />
  }
  if (lowerName.includes('monitor') || lowerName.includes('pantalla')) {
    return <Monitor className="w-3 h-3 inline mr-1" />
  }
  if (lowerName.includes('impresora') || lowerName.includes('printer')) {
    return <Printer className="w-3 h-3 inline mr-1" />
  }
  if (lowerName.includes('tablet') || lowerName.includes('ipad')) {
    return <Tablet className="w-3 h-3 inline mr-1" />
  }
  if (lowerName.includes('teléfono') || lowerName.includes('móvil') || lowerName.includes('smartphone')) {
    return <Smartphone className="w-3 h-3 inline mr-1" />
  }
  if (lowerName.includes('disco') || lowerName.includes('storage') || lowerName.includes('almacenamiento')) {
    return <HardDrive className="w-3 h-3 inline mr-1" />
  }
  return <Monitor className="w-3 h-3 inline mr-1" />
}

function AssetTypeChartComponent() {
  const { data, loading } = useApi<AssetTypeData[]>('/dashboard/asset-types')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Equipos por Tipo</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
          <BarChart 
            data={data || []} 
            margin={{ 
              top: 20, 
              right: 10, 
              left: 10, 
              bottom: 5 
            }}
            className="sm:!mr-[30px] sm:!ml-[20px]"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
              className="sm:!text-xs"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              allowDecimals={false}
              className="sm:!text-xs"
            />
            <Tooltip 
              formatter={(value, name, props) => [
                `${value} equipos`, 
                <span className="flex items-center">
                  {getTypeIcon(props.payload?.name || '')}
                  <span className="truncate">{props.payload?.name || 'Tipo'}</span>
                </span>
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
              wrapperClassName="text-xs sm:text-sm"
            />
            <Bar 
              dataKey="cantidad" 
              radius={[4, 4, 0, 0]}
              stroke="hsl(var(--background))"
              strokeWidth={1}
              className="sm:!radius-[6,6,0,0]"
            >
              {(data || []).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={typeColors[index % typeColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export const AssetTypeChart = memo(AssetTypeChartComponent)