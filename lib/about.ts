export type AboutContent = {
  heroTitle: string
  heroIntro: string
  videoUrl: string // full YouTube URL or embed id
  stats: { value: string; label: string }[]
  unique: { title: string; body: string }[]
  timeline: { date: string; text: string }[]
  locationIntro: string
}

export const DEFAULT_ABOUT: AboutContent = {
  heroTitle: 'The home of builders in Athens.',
  heroIntro:
    'SuiHub Athens is the biggest SuiHub in the world, a space for developers, creators, and builders to connect, learn, create, and accelerate their biggest ideas. Powered by Sui.',
  videoUrl: 'WTG1gtilnUs',
  stats: [
    { value: '80+', label: 'Events hosted' },
    { value: '3,000+', label: 'Attendees' },
    { value: '3,200+', label: 'Hours of coworking' },
  ],
  unique: [
    {
      title: 'A flagship hub',
      body: 'Home to teams and functions across Sui and Mysten Labs, the only physical workspace for the Sui Foundation, with 30+ employees on site.',
    },
    {
      title: 'Education & onboarding',
      body: 'The learning hub for the region: bootcamps, hackathons, and hands-on training that bring new builders into the ecosystem.',
    },
    {
      title: 'Open to any chain',
      body: 'A tech hub that goes beyond Web3, hosting collaborations across industries and championing real Web2 adoption.',
    },
    {
      title: 'Free & open to all',
      body: 'Coworking is free, open, and accessible to everyone, regardless of background. Walk in, plug in, and build.',
    },
  ],
  timeline: [
    { date: 'Spring 2024', text: '12 months of complete renovation of a monumental space begins.' },
    { date: 'March 11, 2025', text: 'SuiHub Athens opens its doors.' },
    { date: 'June 2025', text: 'Three months in, SuiHub has already hosted 25 events.' },
    { date: 'June 26, 2025', text: 'Official grand opening, with 400+ attendees, including government officials, journalists, and CEOs.' },
    { date: 'June 2026', text: '12 months on: 80+ events hosted, including bootcamps, hackathons, consortiums, and more.' },
  ],
  locationIntro:
    "Join discussions, attend events, and build alongside contributors and enthusiasts from across the ecosystem. Come for free coworking. Everyone's welcome.",
}

// Accepts a full YouTube URL or a bare video id and returns the embed URL.
export function youtubeEmbed(urlOrId: string): string {
  const s = (urlOrId || '').trim()
  const m =
    s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/) ||
    s.match(/^([\w-]{6,})$/)
  const id = m ? m[1] : 'WTG1gtilnUs'
  return `https://www.youtube-nocookie.com/embed/${id}`
}
