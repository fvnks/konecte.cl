
"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale" // Import Spanish locale
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date | null; // Allow null for optional date
  onChange: (date?: Date) | ((date?: Date) => void); // Allow undefined for clearing date
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, placeholder = "Selecciona una fecha", disabled }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value || undefined);

  React.useEffect(() => {
    setDate(value || undefined);
  }, [value]);

  const handleDateChange = (selectedDate?: Date) => {
    setDate(selectedDate);
    if (typeof onChange === 'function') {
      onChange(selectedDate);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
          locale={es} // Set locale for calendar
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
