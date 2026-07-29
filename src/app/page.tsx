import { PromoBar } from '@/components/layout/PromoBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { AnalyzerShell } from '@/components/analyzer/AnalyzerShell'

const USER_NAME = 'fifyrioc5123'

export default function Page() {
  return (
    <div className="paper-grain flex min-h-screen flex-col">
      <PromoBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="relative z-10 flex-1 overflow-x-hidden px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <AnalyzerShell userName={USER_NAME} />
          </div>
        </main>
      </div>
    </div>
  )
}
