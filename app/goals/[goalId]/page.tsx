'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useAuth } from '@/hooks/useAuth'
import { getGoal, getRecords, deleteGoal, updateGoal, calcProgress } from '@/lib/firebase/firestore'
import RecordInput from '@/components/goals/RecordInput'
import ProgressBar from '@/components/goals/ProgressBar'
import type { Goal, GoalRecord } from '@/types'
import { GOAL_TYPE_LABELS } from '@/types'
import { Timestamp } from 'firebase/firestore'

const TYPE_COLORS: Record<string, string> = {
  savings: 'bg-emerald-100 text-emerald-700',
  fitness: 'bg-orange-100 text-orange-700',
  study:   'bg-blue-100 text-blue-700',
  quit:    'bg-purple-100 text-purple-700',
  custom:  'bg-gray-100 text-gray-600',
}

export default function GoalDetailPage() {
  const { goalId }    = useParams<{ goalId: string }>()
  const router        = useRouter()
  const { user }      = useAuth()
  const [goal, setGoal]         = useState<Goal | null>(null)
  const [records, setRecords]   = useState<GoalRecord[]>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    if (!goalId) return
    setLoading(true)
    try {
      const [g, recs] = await Promise.all([getGoal(goalId), getRecords(goalId)])
      if (!g) { router.push('/home'); return }
      setGoal(g)
      setRecords(recs)
      setProgress(await calcProgress(goalId, g.targetValue))
      setEditTitle(g.title)
      setEditTarget(String(g.targetValue))
    } finally {
      setLoading(false)
    }
  }, [goalId, router])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    if (!confirm('목표를 삭제하면 모든 기록도 함께 삭제됩니다. 삭제할까요?')) return
    setDeleting(true)
    try {
      await deleteGoal(goalId)
      router.push('/home')
    } catch {
      alert('삭제 중 오류가 발생했어요.')
      setDeleting(false)
    }
  }

  async function handleEditSave() {
    if (!goal) return
    const num = parseFloat(editTarget)
    if (!editTitle.trim() || isNaN(num) || num <= 0) return
    setSaving(true)
    try {
      await updateGoal(goalId, { title: editTitle.trim(), targetValue: num })
      await load()
      setEditMode(false)
    } catch {
      alert('수정 중 오류가 발생했어요.')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(ts: Timestamp) {
    return format(ts.toDate(), 'M월 d일 (EEE)', { locale: ko })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (!goal) return null

  const typeInfo   = GOAL_TYPE_LABELS[goal.type]
  const badgeColor = TYPE_COLORS[goal.type] ?? TYPE_COLORS.custom
  const totalValue = records.reduce((s, r) => s + r.value, 0)
  const unit       = goal.type === 'custom' ? goal.unit : typeInfo.unit

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="rounded-xl p-2 hover:bg-gray-100 active:scale-95 transition"
          aria-label="홈으로"
        >
          <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(true)}
            className="rounded-xl p-2 hover:bg-gray-100 active:scale-95 transition"
            aria-label="수정"
          >
            <PencilSquareIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl p-2 hover:bg-red-50 active:scale-95 transition disabled:opacity-50"
            aria-label="삭제"
          >
            <TrashIcon className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
          </button>
        </div>
      </div>

      <div className="px-4 md:px-6 py-6 space-y-5">
        {/* 목표 정보 카드 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3 mb-4">
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}>
              {typeInfo.label}
            </span>
            <h2 className="flex-1 text-base md:text-lg font-bold text-gray-900 leading-snug">
              {goal.title}
            </h2>
          </div>
          <ProgressBar progress={progress} />
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-gray-50 py-3">
              <p className="text-xs text-gray-400 mb-0.5">누적 기록</p>
              <p className="text-sm md:text-base font-bold text-gray-800">
                {totalValue.toLocaleString()} {unit}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 py-3">
              <p className="text-xs text-gray-400 mb-0.5">목표</p>
              <p className="text-sm md:text-base font-bold text-gray-800">
                {goal.targetValue.toLocaleString()} {unit}
              </p>
            </div>
          </div>
          {(goal.startDate || goal.endDate) && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              {goal.startDate ? formatDate(goal.startDate) : '?'} →{' '}
              {goal.endDate   ? formatDate(goal.endDate)   : '미정'}
            </p>
          )}
        </div>

        {/* 기록 입력 */}
        {user && (
          <RecordInput goal={goal} userId={user.uid} onSaved={load} />
        )}

        {/* 최근 기록 */}
        <div>
          <h3 className="text-sm md:text-base font-semibold text-gray-700 mb-3">
            기록 목록 <span className="text-gray-400 font-normal">({records.length}개)</span>
          </h3>
          {records.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">아직 기록이 없어요. 첫 기록을 남겨보세요!</p>
          ) : (
            <ul className="space-y-2">
              {records.map((rec) => (
                <li key={rec.recordId} className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{formatDate(rec.date)}</span>
                    <span className="text-sm font-bold text-indigo-600">
                      +{rec.value.toLocaleString()} {unit}
                    </span>
                  </div>
                  {rec.memo && (
                    <p className="mt-1.5 text-xs md:text-sm text-gray-600">{rec.memo}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
      {editMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 space-y-4">
            <h3 className="text-base font-bold text-gray-900">목표 수정</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">목표 이름</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={30}
                className="w-full min-h-[44px] rounded-lg border border-gray-200 px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">목표 수치</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-lg border border-gray-200 px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <span className="flex items-center px-4 rounded-lg bg-gray-100 text-sm text-gray-600">
                  {unit}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(false)}
                className="flex-1 min-h-[48px] rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving}
                className="flex-1 min-h-[48px] rounded-xl bg-indigo-500 text-sm font-medium text-white hover:bg-indigo-600 active:scale-95 transition disabled:opacity-60"
              >
                {saving ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
