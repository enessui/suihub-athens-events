'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstile } from '@/lib/turnstile'

export type CheckinEntry = {
  id: string
  date: string
  name: string
  email: string
  created_at: string
}

export type DailyCount = { date: string; count: number }

export type LeaderboardEntry = { name: string; visits: number }

function todayStr(): string {
  // Athens local date
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' })
}

// Tally check-in days per person (one row = one day, guaranteed by the
// (date, email) unique constraint). First names only — emails never exposed.
function tally(
  rows: { email: string; name: string }[],
  limit: number,
): LeaderboardEntry[] {
  const byEmail = new Map<string, { name: string; visits: number }>()
  for (const row of rows) {
    const entry = byEmail.get(row.email)
    if (entry) {
      entry.visits += 1
      entry.name = row.name // keep most recent display name
    } else {
      byEmail.set(row.email, { name: row.name, visits: 1 })
    }
  }
  return [...byEmail.values()]
    .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ name, visits }) => ({ name, visits }))
}

// Public: top visitors for the current month
export async function getMonthlyLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const monthStart = `${todayStr().slice(0, 7)}-01`
  const admin = createAdminClient()
  const { data } = await admin
    .from('coworking_checkins')
    .select('email, name, date, created_at')
    .gte('date', monthStart)
    .order('created_at', { ascending: true })
  return tally(data ?? [], limit)
}

// Public: all-time top visitors by total days checked in
export async function getAllTimeLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('coworking_checkins')
    .select('email, name, created_at')
    .order('created_at', { ascending: true })
  return tally(data ?? [], limit)
}

// Public: how many people checked in today (number only, no personal data)
export async function getTodayCount(): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('coworking_checkins')
    .select('id', { count: 'exact', head: true })
    .eq('date', todayStr())
  return count ?? 0
}

export async function checkIn(input: {
  name: string
  email: string
  captchaToken?: string
}): Promise<{ error?: string; alreadyCheckedIn?: boolean }> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()

  if (!name) return { error: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' }
  if (!(await verifyTurnstile(input.captchaToken))) {
    return { error: 'Captcha verification failed. Please try again.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('coworking_checkins').insert({
    date: todayStr(),
    name,
    email,
  })

  if (error) {
    if (error.code === '23505') return { alreadyCheckedIn: true }
    return { error: error.message }
  }

  return {}
}

// Admin: today's entries + daily counts for the last `days` days
export async function getAttendance(days = 7): Promise<{
  today: CheckinEntry[]
  daily: DailyCount[]
} | { error: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const admin = createAdminClient()
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  const sinceStr = since.toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' })

  const [{ data: today }, { data: recent }] = await Promise.all([
    admin
      .from('coworking_checkins')
      .select('id, date, name, email, created_at')
      .eq('date', todayStr())
      .order('created_at', { ascending: true }),
    admin
      .from('coworking_checkins')
      .select('date')
      .gte('date', sinceStr),
  ])

  const counts = new Map<string, number>()
  for (const row of recent ?? []) {
    counts.set(row.date, (counts.get(row.date) ?? 0) + 1)
  }
  const daily: DailyCount[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' })
    daily.push({ date: key, count: counts.get(key) ?? 0 })
  }

  return { today: (today ?? []) as CheckinEntry[], daily }
}
