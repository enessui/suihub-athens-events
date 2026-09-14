import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * A Supabase session cookie is a prerequisite for being an admin, so checking
 * for one first lets anonymous visitors (nearly all traffic) skip the is_admin
 * round-trip entirely. This is a rendering hint only — every admin page and
 * server action still verifies is_admin against the database independently.
 */
async function hasSessionCookie(): Promise<boolean> {
  const store = await cookies()
  return store.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))
}

/**
 * Returns whether the calling user is an admin, swallowing any error
 * (e.g. Supabase unreachable / project paused) and returning false so the
 * page can still render instead of crashing with an AuthRetryableFetchError.
 *
 * Wrapped in React cache() so the page and the site header — which both ask —
 * share a single round-trip per request instead of querying twice.
 */
export const isAdminSafe = cache(async (): Promise<boolean> => {
  try {
    if (!(await hasSessionCookie())) return false
    const supabase = await createClient()
    const { data } = await supabase.rpc('is_admin')
    return !!data
  } catch {
    return false
  }
})

/**
 * Runs a Supabase-backed async fn and returns `fallback` if it throws
 * (network error, paused project, etc.). Keeps server components resilient
 * to a backend outage.
 */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}
