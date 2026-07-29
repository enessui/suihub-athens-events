'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyAdmin, emailShell, emailRow } from '@/lib/notify'
import { verifyTurnstile } from '@/lib/turnstile'

export type EventRequestInput = {
  title: string
  category: string
  preferred_date: string
  estimated_attendance: string
  description: string
  host_name: string
  host_email: string
  registration_link: string
  captchaToken?: string
}

export async function submitEventRequest(
  input: EventRequestInput,
): Promise<{ error?: string }> {
  if (!(await verifyTurnstile(input.captchaToken))) {
    return { error: 'Captcha verification failed. Please try again.' }
  }

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

  await notifyAdmin(
    `New event request: ${input.title}`,
    emailShell(
      'New Event Request',
      'Submitted via the SuiHub Athens events calendar.',
      emailRow('Event title', input.title) +
        emailRow('Category', input.category) +
        emailRow('Preferred date', input.preferred_date) +
        emailRow('Expected attendance', input.estimated_attendance) +
        emailRow('Organizer', input.host_name) +
        emailRow('Contact email', `<a href="mailto:${input.host_email}">${input.host_email}</a>`) +
        emailRow('Registration link', input.registration_link ? `<a href="${input.registration_link}">${input.registration_link}</a>` : '') +
        emailRow('Description', input.description ? input.description.replace(/\n/g, '<br>') : ''),
    ),
  )

  return {}
}
