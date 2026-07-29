const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Verify a Cloudflare Turnstile token server-side. If no secret is configured
// (keys not set yet), verification is treated as disabled so forms keep working
// — the same graceful-degradation pattern used for email/webhook integrations.
export async function verifyTurnstile(token: string | undefined | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // captcha not configured — allow through
  if (!token) return false

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
