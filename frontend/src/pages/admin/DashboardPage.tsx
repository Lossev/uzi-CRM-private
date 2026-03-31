import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, Users, ArrowUp, TrendingUp, Clock, Eye } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import api from '@/lib/api'
import { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [isRevenueVisible, setIsRevenueVisible] = useState(false)
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/stats/dashboard')
      return data
    },
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Сегодня записей',
      value: stats?.today.appointments || 0,
      icon: CalendarDays,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Завтра записей',
      value: stats?.tomorrow.appointments || 0,
      icon: Clock,
      color: 'text-foreground',
      bgColor: 'bg-muted',
    },
    {
      title: 'Выручка сегодня',
      value: formatPrice(stats?.today.revenue || 0),
      icon: ArrowUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Новых клиентов',
      value: stats?.newClients || 0,
      icon: Users,
      color: 'text-foreground',
      bgColor: 'bg-muted',
    },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <Button asChild>
          <Link to="/admin/appointments">Все записи</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const isRevenueCard = card.title === 'Выручка сегодня'
          return (
            <Card key={card.title}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    {isRevenueCard && !isRevenueVisible ? (
                      <Eye 
                        className="h-6 w-6 text-muted-foreground mt-0.5 cursor-pointer hover:text-foreground transition-colors" 
                        onClick={() => setIsRevenueVisible(true)}
                      />
                    ) : (
                      <p className="text-xl font-semibold mt-0.5">{card.value}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Статистика за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Записей</p>
                <p className="text-lg font-semibold mt-1">{stats?.month.appointments || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Выручка</p>
                {isRevenueVisible ? (
                  <p className="text-lg font-semibold mt-1">{formatPrice(stats?.month.revenue || 0)}</p>
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setIsRevenueVisible(true)} />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">За неделю</p>
                <p className="text-lg font-semibold mt-1">{stats?.week.appointments || 0}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Выручка</p>
                {isRevenueVisible ? (
                  <p className="text-lg font-semibold mt-1">{formatPrice(stats?.week.revenue || 0)}</p>
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground mt-1 cursor-pointer hover:text-foreground transition-colors" onClick={() => setIsRevenueVisible(true)} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Ожидающие записи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-4xl font-semibold text-primary">{stats?.pending || 0}</p>
              <p className="text-sm text-muted-foreground mt-2">предстоящих приёмов</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
