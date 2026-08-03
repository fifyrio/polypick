'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Dropzone } from './Dropzone'
import { MarketCard } from './MarketCard'
import { AnalysisSteps } from './AnalysisSteps'
import { VerdictPlaceholder, VerdictResult } from './VerdictPanel'
import { SimulatorPanel } from '@/components/simulator/SimulatorPanel'
import { ANALYSIS_STEPS, SAMPLE_MARKET, SAMPLE_VERDICT } from '@/lib/sample'
import type { AnalysisResult, AnalyzerPhase, SampleMarket } from '@/types/analyzer'

const STEP_MS = 750

const SOURCE_LABELS: Record<string, string> = {
  polymarket: 'Polymarket',
  kalshi: 'Kalshi',
  predictit: 'PredictIt',
}

export function AnalyzerShell({ userName }: { userName: string }) {
  const [phase, setPhase] = useState<AnalyzerPhase>('idle')
  const [current, setCurrent] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [market, setMarket] = useState<SampleMarket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSample, setIsSample] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    setPhase('idle')
    setCurrent(0)
    setResult(null)
    setMarket(null)
    setError(null)
  }, [clearTimers])

  /** Fake demo run with canned data (blurred verdict). */
  const startSample = useCallback(() => {
    clearTimers()
    setIsSample(true)
    setError(null)
    setResult(null)
    setMarket(SAMPLE_MARKET)
    setPhase('analyzing')
    setCurrent(0)

    ANALYSIS_STEPS.forEach((_, i) => {
      timers.current.push(setTimeout(() => setCurrent(i + 1), STEP_MS * (i + 1)))
    })
    timers.current.push(
      setTimeout(() => setPhase('done'), STEP_MS * (ANALYSIS_STEPS.length + 1))
    )
  }, [clearTimers])

  /** Real AI analysis of an uploaded screenshot. */
  const analyze = useCallback(
    async (file: File) => {
      clearTimers()
      setIsSample(false)
      setError(null)
      setResult(null)
      setMarket({
        fileName: file.name,
        source: 'polymarket',
        sourceLabel: 'Reading…',
        status: 'LIVE',
        question: 'Reading the screenshot…',
        yesPrice: 0,
        noPrice: 0,
      })
      setPhase('analyzing')
      setCurrent(0)

      // Step animation runs while the API call is in flight; it parks on the
      // last step until the model responds.
      ANALYSIS_STEPS.slice(0, -1).forEach((_, i) => {
        timers.current.push(setTimeout(() => setCurrent(i + 1), STEP_MS * (i + 1)))
      })

      try {
        const formData = new FormData()
        formData.append('image', file)
        const res = await fetch('/api/analyze', { method: 'POST', body: formData })
        const data = (await res.json()) as AnalysisResult | { ok: false; error: string }

        if (!data.ok) {
          setError(data.error)
          setPhase('error')
          return
        }

        setResult(data)
        setMarket({
          fileName: file.name,
          source: data.market.source,
          sourceLabel: SOURCE_LABELS[data.market.source] ?? 'Market',
          status: 'LIVE',
          question: data.market.question,
          yesPrice: data.market.yesPrice,
          noPrice: data.market.noPrice,
        })
        setCurrent(ANALYSIS_STEPS.length)
        timers.current.push(setTimeout(() => setPhase('done'), 400))
      } catch {
        setError('Network error — please try again.')
        setPhase('error')
      }
    },
    [clearTimers]
  )

  useEffect(() => clearTimers, [clearTimers])

  const analyzing = phase === 'analyzing' || phase === 'done'
  const reading = phase === 'analyzing' && !isSample && !result

  return (
    <div className="space-y-8">
      <Topbar userName={userName} onUpload={() => fileInputRef.current?.click()} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) analyze(file)
          e.target.value = ''
        }}
      />

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
          {phase === 'idle' ? (
            <Dropzone onFile={analyze} onSample={startSample} />
          ) : phase === 'error' ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl2 border border-market-no/30 bg-paper-card/70 px-8 py-12 text-center">
              <h3 className="font-serif text-2xl text-ink">Analysis failed</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-soft">{error}</p>
              <button
                onClick={reset}
                className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-brand-ink shadow-card transition hover:bg-brand-400"
              >
                Try another screenshot
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              {market && <MarketCard market={market} reading={reading} />}
              <AnalysisSteps steps={ANALYSIS_STEPS} current={current} />
              {phase === 'done' && (
                <button
                  onClick={reset}
                  className="mt-4 w-full rounded-xl border border-paper-line bg-white/60 py-3 text-sm font-medium text-ink transition hover:border-ink/25"
                >
                  Analyze another market
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div>
          {analyzing ? (
            <>
              <VerdictResult
                verdict={result ? result.verdict : SAMPLE_VERDICT}
                revealed={Boolean(result)}
                risk={result?.risk}
              />
              {result && phase === 'done' && <SimulatorPanel result={result} />}
            </>
          ) : (
            <VerdictPlaceholder />
          )}
        </div>
      </div>
    </div>
  )
}
