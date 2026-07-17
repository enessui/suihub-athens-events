import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import type { EventRow } from '@/lib/events'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Invite-only: signed-in users who aren't on the allowlist get bounced.
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    redirect('/auth/login?error=not_admin')
  }

  const [{ data: eventData }, { data: adminData }] = await Promise.all([
    supabase.from('events').select('*').order('start_time', { ascending: true }),
    supabase
      .from('admin_allowlist')
      .select('email, created_at')
      .order('created_at', { ascending: true }),
  ])

  const events = (eventData ?? []) as EventRow[]
  const admins = (adminData ?? []) as { email: string; created_at: string }[]

  return (
    <AdminDashboard
      events={events}
      userEmail={user.email ?? ''}
      admins={admins}
    />
  )
}
