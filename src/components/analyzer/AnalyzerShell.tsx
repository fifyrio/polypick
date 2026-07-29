'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Dropzone } from './Dropzone'
import { MarketCard } from './MarketCard'
import { AnalysisSteps } from './AnalysisSteps'
import { VerdictPlaceholder, VerdictResult } from './VerdictPanel'
import { ANALYSIS_STEPS, SAMPLE_MARKET, SAMPLE_VERDICT } from '@/lib/sample'
import type { AnalyzerPhase } from '@/types/analyzer'

const STEP_MS = 750

export function AnalyzerShell({ userName }: { userName: string }) {
  const [phase, setPhase] = useState<AnalyzerPhase>('idle')
  const [current, setCurrent] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const start = useCallback(() => {
    clearTimers()
    setPhase('analyzing')
    setCurrent(0)

    ANALYSIS_STEPS.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => setCurrent(i + 1), STEP_MS * (i + 1))
      )
    })
    timers.current.push(
      setTimeout(() => setPhase('done'), STEP_MS * (ANALYSIS_STEPS.length + 1))
    )
  }, [clearTimers])

  useEffect(() => clearTimers, [clearTimers])

  const analyzing = phase === 'analyzing' || phase === 'done'
  const reading = phase === 'analyzing' && current < 1

  return (
    <div className="space-y-8">
      <Topbar userName={userName} onUpload={start} />

      <div>
        <p className="font-mono text-[12px] font-medium uppercase tracking-[0.18em] text-ink-faint">
          AI Analyzer · Free demo
        </p>
        <h2 className="mt-2 text-4xl font-bold tracking-tight sm:text-[44px]">
          Polypick<span className="text-brand-600">.app</span>{' '}
          <span className="font-normal text-ink-faint">AI Analyzer</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Left */}
        <div>
          {!analyzing ? (
            <Dropzone onFile={start} onSample={start} />
          ) : (
            <div className="animate-fade-in">
              <MarketCard market={SAMPLE_MARKET} reading={reading} />
              <AnalysisSteps steps={ANALYSIS_STEPS} current={current} />
            </div>
          )}
        </div>

        {/* Right */}
        <div>
          {analyzing ? (
            <VerdictResult verdict={SAMPLE_VERDICT} />
          ) : (
            <VerdictPlaceholder />
          )}
        </div>
      </div>
    </div>
  )
}
