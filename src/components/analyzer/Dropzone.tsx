'use client'

import { useRef, useState, type DragEvent } from 'react'
import { cn } from '@/lib/cn'
import { IconImage } from '@/components/layout/icons'
import { SOURCE_DOTS } from '@/lib/sample'

interface DropzoneProps {
  onFile: () => void
  onSample: () => void
}

export function Dropzone({ onFile, onSample }: DropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    onFile()
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative flex min-h-[420px] flex-col items-center justify-center rounded-xl2 border-2 border-dashed px-6 py-10 text-center transition',
        dragging
          ? 'border-brand-500 bg-brand-50/60'
          : 'border-paper-line bg-paper-card/70 hover:border-ink/25'
      )}
    >
      <span className="absolute right-5 top-5 font-mono text-[12px] text-ink-faint">
        Polypick<span className="text-brand-600">.app</span>
      </span>

      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-brand-400 shadow-card">
        <IconImage className="h-7 w-7" />
      </span>

      <h3 className="mt-5 font-serif text-2xl text-ink">Drop a screenshot</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-soft">
        Or paste from clipboard. We support Polymarket, Kalshi, and PredictIt.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-brand-ink shadow-card transition hover:bg-brand-400"
        >
          Browse file
        </button>
        <button
          onClick={onSample}
          className="rounded-full border border-paper-line bg-white/60 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink/25"
        >
          Try a sample <span aria-hidden>→</span>
        </button>
      </div>

      <ul className="mt-7 flex items-center gap-5">
        {SOURCE_DOTS.map((d) => (
          <li key={d.key} className="flex items-center gap-1.5 font-mono text-[12px] text-ink-faint">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {d.label}
          </li>
        ))}
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={() => onFile()}
      />
    </div>
  )
}
