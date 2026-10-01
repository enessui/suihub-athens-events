import {
  ROOM_OPEN,
  ROOM_CLOSE,
  addDays,
  formatMinute,
  formatRange,
  isWeekend,
} from '@/lib/meeting-room'

export type RoomSlot = {
  id: string
  date: string
  start: number
  end: number
  status: 'pending' | 'approved'
}

export const COLORS = {
  available: '#34D399',
  inUse: '#F87171',
  reserved: '#FBBF24',
  neutral: '#94A3B8',
}

export type Status = { label: string; detail: string; color: string }

/** What the room is doing right now, worded for someone glancing from the corridor. */
export function roomStatus(now: { date: string; minute: number }, today: RoomSlot[] | null): Status {
  if (isWeekend(now.date)) {
    return { label: 'Closed', detail: 'Bookable Monday to Friday, 10:00–18:00', color: COLORS.neutral }
  }
  if (now.minute >= ROOM_CLOSE) {
    let next = addDays(now.date, 1)
    while (isWeekend(next)) next = addDays(next, 1)
    const when =
      next === addDays(now.date, 1)
        ? 'tomorrow'
        : new Date(`${next}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })
    return { label: 'Closed', detail: `Bookable again ${when} from ${formatMinute(ROOM_OPEN)}`, color: COLORS.neutral }
  }
  if (!today) {
    return { label: 'Schedule unavailable', detail: 'Check the bookings page before using the room', color: COLORS.neutral }
  }
  if (now.minute < ROOM_OPEN) {
    const first = today[0]
    return {
      label: `Opens at ${formatMinute(ROOM_OPEN)}`,
      detail: first ? `First booking ${formatRange(first.start, first.end)}` : 'Nothing booked yet today',
      color: COLORS.neutral,
    }
  }

  const m = now.minute
  const current = today.find((b) => b.start <= m && m < b.end)

  if (current) {
    // Follow back-to-back bookings, so "until" is when the room actually frees up.
    let until = current.end
    for (const b of today) if (b.start === until) until = b.end
    const isPending = current.status === 'pending'
    return {
      label: isPending ? 'Reserved' : 'In use',
      detail: `Until ${formatMinute(until)}${isPending ? ' · awaiting approval' : ''}`,
      color: isPending ? COLORS.reserved : COLORS.inUse,
    }
  }

  const next = today.find((b) => b.start > m)
  return {
    label: 'Available',
    detail: next ? `Free until ${formatMinute(next.start)}` : 'Free for the rest of the day',
    color: COLORS.available,
  }
}
