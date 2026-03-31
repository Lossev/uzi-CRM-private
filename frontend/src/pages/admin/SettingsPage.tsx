import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save } from 'lucide-react'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { ScheduleSettings } from '@/types'

const DAYS = [
  { value: 0, label: 'Вс' },
  { value: 1, label: 'Пн' },
  { value: 2, label: 'Вт' },
  { value: 3, label: 'Ср' },
  { value: 4, label: 'Чт' },
  { value: 5, label: 'Пт' },
  { value: 6, label: 'Сб' },
]

const DAY_NAMES = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
]

export default function SettingsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakStart: '',
    breakEnd: '',
    slotDuration: 30,
    workDays: '1,2,3,4,5',
  })

  const { data: settings, isLoading } = useQuery({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      const { data } = await api.get<ScheduleSettings>('/stats/schedule')
      return data
    },
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        workStartTime: settings.workStartTime,
        workEndTime: settings.workEndTime,
        breakStart: settings.breakStart || '',
        breakEnd: settings.breakEnd || '',
        slotDuration: settings.slotDuration,
        workDays: settings.workDays,
      })
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: response } = await api.put('/stats/schedule', {
        ...data,
        breakStart: data.breakStart || null,
        breakEnd: data.breakEnd || null,
      })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-settings'] })
      toast({ title: 'Настройки сохранены' })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось сохранить настройки',
        variant: 'destructive',
      })
    },
  })

  const selectedDays = formData.workDays.split(',').map(Number).filter(n => !isNaN(n))

  const handleWorkDayToggle = (day: number) => {
    const currentDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b)
    setFormData({ ...formData, workDays: currentDays.join(',') })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedDays.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы один рабочий день',
        variant: 'destructive',
      })
      return
    }

    updateMutation.mutate(formData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <p className="text-muted-foreground">Настройки рабочего расписания</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Рабочее время</CardTitle>
            <CardDescription>
              Укажите время начала и окончания рабочего дня
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workStartTime">Начало работы</Label>
                <Input
                  id="workStartTime"
                  type="time"
                  value={formData.workStartTime}
                  onChange={(e) =>
                    setFormData({ ...formData, workStartTime: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workEndTime">Окончание работы</Label>
                <Input
                  id="workEndTime"
                  type="time"
                  value={formData.workEndTime}
                  onChange={(e) =>
                    setFormData({ ...formData, workEndTime: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Перерыв на обед</CardTitle>
            <CardDescription>
              Оставьте пустым, если перерыв не нужен
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breakStart">Начало перерыва</Label>
                <Input
                  id="breakStart"
                  type="time"
                  value={formData.breakStart}
                  onChange={(e) =>
                    setFormData({ ...formData, breakStart: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakEnd">Окончание перерыва</Label>
                <Input
                  id="breakEnd"
                  type="time"
                  value={formData.breakEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, breakEnd: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Длительность слота</CardTitle>
            <CardDescription>
              Минимальный интервал для записи (в минутах)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-32">
              <Label htmlFor="slotDuration">Минут</Label>
              <Input
                id="slotDuration"
                type="number"
                min={10}
                max={120}
                step={5}
                value={formData.slotDuration}
                onChange={(e) =>
                  setFormData({ ...formData, slotDuration: Number(e.target.value) })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Рабочие дни</CardTitle>
            <CardDescription>
              Выберите дни недели, в которые можно записаться
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => {
                const isSelected = selectedDays.includes(day.value)
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleWorkDayToggle(day.value)}
                    className={`p-3 rounded-md border text-center transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted'
                    }`}
                    title={DAY_NAMES[day.value]}
                  >
                    <span className="text-sm font-medium">{day.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </div>
      </form>
    </div>
  )
}
