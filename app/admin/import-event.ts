'use server'

import { lookup } from 'node:dns/promises'
import net from 'node:net'
import { createClient } from '@/lib/supabase/server'

// Block requests that resolve to private / loopback / link-local ranges, so an
// attacker-controlled image URL on an imported page can't reach internal
// services (SSRF), e.g. the cloud metadata endpoint.
function isPrivateAddress(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    const p = ip.split('.').map(Number)
    return (
      p[0] === 0 ||
      p[0] === 10 ||
      p[0] === 127 ||
      (p[0] === 169 && p[1] === 254) ||
      (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
      (p[0] === 192 && p[1] === 168)
    )
  }
  const v6 = ip.toLowerCase()
  return v6 === '::1' || v6 === '::' || v6.startsWith('fe80') || v6.startsWith('fc') || v6.startsWith('fd')
}

// True only for an https URL whose host resolves to a public address.
async function isSafeRemoteImageUrl(raw: string): Promise<boolean> {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return false
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
  try {
    const { address } = await lookup(u.hostname)
    return !isPrivateAddress(address)
  } catch {
    return false
  }
}

export type ImportedEvent = {
  title?: string
  start_time?: string // ISO
  end_time?: string // ISO
  description?: string
  room?: string
  host?: string
  image_url?: string
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function metaContent(html: string, prop: string): string | undefined {
  // matches <meta property="og:title" content="..."> in any attribute order
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    'i',
  )
  const alt = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
    'i',
  )
  const m = html.match(re) ?? html.match(alt)
  return m ? decode(m[1]) : undefined
}

// Pull the first schema.org Event object out of any JSON-LD blocks
function jsonLdEvent(html: string): Record<string, unknown> | null {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b[1].trim())
      const arr = Array.isArray(parsed) ? parsed : parsed['@graph'] ?? [parsed]
      for (const node of Array.isArray(arr) ? arr : [arr]) {
        const t = node?.['@type']
        const types = Array.isArray(t) ? t : [t]
        if (types.some((x: string) => typeof x === 'string' && x.toLowerCase().includes('event'))) {
          return node
        }
      }
    } catch {
      // skip malformed block
    }
  }
  return null
}

function locationName(loc: unknown): string | undefined {
  if (!loc) return undefined
  if (typeof loc === 'string') return loc
  const l = loc as Record<string, unknown>
  if (typeof l.name === 'string') return l.name
  const addr = l.address
  if (typeof addr === 'string') return addr
  if (addr && typeof addr === 'object') {
    const a = addr as Record<string, unknown>
    return [a.streetAddress, a.addressLocality].filter(Boolean).join(', ') || undefined
  }
  return undefined
}

export async function importEventFromUrl(
  url: string,
): Promise<{ data?: ImportedEvent; error?: string }> {
  // Admin-only
  const supabase = await createClient()
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return { error: 'Not authorized' }

  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return { error: 'Please enter a valid URL.' }
  }
  const host = parsed.hostname.replace(/^www\./, '')
  if (!/(^|\.)(lu\.ma|luma\.com|meetup\.com)$/.test(host)) {
    return { error: 'Only Luma (lu.ma) and Meetup links are supported.' }
  }

  let html: string
  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        Accept: 'text/html',
      },
    })
    if (!res.ok) return { error: `Could not fetch the page (HTTP ${res.status}).` }
    html = await res.text()
  } catch {
    return { error: 'Could not reach that link. Check the URL and try again.' }
  }

  const ld = jsonLdEvent(html)
  const out: ImportedEvent = {}

  out.title = (ld?.name as string) || metaContent(html, 'og:title') || metaContent(html, 'twitter:title')

  const start = ld?.startDate as string | undefined
  const end = ld?.endDate as string | undefined
  if (start && !Number.isNaN(Date.parse(start))) out.start_time = new Date(start).toISOString()
  if (end && !Number.isNaN(Date.parse(end))) out.end_time = new Date(end).toISOString()

  out.description =
    (ld?.description as string) || metaContent(html, 'og:description') || metaContent(html, 'description')
  if (out.description) out.description = decode(out.description).slice(0, 2000)

  out.room = locationName(ld?.location)
  const organizer = ld?.organizer as Record<string, unknown> | undefined
  if (organizer && typeof organizer.name === 'string') out.host = organizer.name

  const img = (ld?.image as unknown) || metaContent(html, 'og:image')
  const remoteImage = Array.isArray(img) ? (img[0] as string) : (img as string | undefined)
  if (remoteImage) {
    // Re-host into our own bucket so the URL stays stable; fall back to the
    // remote URL if the copy fails for any reason.
    out.image_url = (await rehostImage(supabase, remoteImage)) ?? remoteImage
  }

  if (!out.title && !out.start_time) {
    return { error: 'Could not read event details from that link.' }
  }
  return { data: out }
}

async function rehostImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  url: string,
): Promise<string | null> {
  try {
    if (!(await isSafeRemoteImageUrl(url))) return null
    const res = await fetch(url)
    if (!res.ok) return null
    const type = res.headers.get('content-type') || 'image/jpeg'
    if (!type.startsWith('image/')) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength === 0 || buf.byteLength > 10 * 1024 * 1024) return null
    const ext = type.split('/')[1]?.split('+')[0] || 'jpg'
    const path = `imported/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage
      .from('event-images')
      .upload(path, buf, { contentType: type, upsert: false })
    if (error) return null
    const {
      data: { publicUrl },
    } = supabase.storage.from('event-images').getPublicUrl(path)
    return publicUrl
  } catch {
    return null
  }
}
