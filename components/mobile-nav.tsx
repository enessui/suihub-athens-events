'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { RequestEventButton } from '@/components/calendar/request-event-button'

const LINKS = [
  
  { href: '/reserve', label: 'Visit us' },
  { href: '/coworking', label: 'Coworking' },
  { href: '/guidelines', label: 'Guidelines' },
  { href: '/gallery', label: 'Gallery' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-md text-white hover:bg-white/10"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-white/10 bg-[#030F1C] px-4 pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              {LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                >
                  {label}
                </Link>
              ))}
              <div className="mt-2 px-3">
                <RequestEventButton />
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
