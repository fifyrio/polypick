import { cn } from '@/lib/cn'
import type { SampleMarket } from '@/types/analyzer'

interface MarketCardProps {
  market: SampleMarket
  reading: boolean
}

export function MarketCard({ market, reading }: MarketCardProps) {
  return (
    <div className="rounded-xl2 border border-paper-line bg-paper-card p-5 shadow-card">
      {/* File header */}
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 shrink-0 rounded-lg border border-paper-line bg-[repeating-linear-gradient(45deg,#eceae2_0,#eceae2_6px,#f6f4ef_6px,#f6f4ef_12px)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[12px] text-ink-faint">{market.fileName}</p>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            {reading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin-slow rounded-full border-2 border-ink/20 border-t-brand-600" />
                Reading the image…
              </>
            ) : (
              'Screenshot read'
            )}
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 font-mono text-[12px] font-medium text-brand-700 ring-1 ring-brand-100">
          {market.sourceLabel}
        </span>
      </div>

      {/* Parsed market */}
      <div className="mt-4 rounded-xl border border-paper-line bg-white/70 p-4">
        <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {market.sourceLabel} · {market.status}
        </p>
        <h3 className="mt-2 font-serif text-xl leading-snug text-ink">{market.question}</h3>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <PriceCell label="YES" price={market.yesPrice} side="yes" />
          <PriceCell label="NO" price={market.noPrice} side="no" />
        </div>
      </div>
    </div>
  )
}

function PriceCell({
  label,
  price,
  side,
}: {
  label: string
  price: number
  side: 'yes' | 'no'
}) {
  const isYes = side === 'yes'
  return (
    <div className="rounded-lg border border-paper-line bg-paper-card px-4 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          {label}
        </span>
      </div>
      <p
        className={cn(
          'mt-1 font-serif text-2xl font-medium',
          isYes ? 'text-market-yes' : 'text-market-no'
        )}
      >
        {price}¢
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-line">
        <div
          className={cn('h-full origin-left animate-grow rounded-full', isYes ? 'bg-market-yes' : 'bg-market-no')}
          style={{ width: `${price}%` }}
        />
      </div>
    </div>
  )
}
