import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_ANNOUNCEMENT, type AnnouncementContent } from '@/lib/announcement'
import { DEFAULT_ABOUT, type AboutContent } from '@/lib/about'
import { DEFAULT_COWORKING, type CoworkingContent } from '@/lib/coworking'
import { DEFAULT_GUIDELINES, type GuidelinesContent } from '@/lib/guidelines'

/**
 * Editable site content lives in `site_settings` and changes rarely, but was
 * being re-fetched from Supabase on every request (~380ms each, in a waterfall
 * behind the page's own queries). These readers cache it instead; admin edits
 * call revalidateTag(SITE_CONTENT_TAG) so changes still appear immediately.
 */
export const SITE_CONTENT_TAG = 'site-content'
const TTL = 300 // seconds; a safety net if a revalidate is ever missed

// unstable_cache can't touch request APIs like cookies(), so this uses a plain
// anon client. site_settings is public-read, so no session is needed.
function publicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  )
}

async function readSetting(key: string): Promise<unknown> {
  const { data } = await publicClient()
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? null
}

export const getAnnouncementCached = unstable_cache(
  async (): Promise<AnnouncementContent> => {
    const value = await readSetting('announcement')
    if (!value) return DEFAULT_ANNOUNCEMENT
    try {
      return { ...DEFAULT_ANNOUNCEMENT, ...(JSON.parse(value as string) as Partial<AnnouncementContent>) }
    } catch {
      return DEFAULT_ANNOUNCEMENT
    }
  },
  ['site-content:announcement'],
  { tags: [SITE_CONTENT_TAG], revalidate: TTL },
)

export const getAboutCached = unstable_cache(
  async (): Promise<AboutContent> => {
    const value = await readSetting('about')
    if (!value) return DEFAULT_ABOUT
    try {
      return { ...DEFAULT_ABOUT, ...(JSON.parse(value as string) as Partial<AboutContent>) }
    } catch {
      return DEFAULT_ABOUT
    }
  },
  ['site-content:about'],
  { tags: [SITE_CONTENT_TAG], revalidate: TTL },
)

export const getCoworkingCached = unstable_cache(
  async (): Promise<CoworkingContent> => {
    const value = await readSetting('coworking')
    if (!value) return DEFAULT_COWORKING
    try {
      return JSON.parse(value as string) as CoworkingContent
    } catch {
      return DEFAULT_COWORKING
    }
  },
  ['site-content:coworking'],
  { tags: [SITE_CONTENT_TAG], revalidate: TTL },
)

export const getGuidelinesCached = unstable_cache(
  async (): Promise<GuidelinesContent> => {
    const value = await readSetting('guidelines')
    return (value as GuidelinesContent) ?? DEFAULT_GUIDELINES
  },
  ['site-content:guidelines'],
  { tags: [SITE_CONTENT_TAG], revalidate: TTL },
)

// Homepage stat — a count, not content, but equally cacheable.
export const getMemberCountCached = unstable_cache(
  async (): Promise<number> => {
    const { count } = await createAdminClient()
      .from('coworking_members')
      .select('id', { count: 'exact', head: true })
    return count ?? 0
  },
  ['site-content:member-count'],
  { tags: [SITE_CONTENT_TAG], revalidate: TTL },
)
