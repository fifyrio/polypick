# Polypick

AI-driven decision engine for prediction markets (Polymarket, Kalshi, PredictIt) — **MVP**.

Drop a market screenshot and Polypick tells you **what to bet, why, and when to take profits**.

## Core features (MVP demo)

- **AI Analyzer** — upload/drop a market screenshot → animated analysis pipeline → locked "FINAL VERDICT" teaser (BET side, entry, cash-out / bail / hold targets, reasoning).
- **Real-time win-rate** framing, **whale-flow** step, and a monetized "Unlock my winning edge" CTA.
- Sidebar shell: Dashboard, AI Analyzer, Picks, AI Coach, Paper Trading, Help Center.

> Auth, real image OCR, live market data, and whale/copy-trading backends are **stubbed** for this MVP. "Try a sample" and "Upload screenshot" both run the demo flow with `src/lib/sample.ts`.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Inter / Newsreader / JetBrains Mono.

## Run

```bash
npm install
npm run dev      # http://localhost:3002
npm run build    # production build
```

## Structure

```
src/
├── app/                 # layout, globals, page (analyzer dashboard)
├── components/
│   ├── layout/          # PromoBar, Sidebar, Topbar, icons
│   ├── analyzer/        # Dropzone, MarketCard, AnalysisSteps, VerdictPanel, AnalyzerShell
│   └── ui/              # Countdown
├── lib/                 # cn(), sample market + verdict data
└── types/               # analyzer types
```
