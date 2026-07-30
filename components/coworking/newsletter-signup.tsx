'use client'

import { useRef, useState, useTransition } from 'react'
import { Mail, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Turnstile, captchaEnabled, type TurnstileHandle } from '@/components/turnstile'
import { subscribe } from '@/app/coworking/subscribe-actions'

export function NewsletterSignup() {
  const [done, setDone] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
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

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Mail className="size-5 text-primary" />
        Stay in the loop
      </div>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Get upcoming events, workshops, and what&apos;s happening at SuiHub Athens
        straight to your inbox. No noise, just the good stuff, now and then.
      </p>

      {done ? (
        <div className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 className="size-5" />
          You&apos;re subscribed. Welcome aboard.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="sm:max-w-xs"
              aria-label="Email address"
            />
            <Button type="submit" disabled={isPending || (captchaEnabled && !captchaToken)}>
              {isPending ? 'Subscribing…' : 'Subscribe'}
            </Button>
          </div>
          <Turnstile
            ref={turnstileRef}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken('')}
            onError={() => setCaptchaToken('')}
            className="w-full sm:max-w-xs"
          />
        </form>
      )}
    </section>
  )
}
