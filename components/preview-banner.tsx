'use client'

import { usePathname } from 'next/navigation'
import { Eye } from 'lucide-react'
import { disablePreviewMode } from '@/app/preview/actions'

export function PreviewBanner() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2.5 text-sm font-medium text-amber-950 shadow-lg">
      <span className="flex items-center gap-2">
        <Eye className="size-4 shrink-0" />
        Preview mode — you are seeing the site as a visitor
      </span>
      <form action={disablePreviewMode.bind(null, pathname)}>
        <button
          type="submit"
          className="rounded-md bg-amber-900/20 px-3 py-1 text-xs font-semibold hover:bg-amber-900/30 transition-colors"
        >
          Exit preview
        </button>
      </form>
    </div>
  )
}
