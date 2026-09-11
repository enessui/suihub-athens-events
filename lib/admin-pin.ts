import { cookies } from 'next/headers'

export const ADMIN_PIN_COOKIE = 'admin_unlocked'

// The admin PIN comes from the ADMIN_PIN env var. When it's unset the gate is
// disabled (like other optional integrations) so a missing config can never
// lock an authenticated admin out of the dashboard.
export function adminPin(): string | null {
  const p = process.env.ADMIN_PIN?.trim()
  return p ? p : null
}

// True when the PIN gate is satisfied — either no PIN is configured, or the
// unlock cookie set after a correct PIN entry is present.
export async function isAdminUnlocked(): Promise<boolean> {
  if (!adminPin()) return true
  const store = await cookies()
  return store.get(ADMIN_PIN_COOKIE)?.value === '1'
}
