import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { useApi } from '../hooks/useApi'
import { Clock, User, Wrench, FileText } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'loan' | 'return' | 'ticket' | 'maintenance'
  message: string
  timestamp: string
  user?: string
}

const getActivityIcon = (type: ActivityItem['type']) => {
  switch (type) {
    case 'loan':
      return <User className="w-4 h-4 text-blue-500" />
    case 'return':
      return <User className="w-4 h-4 text-green-500" />
    case 'ticket':
      return <FileText className="w-4 h-4 text-orange-500" />
    case 'maintenance':
      return <Wrench className="w-4 h-4 text-red-500" />
  }
}

const getActivityBadge = (type: ActivityItem['type']) => {
  switch (type) {
    case 'loan':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Préstamo</Badge>
    case 'return':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Devolución</Badge>
    case 'ticket':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Ticket</Badge>
    case 'maintenance':
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Mantenimiento</Badge>
  }
}

export function RecentActivityFeed() {
  const { data: activities, loading } = useApi<ActivityItem[]>('/dashboard/recent-activity')

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <div className="space-y-3 sm:space-y-4">
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm sm:text-base leading-relaxed">{activity.message}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-shrink-0">
                      {getActivityBadge(activity.type)}
                    </div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <FileText className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">No hay actividad reciente</p>
              <p className="text-xs sm:text-sm mt-1 opacity-75">Las nuevas actividades aparecerán aquí</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}