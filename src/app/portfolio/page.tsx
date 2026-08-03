import { PromoBar } from '@/components/layout/PromoBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { PortfolioBuilder } from '@/components/portfolio/PortfolioBuilder'

export const metadata = {
  title: 'Portfolio Builder — Polypick',
  description:
    'Markowitz mean-variance allocation across trending Polymarket markets.',
}

export default function PortfolioPage() {
  return (
    <div className="paper-grain flex min-h-screen flex-col">
      <PromoBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="relative z-10 flex-1 overflow-x-hidden px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <PortfolioBuilder />
          </div>
        </main>
      </div>
    </div>
  )
}
