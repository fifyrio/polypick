'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { buildPortfolio } from '@/lib/quant/markowitz'
import type { TrendingCandidate } from '@/types/portfolio'

const BUDGETS = [100, 250, 500, 1000]
const RISK_LABELS = ['', 'Aggressive', 'Bold', 'Balanced', 'Careful', 'Conservative']

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; candidates: TrendingCandidate[] }

export function PortfolioBuilder() {
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [budget, setBudget] = useState(250)
  const [riskAversion, setRiskAversion] = useState(3)

  useEffect(() => {
    let cancelled = false

    async function fetchTrending() {
      try {
        const res = await fetch('/api/portfolio/trending')
        const data = (await res.json()) as
          | { ok: true; candidates: TrendingCandidate[] }
          | { ok: false; error: string }
        if (cancelled) return

        if (!data.ok) {
          setLoad({ status: 'error', message: data.error })
          return
        }
        setLoad({ status: 'ready', candidates: data.candidates })
        // Preselect the strongest edges.
        const top = [...data.candidates]
          .sort((a, b) => b.edge - a.edge)
          .slice(0, 5)
          .map((c) => c.id)
        setSelected(new Set(top))
      } catch {
        if (!cancelled) setLoad({ status: 'error', message: 'Network error' })
      }
    }

    fetchTrending()
    return () => {
      cancelled = true
    }
  }, [])

  const plan = useMemo(() => {
    if (load.status !== 'ready') return null
    const assets = load.candidates
      .filter((c) => selected.has(c.id))
      .map((c) => ({
        id: c.id,
        label: c.question,
        price: c.price,
        fairProb: c.fairProb,
      }))
    if (assets.length === 0) return null
    return buildPortfolio(assets, budget, riskAversion)
  }, [load, selected, budget, riskAversion])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-ink-faint">
          Portfolio · Markowitz
        </p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-[44px]">
          Portfolio <span className="font-normal text-ink-faint">Builder</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Pick from today&apos;s highest-volume Polymarket markets. We estimate each
          side&apos;s fair value from 7-day price momentum, then split your budget with
          mean-variance optimization.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left: market selection */}
        <div className="rounded-xl2 border border-paper-line bg-paper-card p-5 shadow-card">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Trending markets · live
          </p>

          {load.status === 'loading' && (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-16 animate-shimmer rounded-xl shimmer-text" />
              ))}
            </div>
          )}

          {load.status === 'error' && (
            <p className="py-8 text-center text-sm text-ink-soft">{load.message}</p>
          )}

          {load.status === 'ready' && (
            <ul className="mt-3 space-y-2">
              {load.candidates.map((c) => (
                <CandidateRow
                  key={c.id}
                  candidate={c}
                  checked={selected.has(c.id)}
                  onToggle={() => toggle(c.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Right: controls + allocation */}
        <div className="space-y-6">
          <div className="rounded-xl2 border border-paper-line bg-paper-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Budget
              </p>
              <div className="flex gap-1.5">
                {BUDGETS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBudget(b)}
                    className={cn(
                      'rounded-full px-3 py-1 font-mono text-[12px] font-medium transition',
                      b === budget
                        ? 'bg-ink text-paper-card'
                        : 'bg-paper-card text-ink-soft ring-1 ring-paper-line hover:text-ink'
                    )}
                  >
                    ${b}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                  Risk profile
                </p>
                <span className="font-mono text-[12px] text-ink">
                  {RISK_LABELS[riskAversion]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={riskAversion}
                onChange={(e) => setRiskAversion(Number(e.target.value))}
                className="mt-3 w-full accent-brand-500"
                aria-label="Risk aversion from aggressive to conservative"
              />
            </div>
          </div>

          {plan && plan.allocations.length > 0 ? (
            <AllocationCard plan={plan} budget={budget} />
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl2 border border-paper-line bg-paper-card/70 p-8 text-center">
              <p className="text-sm text-ink-soft">
                {load.status === 'ready'
                  ? 'Select at least one market with positive edge.'
                  : 'Allocations appear here once markets load.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CandidateRow({
  candidate,
  checked,
  onToggle,
}: {
  candidate: TrendingCandidate
  checked: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        onClick={onToggle}
        aria-pressed={checked}
        className={cn(
          'w-full rounded-xl border px-4 py-3 text-left transition',
          checked
            ? 'border-brand-500/60 bg-brand-50/60'
            : 'border-paper-line bg-white/50 hover:border-ink/25'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="flex-1 text-sm font-medium leading-snug text-ink">
            {candidate.question}
          </p>
          <span
            className={cn(
              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold',
              checked
                ? 'border-brand-600 bg-brand-500 text-white'
                : 'border-paper-line bg-white text-transparent'
            )}
          >
            ✓
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-3 font-mono text-[11px] text-ink-faint">
          <span
            className={cn(
              'font-semibold',
              candidate.side === 'YES' ? 'text-market-yes' : 'text-market-no'
            )}
          >
            {candidate.side} {candidate.price}¢
          </span>
          <span>edge {candidate.edge >= 0 ? '+' : ''}{candidate.edge.toFixed(1)}¢</span>
          <span>${(candidate.volume24h / 1000).toFixed(0)}k / 24h</span>
        </div>
      </button>
    </li>
  )
}

function AllocationCard({
  plan,
  budget,
}: {
  plan: NonNullable<ReturnType<typeof buildPortfolio>>
  budget: number
}) {
  return (
    <div className="animate-rise-in overflow-hidden rounded-xl2 border border-paper-line bg-paper-card shadow-card">
      <div className="h-1 w-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            Optimal allocation
          </p>
          <span className="font-mono text-[12px] text-ink-faint">
            ${plan.deployed} deployed · ${plan.cash} cash
          </span>
        </div>

        <ul className="mt-4 space-y-3">
          {plan.allocations.map((a) => (
            <li key={a.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="flex-1 truncate text-sm text-ink">{a.label}</p>
                <span className="font-mono text-sm font-semibold text-ink">
                  ${a.stake}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-line">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${Math.min(100, (a.stake / budget) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-paper-line pt-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              Expected profit
            </p>
            <p
              className={cn(
                'mt-1 font-serif text-xl font-semibold',
                plan.expectedProfit >= 0 ? 'text-market-yes' : 'text-market-no'
              )}
            >
              {plan.expectedProfit >= 0 ? '+' : ''}${plan.expectedProfit}
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              1σ swing
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-ink">
              ±${plan.sigma}
            </p>
          </div>
        </div>

        <p className="mt-4 text-center font-mono text-[11px] text-ink-faint">
          Mean-variance optimal · 40% max per market · momentum fair values
        </p>
      </div>
    </div>
  )
}
