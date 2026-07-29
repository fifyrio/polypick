import { cn } from '@/lib/cn'
import { IconCheck } from '@/components/layout/icons'
import type { AnalysisStep } from '@/types/analyzer'

interface AnalysisStepsProps {
  steps: AnalysisStep[]
  /** Index of the current in-progress step; steps before it are done. */
  current: number
}

export function AnalysisSteps({ steps, current }: AnalysisStepsProps) {
  return (
    <div className="mt-4">
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-paper-line">
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
          style={{ width: `${(Math.min(current, steps.length) / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-3">
        {steps.map((step, i) => {
          const done = i < current
          const activeNow = i === current
          const pending = i > current
          return (
            <li
              key={step.id}
              className={cn(
                'flex items-center gap-3 text-sm transition',
                pending && 'opacity-40'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  done && 'bg-brand-500 text-white animate-pop-check',
                  activeNow && 'bg-brand-50 text-brand-600 ring-1 ring-brand-100',
                  pending && 'bg-paper-line text-ink-faint'
                )}
              >
                {done ? (
                  <IconCheck className="h-3.5 w-3.5" />
                ) : activeNow ? (
                  <span className="h-3 w-3 animate-spin-slow rounded-full border-2 border-brand-200 border-t-brand-600" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={cn('font-medium', done ? 'text-ink' : 'text-ink-soft')}>
                {step.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
