'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_COWORKING, type CoworkingContent } from '@/lib/coworking'

export async function getCoworking(): Promise<CoworkingContent> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'coworking')
    .single()
  if (!data?.value) return DEFAULT_COWORKING
  try {
    return JSON.parse(data.value) as CoworkingContent
  } catch {
    return DEFAULT_COWORKING
  }
}

export async function updateCoworking(content: CoworkingContent): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const admin = createAdminClient()
  const { error } = await admin.from('site_settings').upsert(
    { key: 'coworking', value: JSON.stringify(content) },
    { onConflict: 'key' },
  )
  if (error) return { error: error.message }

  revalidatePath('/coworking')
  return {}
}
