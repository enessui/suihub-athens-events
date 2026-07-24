'use client'

import { useRef, useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createEvent, updateEvent } from '@/app/admin/actions'
import { importEventFromUrl } from '@/app/admin/import-event'
import {
  EVENT_CATEGORIES,
  isInviteOnly,
  registrationUrl,
  type EventRow,
} from '@/lib/events'

// Convert an ISO string to the value format datetime-local expects (local time).
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: EventRow | null
  defaultDate?: string
}) {
  const isEdit = !!event
  const [category, setCategory] = useState(event?.category ?? 'Workshop')
  const [registrationType, setRegistrationType] = useState<
    'open' | 'invite-only'
  >(isInviteOnly(event?.registration_link ?? null) ? 'invite-only' : 'open')
  const [isPending, startTransition] = useTransition()
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importedImage, setImportedImage] = useState<string | null>(event?.image_url ?? null)
  const formRef = useRef<HTMLFormElement>(null)

  function setField(name: string, value: string) {
    const el = formRef.current?.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null
    if (el) el.value = value
  }

  function handleImport() {
    if (!importUrl.trim()) return
    setImporting(true)
    importEventFromUrl(importUrl)
      .then((res) => {
        if (res.error || !res.data) {
          toast.error(res.error ?? 'Could not import from that link.')
          return
        }
        const d = res.data
        if (d.title) setField('title', d.title)
        if (d.start_time) setField('start_time', toLocalInput(d.start_time))
        if (d.end_time) setField('end_time', toLocalInput(d.end_time))
        if (d.description) setField('description', d.description)
        if (d.room) setField('room', d.room)
        if (d.host) setField('host', d.host)
        if (d.image_url) setImportedImage(d.image_url)
        // Use the pasted link as the registration link
        setRegistrationType('open')
        setTimeout(() => setField('registration_link', importUrl.trim()), 0)
        toast.success('Event details imported. Review and save.')
      })
      .catch(() => toast.error('Could not import from that link.'))
      .finally(() => setImporting(false))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('category', category)
    formData.set('registration_type', registrationType)
    formData.set('imported_image_url', importedImage ?? '')

    startTransition(async () => {
      const result = isEdit
        ? await updateEvent(event!.id, formData)
        : await createEvent(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(isEdit ? 'Event updated' : 'Event created')
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details for this event.'
              : 'Add an event to the coworking calendar.'}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Import from Luma / Meetup */}
          <div className="grid gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            <Label htmlFor="import-url" className="flex items-center gap-1.5 text-primary">
              <Sparkles className="size-3.5" />
              Import from Luma or Meetup
            </Label>
            <div className="flex gap-2">
              <Input
                id="import-url"
                type="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://lu.ma/… or https://meetup.com/…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleImport()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
              >
                {importing ? 'Importing…' : 'Import'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste an event link to auto-fill the fields below. Review before saving.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={event?.title ?? ''}
              placeholder="Intro to UX Research"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start_time">Starts</Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                required
                defaultValue={toLocalInput(event?.start_time ?? null) || defaultDate || ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_time">Ends (optional)</Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                defaultValue={toLocalInput(event?.end_time ?? null)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="room">Room / location</Label>
              <Input
                id="room"
                name="room"
                defaultValue={event?.room ?? ''}
                placeholder="The Loft"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                name="host"
                defaultValue={event?.host ?? ''}
                placeholder="Jane Doe"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={event?.industry ?? ''}
              placeholder="e.g. Fintech, Healthcare, Web3"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="registration_type">Registration</Label>
            <Select
              value={registrationType}
              onValueChange={(v) =>
                setRegistrationType(v as 'open' | 'invite-only')
              }
            >
              <SelectTrigger id="registration_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open (registration link)</SelectItem>
                <SelectItem value="invite-only">Invite only</SelectItem>
              </SelectContent>
            </Select>
            {registrationType === 'open' && (
              <Input
                type="url"
                name="registration_link"
                defaultValue={registrationUrl(event?.registration_link ?? null) ?? ''}
                placeholder="https://example.com/register"
                aria-label="Registration link"
              />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={event?.description ?? ''}
              placeholder="What is this event about?"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Cover image</Label>
            {importedImage && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={importedImage}
                  alt="Event cover"
                  className="size-16 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                  {isEdit && event?.image_url === importedImage
                    ? 'Current cover image.'
                    : 'Imported cover image, used unless you upload a new one below.'}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImportedImage(null)}
                >
                  Remove
                </Button>
              </div>
            )}
            <Input id="image" name="image" type="file" accept="image/*" />
            <p className="text-xs text-muted-foreground">
              {importedImage
                ? 'Upload a file to replace the image above.'
                : isEdit && event?.image_url
                  ? 'Leave empty to keep the current image.'
                  : 'Optional, or import one from a Luma/Meetup link above.'}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : isEdit
                  ? 'Save changes'
                  : 'Create event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
