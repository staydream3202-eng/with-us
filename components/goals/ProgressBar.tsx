interface ProgressBarProps {
  progress: number  // 0–100
  showLabel?: boolean
  height?: 'sm' | 'md' | 'lg'
}

const HEIGHT = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

function getColor(progress: number): string {
  if (progress < 30) return 'bg-red-400'
  if (progress < 60) return 'bg-yellow-400'
  if (progress < 80) return 'bg-blue-400'
  return 'bg-green-400'
}

export default function ProgressBar({ progress, showLabel = true, height = 'md' }: ProgressBarProps) {
  const pct   = Math.min(Math.max(Math.round(progress), 0), 100)
  const color = getColor(pct)

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-gray-400">달성률</span>
          <span
            className={`text-sm font-bold ${
              pct < 30 ? 'text-red-500' : pct < 60 ? 'text-yellow-500' : pct < 80 ? 'text-blue-500' : 'text-green-500'
            }`}
          >
            {pct}%
          </span>
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-gray-100 ${HEIGHT[height]}`}>
        <div
          className={`${HEIGHT[height]} rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
