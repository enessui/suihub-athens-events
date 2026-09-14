'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, CalendarDays, MapPin, Pencil, Save, X, Plus, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AnimatedTimeline } from '@/components/animated-timeline'
import { updateAbout } from '@/app/about/actions'
import { youtubeEmbed, type AboutContent } from '@/lib/about'

const CARD = 'rounded-2xl border-2 border-primary/40 bg-card/70 backdrop-blur-sm'

// Render the hero title with the word "Athens" given an animated shimmer.
function renderHeroTitle(title: string) {
  const idx = title.toLowerCase().indexOf('athens')
  if (idx === -1) return title
  return (
    <>
      {title.slice(0, idx)}
      <span className="athens-shimmer">{title.slice(idx, idx + 6)}</span>
      {title.slice(idx + 6)}
    </>
  )
}

export function AboutClient({
  content: initial,
  isAdmin,
  memberCount,
}: {
  content: AboutContent
  isAdmin: boolean
  memberCount: number
}) {
  const [content, setContent] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const d = editing ? draft : content

  function set<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    startTransition(async () => {
      const result = await updateAbout(draft)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setContent(draft)
      setEditing(false)
      toast.success('Main page updated')
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      {/* Admin toolbar */}
      {isAdmin && (
        <div className="mb-4 flex justify-end gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setDraft(content); setEditing(false) }} disabled={isPending}>
                <X className="size-4" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={isPending}>
                <Save className="size-4" /> {isPending ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => { setDraft(content); setEditing(true) }}>
              <Pencil className="size-4" /> Edit page
            </Button>
          )}
        </div>
      )}

      {/* Hero */}
      <section className={`overflow-hidden ${CARD}`}>
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-center p-6 md:p-10">
            {editing ? (
              <>
                <Textarea className="mt-5 text-2xl font-bold" rows={2} value={draft.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
                <Textarea className="mt-3" rows={4} value={draft.heroIntro} onChange={(e) => set('heroIntro', e.target.value)} />
              </>
            ) : (
              <>
                <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight md:text-5xl">
                  {renderHeroTitle(d.heroTitle)}
                </h1>
                <p className="mt-4 text-pretty text-lg text-muted-foreground">{d.heroIntro}</p>
              </>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/events" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                <CalendarDays className="size-4" />
                See what&apos;s on
              </Link>
              <Link href="/coworking" className="inline-flex items-center gap-2 rounded-full border-2 border-primary/40 bg-card px-6 py-3 text-sm font-semibold transition hover:bg-muted">
                Visit the space
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="relative min-h-64 md:min-h-full">
            <Image
              src="/hub/hub-exterior.jpg"
              alt="The SuiHub Athens building at night"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
        {d.stats.map((s, i) => (
          <div key={i} className={`${CARD} p-3 text-center sm:p-5`}>
            {editing ? (
              <div className="flex flex-col gap-1">
                <Input className="text-center text-lg font-bold" value={draft.stats[i]?.value ?? ''} onChange={(e) => set('stats', draft.stats.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
                <Input className="text-center text-xs" value={draft.stats[i]?.label ?? ''} onChange={(e) => set('stats', draft.stats.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
              </div>
            ) : (
              <>
                <p className="text-[clamp(1.15rem,5.5vw,2.25rem)] font-bold leading-none tracking-tight text-primary">{s.value}</p>
                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
              </>
            )}
          </div>
        ))}
      </section>

      {/* Video + Timeline side by side */}
      <section className="mt-8 grid items-start gap-6 md:grid-cols-2">
        {/* Video */}
        <div>
          <div className={`overflow-hidden ${CARD}`}>
            {editing && (
              <div className="p-3">
                <Input placeholder="YouTube URL or video id" value={draft.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} />
              </div>
            )}
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={youtubeEmbed(d.videoUrl)}
                title="SuiHub Athens"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
          <div className="mt-3 text-right">
            <Link href="/gallery" className="text-sm text-primary hover:underline">See more in the gallery →</Link>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">How we got here</h2>
          {editing ? (
            <div className="mt-4 flex flex-col gap-3">
              {draft.timeline.map((t, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <Input value={t.date} onChange={(e) => set('timeline', draft.timeline.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} placeholder="Date" />
                  <Textarea rows={2} value={t.text} onChange={(e) => set('timeline', draft.timeline.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} placeholder="What happened" />
                  <Button variant="ghost" size="sm" className="self-end text-destructive" onClick={() => set('timeline', draft.timeline.filter((_, j) => j !== i))}>
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="self-start" onClick={() => set('timeline', [...draft.timeline, { date: '', text: '' }])}>
                <Plus className="size-4" /> Add milestone
              </Button>
            </div>
          ) : (
            <AnimatedTimeline items={d.timeline} />
          )}
        </div>
      </section>

      {/* Location */}
      <section className={`mt-10 overflow-hidden ${CARD}`}>
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="size-5 text-primary" />
              Come by
            </div>
            {editing ? (
              <Textarea className="mt-3" rows={3} value={draft.locationIntro} onChange={(e) => set('locationIntro', e.target.value)} />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{d.locationIntro}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/coworking" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                Plan your visit
              </Link>
              <a href="https://maps.google.com/?q=SuiHub+Athens" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/40 px-5 py-2.5 text-sm font-semibold transition hover:bg-muted">
                <MapPin className="size-4" />
                Google Maps
              </a>
            </div>
          </div>
          <div className="min-h-64">
            <iframe
              title="SuiHub Athens location"
              src="https://www.google.com/maps?q=SuiHub%20Athens&output=embed"
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-full min-h-64 w-full"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
