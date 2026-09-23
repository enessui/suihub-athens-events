'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { SITE_CONTENT_TAG } from '@/lib/cache-tags'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_COWORKING, type CoworkingContent } from '@/lib/coworking'
import { normalizeOrigins, type OriginsContent } from '@/lib/coworker-origins'

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
  updateTag(SITE_CONTENT_TAG)
  return {}
}

export async function updateOrigins(content: OriginsContent): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  // Normalize here too: this is the trust boundary, not the browser.
  const clean = normalizeOrigins(content)

  const admin = createAdminClient()
  const { error } = await admin.from('site_settings').upsert(
    { key: 'coworker_origins', value: JSON.stringify(clean) },
    { onConflict: 'key' },
  )
  if (error) return { error: error.message }

  revalidatePath('/coworking')
  updateTag(SITE_CONTENT_TAG)
  return {}
}
