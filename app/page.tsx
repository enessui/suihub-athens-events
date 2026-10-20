import { SiteHeader } from '@/components/site-header'
import { AboutClient } from '@/components/about/about-client'
import { getAboutCached } from '@/lib/site-content'
import { getMemberCountCached } from '@/lib/site-content'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'
import { DEFAULT_ABOUT } from '@/lib/about'
import { FollowOnX } from '@/components/social/follow-on-x'
import { qrSvg } from '@/lib/qr'
import { X_URL } from '@/lib/social'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SuiHub Athens · The home of builders',
  description:
    'SuiHub Athens is the biggest SuiHub in the world, a free, open coworking space and event hub for developers, creators, and builders. Powered by Sui.',
}

export default async function AboutPage() {
  const [content, trueAdmin, memberCount, xQr] = await Promise.all([
    safe(getAboutCached, DEFAULT_ABOUT),
    isAdminSafe(),
    safe(getMemberCountCached, 0),
    safe(() => qrSvg(X_URL), null),
  ])
  const isAdmin = await getEffectiveIsAdmin(trueAdmin)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/" />
      <AboutClient content={content} isAdmin={isAdmin} memberCount={memberCount} />
      <div className="mx-auto max-w-6xl px-4 pb-12 md:px-6 md:pb-16">
        <FollowOnX qr={xQr} />
      </div>
    </main>
  )
}
