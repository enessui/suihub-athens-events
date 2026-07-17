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

// A real registration URL, or null for invite-only / no link.
export function registrationUrl(link: string | null): string | null {
  if (!link || link === INVITE_ONLY) return null
  return link
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
