'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstile } from '@/lib/turnstile'
import { MEETING_HOURS, type MeetingBooking } from '@/lib/meeting-room'

export async function getMeetingBookings(date: string): Promise<MeetingBooking[]> {
  // Read with the service-role client so the table can stay fully locked to the
  // public anon role in RLS — the anon key must not be able to read booker PII.
  const admin = createAdminClient()
  const { data } = await admin
    .from('meeting_room_bookings')
    .select('id, date, hour, name, email, topic, created_at')
    .eq('date', date)
    .order('hour', { ascending: true })
  const rows = (data ?? []) as MeetingBooking[]

  // Only admins see who booked. For everyone else, strip the booker's name,
  // email, and topic so this personal data never ships in the page payload.
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin) return rows
  return rows.map((b) => ({ ...b, name: '', email: '', topic: null }))
}

export async function bookMeetingRoom(input: {
  date: string
  hour: number
  name: string
  email: string
  topic: string
  captchaToken?: string
}): Promise<{ error?: string }> {
  const { date, hour, name, email, topic } = input

  if (!MEETING_HOURS.includes(hour)) return { error: 'Invalid time slot.' }
  if (!name.trim()) return { error: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Invalid date.' }
  if (!(await verifyTurnstile(input.captchaToken))) {
    return { error: 'Captcha verification failed. Please try again.' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(`${date}T12:00:00`) < today) return { error: 'Cannot book a past date.' }

  const dow = new Date(`${date}T12:00:00`).getDay()
  if (dow === 0 || dow === 6) return { error: 'The space is closed on weekends.' }

  const admin = createAdminClient()
  const { error } = await admin.from('meeting_room_bookings').insert({
    date,
    hour,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    topic: topic.trim() || null,
  })
  if (error) {
    if (error.code === '23505') return { error: 'That slot was just booked.' }
    return { error: error.message }
  }

  revalidatePath('/meeting-room')
  return {}
}

export async function cancelMeetingBooking(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const admin = createAdminClient()
  const { error } = await admin.from('meeting_room_bookings').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/meeting-room')
  return {}
}
