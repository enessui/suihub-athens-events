'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ROOM_OPEN,
  ROOM_CLOSE,
  athensNow,
  formatDay,
  formatMinute,
  formatRange,
  isWeekend,
} from '@/lib/meeting-room'
import { COLORS, roomStatus, type RoomSlot } from '@/components/tv/room-status'

export type { RoomSlot }

const TICK_MS = 15_000 // clock and status
const REFRESH_MS = 60_000 // bookings
const STALE_MS = 5 * 60_000 // warn if bookings haven't refreshed for this long
const RELOAD_MS = 6 * 60 * 60_000 // full reload now and then, to pick up new deploys

const SPAN = ROOM_CLOSE - ROOM_OPEN
function shortDay(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

const leftPct = (m: number) => `${((m - ROOM_OPEN) / SPAN) * 100}%`
const widthPct = (minutes: number) => `${(minutes / SPAN) * 100}%`

export function RoomDisplay({
  schedule,
  days,
  initialNow,
  qr,
}: {
  /** null when the bookings couldn't be loaded */
  schedule: RoomSlot[] | null
  /** Today first, then the following weekdays */
  days: string[]
  initialNow: { date: string; minute: number }
  qr: string | null
}) {
  const router = useRouter()
  const [now, setNow] = useState(initialNow)
  const [wallClock, setWallClock] = useState<number | null>(null)
  const [receivedAt, setReceivedAt] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => {
      setNow(athensNow())
      setWallClock(Date.now())
    }
    tick()
    const t = setInterval(tick, TICK_MS)
    const r = setInterval(() => router.refresh(), REFRESH_MS)
    const reload = setTimeout(() => window.location.reload(), RELOAD_MS)
    return () => {
      clearInterval(t)
      clearInterval(r)
      clearTimeout(reload)
    }
  }, [router])

  // Every successful refresh hands us a new schedule; remember when.
  useEffect(() => setReceivedAt(Date.now()), [schedule])

  const stale = wallClock !== null && receivedAt !== null && wallClock - receivedAt > STALE_MS

  const today = schedule ? schedule.filter((b) => b.date === now.date) : null
  const status = roomStatus(now, today)
  const openToday = !isWeekend(now.date)
  const showNowLine = openToday && now.minute >= ROOM_OPEN && now.minute <= ROOM_CLOSE

  // Today's list: the current booking and what's ahead. Finished ones are
  // only counted, so a busy day still fits on screen.
  const finished = (today ?? []).filter((b) => b.end <= now.minute)
  const ahead = (today ?? []).filter((b) => b.end > now.minute).slice(0, 6)

  const upcoming = days.filter((d) => d > now.date).slice(0, 4)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#030F1C] font-sans text-white">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between px-[5.33vmin] py-[2.5vmin]">
        <div className="flex items-center gap-[2.13vmin]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/SuiHub_Symbol_Cloud.png" alt="SuiHub Athens" className="h-[4.5vmin] w-auto object-contain" />
          <div className="h-[3.5vmin] w-px bg-white/20" />
          <p className="whitespace-nowrap text-[2.2vmin] font-semibold uppercase tracking-[0.2em] text-white/75">
            Meeting room · 3rd floor
          </p>
        </div>
        <div className="flex items-baseline gap-[2.67vmin]">
          <p className="whitespace-nowrap text-[2.4vmin] text-white/60">{formatDay(now.date)}</p>
          <p className="text-[4vmin] font-semibold tabular-nums">{formatMinute(now.minute)}</p>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-[4.44vmin] px-[5.33vmin] pb-[2vmin] portrait:grid-cols-1 portrait:grid-rows-[auto_1fr]">
        {/* Status */}
        <section
          className="flex min-h-0 flex-col justify-between gap-[4vmin] rounded-[2.5vmin] border-2 p-[4vmin] portrait:min-h-[40vmin]"
          style={{ borderColor: `${status.color}66`, backgroundColor: `${status.color}14` }}
        >
          <div>
            <div className="flex items-center gap-[2.67vmin]">
              <span
                className="size-[4vmin] shrink-0 rounded-full"
                style={{ backgroundColor: status.color, boxShadow: `0 0 4vmin ${status.color}99` }}
              />
              <h1
                className={`${status.label.length > 10 ? 'text-[7vmin]' : 'text-[10vmin]'} font-bold leading-none tracking-tight`}
                style={{ color: status.color }}
              >
                {status.label}
              </h1>
            </div>
            <p className="mt-[3vmin] text-[4.2vmin] font-medium text-white/90">{status.detail}</p>
          </div>

          {openToday && today && (
            <div>
              <p className="mb-[1.5vmin] text-[2vmin] font-semibold uppercase tracking-[0.15em] text-white/50">
                Today
              </p>
              <div className="relative h-[7vmin] overflow-hidden rounded-[1.2vmin] bg-white/[0.06]">
                {today.map((b) => (
                  <div
                    key={b.id}
                    className="absolute inset-y-0"
                    style={{
                      left: leftPct(b.start),
                      width: widthPct(b.end - b.start),
                      backgroundColor: b.status === 'approved' ? `${COLORS.inUse}cc` : `${COLORS.reserved}99`,
                      borderLeft: '2px solid #030F1C',
                      borderRight: '2px solid #030F1C',
                    }}
                  />
                ))}
                {showNowLine && (
                  <div
                    className="absolute inset-y-0 w-[0.62vmin] bg-white shadow-[0_0_1.5vh_white]"
                    style={{ left: leftPct(now.minute) }}
                  />
                )}
              </div>
              <div className="relative mt-[1vmin] h-[2.6vmin] text-[2vmin] tabular-nums text-white/50">
                {Array.from({ length: SPAN / 60 + 1 }, (_, i) => ROOM_OPEN + i * 60).map((m, i, all) => (
                  <span
                    key={m}
                    className={`absolute ${i === 0 ? '' : i === all.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
                    style={{ left: leftPct(m) }}
                  >
                    {m / 60}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Schedule */}
        <section className="flex min-h-0 flex-col gap-[3.5vmin] overflow-hidden">
          <div>
            <h2 className="mb-[1.5vmin] text-[2.2vmin] font-semibold uppercase tracking-[0.15em] text-white/50">
              Booked today
            </h2>
            {!openToday ? (
              <p className="text-[3vmin] text-white/50">Closed today</p>
            ) : !today ? (
              <p className="text-[3vmin] text-white/50">Couldn&apos;t load bookings</p>
            ) : today.length === 0 ? (
              <p className="text-[3vmin] text-[#34D399]">Nothing booked. Free all day.</p>
            ) : (
              <ul className="flex flex-col gap-[1vmin]">
                {finished.length > 0 && (
                  <li className="text-[2.2vmin] text-white/40">
                    {finished.length} earlier {finished.length === 1 ? 'booking' : 'bookings'} finished
                  </li>
                )}
                {ahead.map((b) => {
                  const current = b.start <= now.minute && now.minute < b.end
                  const color = b.status === 'approved' ? COLORS.inUse : COLORS.reserved
                  return (
                    <li
                      key={b.id}
                      className={`flex items-center justify-between rounded-[1.2vmin] px-[2.13vmin] py-[1.3vmin] ${current ? 'bg-white/10' : 'bg-white/[0.04]'}`}
                    >
                      <span className="text-[3.6vmin] font-semibold tabular-nums">{formatRange(b.start, b.end)}</span>
                      <span className="flex items-center gap-[1.07vmin] text-[2.2vmin] font-medium" style={{ color }}>
                        <span className="size-[1.4vmin] rounded-full" style={{ backgroundColor: color }} />
                        {current ? 'Now' : b.status === 'approved' ? 'Booked' : 'Awaiting approval'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {schedule && upcoming.length > 0 && (
            <div className="min-h-0">
              <h2 className="mb-[1.5vmin] text-[2.2vmin] font-semibold uppercase tracking-[0.15em] text-white/50">
                Coming up
              </h2>
              <ul className="flex flex-col gap-[1.2vmin]">
                {upcoming.map((d) => {
                  const slots = schedule.filter((b) => b.date === d)
                  return (
                    <li key={d} className="flex items-baseline gap-[2.13vmin] text-[2.6vmin]">
                      <span className="w-[14.22vmin] shrink-0 font-semibold text-white/85">{shortDay(d)}</span>
                      {slots.length === 0 ? (
                        <span className="text-white/40">Free all day</span>
                      ) : (
                        <span className="min-w-0 truncate tabular-nums text-white/75">
                          {slots
                            .slice(0, 2)
                            .map((b) => formatRange(b.start, b.end))
                            .join('   ')}
                          {slots.length > 2 && <span className="text-white/45">{`   +${slots.length - 2} more`}</span>}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="flex shrink-0 items-center justify-between gap-[3.56vmin] border-t border-white/10 px-[5.33vmin] py-[2vmin]">
        <div className="flex items-center gap-[2.67vmin]">
          {qr && (
            <div
              className="size-[11vmin] shrink-0 rounded-[1vmin] bg-white p-[0.6vmin] [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
          )}
          <div>
            <p className="text-[3vmin] font-semibold">Need the room? Scan to book.</p>
            <p className="text-[2.1vmin] text-white/55">
              Pick a time and length. The SuiHub team confirms every request.
            </p>
          </div>
        </div>
        {stale && receivedAt !== null && (
          <p className="flex items-center gap-[1.07vmin] text-[1.9vmin] text-amber-300/90">
            <span className="size-[1.2vmin] rounded-full bg-amber-300" />
            Not updated since{' '}
            {new Date(receivedAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/Athens',
            })}
          </p>
        )}
      </footer>
    </div>
  )
}
