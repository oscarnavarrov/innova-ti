import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Settings, Moon, Sun, Monitor } from 'lucide-react'

export function ThemeDebug() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  const getIcon = () => {
    if (theme === 'dark') {
      return <Moon className="w-4 h-4" />
    } else if (theme === 'light') {
      return <Sun className="w-4 h-4" />
    } else {
      return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-8 h-8 sm:w-9 sm:h-9 p-0 hover:bg-muted/80 transition-colors"
          title="Configuración del tema"
        >
          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="sr-only">Configuración de tema</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 sm:w-48" align="end" sideOffset={8}>
        <div className="text-xs sm:text-sm font-medium mb-3 text-center sm:text-left">
          Tema de la aplicación
        </div>
        <div className="grid gap-1.5 sm:gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTheme('light')
              setOpen(false)
            }} 
            className="justify-start text-xs sm:text-sm h-8 sm:h-9"
          >
            <Sun className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Claro
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTheme('dark')
              setOpen(false)
            }} 
            className="justify-start text-xs sm:text-sm h-8 sm:h-9"
          >
            <Moon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Oscuro
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTheme('system')
              setOpen(false)
            }} 
            className="justify-start text-xs sm:text-sm h-8 sm:h-9"
          >
            <Monitor className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Sistema
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}