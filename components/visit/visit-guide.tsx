'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ImageIcon,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OpenStatus } from '@/components/coworking/open-status'
import { PhotoPicker } from '@/components/visit/photo-picker'
import { updateVisitGuide } from '@/app/reserve/actions'
import { DEFAULT_VISIT_GUIDE, mapsQuery, type VisitGuide } from '@/lib/visit-guide'

type ListKey = 'findingUs' | 'floors' | 'uses' | 'tips'
type Item<K extends ListKey> = VisitGuide[K][number]

const BLANK = {
  floors: { level: '', name: '', note: '' },
  uses: { image: DEFAULT_VISIT_GUIDE.uses[0].image, title: '', text: '', cta: '', href: '' },
  tips: { title: '', text: '', linkLabel: '', href: '' },
} satisfies { [K in Exclude<ListKey, 'findingUs'>]: Item<K> }

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-tight">
      <Icon className="size-5 text-primary" />
      {children}
    </h2>
  )
}

function Photo({
  src,
  alt,
  sizes,
  priority,
  className,
  editing,
  onChange,
}: {
  src: string
  alt: string
  sizes: string
  priority?: boolean
  className: string
  editing: boolean
  onChange: () => void
}) {
  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      {editing && (
        <button
          type="button"
          onClick={onChange}
          className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition hover:bg-background"
        >
          <ImageIcon className="size-3.5" />
          Change photo
        </button>
      )}
    </div>
  )
}

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label={label} onClick={onClick}>
      <Trash2 className="size-4 text-destructive" />
    </Button>
  )
}

export function VisitGuideView({
  guide: initial,
  hours,
  isAdmin,
  galleryPhotos,
}: {
  guide: VisitGuide
  hours: { weekdays: string; note: string }
  isAdmin: boolean
  /** Only sent to admins, for the photo picker. */
  galleryPhotos: string[]
}) {
  const [guide, setGuide] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState<{ current: string; apply: (src: string) => void } | null>(null)
  const [isPending, startTransition] = useTransition()

  const g = editing ? draft : guide
  const query = encodeURIComponent(mapsQuery(g))

  function set<K extends keyof VisitGuide>(key: K, value: VisitGuide[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }
  function setItem<K extends ListKey>(key: K, i: number, part: Partial<Item<K>>) {
    setDraft((d) => ({
      ...d,
      [key]: (d[key] as Item<K>[]).map((x, j) => (j === i ? { ...x, ...part } : x)),
    }))
  }
  function removeItem(key: ListKey, i: number) {
    setDraft((d) => ({ ...d, [key]: (d[key] as unknown[]).filter((_, j) => j !== i) }))
  }
  function addItem<K extends Exclude<ListKey, 'findingUs'>>(key: K) {
    setDraft((d) => ({ ...d, [key]: [...(d[key] as Item<K>[]), { ...BLANK[key] }] }))
  }
  function pickPhoto(current: string, apply: (src: string) => void) {
    setPicking({ current, apply })
  }

  function save() {
    startTransition(async () => {
      const result = await updateVisitGuide(draft)
      if (result.error || !result.guide) {
        toast.error(result.error ?? 'Could not save')
        return
      }
      // Show what was actually stored (empty rows dropped, unsafe links removed).
      setGuide(result.guide)
      setDraft(result.guide)
      setEditing(false)
      toast.success('Visitor guide updated')
    })
  }

  return (
    <>
      {isAdmin && (
        <div className="sticky top-2 z-20 mb-6 flex flex-wrap items-center justify-end gap-2">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft(DEFAULT_VISIT_GUIDE)}
                disabled={isPending}
                title="Fill in the original text and photos (nothing is saved until you press Save)"
              >
                <RotateCcw className="size-4" /> Restore defaults
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDraft(guide)
                  setEditing(false)
                }}
                disabled={isPending}
              >
                <X className="size-4" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={isPending}>
                <Save className="size-4" /> {isPending ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(guide)
                setEditing(true)
              }}
            >
              <Pencil className="size-4" /> Edit guide
            </Button>
          )}
        </div>
      )}

      {/* Intro */}
      <div className="mb-8">
        {editing ? (
          <div className="grid gap-2">
            <Input
              aria-label="Title"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              className="h-auto py-2 text-2xl font-bold md:text-2xl"
            />
            <Textarea aria-label="Intro" value={draft.intro} onChange={(e) => set('intro', e.target.value)} rows={3} />
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight">{g.title}</h1>
            {g.intro && <p className="mt-3 max-w-2xl text-muted-foreground">{g.intro}</p>}
          </>
        )}
      </div>

      <Photo
        src={g.heroImage}
        alt="SuiHub Athens"
        priority
        sizes="(max-width: 896px) 100vw, 816px"
        className="mb-12 aspect-[16/7] rounded-2xl"
        editing={editing}
        onChange={() => pickPhoto(draft.heroImage, (src) => set('heroImage', src))}
      />

      {/* Finding us */}
      <section className="mb-12">
        <SectionTitle icon={MapPin}>Finding us</SectionTitle>
        {editing ? (
          <div className="mb-4 grid gap-1.5">
            <label htmlFor="guide-address" className="text-sm font-medium">
              Street address (optional; used for the map and directions)
            </label>
            <Input
              id="guide-address"
              value={draft.address}
              placeholder="e.g. Street name 12, Athens 105 xx"
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
        ) : (
          g.address && <p className="mb-4 font-semibold">{g.address}</p>
        )}

        {g.findingUs.length > 0 && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {g.findingUs.map((p, i) => (
              <figure key={i}>
                <Photo
                  src={p.image}
                  alt={p.caption || 'SuiHub Athens'}
                  sizes="(max-width: 640px) 100vw, 400px"
                  className="aspect-[4/3] rounded-xl"
                  editing={editing}
                  onChange={() => pickPhoto(p.image, (src) => setItem('findingUs', i, { image: src }))}
                />
                {editing ? (
                  <Input
                    aria-label="Caption"
                    className="mt-2"
                    value={p.caption}
                    onChange={(e) => setItem('findingUs', i, { caption: e.target.value })}
                  />
                ) : (
                  p.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{p.caption}</figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border">
          <iframe
            title="SuiHub Athens on Google Maps"
            src={`https://www.google.com/maps?q=${query}&output=embed`}
            width="100%"
            height="300"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block w-full"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Navigation className="size-4" />
            Get directions
          </a>
          <a
            href={`https://maps.google.com/?q=${query}`}
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
          <p className="font-semibold">{hours.weekdays}</p>
          <p className="mt-2 text-sm text-muted-foreground">{hours.note}</p>
          {editing && (
            <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Hours come from the{' '}
              <Link href="/coworking" className="font-medium text-primary hover:underline">
                coworking page
              </Link>
              ; edit them there.
            </p>
          )}
        </section>

        <section>
          <SectionTitle icon={Building2}>Inside the building</SectionTitle>
          <Photo
            src={g.floorsImage}
            alt="Floor sign"
            sizes="(max-width: 768px) 100vw, 380px"
            className="mb-4 aspect-[16/9] rounded-xl"
            editing={editing}
            onChange={() => pickPhoto(draft.floorsImage, (src) => set('floorsImage', src))}
          />
          {editing ? (
            <div className="flex flex-col gap-3">
              {draft.floors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-border p-2">
                  <div className="grid flex-1 gap-1.5">
                    <Input aria-label="Floor" placeholder="Floor, e.g. 2nd floor" value={f.level} onChange={(e) => setItem('floors', i, { level: e.target.value })} />
                    <Input aria-label="Name" placeholder="Name" value={f.name} onChange={(e) => setItem('floors', i, { name: e.target.value })} />
                    <Input aria-label="Description" placeholder="Short description" value={f.note} onChange={(e) => setItem('floors', i, { note: e.target.value })} />
                  </div>
                  <RemoveButton label="Remove floor" onClick={() => removeItem('floors', i)} />
                </div>
              ))}
              <Button variant="outline" size="sm" className="self-start" onClick={() => addItem('floors')}>
                <Plus className="size-4" /> Add floor
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              {g.floors.map((f, i) => (
                <li key={i}>
                  {f.level && <p className="text-xs font-semibold uppercase tracking-wide text-primary">{f.level}</p>}
                  <p className="font-semibold">{f.name}</p>
                  {f.note && <p className="text-sm text-muted-foreground">{f.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* What you can do */}
      <section className="mb-12">
        <SectionTitle icon={Sparkles}>What you can do here</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {g.uses.map((u, i) => {
            const photo = (
              <Photo
                src={u.image}
                alt=""
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 260px"
                className="aspect-[4/3]"
                editing={editing}
                onChange={() => pickPhoto(u.image, (src) => setItem('uses', i, { image: src }))}
              />
            )
            const card = 'group flex flex-col overflow-hidden rounded-xl border border-border bg-card'

            if (editing) {
              return (
                <div key={i} className={card}>
                  {photo}
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <Input aria-label="Title" placeholder="Title" value={u.title} onChange={(e) => setItem('uses', i, { title: e.target.value })} />
                    <Textarea aria-label="Text" placeholder="One or two sentences" rows={2} value={u.text} onChange={(e) => setItem('uses', i, { text: e.target.value })} />
                    <Input aria-label="Link text" placeholder="Link text (optional)" value={u.cta} onChange={(e) => setItem('uses', i, { cta: e.target.value })} />
                    <Input aria-label="Link" placeholder="Link, e.g. /events" value={u.href} onChange={(e) => setItem('uses', i, { href: e.target.value })} />
                    <Button variant="ghost" size="sm" className="self-end text-destructive" onClick={() => removeItem('uses', i)}>
                      <Trash2 className="size-4" /> Remove card
                    </Button>
                  </div>
                </div>
              )
            }

            const body = (
              <>
                {photo}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold">{u.title}</h3>
                  {u.text && <p className="mt-1 flex-1 text-sm text-muted-foreground">{u.text}</p>}
                  {u.href && u.cta && (
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {u.cta}
                      <ArrowRight className="size-4" />
                    </span>
                  )}
                </div>
              </>
            )
            return u.href ? (
              <Link key={i} href={u.href} className={`${card} transition-colors hover:border-primary/40`}>
                {body}
              </Link>
            ) : (
              <div key={i} className={card}>
                {body}
              </div>
            )
          })}
          {editing && (
            <button
              type="button"
              onClick={() => addItem('uses')}
              className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="size-5" /> Add card
            </button>
          )}
        </div>
      </section>

      {/* Before you come */}
      <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <SectionTitle icon={CheckCircle2}>Before you come</SectionTitle>
        {editing ? (
          <div className="flex flex-col gap-3">
            {draft.tips.map((t, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-card p-2">
                <div className="grid flex-1 gap-1.5 sm:grid-cols-2">
                  <Input aria-label="Tip title" placeholder="Bold lead, e.g. Bring your laptop." value={t.title} onChange={(e) => setItem('tips', i, { title: e.target.value })} />
                  <Input aria-label="Tip text" placeholder="Rest of the sentence" value={t.text} onChange={(e) => setItem('tips', i, { text: e.target.value })} />
                  <Input aria-label="Link text" placeholder="Link text (optional)" value={t.linkLabel} onChange={(e) => setItem('tips', i, { linkLabel: e.target.value })} />
                  <Input aria-label="Link" placeholder="Link, e.g. /guidelines or mailto:…" value={t.href} onChange={(e) => setItem('tips', i, { href: e.target.value })} />
                </div>
                <RemoveButton label="Remove tip" onClick={() => removeItem('tips', i)} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="self-start" onClick={() => addItem('tips')}>
              <Plus className="size-4" /> Add tip
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 text-sm">
            {g.tips.map((t, i) => (
              <li key={i}>
                {t.title && <span className="font-semibold">{t.title}</span>} {t.text}{' '}
                {t.href && (
                  <a href={t.href} className="font-medium text-primary hover:underline">
                    {t.linkLabel}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <PhotoPicker
        open={picking !== null}
        current={picking?.current ?? ''}
        galleryPhotos={galleryPhotos}
        onPick={(src) => {
          picking?.apply(src)
          setPicking(null)
        }}
        onClose={() => setPicking(null)}
      />
    </>
  )
}
