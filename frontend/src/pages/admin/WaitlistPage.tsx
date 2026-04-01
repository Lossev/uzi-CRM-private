import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Users, Plus, Calendar, Clock, Phone, XCircle } from 'lucide-react'
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
import { AxiosError } from 'axios'

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

interface AddWaitlistData {
  clientId: number
  serviceId: number
  staffId: number | null
  preferredDate: string | null
  preferredTime: string | null
  notes: string | null
}

interface WaitlistEntry {
  id: number
  preferredDate: string | null
  preferredTime: string | null
  notes: string | null
  status: string
  notifiedAt: string | null
  createdAt: string
  client: { id: number; name: string; phone: string; email?: string }
  service: { id: number; name: string; price: number; duration: number }
  staff: { id: number; name: string } | null
}

const statusColors: Record<string, string> = {
  WAITING: 'bg-amber-500/20 text-amber-700 border-amber-500',
  NOTIFIED: 'bg-blue-500/20 text-blue-700 border-blue-500',
  CONVERTED: 'bg-green-500/20 text-green-700 border-green-500',
  CANCELLED: 'bg-gray-500/20 text-gray-500 border-gray-500',
}

const statusLabels: Record<string, string> = {
  WAITING: 'Ожидает',
  NOTIFIED: 'Уведомлен',
  CONVERTED: 'Записан',
  CANCELLED: 'Отменено',
}

export default function WaitlistPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('WAITING')

  const { data: waitlist = [], isLoading } = useQuery<WaitlistEntry[]>({
    queryKey: ['waitlist', statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/waitlist', {
        params: statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {},
      })
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

  const addMutation = useMutation({
    mutationFn: async (data: AddWaitlistData) => {
      const res = await api.post('/waitlist', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      toast({ title: 'Клиент добавлен в очередь' })
      setShowAddDialog(false)
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error,
        variant: 'destructive',
      })
    },
  })

  const convertMutation = useMutation({
    mutationFn: async ({ id, date, staffId }: { id: number; date: string; staffId: number }) => {
      const res = await api.post(`/waitlist/${id}/convert`, { date, staffId })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast({ title: 'Запись создана' })
      setShowConvertDialog(false)
      setSelectedEntry(null)
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error,
        variant: 'destructive',
      })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/waitlist/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] })
      toast({ title: 'Запись отменена' })
    },
  })

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    addMutation.mutate({
      clientId: Number(formData.get('clientId')),
      serviceId: Number(formData.get('serviceId')),
      staffId: formData.get('staffId') ? Number(formData.get('staffId')) : null,
      preferredDate: formData.get('preferredDate') ? String(formData.get('preferredDate')) : null,
      preferredTime: formData.get('preferredTime') ? String(formData.get('preferredTime')) : null,
      notes: formData.get('notes') ? String(formData.get('notes')) : null,
    })
  }

  const handleConvert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedEntry) return
    
    const formData = new FormData(e.currentTarget)
    
    convertMutation.mutate({
      id: selectedEntry.id,
      date: formData.get('date') as string,
      staffId: Number(formData.get('staffId')),
    })
  }

  const stats = {
    waiting: waitlist.filter(w => w.status === 'WAITING').length,
    notified: waitlist.filter(w => w.status === 'NOTIFIED').length,
    converted: waitlist.filter(w => w.status === 'CONVERTED').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Очередь ожидания
          </h1>
          <p className="text-muted-foreground">
            Клиенты, ожидающие освобождения времени
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить в очередь
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ожидают</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waiting}</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Уведомлены</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notified}</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Записаны</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.converted}</div>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Список</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WAITING">Ожидают</SelectItem>
                <SelectItem value="NOTIFIED">Уведомлены</SelectItem>
                <SelectItem value="CONVERTED">Записаны</SelectItem>
                <SelectItem value="CANCELLED">Отменено</SelectItem>
                <SelectItem value="ALL">Все</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : waitlist.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Очередь пуста</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Услуга</TableHead>
                  <TableHead>Предпочтения</TableHead>
                  <TableHead>Мастер</TableHead>
                  <TableHead>Добавлен</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlist.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="font-medium">{entry.client.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {entry.client.phone}
                      </div>
                    </TableCell>
                    <TableCell>{entry.service.name}</TableCell>
                    <TableCell>
                      {entry.preferredDate && (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.preferredDate), 'd MMM', { locale: ru })}
                        </div>
                      )}
                      {entry.preferredTime && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {entry.preferredTime}
                        </div>
                      )}
                      {!entry.preferredDate && !entry.preferredTime && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{entry.staff?.name || 'Любой'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(entry.createdAt), 'd MMM', { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[entry.status]}>
                        {statusLabels[entry.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.status === 'WAITING' && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedEntry(entry)
                              setShowConvertDialog(true)
                            }}
                          >
                            Записать
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelMutation.mutate(entry.id)}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Добавить в очередь ожидания</DialogTitle>
            <DialogDescription>
              Клиент будет уведомлен при освобождении времени
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
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
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Предпочитаемый мастер (опционально)</Label>
              <Select name="staffId">
                <SelectTrigger>
                  <SelectValue placeholder="Любой мастер" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Предпочитаемая дата</Label>
                <Input name="preferredDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label>Предпочитаемое время</Label>
                <Input name="preferredTime" type="time" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea name="notes" placeholder="Дополнительная информация" rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать запись</DialogTitle>
            <DialogDescription>
              {selectedEntry?.client.name} → {selectedEntry?.service.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConvert} className="space-y-4">
            <div className="space-y-2">
              <Label>Дата и время</Label>
              <Input
                name="date"
                type="datetime-local"
                required
                defaultValue={
                  selectedEntry?.preferredDate
                    ? format(new Date(selectedEntry.preferredDate), "yyyy-MM-dd'T'HH:mm")
                    : format(new Date(), "yyyy-MM-dd'T'HH:mm")
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Мастер</Label>
              <Select name="staffId" required defaultValue={selectedEntry?.staff?.id?.toString()}>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowConvertDialog(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={convertMutation.isPending}>
                {convertMutation.isPending ? 'Создание...' : 'Записать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
