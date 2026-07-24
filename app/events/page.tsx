import { createClient } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { CalendarView } from '@/components/calendar/calendar-view'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'
import type { EventRow } from '@/lib/events'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Events · SuiHub Athens',
  description: 'Workshops, talks, socials and more happening at SuiHub Athens.',
}

export default async function EventsPage() {
  const [events, trueAdmin] = await Promise.all([
    safe(async () => {
      const supabase = await createClient()
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true })
      return (data ?? []) as EventRow[]
    }, [] as EventRow[]),
    isAdminSafe(),
  ])

  const isAdmin = await getEffectiveIsAdmin(trueAdmin)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/events" />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 md:py-10">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-8 md:px-8 md:py-10">
          <CalendarView events={events} isAdmin={isAdmin} />
        </div>
      </div>
    </main>
  )
}
