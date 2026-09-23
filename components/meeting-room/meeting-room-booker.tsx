'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
import { Turnstile, captchaEnabled, type TurnstileHandle } from '@/components/turnstile'
import { WeekdayCalendar } from '@/components/meeting-room/weekday-calendar'
import {
  getMeetingBookings,
  requestMeetingRoom,
  decideMeetingRequest,
  cancelMeetingBooking,
} from '@/app/meeting-room/actions'
import {
  ROOM_OPEN,
  ROOM_CLOSE,
  availableDurations,
  availableStarts,
  earliestStart,
  formatDay,
  formatDuration,
  formatMinute,
  formatRange,
  type MeetingBooking,
} from '@/lib/meeting-room'

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm'

const SPAN = ROOM_CLOSE - ROOM_OPEN
/** Position of a time, and width of a length, as a share of the opening hours. */
const leftPct = (m: number) => `${((m - ROOM_OPEN) / SPAN) * 100}%`
const widthPct = (minutes: number) => `${(minutes / SPAN) * 100}%`

export function MeetingRoomBooker({
  initialDate,
  initialBookings,
  isAdmin,
}: {
  /** First bookable date; also the earliest the calendar allows. */
  initialDate: string
  initialBookings: MeetingBooking[]
  isAdmin: boolean
}) {
  const [date, setDate] = useState(initialDate)
  const [bookings, setBookings] = useState(initialBookings)
  const [loading, setLoading] = useState(false)
  const [start, setStart] = useState<number | null>(null)
  const [duration, setDuration] = useState(60)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [isPending, startTransition] = useTransition()

  // Load the chosen day's bookings, ignoring a response that arrives after the
  // visitor has already moved on to another date.
  useEffect(() => {
    if (date === initialDate) {
      setBookings(initialBookings)
      return
    }
    let stale = false
    setLoading(true)
    getMeetingBookings(date)
      .then((rows) => !stale && setBookings(rows))
      .finally(() => !stale && setLoading(false))
    return () => {
      stale = true
    }
  }, [date, initialDate, initialBookings])

  async function refresh() {
    setBookings(await getMeetingBookings(date))
  }

  // What can be picked right now. If the stored choice stopped fitting (new
  // date, or someone else took the time), fall back to the nearest valid one.
  const starts = availableStarts(date, bookings)
  const chosenStart = start !== null && starts.includes(start) ? start : (starts[0] ?? null)
  const durations = chosenStart !== null ? availableDurations(chosenStart, bookings) : []
  const chosenDuration = durations.includes(duration)
    ? duration
    : (durations.filter((d) => d <= duration).at(-1) ?? durations[0] ?? null)
  const chosenEnd =
    chosenStart !== null && chosenDuration !== null ? chosenStart + chosenDuration : null

  const pastUntil = earliestStart(date) // grey out the part of today that's gone

  function openRequest() {
    setSent(false)
    setCaptchaToken('')
    setDialogOpen(true)
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (chosenStart === null || chosenDuration === null) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await requestMeetingRoom({
        date,
        start: chosenStart,
        duration: chosenDuration,
        name: (fd.get('name') as string) ?? '',
        email: (fd.get('email') as string) ?? '',
        topic: (fd.get('topic') as string) ?? '',
        captchaToken,
      })
      if (result?.error) {
        toast.error(result.error)
        setCaptchaToken('')
        turnstileRef.current?.reset()
        await refresh()
        return
      }
      setSent(true)
      await refresh()
    })
  }

  function decide(b: MeetingBooking, decision: 'approved' | 'declined') {
    startTransition(async () => {
      const result = await decideMeetingRequest(b.id, decision)
      if (result?.error) toast.error(result.error)
      else toast.success(decision === 'approved' ? 'Approved' : 'Declined')
      await refresh()
    })
  }

  function cancel(b: MeetingBooking) {
    startTransition(async () => {
      const result = await cancelMeetingBooking(b.id)
      if (result?.error) toast.error(result.error)
      else toast.success('Booking removed')
      await refresh()
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-[18rem_1fr]">
        <WeekdayCalendar value={date} onChange={setDate} minDate={initialDate} />

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-semibold">{formatDay(date)}</h3>
            {loading && <span className="text-xs text-muted-foreground">Loading…</span>}
          </div>

          {/* The day at a glance: what's taken, what's on hold, what you've picked. */}
          <div>
            <div className="relative h-12 overflow-hidden rounded-lg border border-border bg-emerald-500/5">
              {pastUntil > ROOM_OPEN && (
                <div
                  className="absolute inset-y-0 left-0 bg-muted-foreground/15"
                  style={{ width: leftPct(Math.min(pastUntil, ROOM_CLOSE)) }}
                  title="Already passed"
                />
              )}
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className={cn(
                    'absolute inset-y-0 border-x',
                    b.status === 'approved'
                      ? 'border-red-500/40 bg-red-500/15'
                      : 'border-amber-500/50 bg-[repeating-linear-gradient(135deg,rgb(245_158_11/0.18)_0_6px,rgb(245_158_11/0.06)_6px_12px)]',
                  )}
                  style={{ left: leftPct(b.start_minute), width: widthPct(b.end_minute - b.start_minute) }}
                  title={`${formatRange(b.start_minute, b.end_minute)} · ${b.status === 'approved' ? 'Booked' : 'Awaiting approval'}`}
                />
              ))}
              {chosenStart !== null && chosenEnd !== null && (
                <div
                  className="absolute inset-y-1 rounded-md border-2 border-primary bg-primary/20"
                  style={{ left: leftPct(chosenStart), width: widthPct(chosenEnd - chosenStart) }}
                />
              )}
            </div>
            <div className="relative mt-1 h-4 text-[11px] text-muted-foreground">
              {Array.from({ length: SPAN / 60 + 1 }, (_, i) => ROOM_OPEN + i * 60).map((m, i, all) => (
                <span
                  key={m}
                  className={cn(
                    'absolute',
                    i === 0 ? '' : i === all.length - 1 ? '-translate-x-full' : '-translate-x-1/2',
                  )}
                  style={{ left: leftPct(m) }}
                >
                  {m / 60}
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm border border-red-500/40 bg-red-500/15" /> Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm border border-amber-500/50 bg-amber-500/20" /> Awaiting approval
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm border-2 border-primary bg-primary/20" /> Your pick
              </span>
            </div>
          </div>

          {starts.length === 0 ? (
            <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              No free time left on this day. Try another date.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="mr-start">Start</Label>
                  <select
                    id="mr-start"
                    className={selectClass}
                    value={chosenStart ?? ''}
                    onChange={(e) => setStart(Number(e.target.value))}
                  >
                    {starts.map((m) => (
                      <option key={m} value={m}>
                        {formatMinute(m)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="mr-duration">Duration</Label>
                  <select
                    id="mr-duration"
                    className={selectClass}
                    value={chosenDuration ?? ''}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {durations.map((d) => (
                      <option key={d} value={d}>
                        {formatDuration(d)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm">
                  <span className="font-semibold">
                    {chosenStart !== null && chosenEnd !== null && formatRange(chosenStart, chosenEnd)}
                  </span>
                  <span className="text-muted-foreground"> · needs admin approval</span>
                </p>
                <Button onClick={openRequest} disabled={chosenStart === null || loading}>
                  Request booking
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {bookings.length > 0 && (
        <div className="rounded-xl border border-border">
          <p className="border-b border-border px-4 py-2.5 text-sm font-semibold">
            Already on {formatDay(date)}
          </p>
          <ul className="divide-y divide-border">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-medium tabular-nums">{formatRange(b.start_minute, b.end_minute)}</span>
                  <span
                    className={cn(
                      'ml-2 rounded-full px-2 py-0.5 text-xs font-medium',
                      b.status === 'approved' ? 'bg-red-500/10 text-red-700' : 'bg-amber-500/15 text-amber-800',
                    )}
                  >
                    {b.status === 'approved' ? 'Booked' : 'Awaiting approval'}
                  </span>
                  {isAdmin && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {b.name} ({b.email}){b.topic ? ` · ${b.topic}` : ''}
                    </span>
                  )}
                </span>
                {isAdmin && (
                  <span className="flex shrink-0 gap-1">
                    {b.status === 'pending' ? (
                      <>
                        <Button size="sm" onClick={() => decide(b, 'approved')} disabled={isPending}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => decide(b, 'declined')} disabled={isPending}>
                          Decline
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => cancel(b)} disabled={isPending}>
                        Cancel
                      </Button>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="size-10 text-primary" />
              <DialogTitle className="text-xl">Request sent</DialogTitle>
              <DialogDescription>
                The room is on hold for you until the SuiHub team reviews it. You&apos;ll hear back by email.
              </DialogDescription>
              <Button className="mt-2" onClick={() => setDialogOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request the meeting room</DialogTitle>
                <DialogDescription>
                  {formatDay(date)}
                  {chosenStart !== null && chosenEnd !== null && `, ${formatRange(chosenStart, chosenEnd)}`}.
                  3rd floor. An admin confirms every booking.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="mr-name">Your name</Label>
                  <Input id="mr-name" name="name" required placeholder="Jane Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mr-email">Email</Label>
                  <Input id="mr-email" name="email" type="email" required placeholder="jane@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mr-topic">What&apos;s it for? (optional)</Label>
                  <Input id="mr-topic" name="topic" placeholder="Team sync, client call…" />
                </div>
                <Turnstile
                  ref={turnstileRef}
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken('')}
                  onError={() => setCaptchaToken('')}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending || (captchaEnabled && !captchaToken)}>
                    {isPending ? 'Sending…' : 'Send request'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
