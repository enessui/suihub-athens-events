import { ExternalLink } from 'lucide-react'
import { X_HANDLE, X_URL } from '@/lib/social'
import { XLogo } from '@/components/social/x-logo'

/** "Follow us on X" card. The QR code shows on larger screens, for scanning with a phone. */
export function FollowOnX({ qr }: { qr: string | null }) {
  return (
    <section className="flex flex-col items-start gap-6 rounded-2xl border-2 border-primary/40 bg-card/70 p-6 backdrop-blur-sm md:flex-row md:items-center md:p-8">
      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#030F1C] text-white">
        <XLogo className="size-6" />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold tracking-tight">Follow us on X</h2>
        <p className="mt-1 text-lg font-semibold text-primary">@{X_HANDLE}</p>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Be the first to hear about events, workshops and what&apos;s happening at the hub.
        </p>
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#030F1C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#030F1C]/85"
        >
          <XLogo className="size-4" />
          Follow @{X_HANDLE}
          <ExternalLink className="size-3.5 opacity-70" />
        </a>
      </div>

      {qr && (
        <div className="hidden shrink-0 flex-col items-center gap-2 md:flex">
          <div
            className="size-32 rounded-xl border border-border bg-white p-2 [&>svg]:block [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="text-xs text-muted-foreground">Scan with your phone</p>
        </div>
      )}
    </section>
  )
}
