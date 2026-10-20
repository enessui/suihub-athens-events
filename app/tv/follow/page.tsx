import { qrSvg } from '@/lib/qr'
import { X_HANDLE, X_URL } from '@/lib/social'
import { XLogo } from '@/components/social/x-logo'

export const metadata = {
  title: 'Follow us on X · SuiHub Athens',
  robots: { index: false },
}

const STEPS = ['Open your phone camera', 'Scan the code', 'Tap Follow']

export default async function FollowOnXTvPage() {
  const qr = await qrSvg(X_URL)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#030F1C] font-sans text-white">
      <style>{`
        @keyframes tvFollowGlow {
          0%, 100% { box-shadow: 0 0 6vmin rgba(77, 162, 255, 0.25); }
          50% { box-shadow: 0 0 12vmin rgba(77, 162, 255, 0.55); }
        }
        .tv-follow-card { animation: tvFollowGlow 4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .tv-follow-card { animation: none; } }
      `}</style>

      {/* Backdrop: brand-blue glows and a large, faint X mark */}
      <div aria-hidden className="pointer-events-none absolute -left-[25vmin] -top-[35vmin] size-[95vmin] rounded-full bg-[#4DA2FF]/20 blur-[14vmin]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-[45vmin] -right-[15vmin] size-[85vmin] rounded-full bg-[#4DA2FF]/10 blur-[14vmin]" />
      <XLogo className="pointer-events-none absolute -right-[6vmin] top-1/2 size-[88vmin] -translate-y-1/2 text-white/[0.035]" />

      <header className="relative flex shrink-0 items-center gap-[2vmin] px-[5.3vmin] py-[2.5vmin]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/SuiHub_Symbol_Cloud.png" alt="SuiHub Athens" className="h-[4.5vmin] w-auto object-contain" />
        <div className="h-[3.5vmin] w-px bg-white/20" />
        <p className="whitespace-nowrap text-[2.2vmin] font-semibold uppercase tracking-[0.2em] text-white/75">
          SuiHub Athens
        </p>
      </header>

      <main className="relative grid min-h-0 flex-1 grid-cols-[1.2fr_1fr] items-center gap-[6vmin] px-[8vmin] portrait:grid-cols-1 portrait:content-center portrait:justify-items-center portrait:text-center">
        <section>
          <p className="flex items-center gap-[1.5vmin] text-[2.6vmin] font-semibold uppercase tracking-[0.2em] text-white/60 portrait:justify-center">
            <XLogo className="size-[3vmin]" />
            Stay in the loop
          </p>
          <h1 className="mt-[3vmin] text-[12vmin] font-bold leading-[0.95] tracking-tight">
            Follow us
            <br />
            on X
          </h1>
          <p className="mt-[3.5vmin] text-[7vmin] font-semibold leading-none text-[#4DA2FF]">@{X_HANDLE}</p>
          <p className="mt-[3.5vmin] max-w-[62vmin] text-[3.2vmin] leading-snug text-white/70 portrait:mx-auto">
            Be the first to hear about events, workshops and what&apos;s happening at the hub.
          </p>

          <ol className="mt-[6vmin] flex gap-[4vmin] portrait:justify-center">
            {STEPS.map((step, i) => (
              <li key={step} className="flex max-w-[22vmin] items-start gap-[1.5vmin] text-left">
                <span className="flex size-[5vmin] shrink-0 items-center justify-center rounded-full bg-[#4DA2FF] text-[2.6vmin] font-bold text-[#030F1C]">
                  {i + 1}
                </span>
                <span className="pt-[0.8vmin] text-[2.6vmin] font-medium leading-tight text-white/85">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Profile-style card around the QR code */}
        <section className="justify-self-center">
          <div className="tv-follow-card w-[58vmin] rounded-[4vmin] bg-white p-[3.5vmin] text-[#030F1C]">
            <div className="flex items-center gap-[2vmin]">
              <div className="flex size-[9vmin] shrink-0 items-center justify-center rounded-full bg-[#030F1C]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/SuiHub_Symbol_Cloud.png" alt="" className="w-[62%] object-contain" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[3vmin] font-bold leading-tight">SuiHub Athens</p>
                <p className="truncate text-[2.4vmin] text-[#536471]">@{X_HANDLE}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#030F1C] px-[2.6vmin] py-[1.2vmin] text-[2.5vmin] font-bold text-white">
                Follow
              </span>
            </div>
            <div
              className="mt-[3vmin] aspect-square w-full [&>svg]:block [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <p className="mt-[2vmin] text-center text-[2.8vmin] font-semibold">Scan to follow</p>
          </div>
        </section>
      </main>

      <footer className="relative shrink-0 px-[5.3vmin] py-[2.5vmin] text-[2.2vmin] text-white/45 portrait:text-center">
        x.com/{X_HANDLE}
      </footer>
    </div>
  )
}
