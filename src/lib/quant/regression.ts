import type { PricePoint } from '@/lib/markets/gamma'

/**
 * OLS regression over a market's recent price history.
 * Momentum (slope) extrapolated over the holding period gives a
 * data-backed fair-value estimate; residual noise gives realized volatility.
 */

export interface SeriesSignal {
  /** Price drift in cents per day (OLS slope). */
  momentumPerDay: number
  /** Realized daily volatility in cents. */
  dailyVolCents: number
  /** Extrapolated fair value of this series' side, in cents. */
  fairValueCents: number
  /** fairValue - currentPrice, in cents (signed edge along this side). */
  quantEdge: number
  /** Regression fit quality 0-1. */
  rSquared: number
  /** Last observed price in cents. */
  lastCents: number
  /** Downsampled series in cents for sparklines. */
  sparkline: number[]
}

const SPARKLINE_POINTS = 40
const SECONDS_PER_DAY = 86_400

export function analyzeSeries(points: PricePoint[], holdDays: number): SeriesSignal {
  const t0 = points[0].t
  const xs = points.map((pt) => (pt.t - t0) / SECONDS_PER_DAY)
  const ys = points.map((pt) => pt.p * 100)

  const { slope, intercept, rSquared } = ols(xs, ys)

  const lastX = xs[xs.length - 1]
  const lastCents = ys[ys.length - 1]

  // Extrapolate the trend over the holding period, dampened by fit quality:
  // a noisy trend should not project far.
  const projected = slope * Math.max(0.25, rSquared) * Math.min(holdDays, 7)
  const fairValueCents = clamp(lastCents + projected, 2, 98)

  return {
    momentumPerDay: round2(slope),
    dailyVolCents: round2(realizedDailyVol(xs, ys)),
    fairValueCents: round2(fairValueCents),
    quantEdge: round2(fairValueCents - lastCents),
    rSquared: round2(rSquared),
    lastCents: round2(lastCents),
    sparkline: downsample(ys, SPARKLINE_POINTS),
  }
}

/** Invert a YES series into the NO side (cents mirror around 100). */
export function invertSeries(points: PricePoint[]): PricePoint[] {
  return points.map((pt) => ({ t: pt.t, p: 1 - pt.p }))
}

function ols(xs: number[], ys: number[]): { slope: number; intercept: number; rSquared: number } {
  const n = xs.length
  const meanX = xs.reduce((s, x) => s + x, 0) / n
  const meanY = ys.reduce((s, y) => s + y, 0) / n

  let sxx = 0
  let sxy = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    sxx += dx * dx
    sxy += dx * dy
    syy += dy * dy
  }

  if (sxx === 0 || syy === 0) return { slope: 0, intercept: meanY, rSquared: 0 }

  const slope = sxy / sxx
  return {
    slope,
    intercept: meanY - slope * meanX,
    rSquared: (sxy * sxy) / (sxx * syy),
  }
}

/** Std dev of per-day price changes, in cents. */
function realizedDailyVol(xs: number[], ys: number[]): number {
  const rates: number[] = []
  for (let i = 1; i < ys.length; i++) {
    const dt = xs[i] - xs[i - 1]
    if (dt > 0) rates.push((ys[i] - ys[i - 1]) / Math.sqrt(dt))
  }
  if (rates.length < 2) return 5.5

  const mean = rates.reduce((s, r) => s + r, 0) / rates.length
  const variance = rates.reduce((s, r) => s + (r - mean) ** 2, 0) / (rates.length - 1)
  return Math.sqrt(variance)
}

function downsample(ys: number[], target: number): number[] {
  if (ys.length <= target) return ys.map(round2)
  const step = ys.length / target
  return Array.from({ length: target }, (_, i) => round2(ys[Math.floor(i * step)]))
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
