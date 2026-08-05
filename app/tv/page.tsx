import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { safe } from '@/lib/supabase/safe'
import { qrSvg } from '@/lib/qr'
import {
  registrationUrl,
  isInviteOnly,
  formatEventTime,
  SPACE_TIME_ZONE,
  type EventRow,
} from '@/lib/events'
import { TvCarousel, type TvSlide } from '@/components/tv/tv-carousel'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "What's on · SuiHub Athens",
  robots: { index: false },
}

function part(date: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: SPACE_TIME_ZONE, ...opts }).format(date)
}

// Placeholder / held slots aren't real programming — show them as a teaser
// ("Upcoming event") rather than the internal placeholder text. Matches a
// leading keyword, so "RESERVED", "Reserved (morning)", "TBD", etc. all count.
const PLACEHOLDER_RE = /^(reserved|tbd|tba|placeholder|hold|held|blocked)\b/i
function isPlaceholder(title: string): boolean {
  const t = title.trim()
  return t === '' || PLACEHOLDER_RE.test(t)
}

export default async function TvPage() {
  const events = await safe(async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true })
    return (data ?? []) as EventRow[]
  }, [] as EventRow[])

  // Absolute base URL for the fallback QR (events not carrying a signup link).
  const h = await headers()
  const host = h.get('host') ?? ''
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const baseUrl = host ? `${proto}://${host}` : ''

  // Upcoming, opted-in only: keep events that haven't ended yet and aren't
  // hidden from the TV (show_on_tv !== false stays safe if the column is absent).
  const now = Date.now()
  const upcoming = events
    .filter((e) => e.show_on_tv !== false)
    .filter((e) => new Date(e.end_time ?? e.start_time).getTime() >= now)
    .slice(0, 24)

  const slides: TvSlide[] = await Promise.all(
    upcoming.map(async (e) => {
      const start = new Date(e.start_time)
      const regUrl = registrationUrl(e.registration_link)
      const inviteOnly = isInviteOnly(e.registration_link)
      const qrTarget = regUrl ?? (baseUrl ? `${baseUrl}/events` : null)
      const placeholder = isPlaceholder(e.title)
      return {
        id: e.id,
        title: placeholder ? 'Upcoming event' : e.title,
        description: placeholder ? null : e.description,
        category: e.category,
        host: e.host,
        room: e.room,
        imageUrl: e.image_url,
        day: part(start, { day: 'numeric' }),
        month: part(start, { month: 'short' }).toUpperCase(),
        weekday: part(start, { weekday: 'long' }),
        monthLabel: part(start, { month: 'long', year: 'numeric' }),
        time: formatEventTime(e.start_time, e.end_time),
        inviteOnly,
        registerable: !!regUrl,
        qr: qrTarget ? await qrSvg(qrTarget) : null,
      }
    }),
  )

  return <TvCarousel slides={slides} />
}
