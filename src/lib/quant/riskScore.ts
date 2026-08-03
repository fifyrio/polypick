import type { RiskAssessment, RiskTier } from '@/types/analyzer'

/**
 * CAPM-inspired factor risk model for a single prediction-market bet.
 *
 * Without historical covariance data we proxy "beta" with the factors that
 * dominate a binary contract's variance:
 *  - price extremity: long shots (cheap contracts) have the most volatile
 *    payoff profile, heavy favorites the least;
 *  - model uncertainty: low confidence and thin edge mean the fair-value
 *    estimate itself is noisy;
 *  - time exposure: longer holds absorb more news shocks.
 *
 * Score is 0-100 (higher = riskier), mapped to Safe / Speculative / Lottery.
 */

export interface RiskInput {
  /** Price of the chosen side in cents (1-99). */
  sidePrice: number
  /** Estimated mispricing in percentage points (1-30). */
  edge: number
  /** Model confidence (50-95). */
  confidence: number
  /** Holding period in days. */
  holdDays: number
}

const TIER_THRESHOLDS: { max: number; tier: RiskTier }[] = [
  { max: 38, tier: 'safe' },
  { max: 66, tier: 'speculative' },
  { max: 100, tier: 'lottery' },
]

export function computeRisk(input: RiskInput): RiskAssessment {
  const price = clamp(input.sidePrice, 1, 99)

  // Payoff volatility of a binary contract peaks at 50¢ for price moves, but
  // *return* volatility explodes for cheap contracts: sqrt(p(1-p))/p.
  const p = price / 100
  const returnVol = Math.sqrt(p * (1 - p)) / p // ~0.1 at 99¢, ~3.1 at 9¢
  const priceRisk = clamp((returnVol / 2) * 100, 0, 100)

  // Model uncertainty: low confidence and thin edge -> noisy fair value.
  const confidenceRisk = clamp(((95 - input.confidence) / 45) * 100, 0, 100)
  const edgeRisk = clamp(((10 - input.edge) / 10) * 100, 0, 100)

  // Time exposure: news shocks accumulate roughly with sqrt(days).
  const timeRisk = clamp(Math.sqrt(Math.max(input.holdDays, 1)) * 22, 0, 100)

  const score = Math.round(
    priceRisk * 0.4 + confidenceRisk * 0.25 + edgeRisk * 0.15 + timeRisk * 0.2
  )

  const tier = TIER_THRESHOLDS.find((t) => score <= t.max)?.tier ?? 'lottery'

  return { tier, score, drivers: describeDrivers(price, input, timeRisk, priceRisk) }
}

function describeDrivers(
  price: number,
  input: RiskInput,
  timeRisk: number,
  priceRisk: number
): string[] {
  const drivers: string[] = []

  if (price <= 25) drivers.push(`Long shot at ${price}¢ — big payoff, high variance`)
  else if (price >= 70) drivers.push(`Heavy favorite at ${price}¢ — steady but capped upside`)
  else drivers.push(`Mid-range price at ${price}¢ — moderate payoff swings`)

  if (input.confidence < 65) drivers.push('Model confidence is low')
  if (input.edge >= 12) drivers.push('Large estimated edge cushions losses')
  if (timeRisk > 55) drivers.push(`${input.holdDays}-day hold absorbs more news risk`)

  return drivers.slice(0, 3)
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
