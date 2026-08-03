/**
 * Mean-variance (Markowitz) allocation across independent binary bets.
 *
 * Prediction-market positions on unrelated events have (near) zero
 * covariance, so the covariance matrix is diagonal and the tangency
 * solution reduces to weights proportional to excess return over variance,
 * scaled by risk aversion, with a per-position concentration cap.
 */

export interface PortfolioAsset {
  id: string
  label: string
  /** Price of the chosen side, cents (1-99). */
  price: number
  /** Model probability the chosen side wins, 0-1. */
  fairProb: number
}

export interface Allocation {
  id: string
  label: string
  price: number
  fairProb: number
  /** Fraction of budget, 0-1. */
  weight: number
  /** Dollar stake. */
  stake: number
  /** Expected return per $1 staked. */
  mu: number
  /** Variance of return per $1 staked. */
  variance: number
}

export interface PortfolioPlan {
  allocations: Allocation[]
  /** Sum of stakes actually deployed. */
  deployed: number
  /** Budget left in cash (no positive-edge home for it). */
  cash: number
  /** Expected profit in dollars. */
  expectedProfit: number
  /** One-sigma profit swing in dollars (independence assumption). */
  sigma: number
}

/** Max fraction of budget in a single market. */
const POSITION_CAP = 0.4

export function buildPortfolio(
  assets: PortfolioAsset[],
  budget: number,
  /** 1 = aggressive … 5 = conservative. */
  riskAversion: number
): PortfolioPlan {
  const lambda = clamp(riskAversion, 1, 5)

  const stats = assets.map((asset) => {
    const p = clamp(asset.price, 1, 99) / 100
    const q = clamp(asset.fairProb, 0.01, 0.99)
    const b = (1 - p) / p // net odds per $1
    const mu = q * b - (1 - q)
    const variance = q * (1 - q) * (b + 1) ** 2
    return { ...asset, mu, variance }
  })

  // Tangency weights on the positive-edge subset: w ∝ mu / (λ·σ²).
  const raw = stats.map((s) => (s.mu > 0 ? s.mu / (lambda * s.variance) : 0))
  const capped = capAndNormalize(raw)

  // Kelly-style total exposure: conservative λ keeps some budget in cash.
  const grossKelly = stats.reduce(
    (sum, s) => sum + (s.mu > 0 ? clamp(s.mu / s.variance, 0, 1) : 0),
    0
  )
  const exposure = clamp(grossKelly / lambda, 0, 1)

  const allocations: Allocation[] = stats.map((s, i) => {
    const weight = capped[i] * exposure
    const stake = round2(weight * budget)
    return {
      id: s.id,
      label: s.label,
      price: s.price,
      fairProb: s.fairProb,
      weight,
      stake,
      mu: round4(s.mu),
      variance: round4(s.variance),
    }
  })

  const deployed = round2(allocations.reduce((sum, a) => sum + a.stake, 0))
  const expectedProfit = round2(allocations.reduce((sum, a) => sum + a.stake * a.mu, 0))
  const sigma = round2(
    Math.sqrt(allocations.reduce((sum, a) => sum + a.stake ** 2 * a.variance, 0))
  )

  return {
    allocations: allocations.filter((a) => a.stake > 0).sort((a, b) => b.stake - a.stake),
    deployed,
    cash: round2(budget - deployed),
    expectedProfit,
    sigma,
  }
}

/** Normalize weights to 1, enforcing the per-position cap iteratively. */
function capAndNormalize(raw: number[]): number[] {
  const total = raw.reduce((s, w) => s + w, 0)
  if (total <= 0) return raw.map(() => 0)

  let weights = raw.map((w) => w / total)
  for (let pass = 0; pass < 10; pass++) {
    const over = weights.map((w) => w > POSITION_CAP)
    if (!over.some(Boolean)) break

    const excess = weights.reduce((s, w, i) => s + (over[i] ? w - POSITION_CAP : 0), 0)
    const underTotal = weights.reduce((s, w, i) => s + (over[i] ? 0 : w), 0)
    weights = weights.map((w, i) => {
      if (over[i]) return POSITION_CAP
      return underTotal > 0 ? w + (w / underTotal) * excess : w
    })
  }
  return weights
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}
