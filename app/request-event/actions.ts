'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export type EventRequestInput = {
  title: string
  category: string
  preferred_date: string
  estimated_attendance: string
  description: string
  host_name: string
  host_email: string
  registration_link: string
}

export async function submitEventRequest(
  input: EventRequestInput,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: dbError } = await supabase.from('event_requests').insert({
    title: input.title,
    category: input.category,
    preferred_date: input.preferred_date || null,
    estimated_attendance: input.estimated_attendance || null,
    description: input.description || null,
    host_name: input.host_name,
    host_email: input.host_email,
    registration_link: input.registration_link || null,
  })

  if (dbError) return { error: dbError.message }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'SuiHub Events <onboarding@resend.dev>',
      to: 'suihubathens@sui.io',
      subject: `New event request: ${input.title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="margin-bottom: 4px;">New Event Request</h2>
          <p style="color: #888; margin-top: 0;">Submitted via SuiHub Athens Events Calendar</p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 8px 0; color: #666; width: 180px;">Event title</td><td style="padding: 8px 0; font-weight: 600;">${input.title}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Category</td><td style="padding: 8px 0;">${input.category}</td></tr>
            ${input.preferred_date ? `<tr><td style="padding: 8px 0; color: #666;">Preferred date</td><td style="padding: 8px 0;">${input.preferred_date}</td></tr>` : ''}
            ${input.estimated_attendance ? `<tr><td style="padding: 8px 0; color: #666;">Expected attendance</td><td style="padding: 8px 0;">${input.estimated_attendance}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; color: #666;">Organizer</td><td style="padding: 8px 0;">${input.host_name}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Contact email</td><td style="padding: 8px 0;"><a href="mailto:${input.host_email}">${input.host_email}</a></td></tr>
            ${input.registration_link ? `<tr><td style="padding: 8px 0; color: #666;">Registration link</td><td style="padding: 8px 0;"><a href="${input.registration_link}">${input.registration_link}</a></td></tr>` : ''}
          </table>

          ${input.description ? `
          <div style="margin-top: 20px; padding: 16px; background: #f5f5f5; border-radius: 8px;">
            <p style="margin: 0 0 8px; font-weight: 600;">Description</p>
            <p style="margin: 0; color: #444; white-space: pre-line;">${input.description}</p>
          </div>` : ''}

          <p style="margin-top: 24px; color: #888; font-size: 13px;">
            Reply directly to <a href="mailto:${input.host_email}">${input.host_email}</a> to follow up with the organizer.
          </p>
        </div>
      `,
    })
  } catch {
    // Email failed but request was saved — don't surface this to the user
  }

  return {}
}
