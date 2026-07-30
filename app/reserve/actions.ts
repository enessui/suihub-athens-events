'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstile } from '@/lib/turnstile'
import { SPOTS, OPEN_HOUR, CLOSE_HOUR, type Reservation } from '@/lib/coworking-spots'

export async function getReservations(date: string): Promise<Reservation[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('coworking_reservations')
    .select('id, spot_id, date, start_hour, end_hour, name, email, created_at')
    .eq('date', date)
  const rows = (data ?? []) as Reservation[]

  // Only admins see who reserved. Strip name/email for everyone else so this
  // personal data never ships in the page payload (UI hiding isn't enough).
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin) return rows
  return rows.map((r) => ({ ...r, name: '', email: '' }))
}

export async function reserveSpot(input: {
  spotId: string
  date: string
  startHour: number
  hours: number
  name: string
  email: string
  captchaToken?: string
}): Promise<{ error?: string }> {
  const { spotId, date, startHour, hours, name, email } = input
  const endHour = startHour + hours

  if (!SPOTS.some((s) => s.id === spotId)) return { error: 'Unknown spot.' }
  if (!name.trim()) return { error: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Invalid date.' }
  if (!(await verifyTurnstile(input.captchaToken))) {
    return { error: 'Captcha verification failed. Please try again.' }
  }
  if (!Number.isInteger(startHour) || !Number.isInteger(hours) || hours < 1) {
    return { error: 'Invalid time slot.' }
  }
  if (startHour < OPEN_HOUR || endHour > CLOSE_HOUR) {
    return { error: `Reservations must be between ${OPEN_HOUR}:00 and ${CLOSE_HOUR}:00.` }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(`${date}T12:00:00`) < today) return { error: 'Cannot reserve a past date.' }

  // Weekends are closed
  const dow = new Date(`${date}T12:00:00`).getDay()
  if (dow === 0 || dow === 6) return { error: 'The coworking space is closed on weekends.' }

  const admin = createAdminClient()

  // Check for overlapping reservation on the same spot
  const { data: existing } = await admin
    .from('coworking_reservations')
    .select('start_hour, end_hour')
    .eq('spot_id', spotId)
    .eq('date', date)
  const overlaps = (existing ?? []).some(
    (r) => startHour < r.end_hour && endHour > r.start_hour,
  )
  if (overlaps) return { error: 'That spot is already reserved during those hours.' }

  const { error } = await admin.from('coworking_reservations').insert({
    spot_id: spotId,
    date,
    start_hour: startHour,
    end_hour: endHour,
    name: name.trim(),
    email: email.trim().toLowerCase(),
  })
  if (error) {
    if (error.code === '23505') return { error: 'That spot was just taken for those hours.' }
    return { error: error.message }
  }

  revalidatePath('/reserve')
  return {}
}

export async function cancelReservation(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const admin = createAdminClient()
  const { error } = await admin.from('coworking_reservations').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/reserve')
  return {}
}
