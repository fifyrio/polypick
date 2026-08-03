import { NextResponse } from 'next/server'
import { fetchPriceHistory } from '@/lib/markets/gamma'
import { analyzeSeries, invertSeries } from '@/lib/quant/regression'
import type { TrendingCandidate } from '@/types/portfolio'

export const runtime = 'nodejs'
export const maxDuration = 30

const GAMMA_MARKETS_URL =
  'https://gamma-api.polymarket.com/markets?order=volume24hr&ascending=false&closed=false&active=true&limit=30'
const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CANDIDATES = 10
/** Skip near-resolved markets — no tradeable edge left. */
const MIN_PRICE = 5
const MAX_PRICE = 95

let cache: { at: number; data: TrendingCandidate[] } | null = null

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ ok: true, candidates: cache.data, cached: true })
  }

  try {
    const res = await fetch(GAMMA_MARKETS_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`Gamma responded ${res.status}`)
    const markets = (await res.json()) as Record<string, unknown>[]

    const eligible = markets
      .map(parseMarket)
      .filter((m): m is ParsedMarket => m !== null)
      .filter((m) => m.yesPrice >= MIN_PRICE && m.yesPrice <= MAX_PRICE)
      .slice(0, MAX_CANDIDATES)

    const candidates = (
      await Promise.all(eligible.map((m) => toCandidate(m)))
    ).filter((c): c is TrendingCandidate => c !== null)

    cache = { at: Date.now(), data: candidates }
    return NextResponse.json({ ok: true, candidates, cached: false })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load markets'
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}

interface ParsedMarket {
  id: string
  question: string
  slug: string
  yesPrice: number
  yesTokenId: string
  volume24h: number
  endDate: string | null
}

function parseMarket(raw: Record<string, unknown>): ParsedMarket | null {
  if (
    typeof raw.question !== 'string' ||
    typeof raw.outcomePrices !== 'string' ||
    typeof raw.clobTokenIds !== 'string'
  ) {
    return null
  }
  try {
    const prices = JSON.parse(raw.outcomePrices)
    const tokens = JSON.parse(raw.clobTokenIds)
    const yes = Math.round(Number(prices[0]) * 100)
    if (!Number.isFinite(yes) || typeof tokens[0] !== 'string') return null

    return {
      id: String(raw.id ?? raw.slug ?? raw.question),
      question: raw.question,
      slug: typeof raw.slug === 'string' ? raw.slug : '',
      yesPrice: yes,
      yesTokenId: tokens[0],
      volume24h: Number(raw.volume24hr ?? 0),
      endDate: typeof raw.endDate === 'string' ? raw.endDate : null,
    }
  } catch {
    return null
  }
}

/** Attach a regression fair value and pick the positive-edge side. */
async function toCandidate(m: ParsedMarket): Promise<TrendingCandidate | null> {
  const history = await fetchPriceHistory(m.yesTokenId)
  if (!history) return null

  const yesSignal = analyzeSeries(history, 3)
  const yesEdge = yesSignal.quantEdge

  const side = yesEdge >= 0 ? 'YES' : 'NO'
  const signal = side === 'YES' ? yesSignal : analyzeSeries(invertSeries(history), 3)
  const price = side === 'YES' ? m.yesPrice : 100 - m.yesPrice

  return {
    id: m.id,
    question: m.question,
    slug: m.slug,
    side,
    price,
    fairProb: Math.round(signal.fairValueCents) / 100,
    edge: signal.quantEdge,
    volume24h: Math.round(m.volume24h),
    endDate: m.endDate,
    sparkline: signal.sparkline,
  }
}
