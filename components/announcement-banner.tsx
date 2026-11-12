'use client'

import { useLayoutEffect, useRef, useState, useTransition } from 'react'
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

// How fast the banner scrolls, whatever the message length.
const SPEED_PX_PER_S = 50

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

  // The track holds the message group twice and slides left by half its width,
  // then repeats. That only looks continuous if one group is at least as wide
  // as the screen, so measure the message and repeat it as often as needed.
  // Speed stays constant, and the position follows the wall clock so moving
  // between pages doesn't send the banner back to the start.
  const itemRef = useRef<HTMLSpanElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [ticker, setTicker] = useState<{ copies: number; duration: number } | null>(null)
  const message = current.message

  useLayoutEffect(() => {
    const item = itemRef.current
    if (!item) return
    const fit = () => {
      const width = item.getBoundingClientRect().width
      if (!width) return
      const banner = item.closest('a')?.clientWidth || window.innerWidth
      const copies = Math.max(2, Math.ceil(banner / width) + 1)
      const duration = (copies * width) / SPEED_PX_PER_S
      setTicker((prev) => (prev?.copies === copies && prev.duration === duration ? prev : { copies, duration }))
    }
    fit()
    // Re-fit when the message's width changes (the web font finishing loading)
    // or the banner's does (window resize, zoom, rotation).
    const observer = new ResizeObserver(fit)
    observer.observe(item)
    if (item.closest('a')) observer.observe(item.closest('a')!)
    return () => observer.disconnect()
  }, [message])

  useLayoutEffect(() => {
    if (!ticker) return
    const animation = trackRef.current?.getAnimations()[0] // none with reduced motion
    if (animation) animation.currentTime = Date.now() % (ticker.duration * 1000)
  }, [ticker])

  // Hidden for visitors when disabled; admins still see it (dimmed) so they can re-enable.
  if (!current.enabled && !isAdmin) return null

  const group = (
    <div className="flex flex-none items-center">
      {Array.from({ length: ticker?.copies ?? 12 }).map((_, i) => (
        <span
          key={i}
          ref={i === 0 ? itemRef : undefined}
          className="flex items-center whitespace-nowrap text-sm font-semibold tracking-wide"
        >
          {message}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sui-symbol-sm.png"
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
        <div
          ref={trackRef}
          className="ticker-track"
          style={ticker ? { animationDuration: `${ticker.duration}s` } : undefined}
        >
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
