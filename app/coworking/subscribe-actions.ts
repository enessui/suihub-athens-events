'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyTurnstile } from '@/lib/turnstile'

export async function subscribe(
  email: string,
  captchaToken?: string,
): Promise<{ error?: string; alreadySubscribed?: boolean }> {
  const clean = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { error: 'Please enter a valid email.' }
  }
  if (!(await verifyTurnstile(captchaToken))) {
    return { error: 'Captcha verification failed. Please try again.' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('newsletter_subscribers').insert({ email: clean })

  if (error) {
    if (error.code === '23505') return { alreadySubscribed: true }
    return { error: error.message }
  }

  // Optionally mirror to the same Google Sheet webhook, tagged as a subscriber.
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (url) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          name: '',
          email: clean,
          telegram: '',
          building: 'newsletter',
        }),
      })
    } catch {
      // Sheet mirror is best-effort.
    }
  }

  return {}
}
