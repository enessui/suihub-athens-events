'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { type GuidelinesContent, DEFAULT_GUIDELINES } from '@/lib/guidelines'
import { sanitizeGuidelines } from '@/lib/sanitize'

export async function getGuidelines(): Promise<GuidelinesContent> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'guidelines')
    .single()
  return (data?.value as GuidelinesContent) ?? DEFAULT_GUIDELINES
}

export async function updateGuidelines(
  content: GuidelinesContent,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  const { error } = await supabase.from('site_settings').upsert({
    key: 'guidelines',
    value: sanitizeGuidelines(content),
    updated_at: new Date().toISOString(),
  })
  if (error) return { error: error.message }

  revalidatePath('/guidelines')
  return {}
}
