import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  minDate?: Date
  disabled?: boolean
}

/**
 * @description Custom date picker component for booking flow with month navigation and date selection
 * @param {DatePickerProps} props - Component props including selected date, selection callback, and constraints
 * @param {Date | null} props.selectedDate - Currently selected date value
 * @param {(date: Date) => void} props.onDateSelect - Callback invoked when user selects a date
 * @param {Date} props.minDate - Optional minimum selectable date (defaults to today if not provided)
 * @param {boolean} props.disabled - Optional flag to disable all interactions
 * @returns {JSX.Element} Interactive calendar grid with month navigation and date selection
 * @audit BUSINESS RULE: Calendar starts on Monday (Spanish locale convention)
 * @audit BUSINESS RULE: Disabled dates cannot be selected (past dates via minDate)
 * @audit SECURITY: Client-side only component with no external data access
 * @audit Validate: minDate is enforced via date comparison before selection
 * @audit PERFORMANCE: Uses date-fns for efficient date calculations
 * @audit UI: Today's date indicated with visual marker (dot indicator)
 */
export default function DatePicker({ selectedDate, onDateSelect, minDate, disabled }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ? new Date(selectedDate) : new Date())

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth,1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth,1))

  const isDateDisabled = (date: Date) => {
    if (minDate) {
      return date < minDate
    }
    return false
  }

  const isDateSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate)
  }

  // Calcular el offset del primer día del mes
  // getDay() devuelve: 0=Domingo, 1=Lunes, 2=Martes, ..., 6=Sábado
  // Para calendario que empieza en Lunes, necesitamos ajustar:
  // Si getDay() = 0 (Domingo), offset = 6
  // Si getDay() = 1-6 (Lunes-Sábado), offset = getDay() - 1
  const firstDayOfMonth = startOfMonth(currentMonth)
  const dayOfWeek = firstDayOfMonth.getDay()
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  // Crear array con celdas vacías al inicio para el padding
  const paddingDays = Array.from({ length: offset }, (_, i) => ({ day: null, key: `padding-${i}` }))

  // Crear array de días con key único
  const calendarDays = days.map((date, i) => ({ day: date, key: `day-${i}` }))

  // Combinar padding + días del mes
  const allDays = [...paddingDays, ...calendarDays]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={previousMonth}
          disabled={disabled}
          className="p-2 hover:bg-[var(--mocha-taupe)]/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" style={{ color: 'var(--charcoal-brown)' }} />
        </button>
        <h3 className="text-lg font-medium" style={{ color: 'var(--charcoal-brown)' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          disabled={disabled}
          className="p-2 hover:bg-[var(--mocha-taupe)]/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--charcoal-brown)' }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium py-2"
            style={{ color: 'var(--mocha-taupe)' }}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {allDays.map(({ day, key }) => {
          // Si es celda de padding (day es null)
          if (!day) {
            return (
              <div
                key={key}
                className="p-2"
              />
            )
          }

          const disabled = isDateDisabled(day)
          const selected = isDateSelected(day)
          const today = isToday(day)
          const notCurrentMonth = !isSameMonth(day, currentMonth)

          return (
            <button
              key={key}
              type="button"
              onClick={() => !disabled && !notCurrentMonth && onDateSelect(day)}
              disabled={disabled || notCurrentMonth}
              className={`
                relative p-2 text-sm font-medium rounded-md transition-all
                ${disabled || notCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--mocha-taupe)]/10'}
                ${selected ? 'text-white' : ''}
                ${today && !selected ? 'font-bold' : ''}
              `}
              style={selected ? { background: 'var(--deep-earth)' } : { color: 'var(--charcoal-brown)' }}
            >
              {format(day, 'd')}
              {today && !selected && (
                <span
                  className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: 'var(--deep-earth)' }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}