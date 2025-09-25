import { StatCard } from './StatCard'
import { AssetStatusChart } from './AssetStatusChart'
import { AssetTypeChart } from './AssetTypeChart'
import { TicketStatsChart } from './TicketStatsChart'
import { RecentActivityFeed } from './RecentActivityFeed'
import { useApi } from '../hooks/useApi'
import { Monitor, CheckCircle, UserCheck, Wrench, Settings, XCircle, Ticket, Clock, AlertTriangle } from 'lucide-react'
import { Skeleton } from './ui/skeleton'

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

export function Dashboard() {
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>('/dashboard/stats')

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Assets Stats Cards Grid */}
      <section>
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 px-1">
          <Monitor className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="truncate">Estadísticas de Equipos</span>
        </h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {statsLoading ? (
            <>
              <Skeleton className="h-20 sm:h-24" />
              <Skeleton className="h-20 sm:h-24" />
              <Skeleton className="h-20 sm:h-24" />
              <Skeleton className="h-20 sm:h-24" />
              <Skeleton className="h-20 sm:h-24" />
              <Skeleton className="h-20 sm:h-24" />
            </>
          ) : (
            <>
              <StatCard
                title="Total de Equipos"
                value={stats?.totalAssets || 0}
                icon={<Monitor className="w-4 h-4 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
              <StatCard
                title="Disponibles"
                value={stats?.availableAssets || 0}
                icon={<CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
              <StatCard
                title="En Uso"
                value={stats?.inUseAssets || 0}
                icon={<Settings className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
              <StatCard
                title="En Préstamo"
                value={stats?.loanedAssets || 0}
                icon={<UserCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
              <StatCard
                title="En Mantenimiento"
                value={stats?.maintenanceAssets || 0}
                icon={<Wrench className="w-4 h-4 text-red-500 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
              <StatCard
                title="Retirados"
                value={stats?.retiredAssets || 0}
                icon={<XCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
            </>
          )}
        </div>
      </section>

      {/* Tickets Stats Cards */}
      <section>
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 px-1">
          <Ticket className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          <span className="truncate">Estadísticas de Tickets</span>
        </h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              <Skeleton className="h-20 sm:h-24" />
              <Skeleton className="h-20 sm:h-24" />
              <Skeleton className="h-20 sm:h-24" />
              <Skeleton className="h-20 sm:h-24" />
            </>
          ) : (
            <>
              <StatCard
                title="Total Tickets"
                value={stats?.totalTickets || 0}
                icon={<Ticket className="w-4 h-4 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
              <StatCard
                title="Tickets Abiertos"
                value={stats?.openTickets || 0}
                icon={<Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
              <StatCard
                title="En Progreso"
                value={stats?.inProgressTickets || 0}
                icon={<AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
              <StatCard
                title="Resueltos"
                value={stats?.resolvedTickets || 0}
                icon={<CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                className="min-h-[80px] sm:min-h-[96px]"
              />
            </>
          )}
        </div>
      </section>

      {/* Charts Grid */}
      <section>
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1">
          Análisis Visual
        </h3>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <div className="lg:col-span-1">
            <AssetStatusChart />
          </div>
          <div className="lg:col-span-1">
            <AssetTypeChart />
          </div>
          <div className="lg:col-span-2 xl:col-span-1">
            <TicketStatsChart />
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 px-1">
          Actualizaciones del Sistema
        </h3>
        <RecentActivityFeed />
      </section>
    </div>
  )
}