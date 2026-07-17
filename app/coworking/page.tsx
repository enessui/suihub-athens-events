import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { CoworkingClient } from '@/components/coworking/coworking-client'
import { getCoworking } from './actions'
import { DEFAULT_COWORKING } from '@/lib/coworking'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Coworking — SuiHub Athens',
  description: 'Free coworking space at SuiHub Athens. Open to everyone.',
}

export default async function CoworkingPage() {
  const [content, trueAdmin] = await Promise.all([
    safe(getCoworking, DEFAULT_COWORKING),
    isAdminSafe(),
  ])

  const isAdmin = await getEffectiveIsAdmin(trueAdmin)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/coworking" />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to calendar
          </Link>

          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Coworking Space</h1>
            <p className="mt-3 text-muted-foreground">
              A free, open, community-driven workspace in the heart of Athens.
            </p>
            <Link
              href="/reserve?checkin=1"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Here today? Check in →
            </Link>
          </div>

          <CoworkingClient content={content} isAdmin={isAdmin} />
        </div>
      </div>
    </main>
  )
}
