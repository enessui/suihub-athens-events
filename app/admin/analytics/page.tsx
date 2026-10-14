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
  const [members, subscribers] = await Promise.all([
    admin
      .from('coworking_members')
      .select('id, name, email, telegram, building, created_at')
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
      subscribers={(subscribers.data ?? []) as SubscriberRow[]}
    />
  )
}
