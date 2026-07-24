import { Resend } from 'resend'

// Where admin notifications go. Override with ADMIN_NOTIFY_EMAIL if desired.
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'suihubathens@sui.io'

/**
 * Send an admin notification email. Best-effort: if RESEND_API_KEY is unset or
 * the send fails, it resolves without throwing so the caller (registration /
 * request) never breaks because of email.
 */
export async function notifyAdmin(subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'SuiHub Athens <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject,
      html,
    })
  } catch {
    // Notification failed — the underlying data was already saved.
  }
}

// Small helpers for consistent email markup.
export function emailShell(heading: string, subtitle: string, rowsHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #030F1C;">
      <h2 style="margin: 0 0 4px;">${heading}</h2>
      <p style="color: #91A3B1; margin: 0 0 20px;">${subtitle}</p>
      <table style="width: 100%; border-collapse: collapse;">${rowsHtml}</table>
    </div>`
}

export function emailRow(label: string, value: string): string {
  if (!value) return ''
  return `<tr>
    <td style="padding: 8px 0; color: #91A3B1; width: 170px; vertical-align: top;">${label}</td>
    <td style="padding: 8px 0; font-weight: 500;">${value}</td>
  </tr>`
}
