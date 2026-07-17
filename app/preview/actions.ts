'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function enablePreviewMode(returnTo: string = '/') {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return

  const store = await cookies()
  store.set('preview_mode', 'true', { path: '/', maxAge: 60 * 60 * 4 })
  redirect(returnTo)
}

export async function disablePreviewMode(returnTo: string = '/') {
  const store = await cookies()
  store.delete('preview_mode')
  redirect(returnTo)
}
