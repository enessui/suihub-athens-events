'use client'

import { useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
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
import { updateAnnouncement } from '@/app/announcement/actions'
import { DEFAULT_ANNOUNCEMENT, type AnnouncementContent } from '@/lib/announcement'

export function AnnouncementBanner({
  content,
  isAdmin = false,
}: {
  content: AnnouncementContent
  isAdmin?: boolean
}) {
  // Fill any missing fields (e.g. colors on banners saved before they existed)
  // so the color inputs always receive a defined, controlled value.
  const normalized = { ...DEFAULT_ANNOUNCEMENT, ...content }
  const [current, setCurrent] = useState(normalized)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(normalized)
  const [isPending, startTransition] = useTransition()

  // Hidden for visitors when disabled; admins still see it (dimmed) so they can re-enable.
  if (!current.enabled && !isAdmin) return null

  const message = current.message
  const group = (
    <div className="flex flex-none items-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="flex items-center whitespace-nowrap text-sm font-semibold tracking-wide">
          {message}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Sui_Symbol_Sea.png"
            alt=""
            aria-hidden="true"
            className="mx-6 h-4 w-4 shrink-0 object-contain opacity-90 [filter:brightness(0)_invert(1)]"
          />
        </span>
      ))}
    </div>
  )

  function openEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDraft(current)
    setOpen(true)
  }

  function save() {
    startTransition(async () => {
      const result = await updateAnnouncement(draft)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setCurrent(draft)
      setOpen(false)
      toast.success('Banner updated')
    })
  }

  return (
    <div className={`relative ${!current.enabled ? 'opacity-50' : ''}`}>
      <a
        href={current.url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={message}
        style={{ backgroundColor: current.bgColor, color: current.textColor }}
        className="ticker-mask block overflow-hidden border-b border-white/15 py-2 hover:brightness-105"
      >
        <div className="ticker-track">
          {group}
          {group}
        </div>
      </a>

      {isAdmin && (
        <button
          type="button"
          onClick={openEdit}
          aria-label="Edit banner"
          className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-full bg-[#030f1c]/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-[#030f1c]/50"
        >
          <Pencil className="size-3" />
          Edit
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit announcement banner</DialogTitle>
            <DialogDescription>The scrolling banner shown below the header on every page.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ann-message">Message</Label>
              <Input id="ann-message" value={draft.message} onChange={(e) => setDraft((d) => ({ ...d, message: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ann-url">Link URL</Label>
              <Input id="ann-url" type="url" value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ann-bg">Background color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="ann-bg"
                    type="color"
                    value={draft.bgColor}
                    onChange={(e) => setDraft((d) => ({ ...d, bgColor: e.target.value }))}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1"
                  />
                  <Input
                    aria-label="Background color hex"
                    value={draft.bgColor}
                    onChange={(e) => setDraft((d) => ({ ...d, bgColor: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ann-text">Text color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="ann-text"
                    type="color"
                    value={draft.textColor}
                    onChange={(e) => setDraft((d) => ({ ...d, textColor: e.target.value }))}
                    className="h-9 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-1"
                  />
                  <Input
                    aria-label="Text color hex"
                    value={draft.textColor}
                    onChange={(e) => setDraft((d) => ({ ...d, textColor: e.target.value }))}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div
              className="flex items-center justify-center overflow-hidden rounded-md py-2 text-sm font-semibold tracking-wide"
              style={{ backgroundColor: draft.bgColor, color: draft.textColor }}
            >
              {draft.message || 'Preview'}
            </div>
            <label htmlFor="ann-enabled" className="flex items-center gap-2.5 text-sm">
              <input
                id="ann-enabled"
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
                className="size-4 rounded border-border accent-primary"
              />
              Show the banner
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={save} disabled={isPending}>{isPending ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
