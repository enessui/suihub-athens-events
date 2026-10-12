'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { SITE_CONTENT_TAG } from '@/lib/cache-tags'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeVisitGuide, type VisitGuide } from '@/lib/visit-guide'

export async function updateVisitGuide(
  content: VisitGuide,
): Promise<{ error?: string; guide?: VisitGuide }> {
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  // Validate here, not in the browser: this is the trust boundary.
  const guide = normalizeVisitGuide(content)

  const admin = createAdminClient()
  const { error } = await admin
    .from('site_settings')
    .upsert({ key: 'visit_guide', value: JSON.stringify(guide) }, { onConflict: 'key' })
  if (error) return { error: error.message }

  revalidatePath('/reserve')
  updateTag(SITE_CONTENT_TAG)
  return { guide }
}
