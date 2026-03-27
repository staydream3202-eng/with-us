'use client'

import { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { addRecord } from '@/lib/firebase/firestore'
import type { Goal } from '@/types'
import { GOAL_TYPE_LABELS } from '@/types'

interface RecordInputProps {
  goal: Goal
  userId: string
  onSaved?: () => void
}

export default function RecordInput({ goal, userId, onSaved }: RecordInputProps) {
  const [value, setValue]   = useState('')
  const [memo, setMemo]     = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const typeInfo = GOAL_TYPE_LABELS[goal.type]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      setError('올바른 수치를 입력해주세요.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await addRecord(goal.goalId, userId, {
        value: num,
        memo: memo.trim(),
        date: Timestamp.now(),
      })
      setValue('')
      setMemo('')
      onSaved?.()
    } catch {
      setError('저장 중 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-4 md:p-5 shadow-sm border border-gray-100 space-y-3">
      <h3 className="text-sm md:text-base font-semibold text-gray-800">오늘 기록 추가</h3>

      {/* 수치 입력 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">{typeInfo.recordLabel}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className="w-full min-h-[44px] rounded-lg border border-gray-200 px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="shrink-0 text-sm text-gray-500 min-w-[24px]">
            {goal.type === 'custom' ? goal.unit : typeInfo.unit}
          </span>
        </div>
      </div>

      {/* 메모 입력 */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">메모 (선택)</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="간단한 메모를 남겨보세요"
          maxLength={100}
          className="w-full min-h-[44px] rounded-lg border border-gray-200 px-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full min-h-[48px] rounded-xl bg-indigo-500 text-sm md:text-base font-medium text-white transition hover:bg-indigo-600 active:scale-95 disabled:opacity-60"
      >
        {saving ? '저장 중…' : '기록 저장'}
      </button>
    </form>
  )
}
