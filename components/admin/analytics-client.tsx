'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Users, CalendarClock, Mail, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadCsv, toCsv } from '@/lib/csv'
import type { MemberRow, SubscriberRow } from '@/app/admin/analytics/page'

type Tab = 'coworkers' | 'newsletter'

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
  subscribers,
}: {
  userEmail: string
  members: MemberRow[]
  subscribers: SubscriberRow[]
}) {
  const [tab, setTab] = useState<Tab>('coworkers')

  const stamp = new Date().toISOString().slice(0, 10)
  const subscriberEmails = useMemo(() => new Set(subscribers.map((s) => s.email)), [subscribers])
  const memberTrend = useMemo(() => monthlyTrend(members), [members])

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
          Coworking registrations and newsletter. Admin only.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
          {([
            ['coworkers', `Coworkers (${members.length})`],
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
