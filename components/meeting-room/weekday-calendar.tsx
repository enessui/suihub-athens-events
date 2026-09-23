'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isWeekend } from '@/lib/meeting-room'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

// Dates are handled as YYYY-MM-DD strings in UTC so the grid never shifts by a
// day depending on the viewer's timezone.
function iso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
}

/**
 * Month grid where weekends and past days can't be picked. Monday-first, as is
 * usual in Greece.
 */
export function WeekdayCalendar({
  value,
  onChange,
  minDate,
}: {
  value: string
  onChange: (date: string) => void
  minDate: string
}) {
  const [view, setView] = useState(() => {
    const [y, m] = value.split('-').map(Number)
    return { year: y, month: m - 1 }
  })

  const first = new Date(Date.UTC(view.year, view.month, 1))
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate()
  const leadingBlanks = (first.getUTCDay() + 6) % 7 // Monday = 0

  const minMonth = minDate.slice(0, 7)
  const viewMonth = iso(view.year, view.month, 1).slice(0, 7)
  const canGoBack = viewMonth > minMonth

  function shift(delta: number) {
    setView(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1))
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
    })
  }

  const cells: (string | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => iso(view.year, view.month, i + 1)),
  ]

  return (
    <div className="w-full max-w-[18rem] select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold">
          {first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
        </p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span
            key={d}
            className={cn('pb-1 text-xs font-medium text-muted-foreground', i >= 5 && 'opacity-50')}
          >
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />
          const weekend = isWeekend(date)
          const disabled = weekend || date < minDate
          const selected = date === value
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onChange(date)}
              aria-pressed={selected}
              aria-label={new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'UTC',
              })}
              title={weekend ? 'Closed on weekends' : undefined}
              className={cn(
                'flex aspect-square items-center justify-center rounded-md text-sm transition-colors',
                selected
                  ? 'bg-primary font-semibold text-primary-foreground'
                  : 'hover:bg-primary/10',
                disabled && 'pointer-events-none text-muted-foreground/40',
                weekend && 'line-through decoration-muted-foreground/30',
                date === minDate && !selected && 'font-semibold text-primary',
              )}
            >
              {Number(date.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
