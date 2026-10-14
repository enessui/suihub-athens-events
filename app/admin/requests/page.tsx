import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EventRequestsClient } from '@/components/admin/event-requests-client'
import { isAdminUnlocked } from '@/lib/admin-pin'
import { SPACE_TIME_ZONE } from '@/lib/events'
import type { EventRequestRow } from '@/lib/event-requests'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Event requests · Admin' }

export default async function EventRequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/auth/login?error=not_admin')

  if (!(await isAdminUnlocked())) redirect('/admin/unlock')

  // Verified admin: event_requests is locked to the public, so read it with
  // the service role.
  const { data, error } = await createAdminClient()
    .from('event_requests')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <EventRequestsClient
      userEmail={user.email ?? ''}
      requests={(data ?? []) as EventRequestRow[]}
      loadError={error?.message ?? null}
      today={new Date().toLocaleDateString('en-CA', { timeZone: SPACE_TIME_ZONE })}
    />
  )
}
