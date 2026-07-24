'use client'

import { useRef, useState, useTransition } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { uploadGalleryImage, deleteGalleryImage, submitVisitorPhotos, type GalleryImage } from '@/app/gallery/actions'

export function GalleryClient({
  images: initial,
  isAdmin,
}: {
  images: GalleryImage[]
  isAdmin: boolean
}) {
  const [images, setImages] = useState(initial)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [deleting, setDeleting] = useState<GalleryImage | null>(null)
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null)
  const [isPending, startTransition] = useTransition()
  const [progress, setProgress] = useState<string | null>(null)
  const [fileCount, setFileCount] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const rawFiles = fileInputRef.current?.files
    if (!rawFiles || rawFiles.length === 0) return
    const caption = (new FormData(e.currentTarget).get('caption') as string ?? '').trim() || null
    // Read all files into memory immediately so FileList references can't go stale
    const fileSnapshots = Array.from(rawFiles).map((f) => ({ file: f, name: f.name, type: f.type }))

    startTransition(async () => {
      let failed = 0
      for (let i = 0; i < fileSnapshots.length; i++) {
        setProgress(`Uploading ${i + 1} of ${fileSnapshots.length}…`)
        const { file, name, type } = fileSnapshots[i]
        const buffer = await file.arrayBuffer()
        const blob = new Blob([buffer], { type })
        const fd = new FormData()
        fd.append('image', blob, name)
        if (caption && fileSnapshots.length === 1) fd.append('caption', caption)
        const result = await uploadGalleryImage(fd)
        if (result?.error) failed++
      }
      setProgress(null)
      if (failed > 0) {
        toast.error(`${failed} photo${failed > 1 ? 's' : ''} failed to upload`)
      } else {
        toast.success(`${fileSnapshots.length} photo${fileSnapshots.length > 1 ? 's' : ''} uploaded`)
      }
      setUploadOpen(false)
      setFileCount(0)
      formRef.current?.reset()
      window.location.reload()
    })
  }

  function confirmDelete() {
    if (!deleting) return
    startTransition(async () => {
      const result = await deleteGalleryImage(deleting.id)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Photo deleted')
      setImages((prev) => prev.filter((img) => img.id !== deleting.id))
      setDeleting(null)
    })
  }

  function handleSubmitOwn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const raw = new FormData(e.currentTarget)
    const files = raw.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
    const name = (raw.get('name') as string) ?? ''
    const email = (raw.get('email') as string) ?? ''
    const note = (raw.get('note') as string) ?? ''

    startTransition(async () => {
      // Read files into memory first so File references can't go stale mid-request
      const fd = new FormData()
      fd.append('name', name)
      fd.append('email', email)
      fd.append('note', note)
      for (const f of files) {
        const buffer = await f.arrayBuffer()
        fd.append('photos', new Blob([buffer], { type: f.type }), f.name)
      }
      const result = await submitVisitorPhotos(fd)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success('Thanks! Your photos were sent to the SuiHub team.')
      setSubmitOpen(false)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setSubmitOpen(true)}>
          <ImagePlus className="size-4" />
          Submit your own
        </Button>
        {isAdmin && (
          <Button onClick={() => setUploadOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <ImagePlus className="size-4" />
            Upload photos
          </Button>
        )}
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-20 text-center">
          <ImagePlus className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No photos yet.</p>
          {isAdmin && (
            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <ImagePlus className="size-4" />
              Upload the first photo
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? 'Gallery photo'}
                className="absolute inset-0 h-full w-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => setLightbox(img)}
              />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-xs text-white line-clamp-2">{img.caption}</p>
                </div>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setDeleting(img)}
                  className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                  aria-label="Delete photo"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.caption ?? 'Gallery photo'}
              className="block max-h-[90vh] max-w-[95vw] w-auto h-auto"
            />
            {lightbox.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-6 pb-4 pt-10">
                <p className="text-sm text-white">{lightbox.caption}</p>
              </div>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!isPending) { setUploadOpen(open); if (!open) setFileCount(0) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload photos</DialogTitle>
            <DialogDescription>Select one or more photos to add to the gallery.</DialogDescription>
          </DialogHeader>
          <form ref={formRef} onSubmit={handleUpload} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="gal-image">Photos</Label>
              <Input
                ref={fileInputRef}
                id="gal-image"
                name="image"
                type="file"
                accept="image/*"
                multiple
                required
                onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
              />
              {fileCount > 1 && (
                <p className="text-xs text-muted-foreground">{fileCount} photos selected</p>
              )}
            </div>
            {fileCount <= 1 && (
              <div className="grid gap-2">
                <Label htmlFor="gal-caption">Caption (optional)</Label>
                <Input id="gal-caption" name="caption" placeholder="e.g. Web3 Workshop, June 2025" />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setUploadOpen(false); setFileCount(0) }} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {progress ?? (fileCount > 1 ? `Upload ${fileCount} photos` : 'Upload')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Visitor photo submission */}
      <Dialog open={submitOpen} onOpenChange={(open) => !isPending && setSubmitOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit your photos</DialogTitle>
            <DialogDescription>
              Share your photos from SuiHub Athens events. They will be sent to the team for review before appearing in the gallery.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitOwn} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sub-name">Your name</Label>
              <Input id="sub-name" name="name" required placeholder="Jane Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-email">Email</Label>
              <Input id="sub-email" name="email" type="email" required placeholder="jane@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-photos">Photos (up to 5, max 20MB total)</Label>
              <Input id="sub-photos" name="photos" type="file" accept="image/*" multiple required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-note">Note (optional)</Label>
              <Input id="sub-note" name="note" placeholder="e.g. From the AI workshop last week" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubmitOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Sending…' : 'Send photos'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete photo</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
