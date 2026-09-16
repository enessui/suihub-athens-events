/**
 * Absolute base URL for canonical links (sitemap, robots).
 * Prefers an explicit NEXT_PUBLIC_SITE_URL (set this if you add a custom
 * domain), otherwise falls back to the Vercel production domain, then local.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}
