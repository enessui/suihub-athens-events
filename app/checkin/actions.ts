'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { CHECKIN_TAG } from '@/lib/cache-tags'
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

type LeaderboardOverride = {
  id: string
  email: string | null
  name: string | null
  hidden: boolean
  visits: number | null
}

// Admin edits to the leaderboard, stored separately from raw check-ins.
// Resilient: if the table doesn't exist yet, the board still works unedited.
async function fetchOverrides(
  admin: ReturnType<typeof createAdminClient>,
): Promise<LeaderboardOverride[]> {
  try {
    const { data, error } = await admin
      .from('leaderboard_overrides')
      .select('id, email, name, hidden, visits')
    if (error) return []
    return (data ?? []) as LeaderboardOverride[]
  } catch {
    return []
  }
}

// Tally check-in days per person, then apply admin overrides (hide / adjust
// count / manual entries). One row = one day (guaranteed by the (date, email)
// unique constraint). First names only — emails never exposed to the public.
function computeBoard(
  rows: { email: string; name: string }[],
  overrides: LeaderboardOverride[],
  limit: number,
): LeaderboardEntry[] {
  const byEmail = new Map<string, { name: string; visits: number }>()
  for (const row of rows) {
    const entry = byEmail.get(row.email)
    if (entry) {
      entry.visits += 1
      entry.name = row.name
    } else {
      byEmail.set(row.email, { name: row.name, visits: 1 })
    }
  }
  for (const o of overrides) {
    if (!o.email) continue
    const key = o.email.toLowerCase()
    const entry = byEmail.get(key)
    if (!entry) continue
    if (o.hidden) {
      byEmail.delete(key)
      continue
    }
    if (o.visits != null) entry.visits = o.visits
    if (o.name) entry.name = o.name
  }
  const list = [...byEmail.values()].map(({ name, visits }) => ({ name, visits }))
  for (const o of overrides) {
    if (o.email || o.hidden || !o.name) continue // manual, visible entries only
    list.push({ name: o.name, visits: o.visits ?? 0 })
  }
  return list
    .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name))
    .slice(0, limit)
}

// Public: top visitors for the current month
export async function getMonthlyLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const monthStart = `${todayStr().slice(0, 7)}-01`
  const admin = createAdminClient()
  const [{ data }, overrides] = await Promise.all([
    admin
      .from('coworking_checkins')
      .select('email, name, date, created_at')
      .gte('date', monthStart)
      .order('created_at', { ascending: true }),
    fetchOverrides(admin),
  ])
  return computeBoard(data ?? [], overrides, limit)
}

// Public: all-time top visitors by total days checked in
export async function getAllTimeLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient()
  const [{ data }, overrides] = await Promise.all([
    admin
      .from('coworking_checkins')
      .select('email, name, created_at')
      .order('created_at', { ascending: true }),
    fetchOverrides(admin),
  ])
  return computeBoard(data ?? [], overrides, limit)
}

// ---------- Admin: edit the leaderboard ----------

export type AdminLeaderboardRow = {
  email: string | null // null for a manually-added entry
  overrideId: string | null
  name: string
  computed: number // auto count from check-ins (0 for manual)
  visits: number // effective count shown
  hidden: boolean
  isManual: boolean
}

async function isCallerAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('is_admin')
  return data === true
}

// Admin-only: every real person (all-time) plus manual entries, with their
// current override state, so the editor can show and change them.
export async function getLeaderboardAdmin(): Promise<{ rows?: AdminLeaderboardRow[]; error?: string }> {
  if (!(await isCallerAdmin())) return { error: 'Not authorized' }
  const admin = createAdminClient()
  const [{ data: checks }, overrides] = await Promise.all([
    admin.from('coworking_checkins').select('email, name, created_at').order('created_at', { ascending: true }),
    fetchOverrides(admin),
  ])

  const byEmail = new Map<string, { name: string; visits: number }>()
  for (const r of (checks ?? []) as { email: string; name: string }[]) {
    const e = byEmail.get(r.email)
    if (e) { e.visits += 1; e.name = r.name } else byEmail.set(r.email, { name: r.name, visits: 1 })
  }
  const ovByEmail = new Map(overrides.filter((o) => o.email).map((o) => [o.email!.toLowerCase(), o]))

  const rows: AdminLeaderboardRow[] = []
  for (const [email, base] of byEmail) {
    const o = ovByEmail.get(email)
    rows.push({
      email,
      overrideId: o?.id ?? null,
      name: o?.name || base.name,
      computed: base.visits,
      visits: o?.visits ?? base.visits,
      hidden: o?.hidden ?? false,
      isManual: false,
    })
  }
  for (const o of overrides) {
    if (o.email) continue
    rows.push({ email: null, overrideId: o.id, name: o.name ?? '', computed: 0, visits: o.visits ?? 0, hidden: o.hidden, isManual: true })
  }
  rows.sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name))
  return { rows }
}

function revalidateBoards() {
  updateTag(CHECKIN_TAG)
  revalidatePath('/checkin')
  revalidatePath('/reserve')
}

// Admin-only: hide/adjust a real (check-in) person. visits=null & !hidden clears it.
export async function setLeaderboardOverride(input: {
  email: string
  hidden: boolean
  visits: number | null
}): Promise<{ error?: string }> {
  if (!(await isCallerAdmin())) return { error: 'Not authorized' }
  const admin = createAdminClient()
  const email = input.email.trim().toLowerCase()
  if (!input.hidden && input.visits == null) {
    await admin.from('leaderboard_overrides').delete().eq('email', email)
    revalidateBoards()
    return {}
  }
  const { error } = await admin.from('leaderboard_overrides').upsert(
    { email, hidden: input.hidden, visits: input.visits, name: null },
    { onConflict: 'email' },
  )
  if (error) return { error: error.message }
  revalidateBoards()
  return {}
}

// Admin-only: add or update a manual leaderboard entry.
export async function saveManualLeaderboardEntry(input: {
  id?: string
  name: string
  visits: number
  hidden?: boolean
}): Promise<{ error?: string }> {
  if (!(await isCallerAdmin())) return { error: 'Not authorized' }
  const name = input.name.trim()
  if (!name) return { error: 'Please enter a name.' }
  const admin = createAdminClient()
  const payload = { name, visits: Math.max(0, input.visits | 0), hidden: input.hidden ?? false, email: null }
  const { error } = input.id
    ? await admin.from('leaderboard_overrides').update(payload).eq('id', input.id)
    : await admin.from('leaderboard_overrides').insert(payload)
  if (error) return { error: error.message }
  revalidateBoards()
  return {}
}

// Admin-only: remove an override row (reset a person to auto, or delete a manual entry).
export async function deleteLeaderboardOverride(id: string): Promise<{ error?: string }> {
  if (!(await isCallerAdmin())) return { error: 'Not authorized' }
  const admin = createAdminClient()
  const { error } = await admin.from('leaderboard_overrides').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateBoards()
  return {}
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

  // Today's count and the leaderboards are cached — refresh them now.
  revalidateBoards()
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
