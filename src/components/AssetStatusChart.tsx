import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'
import { Skeleton } from './ui/skeleton'
import { CheckCircle, Settings, User, Wrench, XCircle } from 'lucide-react'
import { memo } from 'react'

interface DashboardStats {
  totalAssets: number
  availableAssets: number
  inUseAssets: number
  loanedAssets: number
  maintenanceAssets: number
  retiredAssets: number
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
}

// Colores específicos para cada estado con mejor contraste y significado visual
const statusColors = {
  'Disponible': '#22c55e', // Verde brillante
  'En Uso': '#f97316', // Naranja
  'En Préstamo': '#3b82f6', // Azul
  'En Mantenimiento': '#ef4444', // Rojo
  'Retirado': '#6b7280', // Gris
  // Fallbacks para otros estados
  'default': ['#22c55e', '#f97316', '#3b82f6', '#ef4444', '#6b7280', '#8b5cf6', '#06b6d4', '#f59e0b']
}

const getStatusIcon = (name: string) => {
  switch (name) {
    case 'Disponible':
      return <CheckCircle className="w-3 h-3 text-green-500 inline mr-1" />
    case 'En Uso':
      return <Settings className="w-3 h-3 text-orange-500 inline mr-1" />
    case 'En Préstamo':
      return <User className="w-3 h-3 text-blue-500 inline mr-1" />
    case 'En Mantenimiento':
      return <Wrench className="w-3 h-3 text-red-500 inline mr-1" />
    case 'Retirado':
      return <XCircle className="w-3 h-3 text-gray-500 inline mr-1" />
    default:
      return null
  }
}

function AssetStatusChartComponent() {
  const { data: stats, loading } = useApi<DashboardStats>('/dashboard/stats')

  const chartData = stats ? [
    { name: 'Disponible', value: stats.availableAssets, color: statusColors['Disponible'] },
    { name: 'En Uso', value: stats.inUseAssets, color: statusColors['En Uso'] },
    { name: 'En Préstamo', value: stats.loanedAssets, color: statusColors['En Préstamo'] },
    { name: 'En Mantenimiento', value: stats.maintenanceAssets, color: statusColors['En Mantenimiento'] },
    { name: 'Retirado', value: stats.retiredAssets, color: statusColors['Retirado'] }
  ].filter(item => item.value > 0) : []

  // Si no hay equipos, mostrar un estado especial
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Sin Equipos', value: 1, color: '#e5e7eb' }
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Activos</CardTitle>
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
        <CardTitle className="text-base sm:text-lg">Estado de Activos</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {stats?.totalAssets === 0 ? (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-center">
            <div>
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">No hay equipos</h3>
              <p className="text-sm text-muted-foreground">
                Aún no se han registrado equipos
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={chartData.length > 1 ? 2 : 0}
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                className="sm:!inner-radius-[60] sm:!outer-radius-[100]"
              >
                {displayData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [
                  stats?.totalAssets === 0 ? 'No hay equipos' : `${value} equipos`, 
                  name
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
              {stats?.totalAssets > 0 && (
                <Legend 
                  formatter={(value) => (
                    <span className="text-xs sm:text-sm font-medium flex items-center">
                      {getStatusIcon(value)}
                      <span className="hidden sm:inline">{value}</span>
                      <span className="sm:hidden truncate">{value.split(' ')[0]}</span>
                    </span>
                  )}
                  wrapperStyle={{
                    paddingTop: '16px',
                    fontSize: '12px'
                  }}
                  wrapperClassName="text-xs sm:text-sm"
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export const AssetStatusChart = memo(AssetStatusChartComponent)