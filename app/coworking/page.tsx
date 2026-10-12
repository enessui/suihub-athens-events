import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, UserCheck, CalendarDays, AlertTriangle, DoorOpen, MapPin } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { CoworkingClient } from '@/components/coworking/coworking-client'
import { OpenStatus } from '@/components/coworking/open-status'
import { NewsletterSignup } from '@/components/coworking/newsletter-signup'
import { OriginsMap } from '@/components/coworking/origins-map'
import { SpaceSwitcher, type Space } from '@/components/coworking/space-switcher'
import { MeetingRoomBooker } from '@/components/meeting-room/meeting-room-booker'
import { getMeetingBookings } from '@/app/meeting-room/actions'
import { firstBookableDate, type MeetingBooking } from '@/lib/meeting-room'
import { getCoworkingCached, getMemberCountCached, getEventsCached, getOriginsCached } from '@/lib/site-content'
import { DEFAULT_COWORKING } from '@/lib/coworking'
import { DEFAULT_ORIGINS } from '@/lib/coworker-origins'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'
import { createClient } from '@/lib/supabase/server'
import { eventDayKey, formatEventTime, type EventRow } from '@/lib/events'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<{ space?: string }> }

async function activeSpace(searchParams: Props['searchParams']): Promise<Space> {
  return (await searchParams).space === 'launchpad' ? 'launchpad' : 'lounge'
}

export async function generateMetadata({ searchParams }: Props) {
  return (await activeSpace(searchParams)) === 'launchpad'
    ? {
        title: 'The Launchpad · SuiHub Athens',
        description: 'Book The Launchpad, the private meeting room at SuiHub Athens.',
      }
    : {
        title: 'Coworking Lounge · SuiHub Athens',
        description: 'Free, open coworking space in Athens. Walk-ins welcome. Desks, coffee, Wi-Fi, community.',
      }
}

function athensToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Athens' })
}

export default async function CoworkingPage({ searchParams }: Props) {
  const space = await activeSpace(searchParams)
  const bookingDate = firstBookableDate()

  // Each tab loads only its own data.
  const lounge = space === 'lounge'
  const [content, trueAdmin, memberCount, events, origins, bookings] = await Promise.all([
    lounge ? safe(getCoworkingCached, DEFAULT_COWORKING) : DEFAULT_COWORKING,
    isAdminSafe(),
    lounge ? safe(getMemberCountCached, 0) : 0,
    lounge ? safe(getEventsCached, [] as EventRow[]) : ([] as EventRow[]),
    lounge ? safe(getOriginsCached, DEFAULT_ORIGINS) : DEFAULT_ORIGINS,
    lounge ? ([] as MeetingBooking[]) : safe(() => getMeetingBookings(bookingDate), [] as MeetingBooking[]),
  ])

  const isAdmin = await getEffectiveIsAdmin(trueAdmin)
  const todayKey = athensToday()

  const isClosure = (e: EventRow) => /clos/i.test(e.title)
  const todaysEvents = events.filter((e) => eventDayKey(e.start_time) === todayKey && !isClosure(e))
  const upcomingClosures = events
    .filter((e) => isClosure(e) && eventDayKey(e.start_time) >= todayKey)
    .slice(0, 2)

  // FAQ structured data for SEO ("free coworking Athens")
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/coworking" />
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10">
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to events
          </Link>

          <SpaceSwitcher active={space} />

          {space === 'launchpad' ? (
            <>
              <div className="mb-6">
                <h1 className="text-4xl font-bold tracking-tight">The Launchpad</h1>
                <p className="mt-3 text-muted-foreground">
                  Our private meeting room on the 3rd floor. Pick a weekday, a start time and how long
                  you need it. An admin confirms each request.
                </p>
              </div>

              <div className="relative mb-8 aspect-[16/7] overflow-hidden rounded-xl border-2 border-primary/40 bg-muted">
                <Image
                  src="/hub/cowork-meeting.jpg"
                  alt="The Launchpad meeting room"
                  fill
                  sizes="(max-width: 768px) 100vw, 688px"
                  className="object-cover"
                />
              </div>

              <MeetingRoomBooker initialDate={bookingDate} initialBookings={bookings} isAdmin={isAdmin} />
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-4xl font-bold tracking-tight">Coworking Lounge</h1>
                <p className="mt-3 text-muted-foreground">
                  A free, open, community-driven workspace in the heart of Athens.
                </p>
              </div>

              {/* Live status + community size */}
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <OpenStatus />
                {memberCount > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
                    <UserCheck className="size-4 text-primary" />
                    {memberCount.toLocaleString()} registered
                  </span>
                )}
              </div>

              {/* Closure notices */}
              {upcomingClosures.length > 0 && (
                <div className="mb-8 flex flex-col gap-2">
                  {upcomingClosures.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800"
                    >
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>
                        <span className="font-semibold">
                          {new Date(e.start_time).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'Europe/Athens',
                          })}
                        </span>{' '}
                        · {e.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Today at SuiHub */}
              {todaysEvents.length > 0 && (
                <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                    <CalendarDays className="size-4" />
                    Today at SuiHub
                  </p>
                  <ul className="flex flex-col gap-2">
                    {todaysEvents.map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium">{e.title}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatEventTime(e.start_time, null)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Photos of the space */}
              <div className="mb-10 grid grid-cols-3 gap-2">
                {[
                  { src: '/hub/cowork-bar.jpg', alt: 'The bar, builders welcome' },
                  { src: '/hub/cowork-meeting.jpg', alt: 'The Launchpad meeting room' },
                  { src: '/hub/cowork-lobby.jpg', alt: 'Reception and lounge' },
                ].map((p) => (
                  <div key={p.src} className="group relative aspect-square overflow-hidden rounded-xl border-2 border-primary/40 bg-muted">
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="(max-width: 768px) 33vw, 240px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>

              <CoworkingClient content={content} isAdmin={isAdmin} />

              <OriginsMap content={origins} isAdmin={isAdmin} />

              {/* Need a private space? */}
              <Link
                href="/coworking?space=launchpad"
                className="mt-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex items-center gap-3">
                  <DoorOpen className="size-5 shrink-0 text-primary" />
                  <span>
                    <span className="block font-semibold">Need a private space?</span>
                    <span className="text-sm text-muted-foreground">
                      Request The Launchpad, our 3rd floor meeting room, for as long as you need it.
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-primary">Book →</span>
              </Link>
            </>
          )}

          {/* Map */}
          <div className="mt-10">
            <p className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <MapPin className="size-5 text-primary" />
              Find us
            </p>
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="SuiHub Athens location"
                src="https://www.google.com/maps?q=SuiHub%20Athens&output=embed"
                width="100%"
                height="320"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full"
              />
            </div>
            <a
              href="https://maps.google.com/?q=SuiHub+Athens"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <MapPin className="size-4" />
              Open in Google Maps
            </a>
          </div>

          <NewsletterSignup />
        </div>
      </div>

      {/* FAQ schema for SEO */}
      {lounge && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </main>
  )
}
