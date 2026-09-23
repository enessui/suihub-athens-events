import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { ReserveClient } from '@/components/coworking/reserve-client'
import { getMeetingBookings } from '@/app/meeting-room/actions'
import { firstBookableDate, type MeetingBooking } from '@/lib/meeting-room'
import { getTodayCount, getAttendance, getMonthlyLeaderboard, getAllTimeLeaderboard, type LeaderboardEntry } from '@/app/checkin/actions'
import { getTodayCountCached, getMonthlyLeaderboardCached, getAllTimeLeaderboardCached } from '@/lib/site-content'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Visit Us · SuiHub Athens',
  description: 'Check in or reserve your coworking spot at SuiHub Athens.',
}

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<{ checkin?: string; meeting?: string }>
}) {
  const date = firstBookableDate()
  const [params, meetingBookings, checkinCount, leaderboard, allTimeLeaderboard, trueAdmin] =
    await Promise.all([
      searchParams,
      safe(() => getMeetingBookings(date), [] as MeetingBooking[]),
      safe(getTodayCountCached, 0),
      safe(getMonthlyLeaderboardCached, [] as LeaderboardEntry[]),
      safe(getAllTimeLeaderboardCached, [] as LeaderboardEntry[]),
      isAdminSafe(),
    ])

  const isAdmin = await getEffectiveIsAdmin(trueAdmin)
  const attendance = isAdmin ? await safe(() => getAttendance(7), null) : null
  const attendanceData = attendance && !('error' in attendance) ? attendance : null
  const initialMode = params.meeting ? ('meeting' as const) : ('checkin' as const)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/reserve" />
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
            <h1 className="text-4xl font-bold tracking-tight">Plan your visit</h1>
            <p className="mt-3 text-muted-foreground">
              Free coworking, walk-ins always welcome. Check in when you arrive, and book
              the private meeting room if you need one.
            </p>
          </div>

          <ReserveClient
            initialDate={date}
            initialMeetingBookings={meetingBookings}
            initialMode={initialMode}
            checkinCount={checkinCount}
            leaderboard={leaderboard}
            allTimeLeaderboard={allTimeLeaderboard}
            attendance={attendanceData}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </main>
  )
}
