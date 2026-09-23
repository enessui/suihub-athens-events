import { unstable_cache } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { SITE_CONTENT_TAG, EVENTS_TAG, CHECKIN_TAG } from '@/lib/cache-tags'
import type { EventRow } from '@/lib/events'
import {
  getTodayCount,
  getMonthlyLeaderboard,
  getAllTimeLeaderboard,
  type LeaderboardEntry,
} from '@/app/checkin/actions'
import { DEFAULT_ANNOUNCEMENT, type AnnouncementContent } from '@/lib/announcement'
import { DEFAULT_ABOUT, type AboutContent } from '@/lib/about'
import { DEFAULT_COWORKING, type CoworkingContent } from '@/lib/coworking'
import { DEFAULT_GUIDELINES, type GuidelinesContent } from '@/lib/guidelines'
import { DEFAULT_ORIGINS, normalizeOrigins, type OriginsContent } from '@/lib/coworker-origins'

/**
 * Editable site content lives in `site_settings` and changes rarely, but was
 * being re-fetched from Supabase on every request (~380ms each, in a waterfall
 * behind the page's own queries). These readers cache it instead; admin edits
 * call revalidateTag(SITE_CONTENT_TAG) so changes still appear immediately.
 */
export { SITE_CONTENT_TAG }
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

export const getOriginsCached = unstable_cache(
  async (): Promise<OriginsContent> => {
    const value = await readSetting('coworker_origins')
    if (!value) return DEFAULT_ORIGINS
    try {
      return normalizeOrigins(JSON.parse(value as string))
    } catch {
      return DEFAULT_ORIGINS
    }
  },
  ['site-content:coworker-origins'],
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

/**
 * The events list, read on the calendar, coworking page and TV display.
 * Invalidated by EVENTS_TAG whenever an admin creates/edits/deletes an event.
 */
export const getEventsCached = unstable_cache(
  async (): Promise<EventRow[]> => {
    const { data } = await publicClient()
      .from('events')
      .select('*')
      .order('start_time', { ascending: true })
    return (data ?? []) as EventRow[]
  },
  ['events:all'],
  { tags: [EVENTS_TAG], revalidate: 60 },
)

/**
 * Check-in derived data. These scan coworking_checkins on every request
 * otherwise; CHECKIN_TAG is invalidated when someone checks in or an admin
 * edits the leaderboard, so they stay accurate.
 */
export const getTodayCountCached = unstable_cache(
  async (): Promise<number> => getTodayCount(),
  ['checkins:today-count'],
  { tags: [CHECKIN_TAG], revalidate: 60 },
)

export const getMonthlyLeaderboardCached = unstable_cache(
  async (): Promise<LeaderboardEntry[]> => getMonthlyLeaderboard(),
  ['checkins:leaderboard-monthly'],
  { tags: [CHECKIN_TAG], revalidate: 60 },
)

export const getAllTimeLeaderboardCached = unstable_cache(
  async (): Promise<LeaderboardEntry[]> => getAllTimeLeaderboard(),
  ['checkins:leaderboard-alltime'],
  { tags: [CHECKIN_TAG], revalidate: 60 },
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
