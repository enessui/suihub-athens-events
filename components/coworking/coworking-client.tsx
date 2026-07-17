'use client'

import { useState, useTransition } from 'react'
import { Clock, CheckCircle, Star, MapPin, HelpCircle, Pencil, Save, X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateCoworking } from '@/app/coworking/actions'
import type { CoworkingContent } from '@/lib/coworking'

export function CoworkingClient({
  content: initial,
  isAdmin,
}: {
  content: CoworkingContent
  isAdmin: boolean
}) {
  const [content, setContent] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(initial)
  const [isPending, startTransition] = useTransition()

  function startEdit() {
    setDraft(content)
    setEditing(true)
  }

  function cancelEdit() {
    setDraft(content)
    setEditing(false)
  }

  function save() {
    startTransition(async () => {
      const result = await updateCoworking(draft)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setContent(draft)
      setEditing(false)
      toast.success('Coworking info updated')
    })
  }

  function setField<K extends keyof CoworkingContent>(key: K, value: CoworkingContent[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function setAmenity(i: number, value: string) {
    const next = [...draft.amenities]
    next[i] = value
    setField('amenities', next)
  }

  function setFaqField(i: number, field: 'q' | 'a', value: string) {
    const next = draft.faq.map((item, idx) => idx === i ? { ...item, [field]: value } : item)
    setField('faq', next)
  }

  const d = editing ? draft : content

  return (
    <div className="flex flex-col gap-10">
      {isAdmin && (
        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={isPending}>
                <X className="size-4" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={isPending}>
                <Save className="size-4" /> {isPending ? 'Saving…' : 'Save'}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="size-4" /> Edit
            </Button>
          )}
        </div>
      )}

      {/* Hours */}
      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Clock className="size-5 text-primary" />
          Hours
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input value={draft.hoursWeekdays} onChange={(e) => setField('hoursWeekdays', e.target.value)} />
            <Input value={draft.hoursNote} onChange={(e) => setField('hoursNote', e.target.value)} />
          </div>
        ) : (
          <>
            <p className="font-semibold">{d.hoursWeekdays}</p>
            <p className="mt-3 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{d.hoursNote}</p>
          </>
        )}
      </section>

      {/* How to Join */}
      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <CheckCircle className="size-5 text-primary" />
          How to Join
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input value={draft.joinIntro} onChange={(e) => setField('joinIntro', e.target.value)} />
            <Input value={draft.registerUrl} onChange={(e) => setField('registerUrl', e.target.value)} placeholder="Registration URL" />
            <Input value={draft.joinNote} onChange={(e) => setField('joinNote', e.target.value)} />
          </div>
        ) : (
          <>
            <p className="text-muted-foreground">{d.joinIntro}</p>
            <a
              href={d.registerUrl}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              👉 Register here for free
            </a>
            <p className="mt-4 text-sm text-muted-foreground">{d.joinNote}</p>
          </>
        )}
      </section>

      {/* Amenities */}
      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Star className="size-5 text-primary" />
          What&apos;s Available
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            {draft.amenities.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={item} onChange={(e) => setAmenity(i, e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => setField('amenities', draft.amenities.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-1 self-start" onClick={() => setField('amenities', [...draft.amenities, ''])}>
              <Plus className="size-4" /> Add item
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {d.amenities.map((item) => (
              <li key={item} className="flex items-center gap-2 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Who is this for */}
      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <MapPin className="size-5 text-primary" />
          Who Is This For?
        </div>
        {editing ? (
          <Input value={draft.whoIntro} onChange={(e) => setField('whoIntro', e.target.value)} />
        ) : (
          <p className="text-muted-foreground">{d.whoIntro}</p>
        )}
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border border-border bg-card/60 p-6">
        <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
          <HelpCircle className="size-5 text-primary" />
          FAQ
        </div>
        {editing ? (
          <div className="flex flex-col gap-4">
            {draft.faq.map((item, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <Input placeholder="Question" value={item.q} onChange={(e) => setFaqField(i, 'q', e.target.value)} />
                <Input placeholder="Answer" value={item.a} onChange={(e) => setFaqField(i, 'a', e.target.value)} />
                <Button variant="ghost" size="sm" className="self-end text-destructive" onClick={() => setField('faq', draft.faq.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" /> Remove
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="self-start" onClick={() => setField('faq', [...draft.faq, { q: '', a: '' }])}>
              <Plus className="size-4" /> Add FAQ
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {d.faq.map(({ q, a }) => (
              <div key={q}>
                <p className="font-semibold">{q}</p>
                <p className="mt-1 text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
