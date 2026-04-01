import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  Users,
  DollarSign,
  Settings,
  LogOut,
  Stethoscope,
  Sun,
  Moon,
  Sunset,
  RefreshCw,
  Clock,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/admin/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { path: '/admin/calendar', label: 'Календарь', icon: Calendar },
  { path: '/admin/appointments', label: 'Записи', icon: CalendarDays },
  { path: '/admin/clients', label: 'Клиенты', icon: Users },
  { path: '/admin/recurring', label: 'Повторяющиеся', icon: RefreshCw },
  { path: '/admin/waitlist', label: 'Очередь', icon: Clock },
  { path: '/admin/revenue', label: 'Выручка', icon: DollarSign },
  { path: '/admin/reports', label: 'Отчеты', icon: FileText },
  { path: '/admin/services', label: 'Услуги', icon: Stethoscope },
  { path: '/admin/settings', label: 'Настройки', icon: Settings, adminOnly: true },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-6 border-b">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-lg">УЗИ Кабинет</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col">
          <div className="space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && user?.role !== 'ADMIN') return null
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
          <div className="flex gap-1 mt-auto p-1 bg-muted/50 rounded-lg">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'flex-1 flex items-center justify-center p-2 rounded-md transition-all',
                theme === 'light'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Светлая тема"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('warm')}
              className={cn(
                'flex-1 flex items-center justify-center p-2 rounded-md transition-all',
                theme === 'warm'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Тёплая тема"
            >
              <Sunset className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'flex-1 flex items-center justify-center p-2 rounded-md transition-all',
                theme === 'dark'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Тёмная тема"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </nav>
        
        <div className="p-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">
              {user?.role === 'ADMIN' ? 'Администратор' : 'Ассистент'}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="h-10 w-10"
              title="Выйти"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="md:hidden bg-card border-b sticky top-0 z-50">
          <div className="px-4 h-14 flex items-center justify-between">
            <Link to="/admin/dashboard" className="font-semibold text-lg">
              УЗИ Кабинет
            </Link>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <nav className="md:hidden bg-card border-b px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'ADMIN') return null
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              theme === 'light'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTheme('warm')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              theme === 'warm'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <Sunset className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              theme === 'dark'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >
            <Moon className="h-4 w-4" />
          </button>
        </nav>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
