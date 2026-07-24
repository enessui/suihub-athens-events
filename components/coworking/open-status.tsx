'use client'

import { useEffect, useState } from 'react'

const OPEN_HOUR = 10
const CLOSE_HOUR = 19
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Current time parts in Athens, regardless of the viewer's own timezone.
function athensNow(): { dow: number; hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Athens',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date())
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon'
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd)
  return { dow, hour, minute }
}

function nextOpenLabel(dow: number): string {
  // Find the next weekday that is open (Mon–Fri)
  for (let i = 1; i <= 7; i++) {
    const d = (dow + i) % 7
    if (d >= 1 && d <= 5) {
      const rel = i === 1 ? 'tomorrow' : DAY_NAMES[d]
      return `opens ${rel} 10:00`
    }
  }
  return 'opens Mon 10:00'
}

export function OpenStatus() {
  const [now, setNow] = useState<{ dow: number; hour: number; minute: number } | null>(null)

  useEffect(() => {
    setNow(athensNow())
    const t = setInterval(() => setNow(athensNow()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (!now) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
        Checking hours…
      </span>
    )
  }

  const isWeekday = now.dow >= 1 && now.dow <= 5
  const isOpen = isWeekday && now.hour >= OPEN_HOUR && now.hour < CLOSE_HOUR

  if (isOpen) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Open now · closes 19:00
      </span>
    )
  }

  // Closed — figure out the next opening
  let label: string
  if (isWeekday && now.hour < OPEN_HOUR) {
    label = 'opens today 10:00'
  } else {
    label = nextOpenLabel(now.dow)
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-sm font-medium text-muted-foreground">
      <span className="size-2 rounded-full bg-muted-foreground/60" />
      Closed · {label}
    </span>
  )
}
