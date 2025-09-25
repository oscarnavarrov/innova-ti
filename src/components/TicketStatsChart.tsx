import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useApi } from '../hooks/useApi'
import { Skeleton } from './ui/skeleton'
import { Clock, AlertTriangle, CheckCircle, Ticket } from 'lucide-react'
import { memo } from 'react'

interface DashboardStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
}

// Colores específicos para cada estado de ticket
const ticketStatusColors = {
  'Abiertos': '#3b82f6', // Azul
  'En Progreso': '#f97316', // Naranja
  'Resueltos': '#22c55e', // Verde
  'Sin Tickets': '#e5e7eb' // Gris claro para estado vacío
}

const getTicketIcon = (name: string) => {
  switch (name) {
    case 'Abiertos':
      return <Clock className="w-3 h-3 text-blue-500 inline mr-1" />
    case 'En Progreso':
      return <AlertTriangle className="w-3 h-3 text-orange-500 inline mr-1" />
    case 'Resueltos':
      return <CheckCircle className="w-3 h-3 text-green-500 inline mr-1" />
    default:
      return <Ticket className="w-3 h-3 text-gray-500 inline mr-1" />
  }
}

function TicketStatsChartComponent() {
  const { data: stats, loading } = useApi<DashboardStats>('/dashboard/stats')

  const chartData = stats ? [
    { name: 'Abiertos', value: stats.openTickets, color: ticketStatusColors['Abiertos'] },
    { name: 'En Progreso', value: stats.inProgressTickets, color: ticketStatusColors['En Progreso'] },
    { name: 'Resueltos', value: stats.resolvedTickets, color: ticketStatusColors['Resueltos'] }
  ].filter(item => item.value > 0) : []

  // Si no hay tickets, mostrar un estado especial
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'Sin Tickets', value: 1, color: ticketStatusColors['Sin Tickets'] }
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Tickets</CardTitle>
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
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Ticket className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">Estado de Tickets</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {stats?.totalTickets === 0 ? (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-center">
            <div>
              <Ticket className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-base sm:text-lg font-medium text-muted-foreground mb-2">No hay tickets</h3>
              <p className="text-sm text-muted-foreground">
                Aún no se han creado tickets de soporte
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {stats?.openTickets || 0}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 truncate">Abiertos</div>
              </div>
              <div className="p-2 sm:p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                  {stats?.inProgressTickets || 0}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-400 truncate">En Progreso</div>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                  {stats?.resolvedTickets || 0}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 truncate">Resueltos</div>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={200} className="sm:!h-[240px]">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={70}
                  paddingAngle={chartData.length > 1 ? 2 : 0}
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  className="sm:!inner-radius-[50] sm:!outer-radius-[90]"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    stats?.totalTickets === 0 ? 'No hay tickets' : `${value} tickets`, 
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
                {stats?.totalTickets > 0 && (
                  <Legend 
                    formatter={(value) => (
                      <span className="text-xs sm:text-sm font-medium flex items-center">
                        {getTicketIcon(value)}
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
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const TicketStatsChart = memo(TicketStatsChartComponent)