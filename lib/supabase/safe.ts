import { createClient } from '@/lib/supabase/server'

/**
 * Returns whether the calling user is an admin, swallowing any error
 * (e.g. Supabase unreachable / project paused) and returning false so the
 * page can still render instead of crashing with an AuthRetryableFetchError.
 */
export async function isAdminSafe(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.rpc('is_admin')
    return !!data
  } catch {
    return false
  }
}

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
