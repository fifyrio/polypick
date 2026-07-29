import { Countdown } from '@/components/ui/Countdown'

export function PromoBar() {
  return (
    <div className="relative z-20 w-full bg-gradient-to-r from-brand-ink via-black to-brand-900 text-white">
      <div className="mx-auto flex h-11 items-center justify-center gap-3 px-4 text-[13px]">
        <span className="hidden items-center gap-2 sm:inline-flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400 shadow-[0_0_8px_2px_rgba(63,207,78,0.6)]" />
          <span className="font-semibold">Unlock every Polypick tool</span>
          <span className="text-white/50">· ends 11:59pm</span>
        </span>
        <span className="sm:hidden font-semibold">Unlock everything</span>
        <Countdown />
        <button className="ml-1 inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-[13px] font-semibold text-brand-ink transition hover:bg-brand-400">
          Claim <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}
