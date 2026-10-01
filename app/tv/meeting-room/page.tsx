import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { qrSvg } from '@/lib/qr'
import { addDays, athensNow, isWeekend } from '@/lib/meeting-room'
import { RoomDisplay, type RoomSlot } from '@/components/tv/room-display'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Meeting Room · SuiHub Athens',
  robots: { index: false },
}

/** Today plus this many following weekdays are shown. */
const UPCOMING_DAYS = 4

// Times and status only. This screen hangs in a shared space, so names, emails
// and topics are never selected, let alone sent to the page.
async function loadSchedule(from: string, to: string): Promise<RoomSlot[] | null> {
  try {
    const { data, error } = await createAdminClient()
      .from('meeting_room_bookings')
      .select('id, date, start_minute, end_minute, status')
      .gte('date', from)
      .lte('date', to)
      .in('status', ['pending', 'approved'])
      .order('date', { ascending: true })
      .order('start_minute', { ascending: true })
    if (error) return null
    return (data ?? []).map((b) => ({
      id: b.id as string,
      date: b.date as string,
      start: b.start_minute as number,
      end: b.end_minute as number,
      status: b.status as RoomSlot['status'],
    }))
  } catch {
    return null
  }
}

export default async function MeetingRoomTvPage() {
  const now = athensNow()

  const days = [now.date]
  for (let d = addDays(now.date, 1); days.length <= UPCOMING_DAYS; d = addDays(d, 1)) {
    if (!isWeekend(d)) days.push(d)
  }

  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'

  const [schedule, qr] = await Promise.all([
    loadSchedule(days[0], days[days.length - 1]),
    host ? qrSvg(`${proto}://${host}/meeting-room`) : Promise.resolve(null),
  ])

  return <RoomDisplay schedule={schedule} days={days} initialNow={now} qr={qr} />
}
