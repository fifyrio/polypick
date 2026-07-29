'use client'

import { useEffect, useState } from 'react'

interface CountdownProps {
  /** Seconds remaining at mount. Defaults to a ~4h48m window like the mock. */
  from?: number
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

/** Static-until-mounted countdown so SSR + client markup match. */
export function Countdown({ from = 4 * 3600 + 48 * 60 + 15 }: CountdownProps) {
  const [seconds, setSeconds] = useState(from)

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  const cells = [pad(h), pad(m), pad(s)]

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[13px] tabular-nums">
      {cells.map((cell, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-white ring-1 ring-white/10">
            {cell}
          </span>
          {i < cells.length - 1 && <span className="text-white/40">:</span>}
        </span>
      ))}
    </span>
  )
}
