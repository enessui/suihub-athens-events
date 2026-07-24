'use client'

import { useState, useTransition } from 'react'
import { Mail, MapPin, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RichTextEditor } from './rich-text-editor'
import { updateGuidelines } from '@/app/guidelines/actions'
import { type GuidelinesContent } from '@/lib/guidelines'

export function GuidelinesClient({
  content,
  isAdmin,
}: {
  content: GuidelinesContent
  isAdmin: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<GuidelinesContent>(content)
  const [isPending, startTransition] = useTransition()

  function set<K extends keyof GuidelinesContent>(key: K, value: GuidelinesContent[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function setListItem(key: 'requestSteps' | 'eventTypes' | 'requirementsSteps' | 'coorganiserSteps', index: number, value: string) {
    setDraft((prev) => {
      const list = [...prev[key]]
      list[index] = value
      return { ...prev, [key]: list }
    })
  }

  function addListItem(key: 'requestSteps' | 'eventTypes' | 'requirementsSteps' | 'coorganiserSteps') {
    setDraft((prev) => ({ ...prev, [key]: [...prev[key], ''] }))
  }

  function removeListItem(key: 'requestSteps' | 'eventTypes' | 'requirementsSteps' | 'coorganiserSteps', index: number) {
    setDraft((prev) => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }))
  }

  function setRuleValue(index: number, field: 'label' | 'value', value: string) {
    setDraft((prev) => {
      const rules = prev.spaceRules.map((r, i) => (i === index ? { ...r, [field]: value } : r))
      return { ...prev, spaceRules: rules }
    })
  }

  function addRule() {
    setDraft((prev) => ({ ...prev, spaceRules: [...prev.spaceRules, { label: '', value: '' }] }))
  }

  function removeRule(index: number) {
    setDraft((prev) => ({ ...prev, spaceRules: prev.spaceRules.filter((_, i) => i !== index) }))
  }

  function cancel() {
    setDraft(content)
    setEditing(false)
  }

  function save() {
    startTransition(async () => {
      const result = await updateGuidelines(draft)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Guidelines updated')
        setEditing(false)
      }
    })
  }

  const d = editing ? draft : content

  return (
    <div className="flex flex-col gap-8">
      {/* Contact info */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Mail className="size-4 text-primary" />suihubathens@sui.io</span>
        <span className="flex items-center gap-1.5"><Send className="size-4 text-primary" />@suihubeu</span>
        <span className="flex items-center gap-1.5"><MapPin className="size-4 text-primary" />Agiou Markou 22, Athens</span>
      </div>

      {/* Admin toolbar */}
      {isAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
          <Pencil className="size-4 text-primary" />
          <span className="text-sm text-primary font-medium flex-1">Admin · you can edit this page</span>
          {editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancel} disabled={isPending}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={isPending}>{isPending ? 'Saving…' : 'Save changes'}</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          )}
        </div>
      )}

      {/* Purpose */}
      <Section title="Purpose of the space">
        {editing ? (
          <RichTextEditor value={draft.purpose} onChange={(v) => set('purpose', v)} rows={3} />
        ) : (
          <p className="text-muted-foreground leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: d.purpose }} />
        )}
      </Section>

      {/* Event request process */}
      <Section title="Event request process">
        <ol className="flex flex-col gap-3">
          {d.requestSteps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              {editing ? (
                <div className="flex flex-1 gap-2">
                  <div className="flex-1"><RichTextEditor value={draft.requestSteps[i]} onChange={(v) => setListItem('requestSteps', i, v)} rows={2} /></div>
                  <Button variant="ghost" size="icon" onClick={() => removeListItem('requestSteps', i)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              ) : (
                <span className="text-muted-foreground [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: step }} />
              )}
            </li>
          ))}
        </ol>
        {editing && (
          <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={() => addListItem('requestSteps')}>
            <Plus className="size-4" /> Add step
          </Button>
        )}
      </Section>

      {/* Event types */}
      <Section title="Event types we support">
        {editing ? (
          <div className="flex flex-col gap-2">
            {draft.eventTypes.map((type, i) => (
              <div key={i} className="flex gap-2">
                <Input value={type} onChange={(e) => setListItem('eventTypes', i, e.target.value)} className="max-w-xs" />
                <Button variant="ghost" size="icon" onClick={() => removeListItem('eventTypes', i)}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-1 w-fit" onClick={() => addListItem('eventTypes')}>
              <Plus className="size-4" /> Add type
            </Button>
            <div className="mt-2">
              <p className="mb-1 text-xs text-muted-foreground">Note text</p>
              <Input value={draft.eventTypesNote} onChange={(e) => set('eventTypesNote', e.target.value)} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {d.eventTypes.map((type) => (
                <Badge key={type} variant="outline" className="text-sm py-1 px-3">{type}</Badge>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-4 py-3">
              <strong className="text-foreground">Note:</strong> {d.eventTypesNote}
            </p>
          </>
        )}
      </Section>

      {/* Space use rules */}
      <Section title="Space use rules">
        <ul className="flex flex-col gap-3">
          {d.spaceRules.map((rule, i) => (
            <li key={i} className={`rounded-lg border border-border bg-card px-4 py-3 text-sm ${editing ? 'flex flex-col gap-2' : 'grid grid-cols-[140px_1fr] gap-3'}`}>
              {editing ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Label" value={draft.spaceRules[i].label} onChange={(e) => setRuleValue(i, 'label', e.target.value)} className="max-w-[180px] font-medium" />
                    <Button variant="ghost" size="icon" onClick={() => removeRule(i)}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                  <RichTextEditor value={draft.spaceRules[i].value} onChange={(v) => setRuleValue(i, 'value', v)} rows={2} />
                </div>
              ) : (
                <>
                  <span className="font-medium text-foreground">{rule.label}</span>
                  <span className="text-muted-foreground [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: rule.value }} />
                </>
              )}
            </li>
          ))}
        </ul>
        {editing && (
          <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={addRule}>
            <Plus className="size-4" /> Add rule
          </Button>
        )}
      </Section>

      {/* Requirements & cost */}
      <Section title="Requirements & cost">
        {editing ? (
          <div className="mb-3"><RichTextEditor value={draft.requirementsIntro} onChange={(v) => set('requirementsIntro', v)} rows={2} /></div>
        ) : (
          <p className="mb-3 text-muted-foreground [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: d.requirementsIntro }} />
        )}
        <ol className="flex flex-col gap-3">
          {d.requirementsSteps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              {editing ? (
                <div className="flex flex-1 gap-2">
                  <div className="flex-1"><RichTextEditor value={draft.requirementsSteps[i]} onChange={(v) => setListItem('requirementsSteps', i, v)} rows={2} /></div>
                  <Button variant="ghost" size="icon" onClick={() => removeListItem('requirementsSteps', i)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              ) : (
                <span className="text-muted-foreground [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: step }} />
              )}
            </li>
          ))}
        </ol>
        {editing && (
          <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={() => addListItem('requirementsSteps')}>
            <Plus className="size-4" /> Add step
          </Button>
        )}
      </Section>

      {/* Co-organiser responsibilities */}
      <Section title="Co-organiser responsibilities">
        <ol className="flex flex-col gap-3">
          {d.coorganiserSteps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              {editing ? (
                <div className="flex flex-1 gap-2">
                  <Input className="flex-1" value={draft.coorganiserSteps[i]} onChange={(e) => setListItem('coorganiserSteps', i, e.target.value)} />
                  <Button variant="ghost" size="icon" onClick={() => removeListItem('coorganiserSteps', i)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              ) : (
                <span className="text-muted-foreground">{step}</span>
              )}
            </li>
          ))}
        </ol>
        {editing && (
          <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={() => addListItem('coorganiserSteps')}>
            <Plus className="size-4" /> Add step
          </Button>
        )}
      </Section>

      {/* Code of conduct */}
      <Section title="Code of conduct">
        {editing ? (
          <RichTextEditor value={draft.conduct} onChange={(v) => set('conduct', v)} rows={3} />
        ) : (
          <p className="text-muted-foreground leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline" dangerouslySetInnerHTML={{ __html: d.conduct }} />
        )}
      </Section>

      {/* CTA */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-6 text-center">
        <h3 className="text-lg font-semibold">Ready to host an event?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Reach out and we'll get back to you as soon as possible.</p>
        <Button
          render={<a href="mailto:suihubathens@sui.io" />}
          nativeButton={false}
          size="lg"
          className="mt-4"
        >
          <Mail className="size-4" />
          Contact us
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}
