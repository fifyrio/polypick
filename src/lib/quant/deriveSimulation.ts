import type { AnalysisResult } from '@/types/analyzer'
import type { SimulationInput } from './monteCarlo'

/**
 * Derive Monte Carlo inputs from an AI verdict. Price strings like "61¢"
 * are parsed; missing values fall back to sensible offsets from entry.
 */
export function deriveSimulationInput(result: AnalysisResult): SimulationInput {
  const { market, verdict } = result
  const sidePrice = verdict.side === 'YES' ? market.yesPrice : market.noPrice

  const entry = parseCents(verdict.entry) ?? sidePrice
  const fairValue = clamp(sidePrice + verdict.edge, 2, 98)
  const cashOut = parseCents(verdict.cashOutAt) ?? clamp(entry + 15, entry + 1, 99)
  const bail = parseCents(verdict.bailAt) ?? clamp(entry - 12, 1, entry - 1)

  return {
    entry,
    fairValue,
    cashOut,
    bail,
    holdDays: parseDays(verdict.holdFor),
  }
}

/** "61¢" | "61c" | "61" -> 61 */
function parseCents(value: string): number | null {
  const match = value.match(/(\d+(?:\.\d+)?)/)
  if (!match) return null
  const n = Number(match[1])
  return Number.isFinite(n) && n > 0 && n < 100 ? Math.round(n) : null
}

/** "2 days" | "1 week" | "12 hours" -> days (min 1) */
export function parseDays(value: string): number {
  const match = value.match(/(\d+(?:\.\d+)?)/)
  if (!match) return 3
  const n = Number(match[1])
  if (!Number.isFinite(n) || n <= 0) return 3

  const lower = value.toLowerCase()
  if (lower.includes('hour')) return Math.max(1, Math.round(n / 24))
  if (lower.includes('week')) return Math.round(n * 7)
  if (lower.includes('month')) return Math.round(n * 30)
  return Math.max(1, Math.round(n))
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
