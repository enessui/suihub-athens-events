import { qrSvg } from '@/lib/qr'
import { X_HANDLE, X_URL } from '@/lib/social'
import { XLogo } from '@/components/social/x-logo'

export const metadata = {
  title: 'Follow us on X · SuiHub Athens',
  robots: { index: false },
}

/** One loop of the scan → tap Follow animation. */
const CYCLE_S = 9

// Things drifting up the background. Fixed values (not random) so the page
// renders identically every time. left/size in vmin-ish units, times in s.
const PARTICLES = [
  { left: '6%', size: 2.6, duration: 19, delay: 0, x: true },
  { left: '14%', size: 1.2, duration: 23, delay: 6, x: false },
  { left: '24%', size: 3.4, duration: 27, delay: 11, x: true },
  { left: '33%', size: 1, duration: 17, delay: 3, x: false },
  { left: '46%', size: 2.2, duration: 25, delay: 15, x: true },
  { left: '55%', size: 1.4, duration: 21, delay: 8, x: false },
  { left: '64%', size: 2.8, duration: 29, delay: 2, x: true },
  { left: '72%', size: 1.1, duration: 18, delay: 12, x: false },
  { left: '81%', size: 3, duration: 24, delay: 5, x: true },
  { left: '90%', size: 1.3, duration: 20, delay: 16, x: false },
  { left: '96%', size: 2.4, duration: 26, delay: 9, x: true },
]

const CSS = `
  /* Ambient */
  @keyframes tvDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(9vmin, 7vmin); } }
  @keyframes tvBreathe {
    0%, 100% { transform: translateY(-50%) scale(1) rotate(0deg); }
    50% { transform: translateY(-50%) scale(1.06) rotate(4deg); }
  }
  @keyframes tvRise {
    0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    50% { transform: translate(3vmin, -65vh) rotate(90deg); }
    90% { opacity: 1; }
    100% { transform: translate(-2vmin, -130vh) rotate(180deg); opacity: 0; }
  }
  @keyframes tvFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1vmin); } }
  @keyframes tvGlow {
    0%, 100% { box-shadow: 0 0 6vmin rgba(77, 162, 255, 0.25); }
    50% { box-shadow: 0 0 12vmin rgba(77, 162, 255, 0.55); }
  }
  @keyframes tvShine { 0% { background-position: 200% 0; } 60%, 100% { background-position: -100% 0; } }

  .tv-glow-a { animation: tvDrift 26s ease-in-out infinite; }
  .tv-glow-b { animation: tvDrift 32s ease-in-out infinite reverse; }
  .tv-mark { animation: tvBreathe 18s ease-in-out infinite; }
  .tv-particle { animation: tvRise linear infinite; }
  .tv-card { animation: tvFloat 6s ease-in-out infinite, tvGlow 4s ease-in-out infinite; }
  .tv-handle {
    background: linear-gradient(100deg, #4DA2FF 40%, #C0E6FF 50%, #4DA2FF 60%) 0 0 / 200% 100%;
    -webkit-background-clip: text; background-clip: text; color: transparent;
    animation: tvShine 6s ease-in-out infinite;
  }

  /* The loop: scan brackets close in, then Follow is tapped and becomes Following. */
  @keyframes tvScan {
    0%, 33%, 66.6%, 100% { opacity: 0; transform: scale(1.08); }
    38%, 62% { opacity: 1; transform: scale(1); }
  }
  @keyframes tvTap {
    0%, 68%, 100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    69% { opacity: 0.55; }
    76% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
  }
  @keyframes tvPill {
    0%, 70%, 97%, 100% { background: #030F1C; color: #fff; border-color: #030F1C; }
    72%, 95% { background: #fff; color: #030F1C; border-color: #CFD9DE; }
  }
  @keyframes tvLabelFollow { 0%, 70%, 97%, 100% { opacity: 1; } 72%, 95% { opacity: 0; } }
  @keyframes tvLabelFollowing { 0%, 70%, 97%, 100% { opacity: 0; } 72%, 95% { opacity: 1; } }

  .tv-scan, .tv-tap, .tv-pill, .tv-label-follow, .tv-label-following {
    animation-duration: ${CYCLE_S}s; animation-iteration-count: infinite; animation-timing-function: ease-in-out;
  }
  .tv-scan { animation-name: tvScan; }
  .tv-tap { animation-name: tvTap; animation-timing-function: ease-out; }
  .tv-pill { animation-name: tvPill; }
  .tv-label-follow { animation-name: tvLabelFollow; }
  .tv-label-following { animation-name: tvLabelFollowing; }

  @media (prefers-reduced-motion: reduce) {
    .tv-glow-a, .tv-glow-b, .tv-mark, .tv-card, .tv-handle,
    .tv-scan, .tv-tap, .tv-pill, .tv-label-follow, .tv-label-following { animation: none !important; }
    .tv-particle { display: none; }
    .tv-scan, .tv-tap, .tv-label-following { opacity: 0; }
  }
`

/** An L-shaped corner of the scan frame. */
function Corner({ className }: { className: string }) {
  return <span className={`absolute size-[5vmin] border-[#4DA2FF] ${className}`} />
}

export default async function FollowOnXTvPage() {
  const qr = await qrSvg(X_URL)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#030F1C] font-sans text-white">
      <style>{CSS}</style>

      {/* Backdrop: drifting brand-blue glows, a breathing X, things rising */}
      <div aria-hidden className="tv-glow-a pointer-events-none absolute -left-[25vmin] -top-[35vmin] size-[95vmin] rounded-full bg-[#4DA2FF]/20 blur-[14vmin]" />
      <div aria-hidden className="tv-glow-b pointer-events-none absolute -bottom-[45vmin] -right-[15vmin] size-[85vmin] rounded-full bg-[#4DA2FF]/10 blur-[14vmin]" />
      <XLogo className="tv-mark pointer-events-none absolute -right-[6vmin] top-1/2 size-[88vmin] text-white/[0.035]" />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="tv-particle absolute top-full"
            style={{ left: p.left, animationDuration: `${p.duration}s`, animationDelay: `-${p.delay}s` }}
          >
            <span className="block" style={{ width: `${p.size}vmin`, height: `${p.size}vmin` }}>
              {p.x ? (
                <XLogo className="size-full text-white/[0.12]" />
              ) : (
                <span className="block size-full rounded-full bg-[#4DA2FF]/40" />
              )}
            </span>
          </span>
        ))}
      </div>

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
          <h1 className="text-[14vmin] font-bold leading-[0.95] tracking-tight">
            Follow us
            <br />
            on X
          </h1>
          <p className="tv-handle mt-[4vmin] inline-block text-[8vmin] font-semibold leading-none">@{X_HANDLE}</p>
        </section>

        {/* Profile-style card around the QR code. The code itself never moves
            relative to the card, so it stays easy to scan. */}
        <section className="justify-self-center">
          <div className="tv-card w-[60vmin] rounded-[4vmin] bg-white p-[3.5vmin] text-[#030F1C]">
            <div className="flex items-center gap-[2vmin]">
              <div className="flex size-[9vmin] shrink-0 items-center justify-center rounded-full bg-[#030F1C]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/SuiHub_Symbol_Cloud.png" alt="" className="w-[62%] object-contain" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[2.9vmin] font-bold leading-tight">SuiHub Athens</p>
                <p className="truncate text-[2.4vmin] text-[#536471]">@{X_HANDLE}</p>
              </div>
              <span className="tv-pill relative grid shrink-0 place-items-center overflow-hidden rounded-full border-[0.25vmin] px-[2vmin] py-[1.1vmin] text-[2.2vmin] font-bold">
                {/* Both labels share one grid cell, so the pill is sized for the longer one. */}
                <span className="tv-label-follow col-start-1 row-start-1">Follow</span>
                <span className="tv-label-following col-start-1 row-start-1 opacity-0">Following</span>
                <span className="tv-tap absolute left-1/2 top-1/2 size-[6vmin] rounded-full bg-[#4DA2FF]" />
              </span>
            </div>

            <div className="relative mt-[3vmin]">
              <div
                className="aspect-square w-full [&>svg]:block [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              {/* Scan frame: closes in around the code during step 2, never over it. */}
              <div aria-hidden className="tv-scan pointer-events-none absolute -inset-[1.6vmin]">
                <Corner className="left-0 top-0 rounded-tl-[1.5vmin] border-l-[0.7vmin] border-t-[0.7vmin]" />
                <Corner className="right-0 top-0 rounded-tr-[1.5vmin] border-r-[0.7vmin] border-t-[0.7vmin]" />
                <Corner className="bottom-0 left-0 rounded-bl-[1.5vmin] border-b-[0.7vmin] border-l-[0.7vmin]" />
                <Corner className="bottom-0 right-0 rounded-br-[1.5vmin] border-b-[0.7vmin] border-r-[0.7vmin]" />
              </div>
            </div>
            <p className="mt-[2vmin] text-center text-[2.8vmin] font-semibold">Scan to follow</p>
          </div>
        </section>
      </main>

    </div>
  )
}
