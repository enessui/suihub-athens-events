import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { MeetingRoomClient } from '@/components/meeting-room/meeting-room-client'
import { getMeetingBookings } from './actions'
import type { MeetingBooking } from '@/lib/meeting-room'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Meeting Room · SuiHub Athens',
  description: 'Book the private meeting room at SuiHub Athens.',
}

function todayStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default async function MeetingRoomPage() {
  const date = todayStr()
  const [bookings, trueAdmin] = await Promise.all([
    safe(() => getMeetingBookings(date), [] as MeetingBooking[]),
    isAdminSafe(),
  ])

  const isAdmin = await getEffectiveIsAdmin(trueAdmin)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/meeting-room" />
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10">
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to events
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Private Meeting Room</h1>
            <p className="mt-3 text-muted-foreground">
              Located on the 3rd floor. Booked in two-hour blocks. Pick a date and choose a free slot.
            </p>
          </div>

          <MeetingRoomClient initialDate={date} initialBookings={bookings} isAdmin={isAdmin} />
        </div>
      </div>
    </main>
  )
}
