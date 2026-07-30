import { cn } from '@/lib/cn'
import { IconCheck, IconSparkle } from '@/components/layout/icons'
import type { Verdict } from '@/types/analyzer'

export function VerdictPlaceholder() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl2 border border-paper-line bg-paper-card/70 px-8 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card ring-1 ring-paper-line">
        <IconSparkle className="h-6 w-6 text-ink-faint" />
      </span>
      <h3 className="mt-5 font-serif text-2xl text-ink">Your verdict appears here</h3>
      <p className="mt-2 max-w-xs text-sm text-ink-soft">
        Drop a screenshot on the left and we&apos;ll show you what to bet, why, and when to
        take profits.
      </p>
    </div>
  )
}

/** A short blurred bar standing in for locked text. */
function LockBar({ w = 'w-full' }: { w?: string }) {
  return <span className={cn('inline-block h-3.5 rounded shimmer-text animate-shimmer', w)} />
}

interface VerdictResultProps {
  verdict: Verdict
  /** When true, show the real AI analysis instead of locked shimmer bars. */
  revealed?: boolean
}

export function VerdictResult({ verdict, revealed = false }: VerdictResultProps) {
  return (
    <div className="animate-rise-in overflow-hidden rounded-xl2 border border-paper-line bg-paper-card shadow-card">
      {/* top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />

      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[13px] text-ink-faint">
            Polypick<span className="text-brand-600">.app</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-700">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-white">
              <IconCheck className="h-2.5 w-2.5" />
            </span>
            Final verdict
          </span>
        </div>

        {/* headline verdict */}
        <div className="mt-4 flex items-center gap-4">
          <span className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 shadow-card">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-ink/70">
              Bet
            </span>
            <span className="font-serif text-2xl font-semibold text-brand-ink">
              {verdict.side}
            </span>
          </span>
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {verdict.action}
            </p>
            {revealed ? (
              <p className="mt-1 font-serif text-xl font-semibold text-ink">{verdict.entry}</p>
            ) : (
              <span className="mt-1 block h-5 w-16 rounded shimmer-text animate-shimmer" />
            )}
          </div>
        </div>

        {/* reasoning intro */}
        {revealed ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">{verdict.summary}</p>
        ) : (
          <div className="mt-4 space-y-2 lock-blur" aria-hidden>
            <LockBar />
            <LockBar w="w-4/5" />
          </div>
        )}

        {/* stat row */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <StatCell label="Cash out at" value={revealed ? verdict.cashOutAt : undefined} />
          <StatCell label="Bail at" value={revealed ? verdict.bailAt : undefined} />
          <StatCell label="Hold for" value={revealed ? verdict.holdFor : undefined} />
        </div>
      </div>

      {/* Why card */}
      <div className="border-t border-paper-line p-5">
        <div className="rounded-xl border border-paper-line bg-white/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Why we think this
            </p>
            <span className="font-mono text-[12px] text-ink-faint">
              Polypick<span className="text-brand-600">.app</span>
            </span>
          </div>
          <ul className="mt-4 space-y-3" aria-hidden={!revealed}>
            {verdict.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-3">
                {revealed ? (
                  <>
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
                      <IconCheck className="h-2.5 w-2.5" />
                    </span>
                    <span className="flex-1 text-sm leading-relaxed text-ink">{reason}</span>
                  </>
                ) : (
                  <>
                    <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-ink/80" />
                    <span className="flex-1 lock-blur">
                      <LockBar w={i === 1 ? 'w-11/12' : 'w-full'} />
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {!revealed && (
          <button className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 py-4 text-base font-semibold text-brand-ink shadow-pop transition hover:from-brand-400 hover:to-brand-500">
            Unlock my winning edge
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
        )}

        <p className="mt-3 text-center font-mono text-[12px] text-ink-faint">
          {verdict.confidence}% confidence · +{verdict.edge} pp edge
        </p>
      </div>
    </div>
  )
}

function StatCell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-paper-line bg-white/50 px-3 py-2.5">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </p>
      {value ? (
        <p className="mt-1.5 font-serif text-base font-semibold text-ink">{value}</p>
      ) : (
        <span className="mt-2 block h-4 w-10 rounded shimmer-text animate-shimmer" aria-hidden />
      )}
    </div>
  )
}
