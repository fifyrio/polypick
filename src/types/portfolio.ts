import type { VerdictSide } from './analyzer'

export interface TrendingCandidate {
  id: string
  question: string
  slug: string
  /** Side with non-negative regression edge. */
  side: VerdictSide
  /** Price of that side in cents. */
  price: number
  /** Regression fair probability of that side, 0-1. */
  fairProb: number
  /** Regression edge in cents (>= 0 by construction for YES; NO mirrored). */
  edge: number
  volume24h: number
  endDate: string | null
  /** 7d price series of the chosen side, cents. */
  sparkline: number[]
}
