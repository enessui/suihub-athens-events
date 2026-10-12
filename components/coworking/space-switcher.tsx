import Link from 'next/link'
import { cn } from '@/lib/utils'

export type Space = 'lounge' | 'launchpad'

const SPACES: { id: Space; label: string; caption: string; href: string }[] = [
  { id: 'lounge', label: 'Coworking Lounge', caption: 'Open desks, walk in', href: '/coworking' },
  { id: 'launchpad', label: 'The Launchpad', caption: 'Meeting room, 3rd floor', href: '/coworking?space=launchpad' },
]

/**
 * Choose between the two spaces. Plain links rather than client state, so each
 * tab has its own URL that can be shared and the back button works.
 */
export function SpaceSwitcher({ active }: { active: Space }) {
  return (
    <nav
      aria-label="Spaces"
      className="mb-8 grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-muted/40 p-1 sm:w-max"
    >
      {SPACES.map((s) => {
        const current = s.id === active
        return (
          <Link
            key={s.id}
            href={s.href}
            scroll={false}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'rounded-lg px-4 py-2.5 text-left transition-colors sm:min-w-48',
              current ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground hover:bg-background',
            )}
          >
            <span className="block text-sm font-semibold">{s.label}</span>
            <span className={cn('block text-xs', current ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
              {s.caption}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
