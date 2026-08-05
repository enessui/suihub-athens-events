export type EventRow = {
  id: string
  title: string
  description: string | null
  category: string
  host: string | null
  room: string | null
  industry: string | null
  registration_link: string | null
  start_time: string
  end_time: string | null
  image_url: string | null
  show_on_tv: boolean
  created_by: string | null
  created_at: string
}

export type EventInput = {
  title: string
  description: string
  category: string
  host: string
  room: string
  industry: string
  registration_link: string | null
  start_time: string
  end_time: string
  image_url: string | null
}

// Sentinel stored in registration_link when an event is invite-only
// (i.e. there is no public registration URL).
export const INVITE_ONLY = 'invite-only'

export function isInviteOnly(link: string | null): boolean {
  return link === INVITE_ONLY
}

// A real registration URL, or null for invite-only / no link. Only http(s)
// links are returned so a stored javascript:/data: value can't become a
// clickable href on the public event dialog.
export function registrationUrl(link: string | null): string | null {
  if (!link || link === INVITE_ONLY) return null
  try {
    const u = new URL(link)
    if (u.protocol === 'http:' || u.protocol === 'https:') return link
  } catch {
    // not an absolute URL
  }
  return null
}

export const EVENT_CATEGORIES = [
  'AI',
  'Blockchain',
  'Educational',
  'Finance',
  'Tech',
  'Entrepreneurship',
  'Other',
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

// Tailwind utility classes per category for badges / calendar chips.
// Brand-palette only (SuiHub guidelines): Sea #4DA2FF, Deep Ocean #030F1C,
// Aqua #C0E6FF, Concrete greys — differentiated by treatment, not hue.
export const CATEGORY_STYLES: Record<string, string> = {
  AI:               'bg-[#4DA2FF] text-white border-[#4DA2FF]',
  Blockchain:       'bg-[#030F1C] text-white border-[#030F1C]',
  Educational:      'bg-[#C0E6FF] text-[#030F1C] border-[#C0E6FF]',
  Finance:          'bg-[#4DA2FF]/15 text-[#2779DD] border-[#4DA2FF]/40',
  Tech:             'bg-white text-[#4DA2FF] border-[#4DA2FF]',
  Entrepreneurship: 'bg-[#ABBDCC]/30 text-[#41586B] border-[#ABBDCC]',
  Other:            'bg-muted text-muted-foreground border-border',
}

export function categoryStyle(category: string): string {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.General
}

// All event times are displayed in a single fixed "space" timezone so the
// calendar reads the same for every visitor — and so the server and client
// always render identical strings (no hydration mismatch).
export const SPACE_TIME_ZONE = 'Europe/Athens'

// A datetime-local input carries no timezone. We always treat its value as
// wall-clock time in SPACE_TIME_ZONE, independent of where the server or browser
// runs. Otherwise a UTC server (e.g. Vercel) and an Athens browser disagree, and
// every save/reload shifts the stored time by the Athens offset (+2h / +3h).

// Stored UTC instant -> "YYYY-MM-DDTHH:mm" wall time for a datetime-local input.
export function utcToSpaceInput(iso: string | null): string {
  if (!iso) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SPACE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`
}

// "YYYY-MM-DDTHH:mm" wall time (in SPACE_TIME_ZONE) -> UTC ISO string.
export function spaceInputToUtc(local: string | null): string | null {
  if (!local) return null
  const [datePart, timePart] = local.split('T')
  if (!datePart || !timePart) return null
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = timePart.split(':').map(Number)
  // Guess a UTC instant with the same wall-clock numbers, then measure how far
  // the space timezone sits from UTC at that instant and correct for it.
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SPACE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(guess))
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const gh = g('hour') === 24 ? 0 : g('hour')
  const zoned = Date.UTC(g('year'), g('month') - 1, g('day'), gh, g('minute'))
  const offset = zoned - guess // space-zone offset from UTC, in ms
  return new Date(guess - offset).toISOString()
}

export function formatEventTime(start: string, end: string | null): string {
  const opts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: SPACE_TIME_ZONE,
  }
  const startStr = new Date(start).toLocaleTimeString('en-US', opts)
  if (!end) return startStr
  const endStr = new Date(end).toLocaleTimeString('en-US', opts)
  return `${startStr} – ${endStr}`
}

export function formatEventDate(start: string): string {
  return new Date(start).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: SPACE_TIME_ZONE,
  })
}

// YYYY-MM-DD key (integer-based) for grid cells built from local Date parts.
export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// YYYY-MM-DD key for an instant, resolved in the fixed space timezone.
// en-CA formats as YYYY-MM-DD, matching dayKey above.
export function eventDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    timeZone: SPACE_TIME_ZONE,
  })
}
