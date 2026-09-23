import { SPACE_TIME_ZONE } from '@/lib/events'

// Times are minutes since midnight, Athens time: 10:30 is 630.

/** When the room can first be booked, and when the last booking must end. */
export const ROOM_OPEN = 10 * 60
export const ROOM_CLOSE = 18 * 60

/** Start times are offered on this grid. */
export const START_STEP = 30

/** Lengths a coworker can pick. Ones that don't fit the day are hidden. */
export const DURATIONS = [30, 60, 90, 120, 180, 240, 360, 480]

export type BookingStatus = 'pending' | 'approved' | 'declined'

export type MeetingBooking = {
  id: string
  date: string
  start_minute: number
  end_minute: number
  status: BookingStatus
  name: string
  email: string
  topic: string | null
  created_at: string
}

export function formatMinute(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function formatRange(start: number, end: number): string {
  return `${formatMinute(start)}–${formatMinute(end)}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = minutes / 60
  return `${h} ${h === 1 ? 'hour' : 'hours'}`
}

/** "Tuesday 24 September" */
export function formatDay(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

/** Day of week for a YYYY-MM-DD string, 0 = Sunday. Independent of the viewer's timezone. */
function dayOfWeek(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay()
}

export function isWeekend(date: string): boolean {
  const d = dayOfWeek(date)
  return d === 0 || d === 6
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Today's date and the current minute, in Athens, wherever this code runs. */
export function athensNow(): { date: string; minute: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: SPACE_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minute: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

/**
 * The first date worth showing: today, unless it's a weekend or too late to
 * fit even the shortest booking, in which case the next weekday.
 */
export function firstBookableDate(): string {
  const now = athensNow()
  let date = now.date
  if (now.minute > ROOM_CLOSE - DURATIONS[0]) date = addDays(date, 1)
  while (isWeekend(date)) date = addDays(date, 1)
  return date
}

/** Earliest start still bookable on `date`: opening time, or later if it's today. */
export function earliestStart(date: string): number {
  const now = athensNow()
  if (date !== now.date) return ROOM_OPEN
  // Round up to the next start on the grid.
  const next = Math.ceil((now.minute + 1) / START_STEP) * START_STEP
  return Math.max(ROOM_OPEN, next)
}

/** Bookings that still hold the room: pending requests and approved ones. */
export function isLive(b: Pick<MeetingBooking, 'status'>): boolean {
  return b.status === 'pending' || b.status === 'approved'
}

function overlaps(start: number, end: number, b: Pick<MeetingBooking, 'start_minute' | 'end_minute'>) {
  return start < b.end_minute && b.start_minute < end
}

/** Start times on the grid that aren't inside an existing booking. */
export function availableStarts(
  date: string,
  bookings: Pick<MeetingBooking, 'start_minute' | 'end_minute' | 'status'>[],
): number[] {
  const live = bookings.filter(isLive)
  const starts: number[] = []
  for (let m = earliestStart(date); m + DURATIONS[0] <= ROOM_CLOSE; m += START_STEP) {
    if (!live.some((b) => overlaps(m, m + DURATIONS[0], b))) starts.push(m)
  }
  return starts
}

/** Lengths that fit between `start` and closing without running into a booking. */
export function availableDurations(
  start: number,
  bookings: Pick<MeetingBooking, 'start_minute' | 'end_minute' | 'status'>[],
): number[] {
  const live = bookings.filter(isLive)
  return DURATIONS.filter(
    (d) => start + d <= ROOM_CLOSE && !live.some((b) => overlaps(start, start + d, b)),
  )
}
