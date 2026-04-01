import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Mail, Loader2, CheckCircle, Send, FileText, AlertCircle, MessageCircle, X } from 'lucide-react'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { AxiosError } from 'axios'

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

interface SendReportPayload {
  startDate: string
  endDate: string
  email?: string
  sendToEmail?: boolean
  telegramChatId?: string
  sendToTelegram?: boolean
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showTelegramDialog, setShowTelegramDialog] = useState(false)
  const [email, setEmail] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [sendSuccess, setSendSuccess] = useState(false)
  const [telegramSendSuccess, setTelegramSendSuccess] = useState(false)
  const [showEmailAlert, setShowEmailAlert] = useState(true)
  const [showTelegramAlert, setShowTelegramAlert] = useState(true)

  const { data: emailSettings, isLoading: emailSettingsLoading } = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data } = await api.get<EmailSettings>('/stats/email')
      return data
    },
  })

  const { data: telegramSettings, isLoading: telegramSettingsLoading } = useQuery({
    queryKey: ['telegram-settings'],
    queryFn: async () => {
      const { data } = await api.get<TelegramSettings>('/stats/telegram')
      return data
    },
  })

  const { data: reportSettings } = useQuery({
    queryKey: ['report-settings'],
    queryFn: async () => {
      const { data } = await api.get<ReportSettings>('/stats/report')
      return data
    },
  })

  const sendEmailReportMutation = useMutation({
    mutationFn: async () => {
      const payload: SendReportPayload = {
        startDate,
        endDate,
        email,
        sendToEmail: true,
      }
      const { data } = await api.post('/stats/revenue/send-report', payload)
      return data
    },
    onSuccess: (data) => {
      setSendSuccess(true)
      toast({
        title: 'Отчет отправлен',
        description: data.message || `Отчет успешно отправлен на ${email}`,
      })
      setTimeout(() => {
        setShowEmailDialog(false)
        setSendSuccess(false)
        setEmail('')
      }, 2000)
    },
    onError: (error: AxiosError<{ error: string; results?: { email?: { error?: string } } }>) => {
      const emailError = error.response?.data?.results?.email?.error
      toast({
        title: 'Ошибка',
        description: emailError || error.response?.data?.error || 'Не удалось отправить отчет',
        variant: 'destructive',
      })
    },
  })

  const sendTelegramReportMutation = useMutation({
    mutationFn: async () => {
      const payload: SendReportPayload = {
        startDate,
        endDate,
        telegramChatId,
        sendToTelegram: true,
      }
      const { data } = await api.post('/stats/revenue/send-report', payload)
      return data
    },
    onSuccess: (data) => {
      setTelegramSendSuccess(true)
      toast({
        title: 'Отчет отправлен',
        description: data.message || 'Отчет успешно отправлен в Telegram',
      })
      setTimeout(() => {
        setShowTelegramDialog(false)
        setTelegramSendSuccess(false)
        setTelegramChatId('')
      }, 2000)
    },
    onError: (error: AxiosError<{ error: string; results?: { telegram?: { error?: string } } }>) => {
      const telegramError = error.response?.data?.results?.telegram?.error
      toast({
        title: 'Ошибка',
        description: telegramError || error.response?.data?.error || 'Не удалось отправить отчет',
        variant: 'destructive',
      })
    },
  })

  const handleSendEmailReport = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный email',
        variant: 'destructive',
      })
      return
    }
    sendEmailReportMutation.mutate()
  }

  const handleSendTelegramReport = () => {
    if (!telegramChatId) {
      toast({
        title: 'Ошибка',
        description: 'Введите Chat ID',
        variant: 'destructive',
      })
      return
    }
    sendTelegramReportMutation.mutate()
  }

  const isEmailConfigured = emailSettings?.enabled && emailSettings?.smtpUser
  const isTelegramConfigured = telegramSettings?.enabled && telegramSettings?.botToken

  if (emailSettingsLoading || telegramSettingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Отчеты</h1>
        <p className="text-muted-foreground">Отправка отчетов по электронной почте и Telegram</p>
      </div>

      {!isEmailConfigured && showEmailAlert && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 relative">
          <button
            onClick={() => setShowEmailAlert(false)}
            className="absolute top-4 right-4 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Отправка по почте не настроена
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Перейдите в <a href="/admin/settings" className="underline">Настройки</a>, чтобы настроить SMTP для отправки отчетов.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isTelegramConfigured && showTelegramAlert && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 relative">
          <button
            onClick={() => setShowTelegramAlert(false)}
            className="absolute top-4 right-4 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Отправка в Telegram не настроена
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Перейдите в <a href="/admin/settings" className="underline">Настройки</a>, чтобы настроить Telegram бота для отправки отчетов.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Отчет по выручке
          </CardTitle>
          <CardDescription>
            Сформируйте и отправьте отчет по выручке за выбранный период
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>С</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>По</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <p className="text-sm font-medium">Отчет будет содержать:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {reportSettings?.includeTotalRevenue && <li>• Общую выручку за период</li>}
              {reportSettings?.includeAppointmentsCount && <li>• Количество выполненных приёмов</li>}
              {reportSettings?.includeAverageCheck && <li>• Средний чек</li>}
              {reportSettings?.includeRevenueByService && <li>• Выручку по услугам</li>}
              {reportSettings?.includeRevenueByStaff && <li>• Выручку по сотрудникам</li>}
              {reportSettings?.includeDailyRevenue && <li>• Динамику по дням</li>}
              {!reportSettings?.includeTotalRevenue && 
               !reportSettings?.includeAppointmentsCount && 
               !reportSettings?.includeAverageCheck && 
               !reportSettings?.includeRevenueByService && 
               !reportSettings?.includeRevenueByStaff && 
               !reportSettings?.includeDailyRevenue && (
                <li className="text-amber-600 dark:text-amber-400">Ничего не выбрано. Настройте отчет в <a href="/admin/settings" className="underline">Настройках</a></li>
              )}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                setEmail(emailSettings?.reportEmail || '')
                setShowEmailDialog(true)
              }}
              disabled={!isEmailConfigured}
              variant="outline"
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              По почте
            </Button>
            <Button
              onClick={() => {
                setTelegramChatId(telegramSettings?.defaultChatId || '')
                setShowTelegramDialog(true)
              }}
              disabled={!isTelegramConfigured}
              variant="outline"
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              В Telegram
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Отправить отчет по почте
            </DialogTitle>
            <DialogDescription>
              Отчет по выручке за период с {format(new Date(startDate), 'd.MM.yyyy')} по {format(new Date(endDate), 'd.MM.yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {sendSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium">Отчет отправлен!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email получателя</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@mail.ru"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendEmailReport()}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEmailDialog(false)}
                  disabled={sendEmailReportMutation.isPending}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSendEmailReport}
                  disabled={sendEmailReportMutation.isPending || !email}
                >
                  {sendEmailReportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Отправить
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showTelegramDialog} onOpenChange={setShowTelegramDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Отправить отчет в Telegram
            </DialogTitle>
            <DialogDescription>
              Отчет по выручке за период с {format(new Date(startDate), 'd.MM.yyyy')} по {format(new Date(endDate), 'd.MM.yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {telegramSendSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 animate-in fade-in-0 zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium">Отчет отправлен!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="telegramChatId">Chat ID</Label>
                  <Input
                    id="telegramChatId"
                    type="text"
                    placeholder="-1001234567890"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendTelegramReport()}
                  />
                  <p className="text-xs text-muted-foreground">
                    ID чата или канала для отправки отчета
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowTelegramDialog(false)}
                  disabled={sendTelegramReportMutation.isPending}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSendTelegramReport}
                  disabled={sendTelegramReportMutation.isPending || !telegramChatId}
                >
                  {sendTelegramReportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Отправить
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
