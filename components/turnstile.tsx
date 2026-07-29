'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// True only when a site key is configured. Forms use this to decide whether to
// require a captcha token before submitting; when false the widget renders
// nothing and forms behave exactly as before.
export const captchaEnabled = Boolean(SITE_KEY)

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id?: string) => void
  remove: (id?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<void> | null = null
function loadScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(s)
  })
  return scriptPromise
}

export type TurnstileHandle = { reset: () => void }

type TurnstileProps = {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  className?: string
}

// Cloudflare Turnstile widget. Renders nothing when no site key is set, so it's
// safe to drop into any form unconditionally.
export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { onVerify, onExpire, onError, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  // Keep the latest callbacks so the one-time render effect never uses stale ones.
  const cbRef = useRef({ onVerify, onExpire, onError })
  cbRef.current = { onVerify, onExpire, onError }

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current)
    },
  }), [])

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => cbRef.current.onVerify(token),
          'expired-callback': () => cbRef.current.onExpire?.(),
          'error-callback': () => cbRef.current.onError?.(),
          theme: 'auto',
          size: 'flexible',
        })
      })
      .catch(() => cbRef.current.onError?.())
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [])

  if (!SITE_KEY) return null
  return <div ref={containerRef} className={className} />
})
