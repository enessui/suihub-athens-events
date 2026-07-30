'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Lock } from 'lucide-react'
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
import { getMeetingBookings, bookMeetingRoom, cancelMeetingBooking } from '@/app/meeting-room/actions'
import { MEETING_HOURS, formatHour, type MeetingBooking } from '@/lib/meeting-room'
import { CheckinClient } from '@/components/checkin/checkin-client'
import { Turnstile, captchaEnabled, type TurnstileHandle } from '@/components/turnstile'
import type { CheckinEntry, DailyCount, LeaderboardEntry } from '@/app/checkin/actions'

function todayStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function ReserveClient({
  initialDate,
  initialMeetingBookings,
  initialMode = 'checkin',
  checkinCount,
  leaderboard,
  allTimeLeaderboard,
  attendance,
  isAdmin,
}: {
  initialDate: string
  initialMeetingBookings: MeetingBooking[]
  initialMode?: 'meeting' | 'checkin'
  checkinCount: number
  leaderboard: LeaderboardEntry[]
  allTimeLeaderboard: LeaderboardEntry[]
  attendance: { today: CheckinEntry[]; daily: DailyCount[] } | null
  isAdmin: boolean
}) {
  const [mode, setMode] = useState<'meeting' | 'checkin'>(initialMode)
  const [date, setDate] = useState(initialDate)
  const [meetingBookings, setMeetingBookings] = useState(initialMeetingBookings)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const bookedByHour = new Map(meetingBookings.map((b) => [b.hour, b]))

  useEffect(() => {
    if (date === initialDate) return
    setLoading(true)
    getMeetingBookings(date)
      .then(setMeetingBookings)
      .finally(() => setLoading(false))
  }, [date, initialDate])

  function handleBookMeeting(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (selectedHour === null) return
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await bookMeetingRoom({
        date,
        hour: selectedHour,
        name: (fd.get('name') as string) ?? '',
        email: (fd.get('email') as string) ?? '',
        topic: (fd.get('topic') as string) ?? '',
        captchaToken,
      })
      if (result?.error) {
        toast.error(result.error)
        setCaptchaToken('')
        turnstileRef.current?.reset()
        return
      }
      toast.success(`Meeting room booked for ${formatHour(selectedHour)} on ${date}`)
      setSelectedHour(null)
      setCaptchaToken('')
      setMeetingBookings(await getMeetingBookings(date))
    })
  }

  function handleCancelMeeting(b: MeetingBooking) {
    startTransition(async () => {
      const result = await cancelMeetingBooking(b.id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Booking cancelled')
      setMeetingBookings((prev) => prev.filter((x) => x.id !== b.id))
    })
  }

  const freeMeetingSlots = MEETING_HOURS.length - meetingBookings.length

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs + date */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex h-9 items-stretch rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => setMode('checkin')}
            className={`flex items-center rounded-md px-4 text-sm font-medium transition-colors ${
              mode === 'checkin' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Check in
          </button>
          <button
            type="button"
            onClick={() => setMode('meeting')}
            className={`flex items-center rounded-md px-4 text-sm font-medium transition-colors ${
              mode === 'meeting' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Meeting room (3rd floor)
          </button>
        </div>
        {mode === 'meeting' && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="res-date">Date</Label>
              <Input
                id="res-date"
                type="date"
                value={date}
                min={todayStr()}
                onChange={(e) => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <p className="ml-auto text-sm text-muted-foreground">
              {loading
                ? 'Checking availability…'
                : `${freeMeetingSlots} of ${MEETING_HOURS.length} slots free`}
            </p>
          </>
        )}
      </div>

      {mode === 'checkin' && (
        <CheckinClient initialCount={checkinCount} leaderboard={leaderboard} allTimeLeaderboard={allTimeLeaderboard} attendance={attendance} isAdmin={isAdmin} />
      )}

      {mode === 'meeting' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Private meeting room · 3rd floor · booked in two-hour blocks.
            </p>
            <p className="text-sm font-medium">
              {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Daily agenda — shows the day's schedule and current bookings */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {MEETING_HOURS.map((hour) => {
              const booking = bookedByHour.get(hour)
              const taken = !!booking
              return (
                <div
                  key={hour}
                  className="flex items-stretch border-b border-border last:border-b-0"
                >
                  {/* Time gutter */}
                  <div className="flex w-20 shrink-0 flex-col items-end justify-center border-r border-border px-3 py-4 text-xs text-muted-foreground sm:w-24">
                    <span className="font-medium text-foreground">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                    <span>{String(hour + 2).padStart(2, '0')}:00</span>
                  </div>

                  {/* Slot */}
                  {taken ? (
                    <div className="flex flex-1 items-center justify-between gap-2 bg-red-500/10 px-4 py-4">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                          <Lock className="size-3.5 shrink-0" />
                          Reserved
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {booking.topic || 'Private meeting'}
                          {isAdmin ? ` · ${booking.name} (${booking.email})` : ''}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-destructive"
                          onClick={() => handleCancelMeeting(booking)}
                          disabled={isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedHour(hour)}
                      className="flex flex-1 items-center justify-between gap-2 px-4 py-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground">Available</span>
                      <span className="text-xs font-medium text-primary">Book this slot →</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Meeting room dialog */}
      <Dialog open={selectedHour !== null} onOpenChange={(open) => !open && setSelectedHour(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Book the meeting room {selectedHour !== null && `· ${formatHour(selectedHour)}`}
            </DialogTitle>
            <DialogDescription>Private meeting room on the 3rd floor · two-hour block on {date}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookMeeting} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="mr-name">Your name</Label>
              <Input id="mr-name" name="name" required placeholder="Jane Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mr-email">Email</Label>
              <Input id="mr-email" name="email" type="email" required placeholder="jane@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mr-topic">Topic (optional)</Label>
              <Input id="mr-topic" name="topic" placeholder="e.g. Team sync, client call" />
            </div>
            <Turnstile
              ref={turnstileRef}
              onVerify={setCaptchaToken}
              onExpire={() => setCaptchaToken('')}
              onError={() => setCaptchaToken('')}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedHour(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || (captchaEnabled && !captchaToken)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isPending ? 'Booking…' : 'Book slot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
