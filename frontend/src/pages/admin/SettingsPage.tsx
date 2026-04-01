import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, Mail, TestTube, Loader2, CheckCircle, AlertCircle, MessageCircle, FileText, Palette } from 'lucide-react'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/hooks/useTheme'
import { ScheduleSettings } from '@/types'

interface EmailSettings {
  id: number
  enabled: boolean
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string | null
  smtpPass: string | null
  smtpFrom: string | null
  reportEmail: string | null
}

interface TelegramSettings {
  id: number
  enabled: boolean
  botToken: string | null
  defaultChatId: string | null
  proxyEnabled: boolean
  proxyHost: string | null
  proxyPort: number | null
  proxyUsername: string | null
  proxyPassword: string | null
}

interface ReportSettings {
  id: number
  includeTotalRevenue: boolean
  includeAppointmentsCount: boolean
  includeAverageCheck: boolean
  includeRevenueByService: boolean
  includeRevenueByStaff: boolean
  includeDailyRevenue: boolean
}

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
  const { theme, warmVariant, setWarmVariant } = useTheme()
  const [formData, setFormData] = useState({
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakStart: '',
    breakEnd: '',
    slotDuration: 30,
    workDays: '1,2,3,4,5',
  })

  const [emailFormData, setEmailFormData] = useState({
    enabled: false,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    reportEmail: '',
  })

  const [telegramFormData, setTelegramFormData] = useState({
    enabled: false,
    botToken: '',
    defaultChatId: '',
    proxyEnabled: false,
    proxyHost: '',
    proxyPort: 1080,
    proxyUsername: '',
    proxyPassword: '',
  })

  const [reportFormData, setReportFormData] = useState({
    includeTotalRevenue: true,
    includeAppointmentsCount: true,
    includeAverageCheck: true,
    includeRevenueByService: true,
    includeRevenueByStaff: true,
    includeDailyRevenue: true,
  })

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [telegramTestStatus, setTelegramTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const { data: settings, isLoading } = useQuery({
    queryKey: ['schedule-settings'],
    queryFn: async () => {
      const { data } = await api.get<ScheduleSettings>('/stats/schedule')
      return data
    },
  })

  const { data: emailSettings, isLoading: emailLoading } = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data } = await api.get<EmailSettings>('/stats/email')
      return data
    },
  })

  const { data: telegramSettings, isLoading: telegramLoading } = useQuery({
    queryKey: ['telegram-settings'],
    queryFn: async () => {
      const { data } = await api.get<TelegramSettings>('/stats/telegram')
      return data
    },
  })

  const { data: reportSettings, isLoading: reportLoading } = useQuery({
    queryKey: ['report-settings'],
    queryFn: async () => {
      const { data } = await api.get<ReportSettings>('/stats/report')
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

  useEffect(() => {
    if (emailSettings) {
      setEmailFormData({
        enabled: emailSettings.enabled,
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpSecure: emailSettings.smtpSecure,
        smtpUser: emailSettings.smtpUser || '',
        smtpPass: emailSettings.smtpPass ? '••••••••' : '',
        smtpFrom: emailSettings.smtpFrom || '',
        reportEmail: emailSettings.reportEmail || '',
      })
    }
  }, [emailSettings])

  useEffect(() => {
    if (telegramSettings) {
      setTelegramFormData({
        enabled: telegramSettings.enabled,
        botToken: telegramSettings.botToken ? '••••••••••••••••' : '',
        defaultChatId: telegramSettings.defaultChatId || '',
        proxyEnabled: telegramSettings.proxyEnabled || false,
        proxyHost: telegramSettings.proxyHost || '',
        proxyPort: telegramSettings.proxyPort || 1080,
        proxyUsername: telegramSettings.proxyUsername || '',
        proxyPassword: telegramSettings.proxyPassword ? '••••••••••' : '',
      })
    }
  }, [telegramSettings])

  useEffect(() => {
    if (reportSettings) {
      setReportFormData({
        includeTotalRevenue: reportSettings.includeTotalRevenue,
        includeAppointmentsCount: reportSettings.includeAppointmentsCount,
        includeAverageCheck: reportSettings.includeAverageCheck,
        includeRevenueByService: reportSettings.includeRevenueByService,
        includeRevenueByStaff: reportSettings.includeRevenueByStaff,
        includeDailyRevenue: reportSettings.includeDailyRevenue,
      })
    }
  }, [reportSettings])

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

  const updateEmailMutation = useMutation({
    mutationFn: async (data: typeof emailFormData) => {
      const payload: Record<string, unknown> = {
        enabled: data.enabled,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpSecure: data.smtpSecure,
        smtpUser: data.smtpUser || null,
        smtpFrom: data.smtpFrom || null,
        reportEmail: data.reportEmail || null,
      }
      if (data.smtpPass && data.smtpPass !== '••••••••') {
        payload.smtpPass = data.smtpPass
      }
      const { data: response } = await api.put('/stats/email', payload)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] })
      toast({ title: 'Настройки email сохранены' })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось сохранить настройки email',
        variant: 'destructive',
      })
    },
  })

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/stats/email/test')
      return data
    },
    onSuccess: (data) => {
      if (data.success) {
        setTestStatus('success')
        toast({ title: 'Соединение успешно', description: 'SMTP сервер доступен' })
      } else {
        setTestStatus('error')
        toast({
          title: 'Ошибка соединения',
          description: data.error || 'Не удалось подключиться к SMTP серверу',
          variant: 'destructive',
        })
      }
    },
    onError: (error) => {
      setTestStatus('error')
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось проверить соединение',
        variant: 'destructive',
      })
    },
  })

  const updateTelegramMutation = useMutation({
    mutationFn: async (data: typeof telegramFormData) => {
      const payload: Record<string, unknown> = {
        enabled: data.enabled,
        defaultChatId: data.defaultChatId || null,
        proxyEnabled: data.proxyEnabled || false,
        proxyHost: data.proxyHost || null,
        proxyPort: data.proxyPort || null,
        proxyUsername: data.proxyUsername || null,
      }
      if (data.botToken && data.botToken !== '••••••••••••••••') {
        payload.botToken = data.botToken
      }
      if (data.proxyPassword && data.proxyPassword !== '••••••••••') {
        payload.proxyPassword = data.proxyPassword
      }
      const { data: response } = await api.put('/stats/telegram', payload)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-settings'] })
      toast({ title: 'Настройки Telegram сохранены' })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось сохранить настройки Telegram',
        variant: 'destructive',
      })
    },
  })

  const testTelegramMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/stats/telegram/test')
      return data
    },
    onSuccess: (data) => {
      if (data.success) {
        setTelegramTestStatus('success')
        toast({ title: 'Соединение успешно', description: `Бот: ${data.botInfo?.username || 'подключен'}` })
      } else {
        setTelegramTestStatus('error')
        toast({
          title: 'Ошибка соединения',
          description: data.error || 'Не удалось подключиться к Telegram',
          variant: 'destructive',
        })
      }
    },
    onError: (error) => {
      setTelegramTestStatus('error')
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось проверить соединение',
        variant: 'destructive',
      })
    },
  })

  const updateReportMutation = useMutation({
    mutationFn: async (data: typeof reportFormData) => {
      const { data: response } = await api.put('/stats/report', data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-settings'] })
      toast({ title: 'Настройки отчета сохранены' })
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось сохранить настройки отчета',
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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateEmailMutation.mutate(emailFormData)
  }

  const handleTestEmail = () => {
    setTestStatus('loading')
    testEmailMutation.mutate()
  }

  const handleTelegramSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateTelegramMutation.mutate(telegramFormData)
  }

  const handleTestTelegram = () => {
    setTelegramTestStatus('loading')
    testTelegramMutation.mutate()
  }

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateReportMutation.mutate(reportFormData)
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
        <p className="text-muted-foreground">Настройки рабочего расписания и уведомлений</p>
      </div>

      {theme === 'warm' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Настройка тёплой темы
            </CardTitle>
            <CardDescription>
              Выберите уровень яркости для комфортной работы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              {[
                { value: 1, label: 'Светлая', desc: 'Максимальная яркость' },
                { value: 2, label: 'Светлая+', desc: 'Повышенная яркость' },
                { value: 3, label: 'Средняя', desc: 'Оптимальная яркость' },
                { value: 4, label: 'Тёмная+', desc: 'Пониженная яркость' },
                { value: 5, label: 'Тёмная', desc: 'Минимальная яркость' },
              ].map((variant) => (
                <button
                  key={variant.value}
                  type="button"
                  onClick={() => setWarmVariant(variant.value as 1 | 2 | 3 | 4 | 5)}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    warmVariant === variant.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full mx-auto mb-2 border-2 ${
                      warmVariant === variant.value ? 'border-primary' : 'border-border'
                    }`}
                    style={{
                      background: `hsl(38, ${25 - variant.value * 2}%, ${92 - variant.value * 7}%)`,
                    }}
                  />
                  <p className="text-sm font-medium">{variant.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{variant.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      <form onSubmit={handleEmailSubmit}>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Настройки отправки отчетов по почте
            </CardTitle>
            <CardDescription>
              Настройте SMTP для отправки отчетов по электронной почте
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <p className="font-medium">Включить отправку по почте</p>
                <p className="text-sm text-muted-foreground">
                  Разрешить отправку отчетов по электронной почте
                </p>
              </div>
              <Switch
                checked={emailFormData.enabled}
                onCheckedChange={(checked) =>
                  setEmailFormData({ ...emailFormData, enabled: checked })
                }
              />
            </div>

            {emailFormData.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP сервер</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      value={emailFormData.smtpHost}
                      onChange={(e) =>
                        setEmailFormData({ ...emailFormData, smtpHost: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Порт</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      placeholder="587"
                      value={emailFormData.smtpPort}
                      onChange={(e) =>
                        setEmailFormData({ ...emailFormData, smtpPort: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">Логин (email)</Label>
                    <Input
                      id="smtpUser"
                      type="email"
                      placeholder="your@email.com"
                      value={emailFormData.smtpUser}
                      onChange={(e) =>
                        setEmailFormData({ ...emailFormData, smtpUser: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">Пароль / App Password</Label>
                    <Input
                      id="smtpPass"
                      type="password"
                      placeholder="••••••••"
                      value={emailFormData.smtpPass}
                      onChange={(e) =>
                        setEmailFormData({ ...emailFormData, smtpPass: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpFrom">Email отправителя</Label>
                    <Input
                      id="smtpFrom"
                      type="email"
                      placeholder="noreply@yourdomain.com"
                      value={emailFormData.smtpFrom}
                      onChange={(e) =>
                        setEmailFormData({ ...emailFormData, smtpFrom: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportEmail">Email для отчетов по умолчанию</Label>
                    <Input
                      id="reportEmail"
                      type="email"
                      placeholder="reports@yourdomain.com"
                      value={emailFormData.reportEmail}
                      onChange={(e) =>
                        setEmailFormData({ ...emailFormData, reportEmail: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">SSL/TLS шифрование</p>
                    <p className="text-sm text-muted-foreground">
                      Использовать защищенное соединение (обычно для порта 465)
                    </p>
                  </div>
                  <Switch
                    checked={emailFormData.smtpSecure}
                    onCheckedChange={(checked) =>
                      setEmailFormData({ ...emailFormData, smtpSecure: checked })
                    }
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={testEmailMutation.isPending || !emailFormData.smtpUser}
                  >
                    {testEmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : testStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    ) : testStatus === 'error' ? (
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Проверить соединение
                  </Button>
                  {testStatus === 'success' && (
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Соединение успешно
                    </span>
                  )}
                  {testStatus === 'error' && (
                    <span className="text-sm text-red-600 dark:text-red-400">
                      Ошибка соединения
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={updateEmailMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateEmailMutation.isPending ? 'Сохранение...' : 'Сохранить настройки email'}
          </Button>
        </div>
      </form>

      <form onSubmit={handleTelegramSubmit}>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Настройки отправки в Telegram
            </CardTitle>
            <CardDescription>
              Настройте бота для отправки отчетов в Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div>
                <p className="font-medium">Включить отправку в Telegram</p>
                <p className="text-sm text-muted-foreground">
                  Разрешить отправку отчетов в Telegram
                </p>
              </div>
              <Switch
                checked={telegramFormData.enabled}
                onCheckedChange={(checked) =>
                  setTelegramFormData({ ...telegramFormData, enabled: checked })
                }
              />
            </div>

            {telegramFormData.enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={telegramFormData.botToken}
                    onChange={(e) =>
                      setTelegramFormData({ ...telegramFormData, botToken: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Получите токен у @BotFather в Telegram
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultChatId">Chat ID по умолчанию</Label>
                  <Input
                    id="defaultChatId"
                    placeholder="-1001234567890"
                    value={telegramFormData.defaultChatId}
                    onChange={(e) =>
                      setTelegramFormData({ ...telegramFormData, defaultChatId: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    ID чата или канала для отправки отчетов. Узнайте у @userinfobot
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium">SOCKS5 прокси</p>
                      <p className="text-sm text-muted-foreground">
                        Для обхода блокировок в РФ
                      </p>
                    </div>
                    <Switch
                      checked={telegramFormData.proxyEnabled}
                      onCheckedChange={(checked) =>
                        setTelegramFormData({ ...telegramFormData, proxyEnabled: checked })
                      }
                    />
                  </div>

                  {telegramFormData.proxyEnabled && (
                    <div className="mt-4 space-y-4 p-4 rounded-lg border">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="proxyHost">Хост прокси</Label>
                          <Input
                            id="proxyHost"
                            placeholder="proxy.example.com"
                            value={telegramFormData.proxyHost}
                            onChange={(e) =>
                              setTelegramFormData({ ...telegramFormData, proxyHost: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyPort">Порт</Label>
                          <Input
                            id="proxyPort"
                            type="number"
                            placeholder="1080"
                            value={telegramFormData.proxyPort}
                            onChange={(e) =>
                              setTelegramFormData({ ...telegramFormData, proxyPort: parseInt(e.target.value) || 1080 })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="proxyUsername">Логин (опционально)</Label>
                          <Input
                            id="proxyUsername"
                            placeholder="username"
                            value={telegramFormData.proxyUsername}
                            onChange={(e) =>
                              setTelegramFormData({ ...telegramFormData, proxyUsername: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proxyPassword">Пароль (опционально)</Label>
                          <Input
                            id="proxyPassword"
                            type="password"
                            placeholder="••••••••••"
                            value={telegramFormData.proxyPassword}
                            onChange={(e) =>
                              setTelegramFormData({ ...telegramFormData, proxyPassword: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Поддерживаются SOCKS5 прокси. Например: @socks5_bot в Telegram предоставляет бесплатные прокси.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestTelegram}
                    disabled={testTelegramMutation.isPending || !telegramFormData.botToken}
                  >
                    {testTelegramMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : telegramTestStatus === 'success' ? (
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    ) : telegramTestStatus === 'error' ? (
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Проверить соединение
                  </Button>
                  {telegramTestStatus === 'success' && (
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Бот подключен
                    </span>
                  )}
                  {telegramTestStatus === 'error' && (
                    <span className="text-sm text-red-600 dark:text-red-400">
                      Ошибка подключения
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={updateTelegramMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateTelegramMutation.isPending ? 'Сохранение...' : 'Сохранить настройки Telegram'}
          </Button>
        </div>
      </form>

      <form onSubmit={handleReportSubmit}>
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Настройки отчета
            </CardTitle>
            <CardDescription>
              Выберите, какие данные будут включены в отправляемый отчет
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Общая выручка</p>
                  <p className="text-sm text-muted-foreground">
                    Показать общую сумму выручки за период
                  </p>
                </div>
                <Switch
                  checked={reportFormData.includeTotalRevenue}
                  onCheckedChange={(checked) =>
                    setReportFormData({ ...reportFormData, includeTotalRevenue: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Количество приёмов</p>
                  <p className="text-sm text-muted-foreground">
                    Показать общее количество выполненных приёмов
                  </p>
                </div>
                <Switch
                  checked={reportFormData.includeAppointmentsCount}
                  onCheckedChange={(checked) =>
                    setReportFormData({ ...reportFormData, includeAppointmentsCount: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Средний чек</p>
                  <p className="text-sm text-muted-foreground">
                    Показать среднюю стоимость приёма
                  </p>
                </div>
                <Switch
                  checked={reportFormData.includeAverageCheck}
                  onCheckedChange={(checked) =>
                    setReportFormData({ ...reportFormData, includeAverageCheck: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Выручка по услугам</p>
                  <p className="text-sm text-muted-foreground">
                    Показать топ услуг по выручке
                  </p>
                </div>
                <Switch
                  checked={reportFormData.includeRevenueByService}
                  onCheckedChange={(checked) =>
                    setReportFormData({ ...reportFormData, includeRevenueByService: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Выручка по сотрудникам</p>
                  <p className="text-sm text-muted-foreground">
                    Показать выручку каждого сотрудника
                  </p>
                </div>
                <Switch
                  checked={reportFormData.includeRevenueByStaff}
                  onCheckedChange={(checked) =>
                    setReportFormData({ ...reportFormData, includeRevenueByStaff: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Динамика по дням</p>
                  <p className="text-sm text-muted-foreground">
                    Показать выручку за последние дни
                  </p>
                </div>
                <Switch
                  checked={reportFormData.includeDailyRevenue}
                  onCheckedChange={(checked) =>
                    setReportFormData({ ...reportFormData, includeDailyRevenue: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={updateReportMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateReportMutation.isPending ? 'Сохранение...' : 'Сохранить настройки отчета'}
          </Button>
        </div>
      </form>
    </div>
  )
}
