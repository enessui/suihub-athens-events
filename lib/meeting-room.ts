// The meeting room is booked in fixed two-hour blocks.
// Values are block start hours: 10–12, 12–14, 14–16, 16–18.
export const MEETING_HOURS = [10, 12, 14, 16]

export const MEETING_BLOCK_HOURS = 2

export type MeetingBooking = {
  id: string
  date: string
  hour: number
  name: string
  email: string
  topic: string | null
  created_at: string
}

export function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00 – ${String(h + MEETING_BLOCK_HOURS).padStart(2, '0')}:00`
}
