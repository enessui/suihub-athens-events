import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { OpenStatus } from '@/components/coworking/open-status'
import { getCoworkingCached } from '@/lib/site-content'
import { DEFAULT_COWORKING } from '@/lib/coworking'
import { safe } from '@/lib/supabase/safe'

import welcome from '@/public/visit/welcome.jpg'
import exterior from '@/public/visit/exterior.jpg'
import entrance from '@/public/visit/entrance.jpg'
import floors from '@/public/visit/floors.jpg'
import lounge from '@/public/visit/lounge.jpg'
import events from '@/public/visit/events.jpg'
import host from '@/public/visit/host.jpg'
import community from '@/public/visit/community.jpg'
import gaming from '@/public/visit/gaming.jpg'
import launchpad from '@/public/hub/cowork-meeting.jpg'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Visit Us · SuiHub Athens',
  description: 'Where SuiHub Athens is, when it’s open, and what you can do there.',
}

const MAPS_URL = 'https://maps.google.com/?q=SuiHub+Athens'
const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=SuiHub+Athens'

const FLOORS = [
  { level: '3rd floor', name: 'The Launchpad', note: 'Bookable meeting room' },
  { level: 'Ground floor', name: 'Coworking Lounge', note: 'Open desks, coffee and Wi-Fi' },
  { level: 'Floor −1', name: 'Gaming Zone', note: 'For a break between sessions' },
]

const USES = [
  {
    photo: lounge,
    title: 'Cowork for free',
    text: 'Grab a desk in the Coworking Lounge. Coffee and Wi-Fi are on us.',
    href: '/coworking',
    cta: 'See the lounge',
  },
  {
    photo: launchpad,
    title: 'Book The Launchpad',
    text: 'A private meeting room on the 3rd floor for calls and team sessions.',
    href: '/coworking?space=launchpad',
    cta: 'Request a time',
  },
  {
    photo: events,
    title: 'Come to an event',
    text: 'Workshops, talks and meetups for builders.',
    href: '/events',
    cta: 'See what’s on',
  },
  {
    photo: host,
    title: 'Host your own event',
    text: 'Got an idea for a talk or a workshop? Tell us about it.',
    href: '/request-event',
    cta: 'Request to host',
  },
  {
    photo: community,
    title: 'Meet the community',
    text: 'Developers, founders and creators from all over the world.',
    href: '/gallery',
    cta: 'See the gallery',
  },
  {
    photo: gaming,
    title: 'Take a break',
    text: 'Head down to the Gaming Zone on floor −1.',
  },
]

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight">
      <Icon className="size-5 text-primary" />
      {children}
    </h2>
  )
}

export default async function VisitPage({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string }>
}) {
  // Old links to the meeting room tab that used to live here.
  if ((await searchParams).meeting) redirect('/coworking?space=launchpad')

  const coworking = await safe(getCoworkingCached, DEFAULT_COWORKING)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/reserve" />
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10">
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to events
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Plan your visit</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Where to find us, when we&apos;re open, and what you can do once you&apos;re here.
              Coworking is free and walk-ins are always welcome.
            </p>
          </div>

          <div className="relative mb-12 aspect-[16/7] overflow-hidden rounded-2xl bg-muted">
            <Image
              src={welcome}
              alt="Welcome to SuiHub, Athens sign"
              fill
              priority
              placeholder="blur"
              sizes="(max-width: 896px) 100vw, 816px"
              className="object-cover"
            />
          </div>

          {/* Finding us */}
          <section className="mb-12">
            <SectionTitle icon={MapPin}>Finding us</SectionTitle>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              {[
                { src: exterior, alt: 'The building, with the blue SuiHub banner', caption: 'Look for the blue SuiHub banner on the building.' },
                { src: entrance, alt: 'The street-level entrance', caption: 'The entrance is at street level.' },
              ].map((p) => (
                <figure key={p.caption}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                    <Image src={p.src} alt={p.alt} fill placeholder="blur" sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
                  </div>
                  <figcaption className="mt-2 text-sm text-muted-foreground">{p.caption}</figcaption>
                </figure>
              ))}
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <iframe
                title="SuiHub Athens on Google Maps"
                src="https://www.google.com/maps?q=SuiHub%20Athens&output=embed"
                width="100%"
                height="300"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={DIRECTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Navigation className="size-4" />
                Get directions
              </a>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm font-medium transition hover:bg-muted"
              >
                <MapPin className="size-4" />
                Open in Google Maps
              </a>
            </div>
          </section>

          {/* Hours + floors */}
          <div className="mb-12 grid gap-10 md:grid-cols-2">
            <section>
              <SectionTitle icon={Clock}>Opening hours</SectionTitle>
              <div className="mb-3">
                <OpenStatus />
              </div>
              <p className="font-semibold">{coworking.hoursWeekdays}</p>
              <p className="mt-2 text-sm text-muted-foreground">{coworking.hoursNote}</p>
            </section>

            <section>
              <SectionTitle icon={Building2}>Inside the building</SectionTitle>
              <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                <Image src={floors} alt="Floor sign: Coworking Lounge on 0, Gaming Zone on −1" fill placeholder="blur" sizes="(max-width: 768px) 100vw, 380px" className="object-cover" />
              </div>
              <ul className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
                {FLOORS.map((f) => (
                  <li key={f.level}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{f.level}</p>
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-sm text-muted-foreground">{f.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* What you can do */}
          <section className="mb-12">
            <SectionTitle icon={Sparkles}>What you can do here</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {USES.map((u) => {
                const body = (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <Image
                        src={u.photo}
                        alt=""
                        fill
                        placeholder="blur"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold">{u.title}</h3>
                      <p className="mt-1 flex-1 text-sm text-muted-foreground">{u.text}</p>
                      {u.cta && (
                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                          {u.cta}
                          <ArrowRight className="size-4" />
                        </span>
                      )}
                    </div>
                  </>
                )
                const card = 'group flex flex-col overflow-hidden rounded-xl border border-border bg-card'
                return u.href ? (
                  <Link key={u.title} href={u.href} className={`${card} transition-colors hover:border-primary/40`}>
                    {body}
                  </Link>
                ) : (
                  <div key={u.title} className={card}>
                    {body}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Before you come */}
          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <SectionTitle icon={CheckCircle2}>Before you come</SectionTitle>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <span className="font-semibold">Register once, for free.</span>{' '}
                <Link href="/coworking" className="text-primary hover:underline">
                  Sign up on the coworking page
                </Link>
                , then drop in whenever we&apos;re open.
              </li>
              <li>
                <span className="font-semibold">Bring your laptop.</span> Desks, Wi-Fi and coffee are
                ready for you.
              </li>
              <li>
                <span className="font-semibold">Read the house rules.</span>{' '}
                <Link href="/guidelines" className="text-primary hover:underline">
                  Our community guidelines
                </Link>{' '}
                take two minutes.
              </li>
              <li>
                <span className="font-semibold">Questions?</span> Email{' '}
                <a href="mailto:suihubathens@sui.io" className="text-primary hover:underline">
                  suihubathens@sui.io
                </a>
                .
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
