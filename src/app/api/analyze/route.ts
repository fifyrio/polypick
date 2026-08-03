import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { AnalysisResult } from '@/types/analyzer'
import { computeRisk } from '@/lib/quant/riskScore'
import { parseDays } from '@/lib/quant/deriveSimulation'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002',
    'X-Title': 'Polypick AI Analyzer',
  },
})

const SYSTEM_PROMPT = `You are Polypick, an expert prediction-market analyst. The user uploads a screenshot of a prediction market (Polymarket, Kalshi, or PredictIt).

Your job:
1. Read the screenshot and extract the market question and the current YES/NO prices (in cents, 0-100).
2. Judge which side has the better expected value based on the priced odds, base rates, and general knowledge. Be decisive.
3. Produce a trading plan: entry ceiling, take-profit, stop-loss, and holding period.

Respond ONLY with a JSON object in exactly this shape:
{
  "ok": true,
  "market": {
    "source": "polymarket" | "kalshi" | "predictit",
    "question": "<the market question>",
    "yesPrice": <number 0-100>,
    "noPrice": <number 0-100>
  },
  "verdict": {
    "side": "YES" | "NO",
    "action": "BUY UNDER",
    "entry": "<e.g. 61¢>",
    "cashOutAt": "<e.g. 78¢>",
    "bailAt": "<e.g. 49¢>",
    "holdFor": "<e.g. 2 days>",
    "summary": "<2 sentences: which side and why, plain language>",
    "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
    "confidence": <number 50-95>,
    "edge": <number 1-30, percentage points of estimated mispricing>
  }
}

If the image is NOT a prediction-market screenshot, respond with:
{ "ok": false, "error": "<short reason the image can't be analyzed>" }

Rules: prices must sum to roughly 100. Never invent a market that is not in the image. Keep reasons concrete and tied to the market topic.`

export async function POST(request: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'OPENROUTER_API_KEY is not configured' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const image = formData.get('image')

    if (!(image instanceof File)) {
      return NextResponse.json(
        { ok: false, error: 'Image file is required' },
        { status: 400 }
      )
    }
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { ok: false, error: 'File must be an image' },
        { status: 400 }
      )
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'Image too large (max 8MB)' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await image.arrayBuffer())
    const dataUrl = `data:${image.type};base64,${buffer.toString('base64')}`

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      max_tokens: 1200,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this prediction market screenshot and give me your verdict.',
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      throw new Error('Empty response from model')
    }

    const parsed = parseModelResponse(raw)
    if (!parsed.ok) {
      return NextResponse.json(parsed, { status: 422 })
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

function parseModelResponse(
  raw: string
): AnalysisResult | { ok: false; error: string } {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Model returned malformed JSON' }
  }

  const data = json as Record<string, unknown>
  if (data.ok === false) {
    return {
      ok: false,
      error: typeof data.error === 'string' ? data.error : 'Not a market screenshot',
    }
  }

  const market = data.market as Record<string, unknown> | undefined
  const verdict = data.verdict as Record<string, unknown> | undefined
  if (
    !market ||
    !verdict ||
    typeof market.question !== 'string' ||
    typeof market.yesPrice !== 'number' ||
    typeof market.noPrice !== 'number' ||
    (verdict.side !== 'YES' && verdict.side !== 'NO') ||
    typeof verdict.summary !== 'string' ||
    !Array.isArray(verdict.reasons)
  ) {
    return { ok: false, error: 'Model response missing required fields' }
  }

  const source =
    market.source === 'kalshi' || market.source === 'predictit'
      ? market.source
      : 'polymarket'

  const yesPrice = clamp(Math.round(market.yesPrice), 1, 99)
  const noPrice = clamp(Math.round(market.noPrice), 1, 99)
  const confidence = clamp(num(verdict.confidence, 60), 50, 95)
  const edge = clamp(num(verdict.edge, 5), 1, 30)
  const holdFor = str(verdict.holdFor, '—')

  return {
    ok: true,
    market: { source, question: market.question, yesPrice, noPrice },
    verdict: {
      side: verdict.side,
      action: typeof verdict.action === 'string' ? verdict.action : 'BUY UNDER',
      entry: str(verdict.entry, '—'),
      cashOutAt: str(verdict.cashOutAt, '—'),
      bailAt: str(verdict.bailAt, '—'),
      holdFor,
      summary: verdict.summary,
      reasons: verdict.reasons.filter((r): r is string => typeof r === 'string').slice(0, 4),
      confidence,
      edge,
    },
    risk: computeRisk({
      sidePrice: verdict.side === 'YES' ? yesPrice : noPrice,
      edge,
      confidence,
      holdDays: parseDays(holdFor),
    }),
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.length > 0 ? v : fallback
}
