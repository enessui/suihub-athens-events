import type { MetadataRoute } from 'next'
import { getEventsCached } from '@/lib/site-content'
import { safe } from '@/lib/supabase/safe'
import { siteUrl } from '@/lib/site-url'
import type { EventRow } from '@/lib/events'

// Only public pages belong here. /admin, /auth, /tv and the QR helper are
// excluded (and disallowed in robots.ts).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const now = new Date()

  // Signal real freshness on the calendar from the newest event.
  const events = await safe(getEventsCached, [] as EventRow[])
  const newest = events.reduce<Date | null>((latest, e) => {
    const d = new Date(e.created_at)
    return Number.isNaN(d.getTime()) ? latest : !latest || d > latest ? d : latest
  }, null)

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/events`, lastModified: newest ?? now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/coworking`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/reserve`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/meeting-room`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/guidelines`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ]
}
