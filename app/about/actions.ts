'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_ABOUT, type AboutContent } from '@/lib/about'

export async function getAbout(): Promise<AboutContent> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'about')
    .single()
  if (!data?.value) return DEFAULT_ABOUT
  try {
    // Merge over defaults so missing fields stay populated.
    return { ...DEFAULT_ABOUT, ...(JSON.parse(data.value) as Partial<AboutContent>) }
  } catch {
    return DEFAULT_ABOUT
  }
}

export async function updateAbout(content: AboutContent): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const admin = createAdminClient()
  const { error } = await admin.from('site_settings').upsert(
    { key: 'about', value: JSON.stringify(content) },
    { onConflict: 'key' },
  )
  if (error) return { error: error.message }

  revalidatePath('/')
  return {}
}
