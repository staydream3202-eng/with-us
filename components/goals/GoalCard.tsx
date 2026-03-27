import Link from 'next/link'
import type { Goal } from '@/types'
import { GOAL_TYPE_LABELS } from '@/types'

interface GoalCardProps {
  goal: Goal
  progress: number  // 0–100
}

const TYPE_COLORS: Record<string, string> = {
  savings: 'bg-emerald-100 text-emerald-700',
  fitness: 'bg-orange-100 text-orange-700',
  study:   'bg-blue-100 text-blue-700',
  custom:  'bg-gray-100 text-gray-600',
}

const PROGRESS_COLORS: Record<string, string> = {
  savings: 'bg-emerald-400',
  fitness: 'bg-orange-400',
  study:   'bg-blue-400',
  custom:  'bg-gray-400',
}

export default function GoalCard({ goal, progress }: GoalCardProps) {
  const typeInfo   = GOAL_TYPE_LABELS[goal.type]
  const badgeColor = TYPE_COLORS[goal.type] ?? TYPE_COLORS.custom
  const barColor   = PROGRESS_COLORS[goal.type] ?? PROGRESS_COLORS.custom

  return (
    <Link href={`/goals/${goal.goalId}`}>
      <div className="w-full max-w-md rounded-2xl bg-white p-4 md:p-5 shadow-sm border border-gray-100 transition hover:shadow-md active:scale-[0.98]">

        {/* 상단: 타입 뱃지 + 제목 */}
        <div className="flex items-start gap-3">
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
            {typeInfo.label}
          </span>
          <h3 className="flex-1 text-sm md:text-base font-semibold text-gray-800 line-clamp-1">
            {goal.title}
          </h3>
          <span className="shrink-0 text-sm md:text-base font-bold text-indigo-500">
            {progress}%
          </span>
        </div>

        {/* 진행바 */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 하단: 목표치 */}
        <p className="mt-2 text-xs text-gray-400">
          목표: {goal.targetValue.toLocaleString()} {goal.unit}
        </p>
      </div>
    </Link>
  )
}
