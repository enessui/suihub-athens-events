'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BarChart3, CalendarDays, Pencil, Plus, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EventFormDialog } from './event-form-dialog'
import {
  deleteEvent,
  inviteAdmin,
  removeAdmin,
  signOut,
} from '@/app/admin/actions'
import {
  categoryStyle,
  formatEventDate,
  formatEventTime,
  type EventRow,
} from '@/lib/events'

export function AdminDashboard({
  events,
  userEmail,
  admins,
}: {
  events: EventRow[]
  userEmail: string
  admins: { email: string; created_at: string }[]
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<EventRow | null>(null)
  const [deleting, setDeleting] = useState<EventRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const now = Date.now()
  const upcoming = events.filter((e) => new Date(e.start_time).getTime() >= now)
  const past = events.filter((e) => new Date(e.start_time).getTime() < now)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(event: EventRow) {
    setEditing(event)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteEvent(deleting.id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Event deleted')
      setDeleting(null)
    })
  }

  return (
    <main className="min-h-svh">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-semibold tracking-tight">
                Admin dashboard
              </span>
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              render={<Link href="/admin/analytics" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
            >
              <BarChart3 className="size-4" />
              Analytics
            </Button>
            <Button
              render={<Link href="/events" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
            >
              View calendar
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length} total · {upcoming.length} upcoming
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New event
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <CalendarDays
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              No events yet. Create your first one.
            </p>
            <Button onClick={openCreate} variant="outline">
              <Plus className="size-4" />
              New event
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <EventGroup
              title="Upcoming"
              events={upcoming}
              onEdit={openEdit}
              onDelete={setDeleting}
            />
            {past.length > 0 && (
              <EventGroup
                title="Past"
                events={past}
                onEdit={openEdit}
                onDelete={setDeleting}
                muted
              />
            )}
          </div>
        )}

        <AdminsSection admins={admins} currentEmail={userEmail} />
      </div>

      <EventFormDialog
        key={editing?.id ?? 'new'}
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editing}
      />

      <Dialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleting?.title}&quot;? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function AdminsSection({
  admins,
  currentEmail,
}: {
  admins: { email: string; created_at: string }[]
  currentEmail: string
}) {
  const [isPending, startTransition] = useTransition()
  const [removing, setRemoving] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleInvite(formData: FormData) {
    startTransition(async () => {
      const result = await inviteAdmin(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Admin invited')
      formRef.current?.reset()
    })
  }

  function handleRemove(email: string) {
    setRemoving(email)
    startTransition(async () => {
      const result = await removeAdmin(email)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Admin removed')
      }
      setRemoving(null)
    })
  }

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="mb-1 flex items-center gap-2">
        <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-tight">Admins</h2>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Registration is invite-only. Add an email here so that person can create
        an account and manage events.
      </p>

      <form
        ref={formRef}
        action={handleInvite}
        className="mb-6 flex flex-col gap-2 sm:flex-row"
      >
        <Input
          name="email"
          type="email"
          required
          placeholder="colleague@example.com"
          aria-label="Email to invite"
          className="sm:max-w-xs"
        />
        <Button type="submit" disabled={isPending}>
          <UserPlus className="size-4" />
          Invite admin
        </Button>
      </form>

      <ul className="flex flex-col gap-2">
        {admins.map((admin) => {
          const isSelf = admin.email.toLowerCase() === currentEmail.toLowerCase()
          return (
            <li
              key={admin.email}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm">{admin.email}</span>
                {isSelf && (
                  <Badge variant="secondary" className="shrink-0">
                    You
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${admin.email}`}
                disabled={isPending && removing === admin.email}
                onClick={() => handleRemove(admin.email)}
              >
                <X className="size-4 text-destructive" />
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function EventGroup({
  title,
  events,
  onEdit,
  onDelete,
  muted,
}: {
  title: string
  events: EventRow[]
  onEdit: (e: EventRow) => void
  onDelete: (e: EventRow) => void
  muted?: boolean
}) {
  if (events.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} events.</p>
      </section>
    )
  }
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {events.map((event) => (
          <li
            key={event.id}
            className={`flex items-center gap-4 rounded-xl border border-border bg-card p-3 ${
              muted ? 'opacity-70' : ''
            }`}
          >
            <div className="relative hidden size-16 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
              {event.image_url ? (
                <Image
                  src={event.image_url || '/placeholder.svg'}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <CalendarDays
                    className="size-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-medium">{event.title}</h3>
                <Badge
                  variant="outline"
                  className={categoryStyle(event.category)}
                >
                  {event.category}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {formatEventDate(event.start_time)} ·{' '}
                {formatEventTime(event.start_time, event.end_time)}
                {event.room ? ` · ${event.room}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${event.title}`}
                onClick={() => onEdit(event)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${event.title}`}
                onClick={() => onDelete(event)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
