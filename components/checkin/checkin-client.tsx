'use client'

import { useEffect, useState, useTransition } from 'react'
import { CheckCircle2, Trophy, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkIn, getTodayCount, type CheckinEntry, type DailyCount, type LeaderboardEntry } from '@/app/checkin/actions'

const STORAGE_KEY = 'suihub-checkin-identity'

type SavedIdentity = { name: string; email: string }

export function CheckinClient({
  initialCount,
  leaderboard = [],
  allTimeLeaderboard = [],
  attendance,
  isAdmin,
}: {
  initialCount: number
  leaderboard: LeaderboardEntry[]
  allTimeLeaderboard?: LeaderboardEntry[]
  attendance: { today: CheckinEntry[]; daily: DailyCount[] } | null
  isAdmin: boolean
}) {
  const [count, setCount] = useState(initialCount)
  const [saved, setSaved] = useState<SavedIdentity | null>(null)
  const [editing, setEditing] = useState(false)
  const [done, setDone] = useState(false)
  const [board, setBoard] = useState<'month' | 'all'>('month')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSaved(JSON.parse(raw))
    } catch {
      // ignore corrupt storage
    }
  }, [])

  function doCheckIn(name: string, email: string) {
    startTransition(async () => {
      const result = await checkIn({ name, email })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email }))
      } catch {
        // storage unavailable — check-in still succeeded
      }
      setSaved({ name, email })
      setDone(true)
      if (result?.alreadyCheckedIn) {
        toast.info('You were already checked in today. See you around!')
      } else {
        toast.success('Checked in. Welcome!')
        setCount(await getTodayCount())
      }
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    doCheckIn((fd.get('name') as string) ?? '', (fd.get('email') as string) ?? '')
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Live occupancy */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/15">
          <Users className="size-5 text-primary" />
        </span>
        <div>
          <p className="text-2xl font-bold leading-none">{count}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            builder{count === 1 ? '' : 's'} checked in today
          </p>
        </div>
      </div>

      {done ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 py-14 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <p className="text-xl font-semibold">You&apos;re checked in{saved ? `, ${saved.name.split(' ')[0]}` : ''}!</p>
          <p className="text-sm text-muted-foreground">Grab a coffee and make yourself at home.</p>
        </div>
      ) : saved && !editing ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-12 text-center">
          <p className="text-lg">
            Welcome back, <span className="font-semibold">{saved.name.split(' ')[0]}</span>!
          </p>
          <Button
            size="lg"
            className="px-10 text-base"
            disabled={isPending}
            onClick={() => doCheckIn(saved.name, saved.email)}
          >
            {isPending ? 'Checking in…' : 'Check in'}
          </Button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Not {saved.name.split(' ')[0]}? Check in as someone else
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-2">
            <Label htmlFor="ci-name">Your name</Label>
            <Input id="ci-name" name="name" required placeholder="Jane Doe" defaultValue={editing ? '' : saved?.name ?? ''} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ci-email">Email</Label>
            <Input id="ci-email" name="email" type="email" required placeholder="jane@example.com" defaultValue={editing ? '' : saved?.email ?? ''} />
          </div>
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? 'Checking in…' : 'Check in'}
          </Button>
          <p className="text-xs text-muted-foreground">
            We only use this to count visits and share occasional SuiHub Athens updates.
          </p>
        </form>
      )}

      {/* Builder leaderboard — days checked in */}
      {(leaderboard.length > 0 || allTimeLeaderboard.length > 0) && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              <p className="text-sm font-semibold">Builder leaderboard</p>
            </div>
            <div className="flex h-8 items-stretch rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={() => setBoard('month')}
                className={`flex items-center rounded-md px-3 text-xs font-medium transition-colors ${
                  board === 'month' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {new Date().toLocaleDateString('en-US', { month: 'long', timeZone: 'Europe/Athens' })}
              </button>
              <button
                type="button"
                onClick={() => setBoard('all')}
                className={`flex items-center rounded-md px-3 text-xs font-medium transition-colors ${
                  board === 'all' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All time
              </button>
            </div>
          </div>
          {(() => {
            const rows = board === 'month' ? leaderboard : allTimeLeaderboard
            if (rows.length === 0) {
              return <p className="text-sm text-muted-foreground">No check-ins yet for this period.</p>
            }
            return (
              <ol className="flex flex-col gap-2">
                {rows.map((entry, i) => (
                  <li key={`${entry.name}-${i}`} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? 'bg-primary text-white'
                          : i === 1
                            ? 'bg-[#C0E6FF] text-[#030F1C]'
                            : i === 2
                              ? 'bg-[#ABBDCC]/40 text-[#41586B]'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate font-medium">{entry.name}</span>
                    <span className="text-muted-foreground">
                      {entry.visits} day{entry.visits === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ol>
            )
          })()}
        </div>
      )}

      {/* Admin attendance */}
      {isAdmin && attendance && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-4 text-sm font-semibold">Last 7 days</p>
            <div className="flex items-end gap-2">
              {attendance.daily.map(({ date, count: c }) => {
                const max = Math.max(...attendance.daily.map((d) => d.count), 1)
                return (
                  <div key={date} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium">{c}</span>
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${Math.max((c / max) * 80, 4)}px` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 text-sm font-semibold">Checked in today ({attendance.today.length})</p>
            {attendance.today.length === 0 ? (
              <p className="text-sm text-muted-foreground">No check-ins yet today.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {attendance.today.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2">
                    <span>
                      {entry.name} <span className="text-muted-foreground">({entry.email})</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZone: 'Europe/Athens',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
