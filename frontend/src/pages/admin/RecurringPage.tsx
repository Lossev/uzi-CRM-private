import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AxiosError } from 'axios'
import { RefreshCw, Plus, Trash2, Play, Calendar, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface RecurringAppointment {
  id: number
  startTime: string
  duration: number
  recurringType: string
  dayOfWeek: number
  endType: string
  endDate: string | null
  maxOccurrences: number | null
  currentCount: number
  price: number | null
  notes: string | null
  isActive: boolean
  createdAt: string
  client: { id: number; name: string; phone: string }
  service: { id: number; name: string; price: number; duration: number }
  staff: { id: number; name: string }
  appointments?: { id: number; date: string; status: string }[]
}

interface Service {
  id: number
  name: string
  price: number
  duration: number
  isActive: boolean
}

interface Client {
  id: number
  name: string
  phone: string
}

interface Staff {
  id: number
  name: string
}

interface CreateRecurringData {
  clientId: number
  serviceId: number
  staffId: number
  startTime: string
  dayOfWeek: number
  recurringType: string
  endType: string
  endDate: string | null
  maxOccurrences: number | null
  price: number | null
  notes: string | null
  createInitial: boolean
}

const fullDayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']

const recurringTypeLabels: Record<string, string> = {
  WEEKLY: 'Каждую неделю',
  BIWEEKLY: 'Раз в 2 недели',
  MONTHLY: 'Раз в месяц',
}

export default function RecurringPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringAppointment | null>(null)

  const { data: recurringList = [], isLoading } = useQuery<RecurringAppointment[]>({
    queryKey: ['recurring'],
    queryFn: async () => {
      const { data } = await api.get('/recurring')
      return data
    },
  })

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients', { params: { limit: 1000 } })
      return data.clients || []
    },
  })

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get('/services')
      return (data.services || data).filter((s: Service) => s.isActive)
    },
  })

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      const { data } = await api.get('/auth/staff')
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateRecurringData) => {
      const res = await api.post('/recurring', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
      toast({ title: 'Повторяющаяся запись создана' })
      setShowCreateDialog(false)
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error,
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ id, deleteFuture }: { id: number; deleteFuture: boolean }) => {
      await api.delete(`/recurring/${id}?deleteFuture=${deleteFuture}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
      toast({ title: 'Повторяющаяся запись отключена' })
    },
  })

  const generateMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/recurring/${id}/generate`, { weeksAhead: 4 })
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] })
      toast({ title: `Создано ${data.created} записей` })
    },
  })

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    createMutation.mutate({
      clientId: Number(formData.get('clientId')),
      serviceId: Number(formData.get('serviceId')),
      staffId: Number(formData.get('staffId')),
      startTime: formData.get('startTime') as string,
      dayOfWeek: Number(formData.get('dayOfWeek')),
      recurringType: formData.get('recurringType') as string,
      endType: formData.get('endType') as string,
      endDate: formData.get('endDate') ? String(formData.get('endDate')) : null,
      maxOccurrences: formData.get('maxOccurrences') ? Number(formData.get('maxOccurrences')) : null,
      price: formData.get('price') ? Number(formData.get('price')) : null,
      notes: formData.get('notes') ? String(formData.get('notes')) : null,
      createInitial: true,
    })
  }

  const activeRecurring = recurringList.filter(r => r.isActive)
  const inactiveRecurring = recurringList.filter(r => !r.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Повторяющиеся записи
          </h1>
          <p className="text-muted-foreground">
            Настройте автоматическое создание записей по расписанию
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Создать
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
      ) : (
        <>
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">Активные ({activeRecurring.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {activeRecurring.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Нет активных повторяющихся записей</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Услуга</TableHead>
                      <TableHead>День / Время</TableHead>
                      <TableHead>Повторение</TableHead>
                      <TableHead>Создано</TableHead>
                      <TableHead>Мастер</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRecurring.map((recurring) => (
                      <TableRow key={recurring.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">{recurring.client.name}</div>
                          <div className="text-xs text-muted-foreground">{recurring.client.phone}</div>
                        </TableCell>
                        <TableCell>{recurring.service.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {fullDayNames[recurring.dayOfWeek]}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {recurring.startTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{recurringTypeLabels[recurring.recurringType]}</Badge>
                          {recurring.endType === 'ON_DATE' && recurring.endDate && (
                            <div className="text-xs text-muted-foreground mt-1">
                              до {format(new Date(recurring.endDate), 'd.MM.yyyy')}
                            </div>
                          )}
                          {recurring.endType === 'AFTER_OCCURRENCES' && recurring.maxOccurrences && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {recurring.currentCount}/{recurring.maxOccurrences}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{recurring.currentCount}</TableCell>
                        <TableCell>{recurring.staff.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRecurring(recurring)
                                setShowDetailsDialog(true)
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generateMutation.mutate(recurring.id)}
                              disabled={generateMutation.isPending}
                            >
                              <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Отключить повторяющуюся запись? Будущие записи будут отменены.')) {
                                  deleteMutation.mutate({ id: recurring.id, deleteFuture: true })
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {inactiveRecurring.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg text-muted-foreground">
                  Неактивные ({inactiveRecurring.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Услуга</TableHead>
                      <TableHead>День / Время</TableHead>
                      <TableHead>Создано записей</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveRecurring.map((recurring) => (
                      <TableRow key={recurring.id} className="opacity-60">
                        <TableCell>{recurring.client.name}</TableCell>
                        <TableCell>{recurring.service.name}</TableCell>
                        <TableCell>{fullDayNames[recurring.dayOfWeek]} {recurring.startTime}</TableCell>
                        <TableCell>{recurring.currentCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Создать повторяющуюся запись</DialogTitle>
            <DialogDescription>
              Запись будет автоматически создаваться по расписанию
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Клиент</Label>
                <Select name="clientId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите клиента" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Услуга</Label>
                <Select name="serviceId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите услугу" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} ({service.price} ₸)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Мастер</Label>
                <Select name="staffId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите мастера" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>День недели</Label>
                <Select name="dayOfWeek" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите день" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {fullDayNames[day]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Время</Label>
                <Input name="startTime" type="time" required defaultValue="10:00" />
              </div>
              <div className="space-y-2">
                <Label>Тип повторения</Label>
                <Select name="recurringType" defaultValue="WEEKLY">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Каждую неделю</SelectItem>
                    <SelectItem value="BIWEEKLY">Раз в 2 недели</SelectItem>
                    <SelectItem value="MONTHLY">Раз в месяц</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Окончание</Label>
              <Select name="endType" defaultValue="NEVER">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEVER">Бессрочно</SelectItem>
                  <SelectItem value="ON_DATE">До определенной даты</SelectItem>
                  <SelectItem value="AFTER_OCCURRENCES">После N повторений</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Цена (опционально)</Label>
                <Input name="price" type="number" placeholder="Как у услуги" />
              </div>
              <div className="space-y-2">
                <Label>Заметки</Label>
                <Input name="notes" placeholder="Комментарий" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Создание...' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Детали повторяющейся записи</DialogTitle>
          </DialogHeader>
          {selectedRecurring && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Клиент:</span>
                  <div className="font-medium">{selectedRecurring.client.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Услуга:</span>
                  <div className="font-medium">{selectedRecurring.service.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">День:</span>
                  <div className="font-medium">{fullDayNames[selectedRecurring.dayOfWeek]}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Время:</span>
                  <div className="font-medium">{selectedRecurring.startTime}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Мастер:</span>
                  <div className="font-medium">{selectedRecurring.staff.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Создано записей:</span>
                  <div className="font-medium">{selectedRecurring.currentCount}</div>
                </div>
              </div>

              {selectedRecurring.appointments && selectedRecurring.appointments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Ближайшие записи:</Label>
                  <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                    {selectedRecurring.appointments.slice(0, 10).map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                        <span>{format(new Date(apt.date), 'd MMMM yyyy, HH:mm', { locale: ru })}</span>
                        <Badge variant={apt.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {apt.status === 'COMPLETED' ? 'Завершено' : 'Запланировано'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => {
                    generateMutation.mutate(selectedRecurring.id)
                    setShowDetailsDialog(false)
                  }}
                  disabled={generateMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сгенерировать записи
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
