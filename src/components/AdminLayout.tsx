import { useState } from 'react'
import { Button } from './ui/button'
import { useAuth } from '../contexts/AuthContext'
import { ThemeDebug } from './ThemeDebug'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from './ui/sidebar'
import { 
  LayoutDashboard, 
  Monitor, 
  Ticket, 
  FileText, 
  LogOut, 
  User,
  Users,
  HelpCircle 
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'equipos', label: 'Equipos', icon: Monitor },
  { id: 'tickets', label: 'Tickets de Soporte', icon: Ticket },
  { id: 'prestamos', label: 'Préstamos', icon: FileText },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
]

const pageNames: Record<string, string> = {
  dashboard: 'Dashboard Principal',
  equipos: 'Gestión de Equipos',
  tickets: 'Tickets de Soporte',
  prestamos: 'Gestión de Préstamos',
  usuarios: 'Gestión de Usuarios',
  faqs: 'Preguntas Frecuentes'
}

export function AdminLayout({ children, currentPage, onNavigate }: AdminLayoutProps) {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Monitor className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Innova TI</h2>
              <p className="text-sm text-muted-foreground">IE 14791</p>
            </div>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.id)}
                    isActive={currentPage === item.id}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 lg:px-6">
          <SidebarTrigger className="-ml-1 flex-shrink-0" />
          
          <div className="flex-1 min-w-0 mr-2 sm:mr-4">
            <h1 className="text-base sm:text-lg font-semibold truncate">
              {pageNames[currentPage] || 'Dashboard'}
            </h1>
          </div>
          
          {/* Desktop User Menu */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate max-w-32 xl:max-w-none">
                {user?.full_name || 'Usuario'}
              </span>
            </div>
            <ThemeDebug />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {/* Tablet User Menu */}
          <div className="hidden sm:flex lg:hidden items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md">
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium truncate max-w-20">
                {user?.full_name?.split(' ')[0] || 'Usuario'}
              </span>
            </div>
            <ThemeDebug />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2"
              onClick={handleLogout}
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile User Menu */}
          <div className="flex sm:hidden items-center gap-1">
            <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md min-w-0">
              <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs font-medium truncate max-w-16">
                {user?.full_name?.split(' ')[0] || 'User'}
              </span>
            </div>
            <div className="flex items-center">
              <ThemeDebug />
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1.5 ml-1"
                onClick={handleLogout}
                title="Cerrar Sesión"
              >
                <LogOut className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-muted/30 min-h-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}