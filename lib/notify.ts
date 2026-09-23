import { Resend } from 'resend'

// Where admin notifications go. ADMIN_NOTIFY_EMAIL can hold several
// addresses separated by commas.
const ADMIN_EMAILS = (process.env.ADMIN_NOTIFY_EMAIL || 'suihubathens@sui.io')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

// Resend's shared onboarding sender can only deliver to the Resend account's
// own address. To email anyone else (a coworker whose booking was approved,
// or several admins), verify a domain in Resend and set RESEND_FROM, e.g.
// "SuiHub Athens <hello@suihubathens.com>".
const FROM = process.env.RESEND_FROM || 'SuiHub Athens <onboarding@resend.dev>'

/**
 * Send an email. Best-effort: if RESEND_API_KEY is unset or the send fails, it
 * resolves without throwing so the caller never breaks because of email.
 */
export async function sendEmail(to: string | string[], subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch {
    // Sending failed; whatever triggered it was already saved.
  }
}

/** Email the admin inbox. */
export async function notifyAdmin(subject: string, html: string): Promise<void> {
  await sendEmail(ADMIN_EMAILS, subject, html)
}

// Escape user-controlled text before placing it in email HTML. Notification
// emails are assembled as HTML strings, so every interpolated value must be
// escaped or a visitor could inject markup/links into the admin's inbox.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Return the URL only if it uses a safe scheme, so an attacker can't smuggle a
// javascript:/data: link into an href. Allows http(s) and mailto.
function safeHref(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:') {
      return u.toString()
    }
  } catch {
    // not a valid absolute URL
  }
  return null
}

// Small helpers for consistent email markup. `heading`/`subtitle` are static,
// caller-controlled copy and are not escaped; all row values are.
export function emailShell(heading: string, subtitle: string, rowsHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #030F1C;">
      <h2 style="margin: 0 0 4px;">${heading}</h2>
      <p style="color: #91A3B1; margin: 0 0 20px;">${subtitle}</p>
      <table style="width: 100%; border-collapse: collapse;">${rowsHtml}</table>
    </div>`
}

// A plain-text row. The value is escaped and newlines become <br>.
export function emailRow(label: string, value: string): string {
  if (!value) return ''
  const safe = escapeHtml(value).replace(/\n/g, '<br>')
  return `<tr>
    <td style="padding: 8px 0; color: #91A3B1; width: 170px; vertical-align: top;">${escapeHtml(label)}</td>
    <td style="padding: 8px 0; font-weight: 500;">${safe}</td>
  </tr>`
}

// A row whose value is a link. The URL is scheme-validated; if it isn't safe,
// the (escaped) text is shown without a link rather than a dangerous href.
export function emailLinkRow(label: string, url: string, text?: string): string {
  if (!url) return ''
  const href = safeHref(url)
  const display = escapeHtml(text ?? url)
  const inner = href ? `<a href="${escapeHtml(href)}">${display}</a>` : display
  return `<tr>
    <td style="padding: 8px 0; color: #91A3B1; width: 170px; vertical-align: top;">${escapeHtml(label)}</td>
    <td style="padding: 8px 0; font-weight: 500;">${inner}</td>
  </tr>`
}

// A call-to-action link styled as a button, spanning both table columns.
export function emailButtonRow(label: string, url: string): string {
  const href = safeHref(url)
  if (!href) return ''
  return `<tr><td colspan="2" style="padding: 24px 0 0;">
    <a href="${escapeHtml(href)}" style="display: inline-block; background: #4DA2FF; color: #ffffff; text-decoration: none; font-weight: 600; padding: 10px 18px; border-radius: 8px;">${escapeHtml(label)}</a>
  </td></tr>`
}
