'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type RegisterResult = { error?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Invite-only registration. Creates a confirmed admin account using the
 * service-role admin API so that NO confirmation email is sent (this avoids
 * Supabase's email rate limits). Eligibility is gated by the allowlist:
 * allowed when the allowlist is empty (bootstrap) or the email was invited.
 */
export async function registerAdmin(
  email: string,
  password: string,
): Promise<RegisterResult> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!EMAIL_RE.test(normalizedEmail)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  // Gate registration through the public RPC (bootstrap or invited only).
  const supabase = await createClient()
  const { data: allowed, error: checkError } = await supabase.rpc(
    'signup_allowed',
    { check_email: normalizedEmail },
  )
  if (checkError) return { error: checkError.message }
  if (!allowed) {
    return {
      error:
        'This email is not invited. Ask an existing admin to invite you first.',
    }
  }

  // Create the account already confirmed — no email is dispatched.
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
  })

  if (error) {
    // A duplicate email means the account already exists.
    if (
      error.status === 422 ||
      /already.*registered|exists/i.test(error.message)
    ) {
      return { error: 'An account with this email already exists. Sign in instead.' }
    }
    return { error: error.message }
  }

  return {}
}
