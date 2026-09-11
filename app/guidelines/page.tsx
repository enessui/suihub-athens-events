import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { GuidelinesClient } from '@/components/guidelines/guidelines-client'
import { getGuidelines } from './actions'
import { DEFAULT_GUIDELINES } from '@/lib/guidelines'
import { sanitizeGuidelines } from '@/lib/sanitize'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Event Guidelines · SuiHub Athens',
  description: 'Space guidelines for hosting events at SuiHub Athens.',
}

export default async function GuidelinesPage() {
  const [rawContent, trueAdmin] = await Promise.all([
    safe(getGuidelines, DEFAULT_GUIDELINES),
    isAdminSafe(),
  ])
  // Sanitize the admin-authored rich text before it reaches the browser, so a
  // stored <script>/onerror can't run for visitors (rendered via innerHTML).
  const content = sanitizeGuidelines(rawContent)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/guidelines" />
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10">
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to events
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Space Guidelines</h1>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know about hosting an event at SuiHub Athens.
            </p>
          </div>

          <GuidelinesClient content={content} isAdmin={await getEffectiveIsAdmin(trueAdmin)} />
        </div>
      </div>
    </main>
  )
}
