import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, setHours, setMinutes, startOfDay, addMinutes, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Clock, User, RefreshCw, Users, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AxiosError } from 'axios'

interface Appointment {
  id: number
  date: string
  status: string
  price: number | null
  notes: string | null
  client: { id: number; name: string; phone: string }
  service: { id: number; name: string; duration: number; price: number }
  staff: { id: number; name: string }
  recurringId?: number | null
}

interface ScheduleSettings {
  workStartTime: string
  workEndTime: string
  breakStart: string | null
  breakEnd: string | null
  slotDuration: number
  workDays: string
}

type ViewMode = 'week' | 'day'

interface WaitlistEntry {
  id: number
  client: { id: number; name: string; phone: string }
  service: { id: number; name: string }
  staffId: number | null
  preferredDate: string | null
  preferredTime: string | null
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-500/20 border-blue-500 text-blue-700',
  COMPLETED: 'bg-green-500/20 border-green-500 text-green-700',
  CANCELLED: 'bg-red-500/20 border-red-500 text-red-700 line-through opacity-60',
  NO_SHOW: 'bg-gray-500/20 border-gray-500 text-gray-500',
}

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Запланировано',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  NO_SHOW: 'Не явился',
}

export default function CalendarPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false)
  const [waitlistData, setWaitlistData] = useState<WaitlistEntry[]>([])

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })

  const { data: settings } = useQuery<ScheduleSettings>({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      const { data } = await api.get('/stats/schedule')
      return data
    },
  })

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['calendar-appointments', weekStart.toISOString(), viewMode],
    queryFn: async () => {
      const startDate = viewMode === 'week' 
        ? weekStart 
        : startOfDay(currentDate)
      const endDate = viewMode === 'week'
        ? addDays(weekStart, 7)
        : addDays(currentDate, 1)

      const { data } = await api.get('/appointments', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      })
      return data.appointments || []
    },
  })

  const { data: waitlist = [] } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const { data } = await api.get('/waitlist?status=WAITING')
      return data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data } = await api.put(`/appointments/${id}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] })
      toast({ title: 'Статус обновлен' })
      setShowStatusDialog(false)
      setSelectedAppointment(null)
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось обновить статус',
        variant: 'destructive',
      })
    },
  })

  const timeSlots = useMemo(() => {
    if (!settings) return []
    
    const [startHour] = settings.workStartTime.split(':').map(Number)
    const [endHour] = settings.workEndTime.split(':').map(Number)
    
    const slots: string[] = []
    for (let h = startHour; h < endHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`)
    }
    return slots
  }, [settings])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => isSameDay(parseISO(apt.date), date))
  }

  const getAppointmentStyle = (appointment: Appointment) => {
    if (!settings) return {}
    
    const aptDate = parseISO(appointment.date)
    const [startHour, startMin] = settings.workStartTime.split(':').map(Number)
    const workStart = setMinutes(setHours(startOfDay(aptDate), startHour), startMin)
    
    const aptStart = aptDate
    const aptEnd = addMinutes(aptStart, appointment.service.duration)
    
    const startOffset = (aptStart.getTime() - workStart.getTime()) / (1000 * 60)
    const height = (aptEnd.getTime() - aptStart.getTime()) / (1000 * 60)
    
    const hourHeight = 60
    
    return {
      top: `${(startOffset / 60) * hourHeight}px`,
      height: `${Math.max((height / 60) * hourHeight - 2, 24)}px`,
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      viewMode === 'week' 
        ? direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
        : direction === 'next' ? addDays(prev, 1) : addDays(prev, -1)
    )
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedAppointment(apt)
    setShowStatusDialog(true)
  }

  const handleAddToWaitlist = () => {
    setWaitlistData(waitlist)
    setShowWaitlistDialog(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Календарь записей
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="week">Неделя</TabsTrigger>
              <TabsTrigger value="day">День</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Сегодня
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center font-medium">
            {viewMode === 'week' 
              ? `${format(weekStart, 'd MMM', { locale: ru })} - ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale: ru })}`
              : format(currentDate, 'd MMMM yyyy', { locale: ru })
            }
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddToWaitlist} className="gap-1">
            <Users className="h-4 w-4" />
            Очередь ({waitlist.length})
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : viewMode === 'week' ? (
        <Card variant="glass" className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-8 border-b">
                <div className="p-2 text-xs text-muted-foreground border-r bg-muted/30">Время</div>
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-2 text-center border-r last:border-r-0",
                      isToday(day) && "bg-primary/10"
                    )}
                  >
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEE', { locale: ru })}
                    </div>
                    <div className={cn("font-semibold", isToday(day) && "text-primary")}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-8 relative" style={{ minHeight: `${timeSlots.length * 60}px` }}>
                <div className="border-r">
                  {timeSlots.map((slot, i) => (
                    <div
                      key={i}
                      className="h-[60px] px-2 py-1 text-xs text-muted-foreground border-b"
                    >
                      {slot}
                    </div>
                  ))}
                </div>

                {weekDays.map((day, dayIndex) => {
                  const dayAppointments = getAppointmentsForDay(day)
                  const isWorkDay = settings?.workDays.split(',').map(Number).includes(day.getDay())
                  
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "relative border-r last:border-r-0",
                        !isWorkDay && "bg-muted/20"
                      )}
                    >
                      {timeSlots.map((slot, i) => (
                        <div key={i} className="h-[60px] border-b border-dashed border-border/30" />
                      ))}
                      
                      {dayAppointments.map(apt => (
                        <div
                          key={apt.id}
className={cn(
                             "absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer border overflow-hidden transition-all hover:z-10 hover:shadow-md",
                             statusColors[apt.status],
                             apt.status === 'SCHEDULED' && "hover:bg-blue-500/40",
                             apt.status === 'COMPLETED' && "hover:bg-green-500/40",
                             apt.status === 'CANCELLED' && "hover:bg-red-500/40",
                             apt.status === 'NO_SHOW' && "hover:bg-gray-500/40"
                           )}
                          style={getAppointmentStyle(apt)}
                          onClick={() => handleAppointmentClick(apt)}
                        >
                          <div className="text-xs font-medium truncate">
                            {apt.service.name}
                          </div>
                          {apt.recurringId && (
                            <RefreshCw className="absolute top-1 right-1 h-3 w-3 opacity-50" />
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card variant="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {format(currentDate, 'EEEE, d MMMM yyyy', { locale: ru })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative" style={{ minHeight: `${timeSlots.length * 60}px` }}>
                  <div className="absolute left-0 top-0 w-16">
                    {timeSlots.map((slot, i) => (
                      <div
                        key={i}
                        className="h-[60px] px-2 py-1 text-xs text-muted-foreground"
                      >
                        {slot}
                      </div>
                    ))}
                  </div>

                  <div className="ml-16 relative border-l">
                    {timeSlots.map((slot, i) => (
                      <div key={i} className="h-[60px] border-b border-dashed border-border/30" />
                    ))}

                    {getAppointmentsForDay(currentDate).map(apt => {
                      const style = getAppointmentStyle(apt)
                      const isCompact = parseInt(String(style.height)) < 50
                      
                      return (
                        <div
                          key={apt.id}
                          className={cn(
                            "absolute left-2 right-2 rounded-lg cursor-pointer border transition-all hover:shadow-lg overflow-hidden",
                            isCompact ? "px-2 py-1" : "p-3",
                            statusColors[apt.status],
                            apt.status === 'SCHEDULED' && "hover:bg-blue-500/40",
                            apt.status === 'COMPLETED' && "hover:bg-green-500/40",
                            apt.status === 'CANCELLED' && "hover:bg-red-500/40",
                            apt.status === 'NO_SHOW' && "hover:bg-gray-500/40"
                          )}
                          style={style}
                          onClick={() => handleAppointmentClick(apt)}
                        >
                          {isCompact ? (
                            <div className="flex items-center justify-between gap-1 h-full">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium text-sm truncate">{apt.service.name}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(parseISO(apt.date), 'HH:mm')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-medium">{apt.price?.toLocaleString() || apt.service.price.toLocaleString()} ₸</span>
                                {apt.recurringId && <RefreshCw className="h-3 w-3 opacity-50" />}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{apt.service.name}</div>
                                <div className="text-sm flex items-center gap-1 truncate">
                                  <User className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{apt.client.name}</span>
                                </div>
                                <div className="text-sm flex items-center gap-1">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  {format(parseISO(apt.date), 'HH:mm')} - {format(addMinutes(parseISO(apt.date), apt.service.duration), 'HH:mm')}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-semibold">{apt.price?.toLocaleString() || apt.service.price.toLocaleString()} ₸</div>
                                <div className="text-xs">{statusLabels[apt.status]}</div>
                                {apt.recurringId && <RefreshCw className="h-4 w-4 mt-1 opacity-50" />}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card variant="glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Записи дня
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getAppointmentsForDay(currentDate).length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Нет записей</p>
                ) : (
                  <div className="space-y-2">
                    {getAppointmentsForDay(currentDate)
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map(apt => (
                        <div
                          key={apt.id}
                          className={cn(
                            "p-2 rounded-lg border cursor-pointer hover:bg-accent/30",
                            selectedAppointment?.id === apt.id && "ring-2 ring-primary"
                          )}
                          onClick={() => handleAppointmentClick(apt)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">{format(parseISO(apt.date), 'HH:mm')}</div>
                              <div className="text-xs">{apt.client.name}</div>
                            </div>
                            <div className={cn("text-xs px-2 py-0.5 rounded", statusColors[apt.status])}>
                              {statusLabels[apt.status]}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запись</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Клиент:</span>
                  <p className="font-medium">{selectedAppointment.client.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Телефон:</span>
                  <p className="font-medium">{selectedAppointment.client.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Услуга:</span>
                  <p className="font-medium">{selectedAppointment.service.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Мастер:</span>
                  <p className="font-medium">{selectedAppointment.staff.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Дата и время:</span>
                  <p className="font-medium">{format(parseISO(selectedAppointment.date), 'd MMMM yyyy, HH:mm', { locale: ru })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Стоимость:</span>
                  <p className="font-medium">{selectedAppointment.price?.toLocaleString() || selectedAppointment.service.price.toLocaleString()} ₸</p>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Примечание:</span>
                  <p>{selectedAppointment.notes}</p>
                </div>
              )}

              {selectedAppointment.status === 'SCHEDULED' && (
                <div className="space-y-2">
                  <Label>Изменить статус</Label>
                  <Select
                    onValueChange={(value) => {
                      updateStatusMutation.mutate({ id: selectedAppointment.id, status: value })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPLETED">Завершено</SelectItem>
                      <SelectItem value="CANCELLED">Отменено</SelectItem>
                      <SelectItem value="NO_SHOW">Не явился</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Очередь ожидания
            </DialogTitle>
            <DialogDescription>
              Клиенты, ожидающие освобождения времени
            </DialogDescription>
          </DialogHeader>
          {waitlistData.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Очередь пуста</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {waitlistData.map((entry) => (
                <div key={entry.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{entry.client.name}</div>
                      <div className="text-sm text-muted-foreground">{entry.client.phone}</div>
                      <div className="text-sm mt-1">
                        <span className="text-muted-foreground">Услуга:</span> {entry.service.name}
                      </div>
                      {entry.preferredDate && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Предпочтительная дата:</span>{' '}
                          {format(new Date(entry.preferredDate), 'd MMMM', { locale: ru })}
                        </div>
                      )}
                      {entry.preferredTime && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Время:</span> {entry.preferredTime}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const today = new Date()
                          today.setHours(10, 0, 0, 0)
                          await api.post(`/waitlist/${entry.id}/convert`, {
                            date: entry.preferredDate || today,
                            staffId: entry.staffId,
                          })
                          toast({ title: 'Запись создана' })
                          queryClient.invalidateQueries({ queryKey: ['waitlist'] })
                          queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] })
                        } catch (err) {
                          const error = err as AxiosError<{ error: string }>
                          toast({
                            title: 'Ошибка',
                            description: error.response?.data?.error,
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      Записать
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
