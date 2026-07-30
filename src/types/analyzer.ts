export type MarketSource = 'polymarket' | 'kalshi' | 'predictit'

export interface SampleMarket {
  fileName: string
  source: MarketSource
  sourceLabel: string
  status: string
  question: string
  yesPrice: number // cents
  noPrice: number // cents
}

export type VerdictSide = 'YES' | 'NO'

export interface Verdict {
  side: VerdictSide
  action: string // e.g. "BUY UNDER"
  entry: string // locked
  cashOutAt: string // locked
  bailAt: string // locked
  holdFor: string // locked
  summary: string // locked reasoning intro
  reasons: string[] // locked bullet reasons
  confidence: number // 0-100
  edge: number // percentage points
}

export interface AnalysisStep {
  id: string
  label: string
}

export type AnalyzerPhase = 'idle' | 'analyzing' | 'done' | 'error'

export interface AnalyzedMarket {
  source: MarketSource
  question: string
  yesPrice: number // cents
  noPrice: number // cents
}

export interface AnalysisResult {
  ok: true
  market: AnalyzedMarket
  verdict: Verdict
}
