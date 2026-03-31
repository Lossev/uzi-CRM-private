import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "relative p-4 bg-gradient-to-br from-card via-card to-card/95",
        "rounded-2xl border border-border/50 shadow-lg shadow-primary/5",
        "backdrop-blur-sm overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:rounded-2xl before:-z-10",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-semibold tracking-wide text-foreground/90 uppercase",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100",
          "rounded-full transition-all duration-200",
          "hover:bg-primary/10 hover:text-primary",
          "focus:ring-2 focus:ring-primary/30"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-1",
        head_cell:
          "text-muted-foreground rounded-lg w-10 font-semibold text-[0.7rem] uppercase tracking-wider",
        row: "flex w-full mt-1",
        cell: cn(
          "h-10 w-10 text-center text-sm p-0 relative",
          "[&:has([aria-selected])]:bg-primary/10",
          "[&:has([aria-selected].day-range-end)]:rounded-r-full",
          "[&:has([aria-selected].day-outside)]:bg-primary/5",
          "first:[&:has([aria-selected])]:rounded-l-full",
          "last:[&:has([aria-selected])]:rounded-r-full",
          "focus-within:relative focus-within:z-20"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal rounded-full",
          "transition-all duration-200 ease-out",
          "hover:bg-primary/15 hover:text-primary hover:scale-105",
          "focus:ring-2 focus:ring-primary/30 focus:bg-primary/10",
          "aria-selected:opacity-100 aria-selected:scale-100",
          "cursor-pointer select-none"
        ),
        day_range_end: "day-range-end rounded-r-full",
        day_selected: cn(
          "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "shadow-md shadow-primary/30 scale-105",
          "font-semibold"
        ),
        day_today: cn(
          "bg-accent text-accent-foreground",
          "font-semibold ring-2 ring-primary/20",
          "shadow-sm"
        ),
        day_outside: cn(
          "day-outside text-muted-foreground/40",
          "aria-selected:bg-primary/5 aria-selected:text-muted-foreground/60"
        ),
        day_disabled: "text-muted-foreground/30 cursor-not-allowed hover:scale-100 hover:bg-transparent",
        day_range_middle: cn(
          "aria-selected:bg-primary/10 aria-selected:text-foreground",
          "rounded-none"
        ),
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />,
        IconRight: () => <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
