/** @type {import('next').NextConfig} */

// Content-Security-Policy. Kept permissive enough for the app's real
// dependencies — Supabase, Cloudflare Turnstile, Vercel Analytics, and the
// YouTube embed on the About page — while still constraining the obvious
// XSS/exfiltration surface. 'unsafe-inline' is required because Next injects
// inline hydration scripts/styles without a nonce. 'unsafe-eval' is added only
// in development, where React uses eval() for debugging; production stays strict.
const isDev = process.env.NODE_ENV !== 'production'
const scriptSrc =
  "script-src 'self' 'unsafe-inline' " +
  (isDev ? "'unsafe-eval' " : '') +
  'https://challenges.cloudflare.com https://va.vercel-scripts.com'

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  scriptSrc,
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "frame-src https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
]

const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
