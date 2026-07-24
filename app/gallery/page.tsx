import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { GalleryClient } from '@/components/gallery/gallery-client'
import { getGalleryImages, type GalleryImage } from './actions'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gallery · SuiHub Athens',
  description: 'Photos from events at SuiHub Athens.',
}

export default async function GalleryPage() {
  const [images, trueAdmin] = await Promise.all([
    safe(getGalleryImages, [] as GalleryImage[]),
    isAdminSafe(),
  ])

  const isAdmin = await getEffectiveIsAdmin(trueAdmin)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/gallery" />
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-14">
        <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-6 py-8 md:px-10 md:py-10">
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to events
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Gallery</h1>
            <p className="mt-3 text-muted-foreground">
              Photos from events and happenings at SuiHub Athens.
            </p>
          </div>

          <GalleryClient images={images} isAdmin={isAdmin} />
        </div>
      </div>
    </main>
  )
}
