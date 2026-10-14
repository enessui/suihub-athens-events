import { EVENT_CATEGORIES, type EventRow } from '@/lib/events'

export type EventRequestStatus = 'pending' | 'approved' | 'declined'

export type EventRequestRow = {
  id: string
  title: string
  category: string | null
  /** YYYY-MM-DD. Requesters pick a day but not a time. */
  preferred_date: string | null
  estimated_attendance: string | null
  description: string | null
  host_name: string
  host_email: string
  registration_link: string | null
  created_at: string
  status: EventRequestStatus
  /** The calendar event an approval created. */
  event_id: string | null
  decided_at: string | null
}

/** Requests only carry a date, so approving fills in this start time to adjust. */
export const DEFAULT_REQUEST_TIME = '18:00'

/** The event form's starting values when approving a request. */
export function eventFromRequest(r: EventRequestRow): {
  prefill: Partial<EventRow>
  startInput: string
} {
  const category = (EVENT_CATEGORIES as readonly string[]).includes(r.category ?? '')
    ? (r.category as string)
    : 'Other'
  return {
    prefill: {
      title: r.title,
      category,
      host: r.host_name,
      description: r.description,
      registration_link: r.registration_link,
      show_on_tv: true,
    },
    startInput: r.preferred_date ? `${r.preferred_date}T${DEFAULT_REQUEST_TIME}` : '',
  }
}
