'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BUILT_IN_PHOTOS } from '@/lib/visit-guide'

function Grid({
  photos,
  current,
  onPick,
}: {
  photos: string[]
  current: string
  onPick: (src: string) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((src) => {
        const selected = src === current
        return (
          <button
            key={src}
            type="button"
            onClick={() => onPick(src)}
            aria-label={selected ? 'Current photo' : 'Use this photo'}
            aria-pressed={selected}
            className={cn(
              'relative aspect-[4/3] overflow-hidden rounded-lg bg-muted outline-none ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'ring-2 ring-primary' : 'hover:opacity-80',
            )}
          >
            <Image src={src} alt="" fill sizes="160px" className="object-cover" />
            {selected && (
              <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-4" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Pick a photo for one spot on the guide: the site's own photos or anything in the gallery. */
export function PhotoPicker({
  open,
  current,
  galleryPhotos,
  onPick,
  onClose,
}: {
  open: boolean
  current: string
  galleryPhotos: string[]
  onPick: (src: string) => void
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a photo</DialogTitle>
          <DialogDescription>
            To use a new photo, upload it to the gallery first and it will show up here.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-[65svh] flex-col gap-5 overflow-y-auto pr-1">
          <section>
            <p className="mb-2 text-sm font-semibold">Gallery</p>
            {galleryPhotos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No gallery photos yet.</p>
            ) : (
              <Grid photos={galleryPhotos} current={current} onPick={onPick} />
            )}
          </section>
          <section>
            <p className="mb-2 text-sm font-semibold">Built into the site</p>
            <Grid photos={BUILT_IN_PHOTOS} current={current} onPick={onPick} />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
