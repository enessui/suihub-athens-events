import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { VisitGuideView } from '@/components/visit/visit-guide'
import { getCoworkingCached, getVisitGuideCached } from '@/lib/site-content'
import { DEFAULT_COWORKING } from '@/lib/coworking'
import { DEFAULT_VISIT_GUIDE } from '@/lib/visit-guide'
import { getGalleryImages, type GalleryImage } from '@/app/gallery/actions'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Visit Us · SuiHub Athens',
  description: 'Where SuiHub Athens is, when it’s open, and what you can do there.',
}

export default async function VisitPage({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string }>
}) {
  // Old links to the meeting room tab that used to live here.
  if ((await searchParams).meeting) redirect('/coworking?space=launchpad')

  const [guide, coworking, trueAdmin] = await Promise.all([
    safe(getVisitGuideCached, DEFAULT_VISIT_GUIDE),
    safe(getCoworkingCached, DEFAULT_COWORKING),
    isAdminSafe(),
  ])
  const isAdmin = await getEffectiveIsAdmin(trueAdmin)

  // Gallery photos only feed the admin photo picker.
  const gallery = isAdmin ? await safe(getGalleryImages, [] as GalleryImage[]) : []

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/reserve" />
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10">
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to events
          </Link>

          <VisitGuideView
            guide={guide}
            hours={{ weekdays: coworking.hoursWeekdays, note: coworking.hoursNote }}
            isAdmin={isAdmin}
            galleryPhotos={gallery.map((g) => g.url)}
          />
        </div>
      </div>
    </main>
  )
}
