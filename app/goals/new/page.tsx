'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Timestamp } from 'firebase/firestore'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'
import { addGoal } from '@/lib/firebase/firestore'
import type { GoalType } from '@/types'
import { GOAL_TYPE_LABELS } from '@/types'

const TYPE_OPTIONS: { type: GoalType; emoji: string; color: string; border: string }[] = [
  { type: 'savings', emoji: '💰', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-300' },
  { type: 'fitness', emoji: '🏃', color: 'bg-orange-50 text-orange-700',  border: 'border-orange-300'  },
  { type: 'study',   emoji: '📚', color: 'bg-blue-50 text-blue-700',      border: 'border-blue-300'    },
  { type: 'custom',  emoji: '✨', color: 'bg-gray-50 text-gray-700',      border: 'border-gray-300'    },
]

export default function NewGoalPage() {
  const router       = useRouter()
  const { user }     = useAuth()
  const [step, setStep]           = useState<'type' | 'form'>('type')
  const [selectedType, setSelectedType] = useState<GoalType | null>(null)
  const [title, setTitle]         = useState('')
  const [targetValue, setTarget]  = useState('')
  const [unit, setUnit]           = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function selectType(type: GoalType) {
    setSelectedType(type)
    // unit 기본값 자동 설정
    const defaultUnit = GOAL_TYPE_LABELS[type].unit
    setUnit(defaultUnit)
    setStep('form')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !selectedType) return

    const num = parseFloat(targetValue)
    if (!title.trim()) { setError('목표 이름을 입력해주세요.'); return }
    if (isNaN(num) || num <= 0) { setError('목표 수치를 올바르게 입력해주세요.'); return }
    if (selectedType === 'custom' && !unit.trim()) { setError('단위를 입력해주세요.'); return }

    setError('')
    setSaving(true)
    try {
      await addGoal(user.uid, {
        title:       title.trim(),
        type:        selectedType,
        targetValue: num,
        unit:        selectedType === 'custom' ? unit.trim() : GOAL_TYPE_LABELS[selectedType].unit,
        startDate:   startDate ? Timestamp.fromDate(new Date(startDate)) : null,
        endDate:     endDate   ? Timestamp.fromDate(new Date(endDate))   : null,
        priority:    99,
      })
      router.push('/home')
    } catch {
      setError('저장 중 오류가 발생했어요.')
      setSaving(false)
    }
  }

  const typeInfo = selectedType ? GOAL_TYPE_LABELS[selectedType] : null

  return (
    <div className="min-h-screen bg-gray-50 px-4 md:px-6 py-6 max-w-md mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => step === 'form' ? setStep('type') : router.back()}
          className="rounded-xl p-2 hover:bg-gray-100 active:scale-95 transition"
          aria-label="뒤로"
        >
          <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
        </button>
        <h1 className="text-lg md:text-xl font-bold text-gray-900">
          {step === 'type' ? '목표 유형 선택' : '목표 설정'}
        </h1>
      </div>

      {/* STEP 1: 타입 선택 */}
      {step === 'type' && (
        <div className="grid grid-cols-2 gap-3">
          {TYPE_OPTIONS.map(({ type, emoji, color, border }) => (
            <button
              key={type}
              onClick={() => selectType(type)}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-5 transition hover:shadow-md active:scale-[0.97] ${color} ${border}`}
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-sm md:text-base font-semibold">
                {GOAL_TYPE_LABELS[type].label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* STEP 2: 폼 입력 */}
      {step === 'form' && selectedType && typeInfo && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 선택된 타입 표시 */}
          <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
            TYPE_OPTIONS.find(o => o.type === selectedType)?.color
          }`}>
            <span>{TYPE_OPTIONS.find(o => o.type === selectedType)?.emoji}</span>
            <span>{typeInfo.label} 목표</span>
          </div>

          {/* 목표 이름 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">목표 이름 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                selectedType === 'savings' ? '예: 여행 자금 모으기' :
                selectedType === 'fitness' ? '예: 하루 30분 운동' :
                selectedType === 'study'   ? '예: 영어 공부 100시간' :
                '목표 이름을 입력하세요'
              }
              maxLength={30}
              className="w-full min-h-[44px] rounded-lg border border-gray-200 bg-white px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* 목표 수치 + 단위 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">목표 수치 *</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="any"
                value={targetValue}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0"
                className="flex-1 min-h-[44px] rounded-lg border border-gray-200 bg-white px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {selectedType === 'custom' ? (
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="단위"
                  maxLength={6}
                  className="w-20 min-h-[44px] rounded-lg border border-gray-200 bg-white px-3 text-sm md:text-base text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              ) : (
                <span className="flex items-center min-h-[44px] px-4 rounded-lg bg-gray-100 text-sm text-gray-600 shrink-0">
                  {typeInfo.unit}
                </span>
              )}
            </div>
          </div>

          {/* 기간 (선택) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">시작일 (선택)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">종료일 (선택)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[48px] rounded-xl bg-indigo-500 text-sm md:text-base font-medium text-white transition hover:bg-indigo-600 active:scale-95 disabled:opacity-60"
          >
            {saving ? '저장 중…' : '목표 만들기'}
          </button>
        </form>
      )}
    </div>
  )
}
