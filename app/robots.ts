import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Private or non-content routes: keep them out of search results.
        disallow: ['/admin', '/auth', '/tv', '/checkin'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
