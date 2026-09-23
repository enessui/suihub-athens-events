'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstile } from '@/lib/turnstile'
import { siteUrl } from '@/lib/site-url'
import {
  notifyAdmin,
  sendEmail,
  emailShell,
  emailRow,
  emailLinkRow,
  emailButtonRow,
} from '@/lib/notify'
import {
  ROOM_OPEN,
  ROOM_CLOSE,
  START_STEP,
  DURATIONS,
  earliestStart,
  formatDay,
  formatDuration,
  formatRange,
  isWeekend,
  athensNow,
  type MeetingBooking,
} from '@/lib/meeting-room'

const COLUMNS = 'id, date, start_minute, end_minute, status, name, email, topic, created_at'

async function callerIsAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('is_admin')
  return data === true
}

function revalidateRoom() {
  revalidatePath('/meeting-room')
  revalidatePath('/reserve')
  revalidatePath('/admin')
}

/** Bookings still holding the room on `date` (pending and approved). */
export async function getMeetingBookings(date: string): Promise<MeetingBooking[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return []

  // Read with the service-role client so the table can stay fully locked to the
  // public anon role in RLS: the anon key must not be able to read booker PII.
  const admin = createAdminClient()
  const { data } = await admin
    .from('meeting_room_bookings')
    .select(COLUMNS)
    .eq('date', date)
    .in('status', ['pending', 'approved'])
    .order('start_minute', { ascending: true })
  const rows = (data ?? []) as MeetingBooking[]

  // Only admins see who booked. Everyone else gets the times and status, with
  // name, email and topic stripped so that data never ships in the page.
  if (await callerIsAdmin()) return rows
  return rows.map((b) => ({ ...b, name: '', email: '', topic: null }))
}

/** Admin: every pending request from today on, soonest first. */
export async function getPendingMeetingRequests(): Promise<MeetingBooking[]> {
  if (!(await callerIsAdmin())) return []
  const admin = createAdminClient()
  const { data } = await admin
    .from('meeting_room_bookings')
    .select(COLUMNS)
    .eq('status', 'pending')
    .gte('date', athensNow().date)
    .order('date', { ascending: true })
    .order('start_minute', { ascending: true })
  return (data ?? []) as MeetingBooking[]
}

export async function requestMeetingRoom(input: {
  date: string
  start: number
  duration: number
  name: string
  email: string
  topic: string
  captchaToken?: string
}): Promise<{ error?: string }> {
  const { date, start, duration } = input
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const topic = input.topic.trim()
  const end = start + duration

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Invalid date.' }
  if (isWeekend(date)) return { error: 'The space is closed on weekends.' }
  if (date < athensNow().date) return { error: 'That date has passed.' }
  if (!Number.isInteger(start) || start % START_STEP !== 0) return { error: 'Invalid start time.' }
  if (!DURATIONS.includes(duration)) return { error: 'Invalid duration.' }
  if (start < ROOM_OPEN || end > ROOM_CLOSE) return { error: 'That time is outside opening hours.' }
  if (start < earliestStart(date)) return { error: 'That time has already passed.' }
  if (!name) return { error: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' }
  if (!(await verifyTurnstile(input.captchaToken))) {
    return { error: 'Captcha verification failed. Please try again.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('meeting_room_bookings').insert({
    date,
    start_minute: start,
    end_minute: end,
    status: 'pending',
    name,
    email,
    topic: topic || null,
  })

  if (error) {
    // 23P01: the database's no-overlap rule caught a clash (e.g. two people
    // submitting the same slot at once).
    if (error.code === '23P01') return { error: 'Someone just requested an overlapping time. Please pick another.' }
    return { error: error.message }
  }

  await notifyAdmin(
    `Meeting room request: ${name}, ${formatDay(date)} ${formatRange(start, end)}`,
    emailShell(
      'Meeting room request',
      'Someone wants the 3rd floor meeting room. It stays on hold until you approve or decline it.',
      emailRow('When', `${formatDay(date)}, ${formatRange(start, end)} (${formatDuration(duration)})`) +
        emailRow('Name', name) +
        emailLinkRow('Email', `mailto:${email}`, email) +
        emailRow('Topic', topic) +
        emailButtonRow('Review request', `${siteUrl()}/admin#meeting-requests`),
    ),
  )

  revalidateRoom()
  return {}
}

/** Admin: approve or decline a pending request, then let the requester know. */
export async function decideMeetingRequest(
  id: string,
  decision: 'approved' | 'declined',
): Promise<{ error?: string }> {
  if (decision !== 'approved' && decision !== 'declined') return { error: 'Invalid decision.' }
  if (!(await callerIsAdmin())) return { error: 'Not authorized' }

  const admin = createAdminClient()
  // Only move requests that are still pending, so two admins acting at once
  // can't approve something the other just declined.
  const { data, error } = await admin
    .from('meeting_room_bookings')
    .update({ status: decision, decided_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select(COLUMNS)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'That request was already handled.' }

  const b = data as MeetingBooking
  const when = `${formatDay(b.date)}, ${formatRange(b.start_minute, b.end_minute)}`
  await sendEmail(
    b.email,
    decision === 'approved'
      ? `Meeting room confirmed: ${when}`
      : `Meeting room request declined: ${when}`,
    emailShell(
      decision === 'approved' ? 'Your meeting room booking is confirmed' : 'Your meeting room request was declined',
      decision === 'approved'
        ? 'The 3rd floor meeting room at SuiHub Athens is yours for this time.'
        : 'Sorry, the room isn’t available for this request. Feel free to pick another time.',
      emailRow('When', when) + emailRow('Topic', b.topic ?? ''),
    ),
  )

  revalidateRoom()
  return {}
}

/** Admin: remove a booking entirely (frees the time). */
export async function cancelMeetingBooking(id: string): Promise<{ error?: string }> {
  if (!(await callerIsAdmin())) return { error: 'Not authorized' }

  const admin = createAdminClient()
  const { error } = await admin.from('meeting_room_bookings').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidateRoom()
  return {}
}
