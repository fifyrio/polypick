/**
 * Monte Carlo simulation of a prediction-market trade.
 *
 * Simulates daily price paths of the chosen side's contract (cents, 1-99),
 * drifting toward the model's fair value, and applies the verdict's
 * take-profit / stop-loss rules. Pure math — no API calls.
 */

export interface SimulationInput {
  /** Entry price of the chosen side, in cents (1-99). */
  entry: number
  /** Model fair value of the chosen side, in cents (1-99). */
  fairValue: number
  /** Take-profit level in cents. */
  cashOut: number
  /** Stop-loss level in cents. */
  bail: number
  /** Holding period in days (>= 1). */
  holdDays: number
  /** Number of simulated paths. */
  trials?: number
  /** RNG seed for reproducible results. */
  seed?: number
  /** Daily price volatility in cents; defaults to a generic 5.5. */
  dailyVol?: number
}

export interface HistogramBin {
  /** Bin lower edge, % return. */
  from: number
  /** Bin upper edge, % return. */
  to: number
  count: number
}

export interface SimulationResult {
  /** Probability the trade exits with a profit (0-1). */
  probProfit: number
  /** Mean % return. */
  mean: number
  /** 5th / 50th / 95th percentile % return. */
  p5: number
  p50: number
  p95: number
  /** Full-Kelly fraction of bankroll (0-1), from resolution odds. */
  kelly: number
  /** Histogram of % returns. */
  bins: HistogramBin[]
  trials: number
}

const DEFAULT_TRIALS = 10_000
const BIN_COUNT = 24
/** Daily price volatility in cents. */
const DAILY_VOL = 5.5
/** Mean-reversion speed toward fair value per day. */
const REVERSION = 0.18

export function simulateTrade(input: SimulationInput): SimulationResult {
  const trials = input.trials ?? DEFAULT_TRIALS
  const entry = clamp(input.entry, 1, 99)
  const fair = clamp(input.fairValue, 1, 99)
  const cashOut = clamp(input.cashOut, entry + 1, 99)
  const bail = clamp(input.bail, 1, entry - 1)
  const days = Math.max(1, Math.round(input.holdDays))
  const vol = clamp(input.dailyVol ?? DAILY_VOL, 0.5, 25)

  const rng = mulberry32(input.seed ?? 42)
  const returns = new Array<number>(trials)

  for (let t = 0; t < trials; t++) {
    let price = entry
    let exit = entry

    for (let d = 0; d < days; d++) {
      price += (fair - price) * REVERSION + gaussian(rng) * vol
      price = clamp(price, 0.5, 99.5)

      if (price >= cashOut) {
        exit = cashOut
        break
      }
      if (price <= bail) {
        exit = bail
        break
      }
      exit = price
    }

    returns[t] = ((exit - entry) / entry) * 100
  }

  returns.sort((a, b) => a - b)

  const probProfit = returns.filter((r) => r > 0).length / trials
  const mean = returns.reduce((s, r) => s + r, 0) / trials

  return {
    probProfit,
    mean,
    p5: percentile(returns, 0.05),
    p50: percentile(returns, 0.5),
    p95: percentile(returns, 0.95),
    kelly: kellyFraction(entry, fair),
    bins: buildHistogram(returns),
    trials,
  }
}

/** Kelly fraction from binary resolution odds: entry price vs model probability. */
export function kellyFraction(entryCents: number, fairCents: number): number {
  const p = clamp(fairCents, 1, 99) / 100
  const q = 1 - p
  const b = (100 - entryCents) / entryCents // net odds per $1 staked
  if (b <= 0) return 0
  return clamp((p * b - q) / b, 0, 1)
}

function buildHistogram(sorted: number[]): HistogramBin[] {
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const span = Math.max(max - min, 1e-9)
  const width = span / BIN_COUNT

  const bins: HistogramBin[] = Array.from({ length: BIN_COUNT }, (_, i) => ({
    from: min + i * width,
    to: min + (i + 1) * width,
    count: 0,
  }))

  for (const r of sorted) {
    const i = Math.min(BIN_COUNT - 1, Math.floor((r - min) / width))
    bins[i] = { ...bins[i], count: bins[i].count + 1 }
  }
  return bins
}

function percentile(sorted: number[], p: number): number {
  const idx = clamp(Math.floor(p * sorted.length), 0, sorted.length - 1)
  return sorted[idx]
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Deterministic 32-bit RNG. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard normal via Box-Muller. */
function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
