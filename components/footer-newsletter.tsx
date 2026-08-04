'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { subscribe } from '@/app/coworking/subscribe-actions'
import { Turnstile, captchaEnabled, type TurnstileHandle } from '@/components/turnstile'

export function FooterNewsletter() {
  const [done, setDone] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  // The captcha only mounts once the user engages the field, so the widget
  // (and its script) isn't loaded on every page for people who never subscribe.
  const [engaged, setEngaged] = useState(false)
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = (new FormData(e.currentTarget).get('email') as string) ?? ''
    startTransition(async () => {
      const result = await subscribe(email, captchaToken)
      if (result?.error) {
        toast.error(result.error)
        setCaptchaToken('')
        turnstileRef.current?.reset()
        return
      }
      if (result?.alreadySubscribed) {
        toast.info("You're already on the list. Thanks!")
      }
      setDone(true)
    })
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-primary">
        <CheckCircle2 className="size-5" />
        You&apos;re subscribed. Welcome aboard.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 md:w-auto">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          aria-label="Email address"
          onFocus={() => setEngaged(true)}
          className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none sm:w-64"
        />
        <button
          type="submit"
          disabled={isPending || (captchaEnabled && engaged && !captchaToken)}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
      {captchaEnabled && engaged && (
        <Turnstile
          ref={turnstileRef}
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken('')}
          onError={() => setCaptchaToken('')}
          className="max-w-[20rem]"
        />
      )}
    </form>
  )
}
