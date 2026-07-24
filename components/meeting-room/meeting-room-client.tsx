'use client'

import { useEffect, useState, useTransition } from 'react'
import { Clock, Lock } from 'lucide-react'
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

function todayStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function MeetingRoomClient({
  initialDate,
  initialBookings,
  isAdmin,
}: {
  initialDate: string
  initialBookings: MeetingBooking[]
  isAdmin: boolean
}) {
  const [date, setDate] = useState(initialDate)
  const [bookings, setBookings] = useState(initialBookings)
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const bookedByHour = new Map(bookings.map((b) => [b.hour, b]))

  useEffect(() => {
    if (date === initialDate) return
    setLoading(true)
    getMeetingBookings(date)
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [date, initialDate])

  function handleBook(e: React.FormEvent<HTMLFormElement>) {
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
      })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Meeting room booked for ${formatHour(selectedHour)} on ${date}`)
      setSelectedHour(null)
      setBookings(await getMeetingBookings(date))
    })
  }

  function handleCancel(b: MeetingBooking) {
    startTransition(async () => {
      const result = await cancelMeetingBooking(b.id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Booking cancelled')
      setBookings((prev) => prev.filter((x) => x.id !== b.id))
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <Label htmlFor="mr-date">Date</Label>
          <Input
            id="mr-date"
            type="date"
            value={date}
            min={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {loading
            ? 'Checking availability…'
            : `${MEETING_HOURS.length - bookings.length} of ${MEETING_HOURS.length} slots free`}
        </p>
      </div>

      {/* Time slots */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MEETING_HOURS.map((hour) => {
          const booking = bookedByHour.get(hour)
          const taken = !!booking
          return (
            <button
              key={hour}
              type="button"
              disabled={taken}
              onClick={() => setSelectedHour(hour)}
              className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm transition-all ${
                taken
                  ? 'cursor-not-allowed border-red-500/40 bg-red-500/10 text-red-600'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:shadow-sm'
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock className="size-4" />
                {formatHour(hour)}
              </span>
              {taken ? (
                <span className="flex items-center gap-1 text-xs">
                  <Lock className="size-3" />
                  {isAdmin ? booking.name : 'Booked'}
                </span>
              ) : (
                <span className="text-xs font-medium">Available</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Admin: booking list */}
      {isAdmin && bookings.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Bookings for {date}</p>
          <ul className="flex flex-col gap-2">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium">{formatHour(b.hour)}</span>
                  {' · '}
                  {b.name} ({b.email}){b.topic ? ` · ${b.topic}` : ''}
                </span>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleCancel(b)} disabled={isPending}>
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Booking dialog */}
      <Dialog open={selectedHour !== null} onOpenChange={(open) => !open && setSelectedHour(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Book the meeting room {selectedHour !== null && `· ${formatHour(selectedHour)}`}
            </DialogTitle>
            <DialogDescription>Private meeting room on the 3rd floor · two-hour block on {date}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBook} className="flex flex-col gap-4">
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSelectedHour(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {isPending ? 'Booking…' : 'Book slot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
