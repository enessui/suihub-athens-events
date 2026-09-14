import Image from 'next/image'
import Link from 'next/link'
import { Eye, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isAdminSafe } from '@/lib/supabase/safe'
import { RequestEventButton } from '@/components/calendar/request-event-button'
import { MobileNav } from '@/components/mobile-nav'
import { AnnouncementBanner } from '@/components/announcement-banner'
import { PreviewBanner } from '@/components/preview-banner'
import { isPreviewMode } from '@/lib/preview-mode'
import { enablePreviewMode } from '@/app/preview/actions'
import { getAnnouncementCached } from '@/lib/site-content'
import { safe } from '@/lib/supabase/safe'
import { DEFAULT_ANNOUNCEMENT } from '@/lib/announcement'

export async function SiteHeader({ pathname = '/' }: { pathname?: string }) {
  // Run in parallel — these used to await one after another, adding ~600ms to
  // every page. isAdminSafe() is request-cached, so it costs nothing when the
  // page has already asked for it.
  const [trueAdmin, preview, announcement] = await Promise.all([
    isAdminSafe(),
    isPreviewMode(),
    safe(getAnnouncementCached, DEFAULT_ANNOUNCEMENT),
  ])
  const isAdmin = trueAdmin && !preview

  return (
    <>
      <header className="relative border-b border-white/10 bg-[#030F1C]">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center">
              <Image
                src="/SuiHub_Symbol_Cloud.png"
                alt="SuiHub"
                width={90}
                height={28}
                priority
                className="block object-contain"
              />
            </Link>
            <span className="hidden sm:flex items-center text-sm font-bold text-white leading-none">
              The home for builders. Powered by <span className="text-primary ml-1">Sui</span>.
            </span>
          </div>
          <MobileNav />
          <div className="hidden md:flex items-center gap-2">
            <RequestEventButton />
            <Button
              render={<Link href="/reserve" />}
              nativeButton={false}
              size="sm"
              className="bg-white text-[#030F1C] hover:bg-white/90"
            >
              Visit us
            </Button>
            <Button
              render={<Link href="/events" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Events
            </Button>
            <Button
              render={<Link href="/coworking" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Coworking
            </Button>
            <Button
              render={<Link href="/guidelines" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Guidelines
            </Button>
            <Button
              render={<Link href="/gallery" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Gallery
            </Button>
            {isAdmin && (
              <form action={enablePreviewMode.bind(null, pathname)}>
                <Button type="submit" variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10">
                  <Eye className="size-4" />
                  Preview
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>
      <AnnouncementBanner content={announcement} isAdmin={isAdmin} />
      {preview && trueAdmin && <PreviewBanner />}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
          >
            <ShieldCheck className="size-4" />
            Admin
          </Link>
        </div>
      )}
    </>
  )
}
