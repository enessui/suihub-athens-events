'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DoorOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { decideMeetingRequest } from '@/app/meeting-room/actions'
import { formatDay, formatDuration, formatRange, type MeetingBooking } from '@/lib/meeting-room'

/** Pending meeting room requests, oldest date first. Linked from the request email. */
export function MeetingRequests({ requests }: { requests: MeetingBooking[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function decide(b: MeetingBooking, decision: 'approved' | 'declined') {
    startTransition(async () => {
      const result = await decideMeetingRequest(b.id, decision)
      if (result?.error) toast.error(result.error)
      else toast.success(`${decision === 'approved' ? 'Approved' : 'Declined'}: ${b.name}`)
      router.refresh()
    })
  }

  return (
    <section id="meeting-requests" className="mb-10 scroll-mt-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
        <DoorOpen className="size-5 text-primary" />
        Meeting room requests
        {requests.length > 0 && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {requests.length}
          </span>
        )}
      </h2>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing waiting for approval.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {requests.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  {formatDay(b.date)}, {formatRange(b.start_minute, b.end_minute)}
                  <span className="font-normal text-muted-foreground">
                    {' '}({formatDuration(b.end_minute - b.start_minute)})
                  </span>
                </p>
                <p className="truncate text-muted-foreground">
                  {b.name} ·{' '}
                  <a href={`mailto:${b.email}`} className="hover:underline">
                    {b.email}
                  </a>
                  {b.topic ? ` · ${b.topic}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => decide(b, 'approved')} disabled={isPending}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => decide(b, 'declined')}
                  disabled={isPending}
                >
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
