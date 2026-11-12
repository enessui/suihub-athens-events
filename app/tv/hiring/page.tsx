import { qrSvg } from '@/lib/qr'

export const metadata = {
  title: "We're hiring · SuiHub Athens",
  robots: { index: false },
}

// The role on screen. Swap these to advertise a different opening.
const ROLE = {
  company: 'Mysten Labs',
  title: ['Software Engineer,', 'Partner Solutions'],
  tags: ['Remote · Greece', 'TypeScript · React · Move', 'AI-native team'],
  url: 'https://jobs.ashbyhq.com/mystenlabs/7a9c9bef-677d-4209-b305-276f31bba4d7',
}

// Code symbols drifting up the background. Fixed values so every render matches.
const GLYPHS = [
  { text: '</>', left: '5%', size: 3.2, duration: 22, delay: 0 },
  { text: '{ }', left: '17%', size: 2.4, duration: 26, delay: 9 },
  { text: ';', left: '28%', size: 3, duration: 19, delay: 4 },
  { text: '=>', left: '41%', size: 2.6, duration: 28, delay: 14 },
  { text: '</>', left: '53%', size: 2.2, duration: 24, delay: 7 },
  { text: '( )', left: '64%', size: 2.8, duration: 21, delay: 17 },
  { text: '{ }', left: '75%', size: 3.4, duration: 27, delay: 2 },
  { text: '=>', left: '86%', size: 2.3, duration: 20, delay: 11 },
  { text: ';', left: '95%', size: 2.7, duration: 25, delay: 6 },
]

const CSS = `
  @keyframes tvDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(9vmin, 7vmin); } }
  @keyframes tvRise {
    0% { transform: translateY(0); opacity: 0; }
    12%, 88% { opacity: 1; }
    100% { transform: translateY(-130vh); opacity: 0; }
  }
  @keyframes tvFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1vmin); } }
  @keyframes tvGlow {
    0%, 100% { box-shadow: 0 0 6vmin rgba(77, 162, 255, 0.25); }
    50% { box-shadow: 0 0 12vmin rgba(77, 162, 255, 0.55); }
  }
  @keyframes tvPulse {
    0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6); }
    70%, 100% { box-shadow: 0 0 0 1.6vmin rgba(52, 211, 153, 0); }
  }
  @keyframes tvShine { 0% { background-position: 200% 0; } 60%, 100% { background-position: -100% 0; } }

  .tv-glow-a { animation: tvDrift 26s ease-in-out infinite; }
  .tv-glow-b { animation: tvDrift 32s ease-in-out infinite reverse; }
  .tv-glyph { animation: tvRise linear infinite; }
  .tv-card { animation: tvFloat 6s ease-in-out infinite, tvGlow 4s ease-in-out infinite; }
  .tv-live { animation: tvPulse 2s ease-out infinite; }
  .tv-shine {
    background: linear-gradient(100deg, #4DA2FF 40%, #C0E6FF 50%, #4DA2FF 60%) 0 0 / 200% 100%;
    -webkit-background-clip: text; background-clip: text; color: transparent;
    animation: tvShine 6s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .tv-glow-a, .tv-glow-b, .tv-card, .tv-live, .tv-shine { animation: none !important; }
    .tv-glyph { display: none; }
  }
`

export default async function HiringTvPage() {
  const qr = await qrSvg(ROLE.url)

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#030F1C] font-sans text-white">
      <style>{CSS}</style>

      {/* Backdrop */}
      <div aria-hidden className="tv-glow-a pointer-events-none absolute -left-[25vmin] -top-[35vmin] size-[95vmin] rounded-full bg-[#4DA2FF]/20 blur-[14vmin]" />
      <div aria-hidden className="tv-glow-b pointer-events-none absolute -bottom-[45vmin] -right-[15vmin] size-[85vmin] rounded-full bg-[#4DA2FF]/10 blur-[14vmin]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 font-mono">
        {GLYPHS.map((g, i) => (
          <span
            key={i}
            className="tv-glyph absolute top-full font-semibold text-[#4DA2FF]/25"
            style={{ left: g.left, fontSize: `${g.size}vmin`, animationDuration: `${g.duration}s`, animationDelay: `-${g.delay}s` }}
          >
            {g.text}
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

      <main className="relative grid min-h-0 flex-1 grid-cols-[1.3fr_1fr] items-center gap-[6vmin] px-[8vmin] portrait:grid-cols-1 portrait:content-center portrait:justify-items-center portrait:text-center">
        <section>
          <p className="inline-flex items-center gap-[1.5vmin] rounded-full border border-white/15 bg-white/5 px-[2.4vmin] py-[1.2vmin] text-[2.6vmin] font-semibold">
            <span className="tv-live size-[1.6vmin] rounded-full bg-[#34D399]" />
            {ROLE.company} is hiring
          </p>
          <h1 className="mt-[4vmin] text-[9.5vmin] font-bold leading-[1.02] tracking-tight">
            {ROLE.title[0]}
            <br />
            <span className="tv-shine">{ROLE.title[1]}</span>
          </h1>
          <ul className="mt-[5vmin] flex flex-wrap gap-[1.4vmin] portrait:justify-center">
            {ROLE.tags.map((tag) => (
              <li key={tag} className="whitespace-nowrap rounded-full bg-white/10 px-[2.2vmin] py-[1.1vmin] text-[2.3vmin] font-medium text-white/90">
                {tag}
              </li>
            ))}
          </ul>
        </section>

        <section className="justify-self-center">
          <div className="tv-card w-[52vmin] rounded-[4vmin] bg-white p-[3.5vmin] text-[#030F1C]">
            <div
              className="aspect-square w-full [&>svg]:block [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            <p className="mt-[2.4vmin] text-center text-[3.4vmin] font-bold">Scan to apply</p>
          </div>
        </section>
      </main>
    </div>
  )
}
