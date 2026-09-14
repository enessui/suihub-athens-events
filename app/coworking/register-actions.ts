'use server'

import { updateTag } from 'next/cache'
import { SITE_CONTENT_TAG } from '@/lib/cache-tags'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdmin, emailShell, emailRow, emailLinkRow } from '@/lib/notify'
import { verifyTurnstile } from '@/lib/turnstile'

export type MemberInput = {
  name: string
  email: string
  telegram: string
  building: string
  subscribe: boolean
  captchaToken?: string
}

export async function registerMember(
  input: MemberInput,
): Promise<{ error?: string; alreadyRegistered?: boolean }> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const telegram = input.telegram.trim().replace(/^@/, '') || null
  const building = input.building.trim() || null

  if (!name) return { error: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Please enter a valid email.' }
  if (!(await verifyTurnstile(input.captchaToken))) {
    return { error: 'Captcha verification failed. Please try again.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('coworking_members').insert({
    name,
    email,
    telegram,
    building,
  })

  if (error) {
    if (error.code === '23505') return { alreadyRegistered: true }
    return { error: error.message }
  }

  // Opt-in newsletter subscription (ignore if already subscribed).
  if (input.subscribe) {
    await admin.from('newsletter_subscribers').insert({ email }).then(
      () => {},
      () => {}, // duplicate / failure is non-fatal
    )
  }

  // Mirror the registration into a Google Sheet (fire-and-forget: never block
  // or fail the registration if the webhook is down or unset).
  await syncToSheet({ name, email, telegram, building })

  // Notify the admin inbox.
  await notifyAdmin(
    `New coworking registration: ${name}`,
    emailShell(
      'New Coworking Registration',
      'Someone just registered for free coworking at SuiHub Athens.',
      emailRow('Name', name) +
        emailLinkRow('Email', `mailto:${email}`, email) +
        emailRow('Telegram', telegram ? `@${telegram}` : '') +
        emailRow('Building', building ?? '') +
        emailRow('Newsletter', input.subscribe ? 'Opted in' : 'No'),
    ),
  )

  // Keep the cached "registered members" stat fresh.
  updateTag(SITE_CONTENT_TAG)
  return {}
}

async function syncToSheet(row: {
  name: string
  email: string
  telegram: string | null
  building: string | null
}): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        name: row.name,
        email: row.email,
        telegram: row.telegram ?? '',
        building: row.building ?? '',
      }),
    })
  } catch {
    // Sheet unavailable — registration already saved to the database.
  }
}

// Public: how many builders have registered (number only)
export async function getMemberCount(): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('coworking_members')
    .select('id', { count: 'exact', head: true })
  return count ?? 0
}

export type Member = {
  id: string
  name: string
  email: string
  telegram: string | null
  building: string | null
  created_at: string
}

// Admin: full list of registrations
export async function getMembers(): Promise<Member[] | { error: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const admin = createAdminClient()
  const { data } = await admin
    .from('coworking_members')
    .select('id, name, email, telegram, building, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as Member[]
}
