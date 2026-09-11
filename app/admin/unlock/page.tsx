import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminPin, isAdminUnlocked } from '@/lib/admin-pin'
import { AdminUnlock } from '@/components/admin/admin-unlock'

export const dynamic = 'force-dynamic'

export default async function AdminUnlockPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/auth/login?error=not_admin')

  // No PIN configured, or already unlocked → go straight to the dashboard.
  if (!adminPin() || (await isAdminUnlocked())) redirect('/admin')

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <AdminUnlock />
    </main>
  )
}
