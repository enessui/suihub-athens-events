// The "Visit us" guide. Admins edit it in place; it's stored as JSON in
// site_settings under 'visit_guide'.

export type GuideFloor = { level: string; name: string; note: string }
export type GuideUse = { image: string; title: string; text: string; cta: string; href: string }
export type GuideTip = { title: string; text: string; linkLabel: string; href: string }

export type VisitGuide = {
  title: string
  intro: string
  heroImage: string
  /** Shown under "Finding us" and used for the map and directions when set. */
  address: string
  findingUs: { image: string; caption: string }[]
  floorsImage: string
  floors: GuideFloor[]
  uses: GuideUse[]
  tips: GuideTip[]
}

export const DEFAULT_VISIT_GUIDE: VisitGuide = {
  title: 'Plan your visit',
  intro:
    "Where to find us, when we're open, and what you can do once you're here. Coworking is free and walk-ins are always welcome.",
  heroImage: '/visit/welcome.jpg',
  address: '',
  findingUs: [
    { image: '/visit/exterior.jpg', caption: 'Look for the blue SuiHub banner on the building.' },
    { image: '/visit/entrance.jpg', caption: 'The entrance is at street level.' },
  ],
  floorsImage: '/visit/floors.jpg',
  floors: [
    { level: '3rd floor', name: 'The Launchpad', note: 'Bookable meeting room' },
    { level: 'Ground floor', name: 'Coworking Lounge', note: 'Open desks, coffee and Wi-Fi' },
    { level: 'Floor −1', name: 'Gaming Zone', note: 'For a break between sessions' },
  ],
  uses: [
    { image: '/visit/lounge.jpg', title: 'Cowork for free', text: 'Grab a desk in the Coworking Lounge. Coffee and Wi-Fi are on us.', cta: 'See the lounge', href: '/coworking' },
    { image: '/hub/cowork-meeting.jpg', title: 'Book The Launchpad', text: 'A private meeting room on the 3rd floor for calls and team sessions.', cta: 'Request a time', href: '/coworking?space=launchpad' },
    { image: '/visit/events.jpg', title: 'Come to an event', text: 'Workshops, talks and meetups for builders.', cta: 'See what’s on', href: '/events' },
    { image: '/visit/host.jpg', title: 'Host your own event', text: 'Got an idea for a talk or a workshop? Tell us about it.', cta: 'Request to host', href: '/request-event' },
    { image: '/visit/community.jpg', title: 'Meet the community', text: 'Developers, founders and creators from all over the world.', cta: 'See the gallery', href: '/gallery' },
    { image: '/visit/gaming.jpg', title: 'Take a break', text: 'Head down to the Gaming Zone on floor −1.', cta: '', href: '' },
  ],
  tips: [
    { title: 'Register once, for free.', text: "Sign up once, then drop in whenever we're open.", linkLabel: 'Register on the coworking page', href: '/coworking' },
    { title: 'Bring your laptop.', text: 'Desks, Wi-Fi and coffee are ready for you.', linkLabel: '', href: '' },
    { title: 'Read the house rules.', text: 'Our community guidelines take two minutes.', linkLabel: 'Read the guidelines', href: '/guidelines' },
    { title: 'Questions?', text: 'Email the team any time.', linkLabel: 'suihubathens@sui.io', href: 'mailto:suihubathens@sui.io' },
  ],
}

/** Photos that ship with the site, offered in the photo picker alongside the gallery. */
export const BUILT_IN_PHOTOS = [
  '/visit/welcome.jpg',
  '/visit/exterior.jpg',
  '/visit/entrance.jpg',
  '/visit/floors.jpg',
  '/visit/lounge.jpg',
  '/visit/events.jpg',
  '/visit/host.jpg',
  '/visit/community.jpg',
  '/visit/gaming.jpg',
  '/hub/cowork-meeting.jpg',
  '/hub/cowork-bar.jpg',
  '/hub/cowork-lobby.jpg',
  '/hub/hub-exterior.jpg',
  '/hub/hub-hall.jpg',
  '/hub/hub-reception.jpg',
  '/hub/hub-rooftop.jpg',
]

export function mapsQuery(guide: Pick<VisitGuide, 'address'>): string {
  return guide.address.trim() || 'SuiHub Athens'
}

// ---- Validation ---------------------------------------------------------
// Everything below runs on whatever is stored and on every admin save. An
// image must be one next/image is configured to serve (a file in /public or
// a public Supabase Storage object), or the page would crash; links must be
// on-site, https or mailto, so nobody can save a javascript: URL.

const LOCAL_IMAGE = /^\/[\w\-./]+\.(?:jpe?g|png|webp|avif)$/i
const STORAGE_IMAGE = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/\S+$/i

export function safeImage(value: unknown, fallback: string): string {
  const s = typeof value === 'string' ? value.trim() : ''
  if (LOCAL_IMAGE.test(s) && !s.startsWith('//') && !s.includes('..')) return s
  if (STORAGE_IMAGE.test(s)) return s
  return fallback
}

export function safeHref(value: unknown): string {
  const s = typeof value === 'string' ? value.trim() : ''
  if (/^\/(?!\/)\S*$/.test(s)) return s
  if (/^https:\/\/\S+$/i.test(s) || /^mailto:[^\s@]+@[^\s@]+$/i.test(s)) return s
  return ''
}

function text(value: unknown, max: number, fallback = ''): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback
}

function list<T>(value: unknown, max: number, map: (item: Record<string, unknown>) => T | null): T[] {
  if (!Array.isArray(value)) return []
  return value
    .slice(0, max)
    .map((v) => (v && typeof v === 'object' ? map(v as Record<string, unknown>) : null))
    .filter((v): v is T => v !== null)
}

export function normalizeVisitGuide(input: unknown): VisitGuide {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const d = DEFAULT_VISIT_GUIDE

  const findingUs = list(raw.findingUs, 2, (f) => ({
    image: safeImage(f.image, ''),
    caption: text(f.caption, 200),
  })).filter((f) => f.image)

  return {
    title: text(raw.title, 80) || d.title,
    intro: text(raw.intro, 400, d.intro),
    heroImage: safeImage(raw.heroImage, d.heroImage),
    address: text(raw.address, 160),
    findingUs: Array.isArray(raw.findingUs) ? findingUs : d.findingUs,
    floorsImage: safeImage(raw.floorsImage, d.floorsImage),
    floors: Array.isArray(raw.floors)
      ? list(raw.floors, 10, (f) => {
          const name = text(f.name, 60)
          return name ? { level: text(f.level, 30), name, note: text(f.note, 120) } : null
        })
      : d.floors,
    uses: Array.isArray(raw.uses)
      ? list(raw.uses, 12, (u) => {
          const title = text(u.title, 60)
          if (!title) return null
          const href = safeHref(u.href)
          return {
            image: safeImage(u.image, d.uses[0].image),
            title,
            text: text(u.text, 200),
            cta: href ? text(u.cta, 40) || 'Learn more' : '',
            href,
          }
        })
      : d.uses,
    tips: Array.isArray(raw.tips)
      ? list(raw.tips, 10, (t) => {
          const title = text(t.title, 80)
          const body = text(t.text, 200)
          if (!title && !body) return null
          const href = safeHref(t.href)
          return { title, text: body, linkLabel: href ? text(t.linkLabel, 60) || href : '', href }
        })
      : d.tips,
  }
}
