'use client'

import { useEffect, useRef, useState } from 'react'

export type TimelineItem = { date: string; text: string }

export function AnimatedTimeline({ items }: { items: TimelineItem[] }) {
  const [visible, setVisible] = useState<boolean[]>(() => items.map(() => false))
  const refs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    refs.current.forEach((el, i) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible((prev) => {
              if (prev[i]) return prev
              const next = [...prev]
              next[i] = true
              return next
            })
            obs.unobserve(el)
          }
        },
        { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <ol className="relative mt-6 flex flex-col">
      {/* Connecting line */}
      <span
        aria-hidden="true"
        className="absolute left-[7px] top-2 bottom-2 w-px bg-border"
      />
      {items.map((item, i) => (
        <li
          key={item.date}
          ref={(el) => {
            refs.current[i] = el
          }}
          className={`relative pb-8 pl-8 last:pb-0 transition-all duration-700 ease-out ${
            visible[i] ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
          style={{ transitionDelay: `${Math.min(i * 80, 320)}ms` }}
        >
          {/* Dot */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1 size-[15px] rounded-full border-2 border-primary bg-background transition-all duration-500 ${
              visible[i] ? 'scale-100 bg-primary' : 'scale-75'
            }`}
          />
          <p className="text-sm font-semibold text-primary">{item.date}</p>
          <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
        </li>
      ))}
    </ol>
  )
}
