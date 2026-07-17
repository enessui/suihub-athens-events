'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RequestEventDialog } from './request-event-dialog'

export function RequestEventButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
        size="sm"
      >
        Request an event
      </Button>
      <RequestEventDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
