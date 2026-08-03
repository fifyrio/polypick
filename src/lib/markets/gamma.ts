/**
 * Polymarket public data access: Gamma search + CLOB price history.
 * All calls are best-effort with short timeouts — callers must handle null.
 */

export interface GammaMarket {
  question: string
  slug: string
  /** CLOB token id of the YES outcome. */
  yesTokenId: string
  volume: number
  endDate: string | null
}

export interface PricePoint {
  /** Unix seconds. */
  t: number
  /** Probability 0-1. */
  p: number
}

const GAMMA_BASE = 'https://gamma-api.polymarket.com'
const CLOB_BASE = 'https://clob.polymarket.com'
const FETCH_TIMEOUT_MS = 6000
/** Minimum token-overlap similarity to accept a search hit. */
const MIN_SIMILARITY = 0.45

export async function findMarket(question: string): Promise<GammaMarket | null> {
  const url = `${GAMMA_BASE}/public-search?q=${encodeURIComponent(question)}&limit_per_type=8`
  const json = await fetchJson(url)
  if (!json || typeof json !== 'object') return null

  const events = (json as { events?: unknown[] }).events
  if (!Array.isArray(events)) return null

  let best: GammaMarket | null = null
  let bestScore = MIN_SIMILARITY

  for (const event of events) {
    const markets = (event as { markets?: unknown[] }).markets
    if (!Array.isArray(markets)) continue

    for (const raw of markets) {
      const m = raw as Record<string, unknown>
      if (m.active !== true || m.closed === true) continue
      if (typeof m.question !== 'string' || typeof m.clobTokenIds !== 'string') continue

      const tokenIds = safeParseIds(m.clobTokenIds)
      if (!tokenIds) continue

      const score = similarity(question, m.question)
      if (score > bestScore) {
        bestScore = score
        best = {
          question: m.question,
          slug: typeof m.slug === 'string' ? m.slug : '',
          yesTokenId: tokenIds[0],
          volume: typeof m.volume === 'string' ? Number(m.volume) : Number(m.volume ?? 0),
          endDate: typeof m.endDate === 'string' ? m.endDate : null,
        }
      }
    }
  }
  return best
}

export async function fetchPriceHistory(tokenId: string): Promise<PricePoint[] | null> {
  const url = `${CLOB_BASE}/prices-history?market=${tokenId}&interval=1w&fidelity=180`
  const json = await fetchJson(url)
  if (!json || typeof json !== 'object') return null

  const history = (json as { history?: unknown[] }).history
  if (!Array.isArray(history)) return null

  const points = history
    .map((h) => h as Record<string, unknown>)
    .filter((h) => typeof h.t === 'number' && typeof h.p === 'number')
    .map((h) => ({ t: h.t as number, p: h.p as number }))

  return points.length >= 8 ? points : null
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function safeParseIds(raw: string): [string, string] | null {
  try {
    const ids = JSON.parse(raw)
    if (Array.isArray(ids) && typeof ids[0] === 'string' && typeof ids[1] === 'string') {
      return [ids[0], ids[1]]
    }
    return null
  } catch {
    return null
  }
}

/** Token-overlap similarity (Jaccard on lowercase words, numbers weighted). */
function similarity(a: string, b: string): number {
  const ta = tokenize(a)
  const tb = tokenize(b)
  if (ta.size === 0 || tb.size === 0) return 0

  let hit = 0
  ta.forEach((w) => {
    if (tb.has(w)) hit++
  })
  return hit / Math.max(ta.size, tb.size)
}

const STOP_WORDS = new Set(['will', 'the', 'a', 'an', 'by', 'on', 'in', 'at', 'to', 'of', 'be'])

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9$.\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  )
}
