import Image from 'next/image'
import Link from 'next/link'
import { Clock, Mail, MapPin } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#030F1C] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 md:grid-cols-5 md:px-6">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <Image
            src="/SuiHub_Symbol_Cloud.png"
            alt="SuiHub"
            width={110}
            height={34}
            className="object-contain"
          />
          <p className="text-sm text-white/60">
            The home of builders. Powered by <span className="text-primary font-semibold">Sui</span>.
          </p>
        </div>

        {/* Visit */}
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold uppercase tracking-wide text-white/80">Visit us</p>
          <a
            href="https://maps.google.com/?q=SuiHub+Athens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 text-white/60 hover:text-white"
          >
            <MapPin className="mt-0.5 size-4 shrink-0" />
            SuiHub Athens, Greece
          </a>
          <p className="flex items-start gap-2 text-white/60">
            <Clock className="mt-0.5 size-4 shrink-0" />
            Mon – Fri · 10:00 – 19:00
          </p>
          <a
            href="mailto:suihubathens@sui.io"
            className="flex items-start gap-2 text-white/60 hover:text-white"
          >
            <Mail className="mt-0.5 size-4 shrink-0" />
            suihubathens@sui.io
          </a>
        </div>

        {/* Explore */}
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold uppercase tracking-wide text-white/80">Explore</p>
          <Link href="/" className="text-white/60 hover:text-white">About</Link>
          <Link href="/events" className="text-white/60 hover:text-white">Events calendar</Link>
          <Link href="/reserve?checkin=1" className="text-white/60 hover:text-white">Check in / Visit</Link>
          <Link href="/reserve?meeting=1" className="text-white/60 hover:text-white">Meeting room</Link>
          <Link href="/coworking" className="text-white/60 hover:text-white">Coworking</Link>
          <Link href="/guidelines" className="text-white/60 hover:text-white">Guidelines</Link>
          <Link href="/gallery" className="text-white/60 hover:text-white">Gallery</Link>
        </div>

        {/* SuiHub Athens */}
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold uppercase tracking-wide text-white/80">SuiHub Athens</p>
          <a
            href="https://www.linkedin.com/company/suihub-athens/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white"
          >
            LinkedIn
          </a>
          <a
            href="https://t.me/suiandfriends"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white"
          >
            Telegram
          </a>
          <a
            href="mailto:suihubathens@sui.io"
            className="text-white/60 hover:text-white"
          >
            Contact us
          </a>
        </div>

        {/* About Sui */}
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold uppercase tracking-wide text-white/80">About Sui</p>
          <a
            href="https://sui.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white"
          >
            sui.io
          </a>
          <a
            href="https://x.com/SuiNetwork"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white"
          >
            X / Twitter
          </a>
          <a
            href="https://discord.gg/sui"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white"
          >
            Discord
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/40 md:px-6">
          © {new Date().getFullYear()} SuiHub Athens. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
