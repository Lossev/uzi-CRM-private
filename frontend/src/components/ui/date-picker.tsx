import * as React from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  formatStr?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Выберите дату",
  disabled = false,
  className,
  formatStr = "d MMMM yyyy",
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            "h-11 px-4 rounded-xl",
            "border-input/50 bg-background/50 backdrop-blur-sm",
            "hover:bg-accent/50 hover:border-input",
            "transition-all duration-200",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
            !date && "text-muted-foreground/60",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/70" />
          {date ? (
            <span className="text-foreground">
              {format(date, formatStr, { locale: ru })}
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-2xl shadow-xl border-border/50"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  dateFrom?: Date
  dateTo?: Date
  onDateChange?: (range: { from?: Date; to?: Date }) => void
  placeholderFrom?: string
  placeholderTo?: string
  disabled?: boolean
  className?: string
  formatStr?: string
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateChange,
  placeholderFrom = "С",
  placeholderTo = "По",
  disabled = false,
  className,
  formatStr = "d MMM",
}: DateRangePickerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-start text-left font-normal flex-1",
              "h-10 px-3 rounded-xl text-sm",
              "border-input/50 bg-background/50 backdrop-blur-sm",
              "hover:bg-accent/50 hover:border-input",
              "transition-all duration-200",
              !dateFrom && "text-muted-foreground/60"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {dateFrom ? (
              format(dateFrom, formatStr, { locale: ru })
            ) : (
              placeholderFrom
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-2xl shadow-xl border-border/50"
          align="start"
        >
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={(date) => onDateChange?.({ from: date, to: dateTo })}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      
      <span className="text-muted-foreground/50 text-sm">—</span>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "justify-start text-left font-normal flex-1",
              "h-10 px-3 rounded-xl text-sm",
              "border-input/50 bg-background/50 backdrop-blur-sm",
              "hover:bg-accent/50 hover:border-input",
              "transition-all duration-200",
              !dateTo && "text-muted-foreground/60"
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {dateTo ? (
              format(dateTo, formatStr, { locale: ru })
            ) : (
              placeholderTo
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-2xl shadow-xl border-border/50"
          align="start"
        >
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={(date) => onDateChange?.({ from: dateFrom, to: date })}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
