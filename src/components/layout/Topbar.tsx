import { IconUpload } from './icons'

interface TopbarProps {
  userName: string
  onUpload?: () => void
}

export function Topbar({ userName, onUpload }: TopbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-bold tracking-tight sm:text-[26px]">
        Welcome back, {userName}{' '}
        <span className="align-middle">👋</span>
      </h1>

      <div className="flex items-center gap-3">
        <button
          onClick={onUpload}
          className="inline-flex items-center gap-2 rounded-full border border-paper-line bg-paper-card px-4 py-2 text-sm font-medium text-ink shadow-card transition hover:border-ink/20 hover:bg-white"
        >
          <IconUpload className="h-4 w-4" />
          Upload screenshot
        </button>
        <button className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-black">
          See plans
        </button>
        <span
          aria-hidden
          className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-rose-400 ring-2 ring-white shadow-card"
        />
      </div>
    </header>
  )
}
