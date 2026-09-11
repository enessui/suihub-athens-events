'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { adminPin, ADMIN_PIN_COOKIE } from '@/lib/admin-pin'

export async function unlockAdmin(pin: string): Promise<{ error?: string; ok?: boolean }> {
  // The PIN sits on top of auth — still require an authenticated allowlisted admin.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized.' }

  const expected = adminPin()
  if (!expected) return { ok: true } // gate disabled
  if (pin.trim() !== expected) return { error: 'Incorrect PIN.' }

  const store = await cookies()
  store.set(ADMIN_PIN_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // re-prompt after 8 hours
  })
  return { ok: true }
}
