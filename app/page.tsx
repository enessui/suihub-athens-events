import { SiteHeader } from '@/components/site-header'
import { AboutClient } from '@/components/about/about-client'
import { getAboutCached } from '@/lib/site-content'
import { getMemberCountCached } from '@/lib/site-content'
import { getEffectiveIsAdmin } from '@/lib/preview-mode'
import { safe, isAdminSafe } from '@/lib/supabase/safe'
import { DEFAULT_ABOUT } from '@/lib/about'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'SuiHub Athens · The home of builders',
  description:
    'SuiHub Athens is the biggest SuiHub in the world, a free, open coworking space and event hub for developers, creators, and builders. Powered by Sui.',
}

export default async function AboutPage() {
  const [content, trueAdmin, memberCount] = await Promise.all([
    safe(getAboutCached, DEFAULT_ABOUT),
    isAdminSafe(),
    safe(getMemberCountCached, 0),
  ])
  const isAdmin = await getEffectiveIsAdmin(trueAdmin)

  return (
    <main className="min-h-svh">
      <SiteHeader pathname="/" />
      <AboutClient content={content} isAdmin={isAdmin} memberCount={memberCount} />
    </main>
  )
}
