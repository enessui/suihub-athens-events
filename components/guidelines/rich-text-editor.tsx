'use client'

import { useEffect, useRef } from 'react'
import { Bold, Italic, Underline } from 'lucide-react'

function ToolbarBtn({
  onClick,
  title,
  children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault() // keep focus in editor
        onClick()
      }}
      className="flex size-7 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  rows = 3,
}: {
  value: string
  onChange: (html: string) => void
  rows?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Set initial HTML once on mount
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function exec(command: string) {
    ref.current?.focus()
    document.execCommand(command, false)
  }

  return (
    <div className="rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-ring">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-input bg-muted/40 px-2 py-1">
        <ToolbarBtn title="Bold" onClick={() => exec('bold')}>
          <Bold className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Italic" onClick={() => exec('italic')}>
          <Italic className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn title="Underline" onClick={() => exec('underline')}>
          <Underline className="size-3.5" />
        </ToolbarBtn>
      </div>
      {/* Editable area */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        style={{ minHeight: `${rows * 1.6}rem` }}
        className="px-3 py-2 text-sm outline-none leading-relaxed [&_strong]:font-bold [&_em]:italic [&_u]:underline"
      />
    </div>
  )
}
