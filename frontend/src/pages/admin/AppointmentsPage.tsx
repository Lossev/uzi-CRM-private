import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Search, CalendarIcon, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import api from '@/lib/api'
import { Appointment, Service, Client, AppointmentStatus } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'

const statusLabels: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' }> = {
  SCHEDULED: { label: 'Запланировано', variant: 'default' },
  COMPLETED: { label: 'Выполнено', variant: 'success' },
  CANCELLED: { label: 'Отменено', variant: 'destructive' },
  NO_SHOW: { label: 'Неявка', variant: 'warning' },
}

export default function AppointmentsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [date, setDate] = useState(new Date())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [formData, setFormData] = useState({
    clientId: 0,
    serviceId: 0,
    date: '',
    time: '',
    notes: '',
    status: 'SCHEDULED' as AppointmentStatus,
    price: 0,
  })

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', format(date, 'yyyy-MM-dd'), statusFilter],
    queryFn: async () => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const params = new URLSearchParams({
        startDate: dateStr,
        endDate: dateStr,
        limit: '100',
      })
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)
      const { data } = await api.get('/appointments', { params })
      return data.appointments
    },
  })

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get<Service[]>('/services')
      return data
    },
  })

  const { data: clients } = useQuery({
    queryKey: ['clients-search', search],
    queryFn: async () => {
      if (!search || search.length < 2) return []
      const { data } = await api.get('/clients', {
        params: { search, limit: '10' },
      })
      return data.clients
    },
    enabled: search.length >= 2,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const dateTime = new Date(`${data.date}T${data.time}`)
      const response = await api.post('/appointments', {
        clientId: data.clientId,
        serviceId: data.serviceId,
        date: dateTime.toISOString(),
        notes: data.notes,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setIsDialogOpen(false)
      resetForm()
      toast({ title: 'Запись создана', description: 'Запись успешно добавлена' })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось создать запись',
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: number }) => {
      const dateTime = data.date && data.time ? new Date(`${data.date}T${data.time}`) : undefined
      const response = await api.put(`/appointments/${data.id}`, {
        status: data.status,
        notes: data.notes,
        price: user?.role === 'ADMIN' ? data.price : undefined,
        date: dateTime?.toISOString(),
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setIsDialogOpen(false)
      resetForm()
      toast({ title: 'Запись обновлена' })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось обновить запись',
      variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/appointments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast({ title: 'Запись отменена' })
    },
  })

  useEffect(() => {
    if (!isDialogOpen) {
      resetForm()
    }
  }, [isDialogOpen])

  const resetForm = () => {
    setFormData({
      clientId: 0,
      serviceId: 0,
      date: '',
      time: '',
      notes: '',
      status: 'SCHEDULED',
      price: 0,
    })
    setEditingAppointment(null)
  }

  const handleEdit = (appointment: Appointment) => {
    const aptDate = new Date(appointment.date)
    setEditingAppointment(appointment)
    setFormData({
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      date: format(aptDate, 'yyyy-MM-dd'),
      time: format(aptDate, 'HH:mm'),
      notes: appointment.notes || '',
      status: appointment.status,
      price: appointment.price ? Number(appointment.price) : 0,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!editingAppointment) {
      if (!formData.clientId || formData.clientId === 0) {
        toast({ title: 'Ошибка', description: 'Выберите клиента', variant: 'destructive' })
        return
      }
      if (!formData.serviceId || formData.serviceId === 0) {
        toast({ title: 'Ошибка', description: 'Выберите услугу', variant: 'destructive' })
        return
      }
      if (!formData.date || !formData.time) {
        toast({ title: 'Ошибка', description: 'Выберите дату и время', variant: 'destructive' })
        return
      }
    }
    if (editingAppointment) {
      updateMutation.mutate({ ...formData, id: editingAppointment.id })
    } else {
      createMutation.mutate(formData)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1))
    setDate(newDate)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Записи</h1>
          <p className="text-muted-foreground">{format(date, 'd MMMM yyyy', { locale: ru })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  locale={ru}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Новая запись
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени клиента..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            {Object.entries(statusLabels).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Время</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Услуга</TableHead>
              <TableHead className="hidden md:table-cell">Телефон</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Загрузка...
                </TableCell>
              </TableRow>
            ) : appointments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Нет записей на этот день
                </TableCell>
              </TableRow>
            ) : (
              appointments?.map((appointment: Appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell className="font-medium">
                    {format(new Date(appointment.date), 'HH:mm')}
                  </TableCell>
                  <TableCell>{appointment.client.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {appointment.service.name}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {appointment.client.phone}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[appointment.status].variant}>
                      {statusLabels[appointment.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(appointment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(appointment.id)}
                        disabled={appointment.status === 'CANCELLED'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? 'Редактировать запись' : 'Новая запись'}
            </DialogTitle>
            <DialogDescription>
              {editingAppointment
                ? 'Измените данные записи'
                : 'Заполните форму для создания новой записи'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingAppointment && (
              <>
                <div className="space-y-2">
                  <Label>Клиент</Label>
                  <div className="relative">
                    <Input
                      placeholder="Введите имя для поиска..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {clients && clients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-40 overflow-auto">
                        {clients.map((client: Client) => (
                          <button
                            key={client.id}
                            className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                            onClick={() => {
                              setFormData({ ...formData, clientId: client.id })
                              setSearch(client.name)
                            }}
                          >
                            {client.name} ({client.phone})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Услуга</Label>
                  <Select
                    value={formData.serviceId?.toString()}
                    onValueChange={(v) => setFormData({ ...formData, serviceId: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите услугу" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} - {formatPrice(service.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Дата</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Время</Label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as AppointmentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="space-y-2">
                <Label>Цена</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Примечания</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingAppointment ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
