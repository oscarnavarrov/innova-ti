import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface StatCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, icon, className }: StatCardProps) {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium leading-tight line-clamp-2 pr-2">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-xl sm:text-2xl font-bold tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </CardContent>
    </Card>
  )
}