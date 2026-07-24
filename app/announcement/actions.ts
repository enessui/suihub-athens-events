'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_ANNOUNCEMENT, type AnnouncementContent } from '@/lib/announcement'

export async function getAnnouncement(): Promise<AnnouncementContent> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'announcement')
    .single()
  if (!data?.value) return DEFAULT_ANNOUNCEMENT
  try {
    return { ...DEFAULT_ANNOUNCEMENT, ...(JSON.parse(data.value) as Partial<AnnouncementContent>) }
  } catch {
    return DEFAULT_ANNOUNCEMENT
  }
}

export async function updateAnnouncement(
  content: AnnouncementContent,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const admin = createAdminClient()
  const { error } = await admin.from('site_settings').upsert(
    { key: 'announcement', value: JSON.stringify(content) },
    { onConflict: 'key' },
  )
  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return {}
}
