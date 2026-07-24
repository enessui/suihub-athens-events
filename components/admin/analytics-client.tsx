'use client'

import { Fragment, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Download, Users, CalendarClock, Mail, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MemberRow, EventRequestRow, SubscriberRow } from '@/app/admin/analytics/page'

type Tab = 'coworkers' | 'requests' | 'newsletter'

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.join(',')
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(',')).join('\n')
  return `${header}\n${body}`
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Count rows per month for a small 6-month trend
function monthlyTrend(rows: { created_at: string }[]): { label: string; count: number }[] {
  const now = new Date()
  const buckets: { key: string; label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      count: 0,
    })
  }
  const idx = new Map(buckets.map((b, i) => [b.key, i]))
  for (const r of rows) {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const i = idx.get(key)
    if (i !== undefined) buckets[i].count++
  }
  return buckets.map(({ label, count }) => ({ label, count }))
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function TrendChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <TrendingUp className="size-4 text-primary" />
        Last 6 months
      </p>
      <div className="flex items-end gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-medium">{d.count}</span>
            <div
              className="w-full rounded-t bg-primary/70"
              style={{ height: `${Math.max((d.count / max) * 90, 3)}px` }}
            />
            <span className="text-[10px] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AnalyticsClient({
  userEmail,
  members,
  requests,
  subscribers,
}: {
  userEmail: string
  members: MemberRow[]
  requests: EventRequestRow[]
  subscribers: SubscriberRow[]
}) {
  const [tab, setTab] = useState<Tab>('coworkers')

  const stamp = new Date().toISOString().slice(0, 10)
  const subscriberEmails = useMemo(() => new Set(subscribers.map((s) => s.email)), [subscribers])
  const memberTrend = useMemo(() => monthlyTrend(members), [members])
  const requestTrend = useMemo(() => monthlyTrend(requests), [requests])

  function exportMembers() {
    const cols = ['name', 'email', 'telegram', 'building', 'subscribed', 'registered_at']
    const rows = members.map((m) => ({
      name: m.name,
      email: m.email,
      telegram: m.telegram ?? '',
      building: m.building ?? '',
      subscribed: subscriberEmails.has(m.email) ? 'yes' : 'no',
      registered_at: m.created_at,
    }))
    downloadCsv(`suihub-coworkers-${stamp}.csv`, toCsv(rows, cols))
  }

  function exportRequests() {
    const cols = [
      'title', 'category', 'preferred_date', 'estimated_attendance',
      'host_name', 'host_email', 'registration_link', 'description', 'submitted_at',
    ]
    const rows = requests.map((r) => ({
      title: r.title,
      category: r.category ?? '',
      preferred_date: r.preferred_date ?? '',
      estimated_attendance: r.estimated_attendance ?? '',
      host_name: r.host_name,
      host_email: r.host_email,
      registration_link: r.registration_link ?? '',
      description: r.description ?? '',
      submitted_at: r.created_at,
    }))
    downloadCsv(`suihub-event-requests-${stamp}.csv`, toCsv(rows, cols))
  }

  function exportSubscribers() {
    const rows = subscribers.map((s) => ({ email: s.email, subscribed_at: s.created_at }))
    downloadCsv(`suihub-newsletter-${stamp}.csv`, toCsv(rows, ['email', 'subscribed_at']))
  }

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
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registrations, event requests, and newsletter. Admin only.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {([
            ['coworkers', `Coworkers (${members.length})`],
            ['requests', `Event Requests (${requests.length})`],
            ['newsletter', `Newsletter (${subscribers.length})`],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Coworkers */}
        {tab === 'coworkers' && (
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard icon={<Users className="size-5" />} label="Registered coworkers" value={members.length} />
              <StatCard icon={<Mail className="size-5" />} label="Opted into newsletter" value={members.filter((m) => subscriberEmails.has(m.email)).length} />
              <StatCard icon={<CalendarClock className="size-5" />} label="This month" value={memberTrend[memberTrend.length - 1]?.count ?? 0} />
            </div>
            <TrendChart data={memberTrend} />
            <div className="flex justify-end">
              <Button onClick={exportMembers} disabled={members.length === 0}>
                <Download className="size-4" /> Export CSV
              </Button>
            </div>
            <DataTable
              columns={['Name', 'Email', 'Telegram', 'Building', 'News', 'Registered']}
              rows={members.map((m) => [
                m.name,
                m.email,
                m.telegram ? `@${m.telegram}` : '—',
                m.building ?? '—',
                subscriberEmails.has(m.email) ? '✓' : '—',
                fmtDate(m.created_at),
              ])}
              empty="No coworkers have registered yet."
            />
          </div>
        )}

        {/* Event requests */}
        {tab === 'requests' && (
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard icon={<CalendarClock className="size-5" />} label="Total requests" value={requests.length} />
              <StatCard icon={<TrendingUp className="size-5" />} label="This month" value={requestTrend[requestTrend.length - 1]?.count ?? 0} />
              <StatCard icon={<Users className="size-5" />} label="Unique hosts" value={new Set(requests.map((r) => r.host_email)).size} />
            </div>
            <TrendChart data={requestTrend} />
            <div className="flex justify-end">
              <Button onClick={exportRequests} disabled={requests.length === 0}>
                <Download className="size-4" /> Export CSV
              </Button>
            </div>
            <RequestsTable requests={requests} />
          </div>
        )}

        {/* Newsletter */}
        {tab === 'newsletter' && (
          <div className="mt-6 flex flex-col gap-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard icon={<Mail className="size-5" />} label="Subscribers" value={subscribers.length} />
              <StatCard icon={<CalendarClock className="size-5" />} label="This month" value={monthlyTrend(subscribers)[5]?.count ?? 0} />
            </div>
            <div className="flex justify-end">
              <Button onClick={exportSubscribers} disabled={subscribers.length === 0}>
                <Download className="size-4" /> Export CSV
              </Button>
            </div>
            <DataTable
              columns={['Email', 'Subscribed']}
              rows={subscribers.map((s) => [s.email, fmtDate(s.created_at)])}
              empty="No newsletter subscribers yet."
            />
          </div>
        )}
      </div>
    </div>
  )
}

function RequestsTable({ requests }: { requests: EventRequestRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
        No event requests yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="w-8 px-2 py-3" />
            <th className="px-4 py-3 font-medium text-muted-foreground">Event</th>
            <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">Category</th>
            <th className="hidden px-4 py-3 font-medium text-muted-foreground md:table-cell">Preferred date</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Host</th>
            <th className="hidden px-4 py-3 font-medium text-muted-foreground sm:table-cell">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const open = expanded.has(r.id)
            return (
              <Fragment key={r.id}>
                <tr
                  className="cursor-pointer border-b border-border last:border-b-0 hover:bg-muted/40"
                  onClick={() => toggle(r.id)}
                >
                  <td className="px-2 py-3 text-muted-foreground">
                    <ChevronRight className={`size-4 transition-transform ${open ? 'rotate-90' : ''}`} />
                  </td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{r.category ?? '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{r.preferred_date ?? '—'}</td>
                  <td className="px-4 py-3">{r.host_name}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{fmtDate(r.created_at)}</td>
                </tr>
                {open && (
                  <tr className="border-b border-border bg-muted/20 last:border-b-0">
                    <td />
                    <td colSpan={5} className="px-4 py-4">
                      <dl className="grid gap-3 sm:grid-cols-2">
                        <Detail label="Host name" value={r.host_name} />
                        <Detail label="Host email" value={<a href={`mailto:${r.host_email}`} className="text-primary hover:underline">{r.host_email}</a>} />
                        <Detail label="Category" value={r.category ?? '—'} />
                        <Detail label="Preferred date" value={r.preferred_date ?? '—'} />
                        <Detail label="Estimated attendance" value={r.estimated_attendance ?? '—'} />
                        <Detail
                          label="Registration link"
                          value={
                            r.registration_link ? (
                              <a href={r.registration_link} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">
                                {r.registration_link}
                              </a>
                            ) : '—'
                          }
                        />
                        <div className="sm:col-span-2">
                          <Detail
                            label="Description"
                            value={
                              r.description
                                ? <span className="whitespace-pre-line">{r.description}</span>
                                : '—'
                            }
                          />
                        </div>
                        <Detail label="Submitted" value={new Date(r.created_at).toLocaleString('en-US')} />
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}

function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: string[]
  rows: (string | number)[][]
  empty: string
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
