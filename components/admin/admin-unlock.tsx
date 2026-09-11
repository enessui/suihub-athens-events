'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { unlockAdmin } from '@/app/admin/unlock/actions'

export function AdminUnlock() {
  const [pin, setPin] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const result = await unlockAdmin(pin)
      if (result?.error) {
        toast.error(result.error)
        setPin('')
        return
      }
      router.replace('/admin')
      router.refresh()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xs flex-col gap-5 rounded-2xl border border-border bg-card p-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/15">
          <Lock className="size-5 text-primary" />
        </span>
        <h1 className="text-lg font-semibold">Enter admin PIN</h1>
        <p className="text-sm text-muted-foreground">This area is PIN-protected.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="admin-pin" className="sr-only">
          PIN
        </Label>
        <Input
          id="admin-pin"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="••••••"
          className="text-center text-lg tracking-[0.4em]"
        />
      </div>
      <Button type="submit" disabled={isPending || pin.length === 0}>
        {isPending ? 'Unlocking…' : 'Unlock'}
      </Button>
    </form>
  )
}
