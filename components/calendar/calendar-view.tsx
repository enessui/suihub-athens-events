'use client'

import { useMemo, useRef, useState, useTransition, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EventDialog } from './event-dialog'
import { EventFormDialog } from '@/components/admin/event-form-dialog'
import { deleteEvent } from '@/app/admin/actions'
import {
  categoryStyle,
  dayKey,
  eventDayKey,
  EVENT_CATEGORIES,
  formatEventTime,
  type EventRow,
} from '@/lib/events'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildCalendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay()) // back to Sunday
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

// The 7 days (Sun–Sat) of the week containing `anchor`.
function buildWeekDays(anchor: Date): Date[] {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())
  start.setDate(start.getDate() - start.getDay())
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

export function CalendarView({ events, isAdmin }: { events: EventRow[], isAdmin?: boolean }) {
  const today = new Date()
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selected, setSelected] = useState<EventRow | null>(null)
  const [editing, setEditing] = useState<EventRow | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [newEventDate, setNewEventDate] = useState<string | undefined>(undefined)
  const [deleting, setDeleting] = useState<EventRow | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [view, setView] = useState<'month' | 'week'>('month')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      sectionRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  function confirmDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteEvent(deleting.id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Event deleted')
        setDeleting(null)
      }
    })
  }

  type DayEntry = { ev: EventRow; isStart: boolean; isEnd: boolean; multi: boolean }

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEntry[]>()
    for (const ev of events) {
      const startKey = eventDayKey(ev.start_time)
      const endKey = ev.end_time ? eventDayKey(ev.end_time) : startKey
      const multi = endKey > startKey
      const start = new Date(`${startKey}T00:00:00`)
      const end = new Date(`${endKey}T00:00:00`)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = dayKey(d)
        const list = map.get(key) ?? []
        list.push({ ev, isStart: key === startKey, isEnd: key === endKey, multi })
        map.set(key, list)
      }
    }
    for (const list of map.values()) {
      // Multi-day bars first so they line up across cells, then by start time
      list.sort(
        (a, b) =>
          Number(b.multi) - Number(a.multi) ||
          a.ev.start_time.localeCompare(b.ev.start_time),
      )
    }
    return map
  }, [events])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const isWeek = view === 'week'
  const days = useMemo(
    () => (isWeek ? buildWeekDays(cursor) : buildCalendarDays(year, month)),
    [isWeek, cursor, year, month],
  )
  const todayKey = dayKey(today)

  // Header label + event count for the current view
  const periodLabel = isWeek
    ? (() => {
        const first = days[0]
        const last = days[6]
        const sameMonth = first.getMonth() === last.getMonth()
        const l = first.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const r = last.toLocaleDateString('en-US', {
          month: sameMonth ? undefined : 'short',
          day: 'numeric',
          year: 'numeric',
        })
        return `${l} – ${r}`
      })()
    : cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const periodCount = isWeek
    ? (() => {
        const keys = new Set(days.map(dayKey))
        return events.filter((e) => keys.has(eventDayKey(e.start_time))).length
      })()
    : events.filter((e) =>
        eventDayKey(e.start_time).startsWith(`${year}-${String(month + 1).padStart(2, '0')}`),
      ).length

  function goPrev() {
    setCursor((c) =>
      isWeek
        ? new Date(c.getFullYear(), c.getMonth(), c.getDate() - 7)
        : new Date(c.getFullYear(), c.getMonth() - 1, 1),
    )
  }
  function goNext() {
    setCursor((c) =>
      isWeek
        ? new Date(c.getFullYear(), c.getMonth(), c.getDate() + 7)
        : new Date(c.getFullYear(), c.getMonth() + 1, 1),
    )
  }
  function goToday() {
    setCursor(
      isWeek
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
        : new Date(today.getFullYear(), today.getMonth(), 1),
    )
  }

  return (
    <section
      ref={sectionRef}
      className={`flex flex-col gap-6 ${isFullscreen ? 'bg-background p-6 overflow-y-auto' : ''}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight">
            {periodLabel}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodCount === 0
              ? `No events scheduled this ${isWeek ? 'week' : 'month'} yet.`
              : `${periodCount} event${periodCount === 1 ? '' : 's'} happening this ${isWeek ? 'week' : 'month'}.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month / Week toggle */}
          <div className="mr-1 flex h-9 items-stretch rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView('month')}
              className={`flex items-center rounded-md px-3 text-sm font-medium transition-colors ${
                view === 'month' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setView('week')}
              className={`flex items-center rounded-md px-3 text-sm font-medium transition-colors ${
                view === 'week' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week
            </button>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label={isWeek ? 'Previous week' : 'Previous month'}
            onClick={goPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" onClick={goToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={isWeek ? 'Next week' : 'Next month'}
            onClick={goNext}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {EVENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all ${categoryStyle(cat)} ${
              activeCategory && activeCategory !== cat
                ? 'opacity-30'
                : activeCategory === cat
                  ? 'ring-2 ring-offset-1 ring-current scale-105'
                  : ''
            }`}
          >
            {cat}
          </button>
        ))}
        {activeCategory && (
          <button
            type="button"
            onClick={() => setActiveCategory(null)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = dayKey(day)
            const inMonth = isWeek || day.getMonth() === month
            const dayEvents = eventsByDay.get(key) ?? []
            const isToday = key === todayKey
            const isPast = key < todayKey
            const isWeekend = day.getDay() === 0 || day.getDay() === 6
            return (
              <div
                key={key}
                className={`border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0 ${
                  isWeek ? 'min-h-64 sm:min-h-96' : 'min-h-28 sm:min-h-36'
                } ${
                  isPast && !isWeekend ? 'bg-chart-1/15' : isWeekend ? 'bg-muted/50' : inMonth ? 'bg-transparent' : 'bg-muted/30'
                }`}
                style={isWeekend ? {
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.04) 6px, rgba(0,0,0,0.04) 7px)'
                } : undefined}
              >
                <div className="mb-1 flex justify-end">
                  {isAdmin ? (
                    <button
                      type="button"
                      title="Add event"
                      onClick={() => {
                        setEditing(null)
                        const d = new Date(day)
                        d.setHours(10, 0, 0, 0)
                        const pad = (n: number) => String(n).padStart(2, '0')
                        const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T10:00`
                        setNewEventDate(dateStr)
                        setFormOpen(true)
                      }}
                      className={`flex size-6 items-center justify-center rounded-full text-xs transition-colors hover:bg-primary hover:text-primary-foreground ${
                        isToday
                          ? 'bg-primary font-semibold text-primary-foreground'
                          : isPast || !inMonth
                            ? 'text-muted-foreground/60'
                            : isWeekend
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  ) : (
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-xs ${
                        isToday
                          ? 'bg-primary font-semibold text-primary-foreground'
                          : isPast || !inMonth
                            ? 'text-muted-foreground/60'
                            : isWeekend
                              ? 'text-muted-foreground'
                              : 'text-foreground'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {/* Multi-day events as connected bars */}
                  {dayEvents
                    .filter((e) => e.multi)
                    .map(({ ev, isStart, isEnd }) => {
                      const isWeekStart = day.getDay() === 0
                      const showLabel = isStart || isWeekStart
                      const barShape = `${isStart ? 'rounded-l' : '-ml-1.5 rounded-l-none border-l-0'} ${
                        isEnd ? 'rounded-r' : '-mr-1.5 rounded-r-none border-r-0'
                      }`
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelected(ev)}
                          className={`truncate border px-1.5 py-0.5 text-left text-[11px] leading-tight transition-all hover:opacity-80 ${barShape} ${categoryStyle(ev.category)} ${
                            activeCategory && activeCategory !== ev.category ? 'opacity-20' : ''
                          }`}
                          title={ev.title}
                        >
                          {showLabel ? ev.title : ' '}
                        </button>
                      )
                    })}
                  {/* Single-day events as compact chips: small icon + title */}
                  <div className="flex flex-col gap-0.5">
                    {dayEvents
                      .filter((e) => !e.multi)
                      .slice(0, isWeek ? 20 : 3)
                      .map(({ ev }) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelected(ev)}
                          title={ev.title}
                          className={`flex w-full items-start gap-1.5 rounded px-1 py-0.5 text-left transition-all hover:bg-muted ${
                            activeCategory && activeCategory !== ev.category ? 'opacity-20' : ''
                          }`}
                        >
                          <span
                            className={`relative mt-0.5 block size-5 sm:size-6 shrink-0 overflow-hidden rounded border ${categoryStyle(ev.category)}`}
                          >
                            {ev.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={ev.image_url}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold">
                                {ev.title.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1 line-clamp-2 text-xs sm:text-sm leading-tight text-foreground">
                            <span className="hidden font-medium text-muted-foreground sm:inline">
                              {formatEventTime(ev.start_time, null)}{' '}
                            </span>
                            {ev.title}
                          </span>
                        </button>
                      ))}
                    {!isWeek && dayEvents.filter((e) => !e.multi).length > 3 && (
                      <button
                        type="button"
                        onClick={() => setSelected(dayEvents.filter((e) => !e.multi)[3].ev)}
                        className="px-1 text-left text-xs text-muted-foreground hover:text-foreground"
                      >
                        +{dayEvents.filter((e) => !e.multi).length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <EventDialog
        event={selected}
        onClose={() => setSelected(null)}
        isAdmin={isAdmin}
        onEdit={(ev) => {
          setSelected(null)
          setEditing(ev)
          setFormOpen(true)
        }}
        onDelete={(ev) => {
          setSelected(null)
          setDeleting(ev)
        }}
      />

      <EventFormDialog
        key={editing?.id ?? newEventDate ?? 'new'}
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setNewEventDate(undefined) }}
        event={editing}
        defaultDate={newEventDate}
      />

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleting?.title}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
