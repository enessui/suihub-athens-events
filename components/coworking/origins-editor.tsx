'use client'

import { useMemo, useState, useTransition } from 'react'
import { Globe2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { updateOrigins } from '@/app/coworking/actions'
import { flagEmoji, type OriginsContent } from '@/lib/coworker-origins'
import type { Country } from '@/lib/countries'

// A native select handles 244 options better than a custom popover: it's
// scrollable, keyboard-searchable, and behaves like a picker on mobile. w-full
// with a hard width from sm up stops the longest option name from stretching
// the row wider than the dialog.
const selectClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-0 sm:flex-1 md:text-sm'

export function OriginsEditor({
  content,
  countries,
}: {
  content: OriginsContent
  countries: Country[]
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<OriginsContent>(content)
  const [isPending, startTransition] = useTransition()

  const names = useMemo(
    () => new Map(countries.map((c) => [c.code, c.name])),
    [countries],
  )

  function start() {
    setDraft(content)
    setOpen(true)
  }

  function setCode(i: number, code: string) {
    setDraft((d) => ({ ...d, codes: d.codes.map((c, j) => (j === i ? code : c)) }))
  }

  function removeCode(i: number) {
    setDraft((d) => ({ ...d, codes: d.codes.filter((_, j) => j !== i) }))
  }

  function addCode() {
    setDraft((d) => ({ ...d, codes: [...d.codes, ''] }))
  }

  function save() {
    const filled = draft.codes.filter(Boolean)
    if (filled.length !== draft.codes.length) {
      toast.error('Some rows have no country selected.')
      return
    }
    const seen = new Set<string>()
    const dupe = filled.find((c) => (seen.has(c) ? true : (seen.add(c), false)))
    if (dupe) {
      toast.error(`${names.get(dupe) ?? dupe} is listed twice.`)
      return
    }
    startTransition(async () => {
      const result = await updateOrigins({ ...draft, codes: filled })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setOpen(false)
      toast.success('Saved')
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" className="shrink-0" onClick={start}>
        <Globe2 className="size-4" /> Edit map
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Where our coworkers are from</DialogTitle>
            <DialogDescription>Countries shown on the map.</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60svh] flex-col gap-4 overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="origins-heading">Heading</Label>
              <Input
                id="origins-heading"
                value={draft.heading}
                onChange={(e) => setDraft((d) => ({ ...d, heading: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="origins-intro">Intro line (optional)</Label>
              <Input
                id="origins-intro"
                value={draft.intro}
                onChange={(e) => setDraft((d) => ({ ...d, intro: e.target.value }))}
              />
            </div>

            <div className="grid min-w-0 gap-2">
              <Label>Countries</Label>
              {draft.codes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing here yet.</p>
              )}
              {draft.codes.map((code, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Country"
                    className={selectClass}
                    value={code}
                    onChange={(e) => setCode(i, e.target.value)}
                  >
                    <option value="">Choose a country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {flagEmoji(c.code)} {c.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label="Remove country"
                    onClick={() => removeCode(i)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="self-start" onClick={addCode}>
                <Plus className="size-4" /> Add country
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {draft.codes.length} {draft.codes.length === 1 ? 'country' : 'countries'}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
