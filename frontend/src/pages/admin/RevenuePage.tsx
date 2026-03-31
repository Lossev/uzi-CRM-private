import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, TrendingUp, Calendar, Mail, Loader2, CheckCircle, Send } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import api from '@/lib/api'
import { RevenueStats } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { AxiosError } from 'axios'

interface SendReportPayload {
  startDate: string
  endDate: string
  email?: string
  sendToEmail?: boolean
  telegramChatId?: string
  sendToTelegram?: boolean
}

export default function RevenuePage() {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [email, setEmail] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [sendToEmail, setSendToEmail] = useState(true)
  const [sendToTelegram, setSendToTelegram] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['revenue-stats', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get<RevenueStats>('/stats/revenue', {
        params: { startDate, endDate },
      })
      return data
    },
  })

  const sendReportMutation = useMutation({
    mutationFn: async () => {
      const payload: SendReportPayload = {
        startDate,
        endDate,
      }
      if (sendToEmail && email) {
        payload.email = email
        payload.sendToEmail = true
      }
      if (sendToTelegram && telegramChatId) {
        payload.telegramChatId = telegramChatId
        payload.sendToTelegram = true
      }
      const { data } = await api.post('/stats/revenue/send-report', payload)
      return data
    },
    onSuccess: (data) => {
      setSendSuccess(true)
      const destinations: string[] = []
      if (sendToEmail && email) destinations.push(`на ${email}`)
      if (sendToTelegram && telegramChatId) destinations.push('в Telegram')
      toast({
        title: 'Отчет отправлен',
        description: data.message || `Отчет успешно отправлен ${destinations.join(' и ')}`,
      })
      setTimeout(() => {
        setShowEmailDialog(false)
        setSendSuccess(false)
        setEmail('')
        setTelegramChatId('')
        setSendToEmail(true)
        setSendToTelegram(false)
      }, 2000)
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.error || 'Не удалось отправить отчет',
        variant: 'destructive',
      })
    },
  })

  const handleSendReport = () => {
    if (sendToEmail && (!email || !email.includes('@'))) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный email',
        variant: 'destructive',
      })
      return
    }
    if (sendToTelegram && !telegramChatId.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите Telegram Chat ID',
        variant: 'destructive',
      })
      return
    }
    if (!sendToEmail && !sendToTelegram) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы один способ отправки',
        variant: 'destructive',
      })
      return
    }
    sendReportMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Учёт выручки</h1>
        <Button
          onClick={() => setShowEmailDialog(true)}
          variant="outline"
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Отправить отчет
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>С</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="space-y-2">
          <Label>По</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Выполненных приёмов</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointmentsCount || 0}</div>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(
                stats?.appointmentsCount
                  ? stats.totalRevenue / stats.appointmentsCount
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Выручка по услугам</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Услуга</TableHead>
                    <TableHead className="text-right">Выручка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.revenueByService?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Нет данных
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats?.revenueByService?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatPrice(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Выручка по сотрудникам</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сотрудник</TableHead>
                    <TableHead className="text-right">Выручка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.revenueByStaff?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Нет данных
                      </TableCell>
                    </TableRow>
                  ) : (
                    stats?.revenueByStaff?.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatPrice(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Динамика выручки</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {stats?.chartData?.slice().reverse().map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-accent/30 transition-colors"
                >
                  <span className="text-muted-foreground">
                    {format(new Date(item.date), 'd MMMM', { locale: ru })}
                  </span>
                  <span className="font-semibold text-primary">{formatPrice(item.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Отправить отчет
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
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendToEmail"
                      checked={sendToEmail}
                      onCheckedChange={setSendToEmail}
                    />
                    <Label htmlFor="sendToEmail" className="cursor-pointer flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Отправить на email
                    </Label>
                  </div>
                  {sendToEmail && (
                    <Input
                      type="email"
                      placeholder="example@mail.ru"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReport()}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendToTelegram"
                      checked={sendToTelegram}
                      onCheckedChange={setSendToTelegram}
                    />
                    <Label htmlFor="sendToTelegram" className="cursor-pointer flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Отправить в Telegram
                    </Label>
                  </div>
                  {sendToTelegram && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Chat ID или @username"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReport()}
                      />
                      <p className="text-xs text-muted-foreground">
                        Введите Chat ID (число) или @username группы/канала
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  <p className="text-sm font-medium">Отчет будет содержать:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Общую выручку за период</li>
                    <li>• Количество выполненных приёмов</li>
                    <li>• Средний чек</li>
                    <li>• Выручку по услугам</li>
                    <li>• Выручку по сотрудникам</li>
                    <li>• Динамику по дням</li>
                  </ul>
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailDialog(false)}
                  disabled={sendReportMutation.isPending}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSendReport}
                  disabled={sendReportMutation.isPending || (!sendToEmail && !sendToTelegram) || (sendToEmail && !email) || (sendToTelegram && !telegramChatId)}
                >
                  {sendReportMutation.isPending ? (
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
