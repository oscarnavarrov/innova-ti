import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AdminLayout } from './components/AdminLayout'
import { LoginPage } from './components/LoginPage'
import { Dashboard } from './components/Dashboard'
import { EquiposPage } from './components/EquiposPage'
import { TicketsPage } from './components/TicketsPage'
import { PrestamosPage } from './components/PrestamosPage'
import { UsuariosPage } from './components/UsuariosPage'
import { FAQsPage } from './components/FAQsPage'
import { AuthErrorBoundary } from './components/AuthErrorBoundary'
import { Toaster } from "./components/ui/sonner"

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const { isAuthenticated, loading } = useAuth()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'equipos':
        return <EquiposPage />
      case 'tickets':
        return <TicketsPage />
      case 'prestamos':
        return <PrestamosPage onNavigate={setCurrentPage} />
      case 'usuarios':
        return <UsuariosPage />
      case 'faqs':
        return <FAQsPage />
      default:
        return <Dashboard />
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Show main application if authenticated
  return (
    <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AdminLayout>
  )
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="admin-it-theme">
      <AuthErrorBoundary>
        <AuthProvider>
          <AppContent />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontSize: '14px',
                fontWeight: '600',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              },
              unstyled: false,
              classNames: {
                toast: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-semibold shadow-lg',
                title: 'text-gray-900 dark:text-gray-100 font-bold text-[15px]',
                description: 'text-gray-700 dark:text-gray-300 font-medium text-[13px]',
                error: 'bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800 font-semibold',
                success: 'bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800 font-semibold',
                warning: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-800 font-semibold',
                info: 'bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800 font-semibold',
              }
            }}
          />
        </AuthProvider>
      </AuthErrorBoundary>
    </ThemeProvider>
  )
}