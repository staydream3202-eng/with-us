'use client'

import { useEffect, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { getGoals, calcProgress } from '@/lib/firebase/firestore'
import GoalCard from '@/components/goals/GoalCard'
import type { Goal } from '@/types'

interface GoalWithProgress {
  goal: Goal
  progress: number
}

export default function HomePage() {
  const { user } = useAuth()
  const [items, setItems]     = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchGoals() {
      setLoading(true)
      try {
        const goals = await getGoals(user!.uid)
        const withProgress = await Promise.all(
          goals.map(async (goal) => ({
            goal,
            progress: await calcProgress(goal.goalId, goal.targetValue),
          })),
        )
        setItems(withProgress)
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [user])

  return (
    <div className="px-4 md:px-6 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900">
            안녕하세요 👋
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">오늘도 목표를 향해 한 걸음!</p>
        </div>
        {/* 목표 추가 버튼 (향후 GoalForm 모달 연결) */}
        <button
          className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-600 active:scale-95"
          aria-label="목표 추가"
        >
          <PlusIcon className="w-5 h-5 md:w-6 md:h-6" />
          <span className="hidden sm:inline">목표 추가</span>
        </button>
      </div>

      {/* 목표 목록 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-sm md:text-base font-medium text-gray-700">아직 목표가 없어요</p>
          <p className="mt-1 text-xs md:text-sm text-gray-400">
            오른쪽 위 버튼으로 첫 목표를 추가해보세요!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(({ goal, progress }) => (
            <li key={goal.goalId}>
              <GoalCard goal={goal} progress={progress} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
