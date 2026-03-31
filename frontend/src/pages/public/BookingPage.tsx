import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { format, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  ChevronRight,
  Stethoscope,
  Shield,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import api from '@/lib/api'
import { Service } from '@/types'
import { useToast } from '@/hooks/use-toast'

const CLINIC_INFO = {
  name: 'УЗИ Диагностика',
  address: 'ул. Ленина, 45, офис 203',
  phone: '+7 (999) 123-45-67',
  workHours: 'Пн-Пт: 9:00–20:00, Сб: 10:00–18:00',
}

export default function BookingPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<number>()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedSlot, setSelectedSlot] = useState<string>()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [showContactInfo, setShowContactInfo] = useState(false)

  const { data: services } = useQuery({
    queryKey: ['public-services'],
    queryFn: async () => {
      const { data } = await api.get<Service[]>('/public/services')
      return data
    },
  })

  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', selectedDate, selectedService],
    queryFn: async () => {
      if (!selectedDate || !selectedService) return { slots: [] }
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const { data } = await api.get<{ slots: string[] }>(
        `/public/slots?date=${dateStr}&serviceId=${selectedService}`
      )
      return data
    },
    enabled: !!selectedDate && !!selectedService,
  })

  const bookingMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/public/book', {
        name,
        phone,
        serviceId: selectedService,
        date: selectedSlot,
      })
      return data
    },
    onSuccess: () => {
      setStep(4)
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ error?: string }>
      toast({
        title: 'Ошибка',
        description: axiosError.response?.data?.error || 'Не удалось записаться',
        variant: 'destructive',
      })
    },
  })

  const selectedServiceData = services?.find((s) => s.id === selectedService)

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      })
      return
    }
    bookingMutation.mutate()
  }

  const resetForm = () => {
    setStep(1)
    setSelectedService(undefined)
    setSelectedDate(undefined)
    setSelectedSlot(undefined)
    setName('')
    setPhone('')
  }

  const steps = [
    { number: 1, label: 'Услуга' },
    { number: 2, label: 'Дата' },
    { number: 3, label: 'Контакты' },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col pb-safe">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm">
                <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-base sm:text-lg">{CLINIC_INFO.name}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Запись на приём онлайн</p>
              </div>
            </div>
            
            <a
              href={`tel:${CLINIC_INFO.phone}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary hidden sm:inline">{CLINIC_INFO.phone}</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-4 sm:py-8 w-full">
        {step < 4 && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              {steps.map((s, index) => (
                <div key={s.number} className="flex items-center">
                  <button
                    onClick={() => s.number < step && setStep(s.number)}
                    disabled={s.number >= step}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full transition-all',
                      step === s.number && 'bg-primary text-primary-foreground shadow-md shadow-primary/20',
                      step > s.number && 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20',
                      step < s.number && 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <span className={cn(
                      'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                      step >= s.number ? 'bg-background/20' : 'bg-muted'
                    )}>
                      {step > s.number ? (
                        <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      ) : (
                        s.number
                      )}
                    </span>
                    <span className="text-xs sm:text-sm font-medium hidden xs:inline">{s.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'w-4 sm:w-8 h-0.5 mx-1 rounded-full transition-colors',
                      step > s.number ? 'bg-primary' : 'bg-muted'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-1">Выберите услугу</h2>
                  <p className="text-muted-foreground text-sm">
                    Выберите вид УЗИ-исследования
                  </p>
                </div>
                <div className="grid gap-2.5 sm:gap-3">
                  {services?.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service.id)
                        setStep(2)
                      }}
                      className={cn(
                        'group p-3.5 sm:p-4 rounded-xl border bg-card text-left transition-all',
                        'hover:border-primary/50 hover:shadow-md hover:shadow-primary/5',
                        'active:scale-[0.99]',
                        selectedService === service.id && 'border-primary ring-1 ring-primary/50'
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium group-hover:text-primary transition-colors text-sm sm:text-base">
                            {service.name}
                          </div>
                          {service.description && (
                            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                              {service.description}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              {service.duration} мин
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-base sm:text-lg font-semibold text-primary">
                            {formatPrice(service.price)}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 self-center" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-1">Выберите дату и время</h2>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {selectedServiceData?.name} — {formatPrice(selectedServiceData?.price || 0)}
                  </p>
                </div>

                <Card variant="glass" className="overflow-hidden">
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setSelectedSlot(undefined)
                        }}
                        disabled={(date) => date < startOfDay(new Date())}
                        locale={ru}
                        className="scale-[0.85] sm:scale-100 origin-top"
                      />
                    </div>
                  </CardContent>
                </Card>

                {selectedDate && (
                  <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Label className="text-xs sm:text-sm font-medium">Доступное время</Label>
                    {slotsLoading ? (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground">
                        <div className="animate-pulse flex justify-center">
                          <div className="h-4 w-20 bg-muted rounded" />
                        </div>
                      </div>
                    ) : slots?.slots?.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
                        Нет свободных слотов на эту дату
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-2">
                        {slots?.slots?.map((slot) => {
                          const isSelected = selectedSlot === slot
                          return (
                            <button
                              key={slot}
                              onClick={() => {
                                setSelectedSlot(slot)
                                setStep(3)
                              }}
                              className={cn(
                                'py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl border text-xs sm:text-sm font-medium transition-all',
                                'active:scale-95',
                                isSelected
                                  ? 'bg-gradient-to-b from-primary to-primary/90 text-primary-foreground border-primary shadow-md shadow-primary/20'
                                  : 'bg-card hover:border-primary/50 hover:bg-accent/50'
                              )}
                            >
                              {format(new Date(slot), 'HH:mm')}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)} 
                  className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
                  Назад к услугам
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-1">Ваши контакты</h2>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {selectedServiceData?.name} • {selectedDate && format(selectedDate, 'd MMMM', { locale: ru })} • {selectedSlot && format(new Date(selectedSlot), 'HH:mm')}
                  </p>
                </div>

                <Card variant="glass">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs sm:text-sm">Ваше имя</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Иван Иванов"
                        inputSize="lg"
                        className="text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs sm:text-sm">Номер телефона</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+7 (999) 123-45-67"
                        type="tel"
                        inputSize="lg"
                        className="text-base"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(2)} 
                        className="w-full sm:w-auto order-2 sm:order-1"
                        size="lg"
                      >
                        Назад
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={bookingMutation.isPending}
                        className="w-full sm:flex-1 order-1 sm:order-2"
                        size="lg"
                      >
                        {bookingMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Запись...
                          </span>
                        ) : (
                          'Записаться'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 4 && (
              <Card variant="glass" className="text-center animate-in fade-in-0 zoom-in-95 duration-300">
                <CardContent className="p-6 sm:p-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/10">
                    <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">Запись подтверждена!</h2>
                  <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                    {selectedServiceData?.name}<br />
                    {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: ru })} в {selectedSlot && format(new Date(selectedSlot), 'HH:mm')}
                  </p>
                  <div className="bg-muted/30 rounded-xl p-4 mb-6 text-sm text-left border border-border/30">
                    <p className="font-medium mb-2 text-xs uppercase tracking-wider text-muted-foreground">Информация</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Мы отправим SMS-напоминание за день до приёма. Пожалуйста, приходите за 10 минут до назначенного времени.
                    </p>
                  </div>
                  <Button onClick={resetForm} variant="outline" size="lg" className="w-full sm:w-auto">
                    Записать ещё
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="hidden lg:block space-y-4">
            <Card variant="glass">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Контакты</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Адрес</p>
                      <p className="text-muted-foreground">{CLINIC_INFO.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Телефон</p>
                      <a href={`tel:${CLINIC_INFO.phone}`} className="text-primary hover:underline">
                        {CLINIC_INFO.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Время работы</p>
                      <p className="text-muted-foreground">{CLINIC_INFO.workHours}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="outline">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Современное оборудование</p>
                    <p className="text-muted-foreground text-xs">Экспертный класс</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">Опытные специалисты</p>
                    <p className="text-muted-foreground text-xs">Стаж от 10 лет</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="lg:hidden mt-4 sm:mt-6">
          <button
            onClick={() => setShowContactInfo(!showContactInfo)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-card border hover:bg-accent/30 transition-colors"
          >
            <span className="font-medium text-sm">Контактная информация</span>
            {showContactInfo ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          {showContactInfo && (
            <div className="mt-2 p-4 rounded-xl bg-card border space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Адрес</p>
                  <p className="text-muted-foreground">{CLINIC_INFO.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Телефон</p>
                  <a href={`tel:${CLINIC_INFO.phone}`} className="text-primary hover:underline">
                    {CLINIC_INFO.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Время работы</p>
                  <p className="text-muted-foreground">{CLINIC_INFO.workHours}</p>
                </div>
              </div>
              
              <div className="pt-3 mt-3 border-t space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span>Современное оборудование</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Heart className="h-4 w-4 text-primary shrink-0" />
                  <span>Опытные специалисты</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t bg-card/50 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col xs:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} {CLINIC_INFO.name}</p>
            <a 
              href={`tel:${CLINIC_INFO.phone}`} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              {CLINIC_INFO.phone}
            </a>
          </div>
        </div>
      </footer>

      {step < 4 && selectedServiceData && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-lg border-t lg:hidden safe-area-bottom">
          <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {selectedServiceData?.name}
              </p>
              <p className="font-semibold text-primary">
                {formatPrice(selectedServiceData?.price || 0)}
              </p>
            </div>
            {step < 3 && (
              <Button size="lg" className="shrink-0">
                {step === 1 ? 'Далее' : step === 2 ? 'Контакты' : 'Записаться'}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
