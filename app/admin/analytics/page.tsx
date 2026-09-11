import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AnalyticsClient } from '@/components/admin/analytics-client'
import { isAdminUnlocked } from '@/lib/admin-pin'

export const dynamic = 'force-dynamic'

export type MemberRow = {
  id: string
  name: string
  email: string
  telegram: string | null
  building: string | null
  created_at: string
}

export type EventRequestRow = {
  id: string
  title: string
  category: string | null
  preferred_date: string | null
  estimated_attendance: string | null
  description: string | null
  host_name: string
  host_email: string
  registration_link: string | null
  created_at: string
}

export type SubscriberRow = {
  id: string
  email: string
  created_at: string
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/auth/login?error=not_admin')

  if (!(await isAdminUnlocked())) redirect('/admin/unlock')

  // Verified admin — use the service-role client to read the private tables.
  const admin = createAdminClient()
  const [members, requests, subscribers] = await Promise.all([
    admin
      .from('coworking_members')
      .select('id, name, email, telegram, building, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('event_requests')
      .select(
        'id, title, category, preferred_date, estimated_attendance, description, host_name, host_email, registration_link, created_at',
      )
      .order('created_at', { ascending: false }),
    admin
      .from('newsletter_subscribers')
      .select('id, email, created_at')
      .order('created_at', { ascending: false }),
  ])

  return (
    <AnalyticsClient
      userEmail={user.email ?? ''}
      members={(members.data ?? []) as MemberRow[]}
      requests={(requests.data ?? []) as EventRequestRow[]}
      subscribers={(subscribers.data ?? []) as SubscriberRow[]}
    />
  )
}
