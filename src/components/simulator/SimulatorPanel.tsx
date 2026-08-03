'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { simulateTrade } from '@/lib/quant/monteCarlo'
import { deriveSimulationInput } from '@/lib/quant/deriveSimulation'
import type { AnalysisResult } from '@/types/analyzer'

const STAKES = [25, 50, 100, 250, 500]

export function SimulatorPanel({ result }: { result: AnalysisResult }) {
  const [stake, setStake] = useState(100)

  const input = useMemo(() => deriveSimulationInput(result), [result])
  const sim = useMemo(() => simulateTrade(input), [input])

  const kellyStake = Math.round((sim.kelly / 2) * 1000) // half-Kelly on a $1k bankroll
  const dollars = (pct: number) => formatSigned((pct / 100) * stake)

  return (
    <div className="mt-6 animate-rise-in overflow-hidden rounded-xl2 border border-paper-line bg-paper-card shadow-card">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Monte Carlo · {sim.trials.toLocaleString()} runs
          </p>
          <span className="font-mono text-[12px] text-ink-faint">
            {input.holdDays}d hold · entry {input.entry}¢
          </span>
        </div>

        {/* headline stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat
            label="Win chance"
            value={`${Math.round(sim.probProfit * 100)}%`}
            tone={sim.probProfit >= 0.5 ? 'yes' : 'no'}
          />
          <Stat label="Median P&L" value={dollars(sim.p50)} tone={sim.p50 >= 0 ? 'yes' : 'no'} />
          <Stat label="Avg P&L" value={dollars(sim.mean)} tone={sim.mean >= 0 ? 'yes' : 'no'} />
        </div>

        {/* histogram */}
        <Histogram bins={sim.bins} />
        <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-faint">
          <span>worst 5%: {dollars(sim.p5)}</span>
          <span>best 5%: {dollars(sim.p95)}</span>
        </div>

        {/* stake selector */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-paper-line bg-white/60 px-4 py-3">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
            Stake
          </p>
          <div className="flex gap-1.5">
            {STAKES.map((s) => (
              <button
                key={s}
                onClick={() => setStake(s)}
                className={cn(
                  'rounded-full px-3 py-1 font-mono text-[12px] font-medium transition',
                  s === stake
                    ? 'bg-ink text-paper-card'
                    : 'bg-paper-card text-ink-soft ring-1 ring-paper-line hover:text-ink'
                )}
              >
                ${s}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-center font-mono text-[12px] text-ink-faint">
          Half-Kelly sizing: ${kellyStake} per $1,000 bankroll
        </p>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'yes' | 'no'
}) {
  return (
    <div className="rounded-lg border border-paper-line bg-white/50 px-3 py-2.5">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 font-serif text-lg font-semibold',
          tone === 'yes' ? 'text-market-yes' : 'text-market-no'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function Histogram({ bins }: { bins: { from: number; to: number; count: number }[] }) {
  const max = Math.max(...bins.map((b) => b.count), 1)
  const W = 100 / bins.length

  return (
    <svg
      viewBox="0 0 100 36"
      className="mt-5 h-28 w-full"
      role="img"
      aria-label="Distribution of simulated returns"
      preserveAspectRatio="none"
    >
      {bins.map((b, i) => {
        const h = (b.count / max) * 32
        const mid = (b.from + b.to) / 2
        return (
          <rect
            key={i}
            x={i * W + 0.5}
            y={36 - h}
            width={W - 1}
            height={h}
            rx={0.6}
            className={mid >= 0 ? 'fill-market-yes/80' : 'fill-market-no/70'}
          />
        )
      })}
    </svg>
  )
}

function formatSigned(n: number): string {
  const rounded = Math.round(n)
  return rounded >= 0 ? `+$${rounded}` : `-$${Math.abs(rounded)}`
}
