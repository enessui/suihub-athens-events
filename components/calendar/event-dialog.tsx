'use client'

import { Briefcase, Clock, ExternalLink, Lock, MapPin, Pencil, Trash2, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  categoryStyle,
  formatEventDate,
  formatEventTime,
  isInviteOnly,
  registrationUrl,
  type EventRow,
} from '@/lib/events'

export function EventDialog({
  event,
  onClose,
  isAdmin,
  onEdit,
  onDelete,
}: {
  event: EventRow | null
  onClose: () => void
  isAdmin?: boolean
  onEdit?: (event: EventRow) => void
  onDelete?: (event: EventRow) => void
}) {
  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto p-0 sm:max-w-lg">
        {event && (
          <>
            {event.image_url ? (
              <div className="w-full overflow-hidden rounded-t-lg bg-muted">
                {/* Full flyer, natural aspect ratio — never crop the event's own text */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="mx-auto block max-h-[60svh] w-full object-contain"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-4 p-6">
              <DialogHeader className="gap-2 pr-8 text-left">
                <Badge
                  variant="outline"
                  className={`w-fit ${categoryStyle(event.category)}`}
                >
                  {event.category}
                </Badge>
                <DialogTitle className="text-balance text-2xl">
                  {event.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Details for {event.title}
                </DialogDescription>
              </DialogHeader>

              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Clock
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    {formatEventDate(event.start_time)}
                    {' · '}
                    {formatEventTime(event.start_time, event.end_time)}
                  </span>
                </div>
                {event.room && (
                  <div className="flex items-center gap-3">
                    <MapPin
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{event.room}</span>
                  </div>
                )}
                {event.host && (
                  <div className="flex items-center gap-3">
                    <User
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>Hosted by {event.host}</span>
                  </div>
                )}
                {event.industry && (
                  <div className="flex items-center gap-3">
                    <Briefcase
                      className="size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{event.industry}</span>
                  </div>
                )}
              </dl>

              {event.description && (
                <p className="whitespace-pre-line text-pretty leading-relaxed text-muted-foreground">
                  {event.description}
                </p>
              )}

              {isAdmin && (onEdit || onDelete) && (
                <div className="flex gap-2">
                  {onEdit && (
                    <Button variant="outline" size="sm" className="w-fit" onClick={() => onEdit(event)}>
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit event
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="destructive" size="sm" className="w-fit" onClick={() => onDelete(event)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  )}
                </div>
              )}

              {registrationUrl(event.registration_link) ? (
                <Button
                  render={
                    <a
                      href={registrationUrl(event.registration_link)!}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  nativeButton={false}
                  size="lg"
                  className="w-full text-base font-semibold"
                >
                  Register now
                  <ExternalLink className="size-5" aria-hidden="true" />
                </Button>
              ) : isInviteOnly(event.registration_link) ? (
                <div className="flex w-fit items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Lock className="size-4 shrink-0" aria-hidden="true" />
                  Invite only
                </div>
              ) : null}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
