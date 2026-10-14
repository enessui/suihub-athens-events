'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarCheck, Check, Download, ExternalLink, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EventFormDialog } from '@/components/admin/event-form-dialog'
import { declineEventRequest, reopenEventRequest } from '@/app/admin/actions'
import { downloadCsv, toCsv } from '@/lib/csv'
import {
  DEFAULT_REQUEST_TIME,
  eventFromRequest,
  type EventRequestRow,
  type EventRequestStatus,
} from '@/lib/event-requests'

const TABS: { id: EventRequestStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'declined', label: 'Declined' },
]

/** "Monday 26 October" from YYYY-MM-DD, without timezone drift. */
function fmtDay(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function fmtSubmitted(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)
}

function whenLabel(date: string | null, today: string): string {
  if (!date) return 'No date given'
  const d = daysBetween(today, date)
  const rel = d === 0 ? 'today' : d === 1 ? 'tomorrow' : d > 1 ? `in ${d} days` : d === -1 ? 'yesterday' : `${-d} days ago`
  return `${fmtDay(date)} (${rel})`
}

function RequestCard({
  r,
  today,
  busy,
  onApprove,
  onDecline,
  onReopen,
}: {
  r: EventRequestRow
  today: string
  busy: boolean
  onApprove: () => void
  onDecline: () => void
  onReopen: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const long = (r.description?.length ?? 0) > 220

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{r.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {[r.category, whenLabel(r.preferred_date, today), r.estimated_attendance && `~${r.estimated_attendance} people`]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {r.status === 'pending' && (
            <>
              <Button size="sm" onClick={onApprove} disabled={busy}>
                <Check className="size-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={onDecline} disabled={busy}>
                <X className="size-4" /> Decline
              </Button>
            </>
          )}
          {r.status === 'approved' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CalendarCheck className="size-3.5" />
              {r.event_id ? 'On the calendar' : 'Approved'}
            </span>
          )}
          {r.status === 'declined' && (
            <Button size="sm" variant="outline" onClick={onReopen} disabled={busy}>
              <RotateCcw className="size-4" /> Move back to pending
            </Button>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm">
        <span className="font-medium">{r.host_name}</span>
        {' · '}
        <a href={`mailto:${r.host_email}`} className="text-primary hover:underline">
          {r.host_email}
        </a>
        {r.registration_link && (
          <>
            {' · '}
            <a
              href={r.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Registration link <ExternalLink className="size-3" />
            </a>
          </>
        )}
      </p>

      {r.description && (
        <div className="mt-2 text-sm text-muted-foreground">
          <p className={`whitespace-pre-line ${!expanded && long ? 'line-clamp-3' : ''}`}>{r.description}</p>
          {long && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs font-medium text-primary hover:underline">
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Submitted {fmtSubmitted(r.created_at)}
        {r.decided_at && r.status !== 'pending' && ` · ${r.status === 'approved' ? 'approved' : 'declined'} ${fmtSubmitted(r.decided_at)}`}
      </p>
    </li>
  )
}

export function EventRequestsClient({
  userEmail,
  requests,
  loadError,
  today,
}: {
  userEmail: string
  requests: EventRequestRow[]
  loadError: string | null
  /** YYYY-MM-DD in Athens, from the server, so dates read the same on both sides. */
  today: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<EventRequestStatus>('pending')
  const [approving, setApproving] = useState<EventRequestRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const byStatus = useMemo(() => {
    const groups: Record<EventRequestStatus, EventRequestRow[]> = { pending: [], approved: [], declined: [] }
    for (const r of requests) groups[r.status ?? 'pending']?.push(r)
    return groups
  }, [requests])

  // Pending: soonest requested date first, undated after, and the ones whose
  // date has already gone kept apart so they don't bury the real queue.
  const { upcoming, expired } = useMemo(() => {
    const sorted = [...byStatus.pending].sort((a, b) =>
      (a.preferred_date ?? '9999').localeCompare(b.preferred_date ?? '9999'),
    )
    return {
      upcoming: sorted.filter((r) => !r.preferred_date || r.preferred_date >= today),
      expired: sorted.filter((r) => r.preferred_date && r.preferred_date < today).reverse(),
    }
  }, [byStatus.pending, today])

  function decline(r: EventRequestRow) {
    startTransition(async () => {
      const result = await declineEventRequest(r.id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      router.refresh()
      toast.success(`Declined: ${r.title}`, {
        action: { label: 'Undo', onClick: () => reopen(r, false) },
      })
    })
  }

  function reopen(r: EventRequestRow, announce = true) {
    startTransition(async () => {
      const result = await reopenEventRequest(r.id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      router.refresh()
      if (announce) toast.success(`Back in pending: ${r.title}`)
    })
  }

  function exportCsv() {
    const cols = [
      'status', 'title', 'category', 'preferred_date', 'estimated_attendance',
      'host_name', 'host_email', 'registration_link', 'description', 'submitted_at',
    ]
    const rows = requests.map((r) => ({ ...r, submitted_at: r.created_at }))
    downloadCsv(`suihub-event-requests-${today}.csv`, toCsv(rows, cols))
  }

  const card = (r: EventRequestRow) => (
    <RequestCard
      key={r.id}
      r={r}
      today={today}
      busy={isPending}
      onApprove={() => setApproving(r)}
      onDecline={() => decline(r)}
      onReopen={() => reopen(r)}
    />
  )

  const list = tab === 'pending' ? upcoming : [...byStatus[tab]].sort((a, b) =>
    (b.preferred_date ?? '').localeCompare(a.preferred_date ?? ''),
  )

  const approval = approving ? eventFromRequest(approving) : null

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back to admin
          </Link>
          <span className="text-xs text-muted-foreground">{userEmail}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Event requests</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sent through &ldquo;Request an event&rdquo; on the calendar. Approving one publishes it to the calendar.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={requests.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>

        {loadError && (
          <p className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Couldn&apos;t load requests: {loadError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label} ({byStatus[id].length})
            </button>
          ))}
        </div>

        <div className="mt-6">
          {list.length === 0 && !(tab === 'pending' && expired.length > 0) ? (
            <p className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
              {tab === 'pending' ? 'Nothing waiting for a decision.' : `No ${tab} requests.`}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">{list.map(card)}</ul>
          )}

          {tab === 'pending' && expired.length > 0 && (
            <details className="mt-8 group">
              <summary className="cursor-pointer list-none text-sm font-semibold text-muted-foreground hover:text-foreground">
                Requested date has passed ({expired.length})
                <span className="ml-1 font-normal group-open:hidden">· show</span>
              </summary>
              <ul className="mt-3 flex flex-col gap-3 opacity-80">{expired.map(card)}</ul>
            </details>
          )}
        </div>
      </div>

      {approving && approval && (
        <EventFormDialog
          key={approving.id}
          open
          onOpenChange={(open) => {
            if (!open) {
              setApproving(null)
              router.refresh()
            }
          }}
          prefill={approval.prefill}
          defaultDate={approval.startInput}
          fromRequestId={approving.id}
          startNote={
            approving.preferred_date
              ? `Requested for ${fmtDay(approving.preferred_date)}. No time was given, so ${DEFAULT_REQUEST_TIME} is filled in.`
              : 'No date was requested. Pick a date and time.'
          }
        />
      )}
    </div>
  )
}
