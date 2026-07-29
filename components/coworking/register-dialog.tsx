'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Turnstile, captchaEnabled, type TurnstileHandle } from '@/components/turnstile'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { registerMember } from '@/app/coworking/register-actions'

export function RegisterDialog() {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [isPending, startTransition] = useTransition()

  function resetCaptcha() {
    setCaptchaToken('')
    turnstileRef.current?.reset()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await registerMember({
        name: (fd.get('name') as string) ?? '',
        email: (fd.get('email') as string) ?? '',
        telegram: (fd.get('telegram') as string) ?? '',
        building: (fd.get('building') as string) ?? '',
        subscribe: fd.get('subscribe') === 'on',
        captchaToken,
      })
      if (result?.error) {
        toast.error(result.error)
        resetCaptcha()
        return
      }
      if (result?.alreadyRegistered) {
        toast.info("You're already registered. See you at the hub!")
        setOpen(false)
        return
      }
      setDone(true)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDone(false)
          setOpen(true)
        }}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
      >
        Register for free →
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 className="size-10 text-primary" />
              <DialogTitle className="text-xl">You&apos;re registered!</DialogTitle>
              <DialogDescription>
                Welcome to SuiHub Athens. Drop in any weekday, 10:00–19:00, and don&apos;t
                forget to check in when you arrive.
              </DialogDescription>
              <Button className="mt-2" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Register for free coworking</DialogTitle>
                <DialogDescription>
                  One-time registration, then just walk in whenever you like during open hours.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="reg-name">Your name</Label>
                  <Input id="reg-name" name="name" required placeholder="Jane Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" name="email" type="email" required placeholder="jane@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reg-telegram">Telegram (optional)</Label>
                  <Input id="reg-telegram" name="telegram" placeholder="@handle" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reg-building">What are you building? (optional)</Label>
                  <Input id="reg-building" name="building" placeholder="e.g. DeFi app on Sui, AI agents, just exploring" />
                </div>
                <label htmlFor="reg-subscribe" className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <input
                    id="reg-subscribe"
                    name="subscribe"
                    type="checkbox"
                    defaultChecked
                    className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
                  />
                  <span>Keep me posted on events, workshops, and hub news.</span>
                </label>
                <Turnstile
                  ref={turnstileRef}
                  onVerify={setCaptchaToken}
                  onExpire={() => setCaptchaToken('')}
                  onError={() => setCaptchaToken('')}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending || (captchaEnabled && !captchaToken)}>
                    {isPending ? 'Registering…' : 'Register'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
