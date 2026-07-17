'use client'

import { useState, useTransition } from 'react'
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
import { submitEventRequest } from '@/app/request-event/actions'
import { EVENT_CATEGORIES } from '@/lib/events'

export function RequestEventDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [category, setCategory] = useState('Workshop')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await submitEventRequest({
        title: data.get('title') as string,
        category,
        preferred_date: data.get('preferred_date') as string,
        estimated_attendance: data.get('estimated_attendance') as string,
        description: data.get('description') as string,
        host_name: data.get('host_name') as string,
        host_email: data.get('host_email') as string,
        registration_link: data.get('registration_link') as string,
      })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      toast.success('Request submitted! We will be in touch soon.')
      onOpenChange(false)
      form.reset()
      setCategory('Workshop')
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request an event</DialogTitle>
          <DialogDescription>
            Fill in the details below and we'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="req-title">Event title</Label>
            <Input id="req-title" name="title" required placeholder="e.g. Web3 for Beginners" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="req-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="req-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="req-date">Preferred date</Label>
              <Input id="req-date" name="preferred_date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="req-attendance">Expected attendance</Label>
              <Input id="req-attendance" name="estimated_attendance" placeholder="e.g. 30–50 people" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="req-description">Description</Label>
            <Textarea
              id="req-description"
              name="description"
              rows={4}
              placeholder="Tell us about the event — topic, format, goals…"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="req-link">Registration link (optional)</Label>
            <Input
              id="req-link"
              name="registration_link"
              type="url"
              placeholder="https://example.com/register"
            />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-foreground">Your contact details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="req-name">Your name</Label>
                <Input id="req-name" name="host_name" required placeholder="Jane Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="req-email">Your email</Label>
                <Input id="req-email" name="host_email" type="email" required placeholder="jane@example.com" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isPending ? 'Submitting…' : 'Submit request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
