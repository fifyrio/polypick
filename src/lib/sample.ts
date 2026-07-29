import type { AnalysisStep, SampleMarket, Verdict } from '@/types/analyzer'

export const SAMPLE_MARKET: SampleMarket = {
  fileName: 'sample-market.png',
  source: 'polymarket',
  sourceLabel: 'Polymarket',
  status: 'LIVE',
  question: 'Will Bitcoin close above $120,000 by Friday?',
  yesPrice: 58,
  noPrice: 42,
}

export const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'read', label: 'Reading the screenshot…' },
  { id: 'identify', label: 'Identifying the market…' },
  { id: 'odds', label: 'Pulling latest odds & news…' },
  { id: 'whale', label: 'Checking on-chain whale flow…' },
  { id: 'model', label: 'Running the model…' },
  { id: 'verdict', label: 'Making final verdict…' },
]

export const SAMPLE_VERDICT: Verdict = {
  side: 'YES',
  action: 'BUY UNDER',
  entry: '61¢',
  cashOutAt: '78¢',
  bailAt: '49¢',
  holdFor: '2 days',
  summary:
    'We think YES happens. The market has priced this too cheaply given the on-chain momentum, so there is real edge to take the odds.',
  reasons: [
    'Recent market activity points your way.',
    'On-chain whale flow agrees with this bet.',
    'Historical pattern on this asset skewed in your favor.',
  ],
  confidence: 71,
  edge: 9,
}

export const SOURCE_DOTS: { key: string; label: string }[] = [
  { key: 'polymarket', label: 'polymarket' },
  { key: 'kalshi', label: 'kalshi' },
  { key: 'predictit', label: 'predictit' },
]
