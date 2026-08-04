'use client'

import { useEffect, useState } from 'react'
import { CATEGORY_STYLES } from '@/lib/events'

export type TvSlide = {
  id: string
  title: string
  description: string | null
  category: string
  host: string | null
  room: string | null
  imageUrl: string | null
  day: string
  month: string
  weekday: string
  monthLabel: string
  time: string
  inviteOnly: boolean
  registerable: boolean
  qr: string | null
}

const SLIDE_MS = 14000

export function TvCarousel({ slides }: { slides: TvSlide[] }) {
  const [index, setIndex] = useState(0)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'Europe/Athens',
        }),
      )
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(t)
  }, [slides.length])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#030F1C] font-sans text-white">
      <style>{`
        @keyframes tvProgress { from { width: 0% } to { width: 100% } }
        @keyframes tvKenBurns { from { transform: scale(1.04) } to { transform: scale(1.16) } }
        @media (prefers-reduced-motion: reduce) {
          .tv-kenburns { animation: none !important; transform: none !important; }
        }
      `}</style>

      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between px-[3vw] py-[2vh]">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/SuiHub_Symbol_Cloud.png" alt="SuiHub Athens" className="h-[4vh] w-auto object-contain" />
          <div className="h-[3vh] w-px bg-white/20" />
          <p className="text-[1.7vh] font-semibold uppercase tracking-[0.2em] text-white/70">
            What&apos;s on at SuiHub Athens
          </p>
        </div>
        <div className="flex items-center gap-6">
          {slides.length > 0 && (
            <p className="text-[1.7vh] font-medium text-[#4DA2FF]">{slides[index]?.monthLabel}</p>
          )}
          <p className="text-[2vh] font-semibold tabular-nums text-white/80">{clock}</p>
        </div>
      </header>

      {/* Slides */}
      <div className="relative flex-1">
        {slides.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-[4vh] font-bold">No upcoming events right now</p>
            <p className="text-[2.2vh] text-white/60">Check back soon — new events are added often.</p>
          </div>
        ) : (
          slides.map((s, i) => (
            <Slide key={s.id} slide={s} active={i === index} />
          ))
        )}
      </div>

      {/* Progress + counter */}
      {slides.length > 1 && (
        <footer className="flex shrink-0 items-center gap-4 px-[3vw] py-[2vh]">
          <div className="h-[0.5vh] flex-1 overflow-hidden rounded-full bg-white/15">
            <div
              key={index}
              className="h-full rounded-full bg-[#4DA2FF]"
              style={{ animation: `tvProgress ${SLIDE_MS}ms linear forwards` }}
            />
          </div>
          <p className="text-[1.7vh] font-semibold tabular-nums text-white/60">
            {index + 1} / {slides.length}
          </p>
        </footer>
      )}
    </div>
  )
}

function Slide({ slide, active }: { slide: TvSlide; active: boolean }) {
  const chip = CATEGORY_STYLES[slide.category] ?? 'bg-[#4DA2FF] text-white border-[#4DA2FF]'
  return (
    <div
      className={`absolute inset-0 flex px-[3vw] pb-[1vh] transition-opacity duration-700 ${
        active ? 'z-10 opacity-100' : 'z-0 opacity-0'
      }`}
    >
      {/* Left: cover + headline */}
      <div className="relative flex-1 overflow-hidden rounded-[2vh]">
        {slide.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.imageUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${active ? 'tv-kenburns' : ''}`}
            style={active ? { animation: `tvKenBurns ${SLIDE_MS + 800}ms ease-out forwards` } : undefined}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B2A4A] via-[#0A3D6B] to-[#030F1C]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030F1C] via-[#030F1C]/40 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[2vh] p-[3vw]">
          <span className={`w-fit rounded-full border px-[1.4vw] py-[0.6vh] text-[1.6vh] font-semibold uppercase tracking-wide ${chip}`}>
            {slide.category}
          </span>
          <h1 className="max-w-[46vw] text-[5.2vh] font-bold leading-[1.05] tracking-tight text-balance">
            {slide.title}
          </h1>
          {slide.description && (
            <p className="line-clamp-3 max-w-[42vw] text-[2.3vh] leading-snug text-white/75">
              {slide.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: date, details, QR */}
      <aside className="flex w-[30vw] shrink-0 flex-col justify-between py-[1vh] pl-[3vw]">
        <div>
          <div className="flex items-end gap-[1.5vw]">
            <span className="text-[13vh] font-bold leading-[0.85] tracking-tight text-[#4DA2FF]">
              {slide.day}
            </span>
            <div className="pb-[1.5vh]">
              <p className="text-[3.4vh] font-bold leading-none">{slide.month}</p>
              <p className="text-[2.2vh] text-white/60">{slide.weekday}</p>
            </div>
          </div>

          <dl className="mt-[3vh] flex flex-col gap-[1.6vh] text-[2.2vh]">
            <Row label="Time" value={slide.time} />
            {slide.room && <Row label="Where" value={slide.room} />}
            {slide.host && <Row label="Host" value={slide.host} />}
          </dl>
        </div>

        {/* Sign-up */}
        <div className="flex items-center gap-[1.8vw]">
          {slide.qr ? (
            <>
              <div
                className="h-[16vh] w-[16vh] shrink-0 rounded-[1.4vh] bg-white p-[1.2vh] [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: slide.qr }}
              />
              <div>
                <p className="text-[2.6vh] font-bold leading-tight">
                  {slide.registerable ? 'Scan to sign up' : 'Scan for all events'}
                </p>
                <p className="mt-[0.5vh] text-[1.9vh] text-white/60">
                  {slide.registerable
                    ? 'Point your camera at the code'
                    : 'See the full calendar on your phone'}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-[1.4vh] border border-white/15 bg-white/5 px-[2vw] py-[2vh]">
              <p className="text-[2.6vh] font-bold text-[#4DA2FF]">
                {slide.inviteOnly ? 'Invite only' : 'Ask our team to join'}
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-[1.2vw]">
      <dt className="w-[6vw] shrink-0 text-[1.6vh] font-semibold uppercase tracking-wide text-white/45">
        {label}
      </dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  )
}
