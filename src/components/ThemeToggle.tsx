// import { Moon, Sun, Monitor } from 'lucide-react'
// import { Button } from './ui/button'
// import { useTheme } from '../contexts/ThemeContext'

// export function ThemeToggle() {
//   const { theme, setTheme } = useTheme()

//   const cycleTheme = () => {
//     console.log('Cycling theme from:', theme)
//     if (theme === 'light') {
//       setTheme('dark')
//     } else if (theme === 'dark') {
//       setTheme('system')
//     } else {
//       setTheme('light')
//     }
//   }

//   const getIcon = () => {
//     if (theme === 'dark') {
//       return <Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
//     } else if (theme === 'light') {
//       return <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
//     } else {
//       return <Monitor className="h-[1.2rem] w-[1.2rem] transition-all duration-200" />
//     }
//   }

//   const getTooltipText = () => {
//     if (theme === 'light') return 'Cambiar a modo oscuro'
//     if (theme === 'dark') return 'Cambiar a modo sistema'
//     return 'Cambiar a modo claro'
//   }

//   return (
//     <Button 
//       variant="ghost" 
//       size="icon" 
//       onClick={cycleTheme}
//       className="relative"
//       title={getTooltipText()}
//     >
//       {getIcon()}
//       <span className="sr-only">{getTooltipText()}</span>
//     </Button>
//   )
// }