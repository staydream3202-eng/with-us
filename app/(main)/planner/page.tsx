'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import { getGoals, addGoal } from '@/lib/firebase/firestore'
import type { Goal, GoalType } from '@/types'

interface SuggestedGoal {
  title: string
  type: GoalType
  targetValue: number
  unit: string
}

interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
  suggestedGoal?: SuggestedGoal
  goalAdded?: boolean
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'ai',
  text: '안녕하세요! 저는 위드어스 AI 플래너예요 ✨\n목표를 세우거나, 기록을 어떻게 쌓을지 고민될 때 말을 걸어보세요. 함께 계획해 드릴게요!',
}

export default function PlannerPage() {
  const { user }            = useAuth()
  const router              = useRouter()
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const [goals, setGoals]   = useState<Goal[]>([])
  const bottomRef           = useRef<HTMLDivElement>(null)
  const textareaRef         = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!user) return
    getGoals(user.uid).then(setGoals).catch(() => {})
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/ai', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, goals }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'AI 응답 오류')
      }

      const aiMsg: Message = {
        id:            (Date.now() + 1).toString(),
        role:          'ai',
        text:          data.reply,
        suggestedGoal: data.suggestedGoal,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errMsg: Message = {
        id:   (Date.now() + 1).toString(),
        role: 'ai',
        text: err instanceof Error ? err.message : 'AI 응답 중 오류가 발생했어요.',
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  async function handleAddGoal(msgId: string, suggested: SuggestedGoal) {
    if (!user) return
    try {
      await addGoal(user.uid, {
        title:       suggested.title,
        type:        suggested.type,
        targetValue: suggested.targetValue,
        unit:        suggested.unit,
        startDate:   Timestamp.now(),
        endDate:     null,
        priority:    99,
      })
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, goalAdded: true } : m)),
      )
      // 목표 목록 갱신
      const updated = await getGoals(user.uid)
      setGoals(updated)
    } catch {
      alert('목표 저장 중 오류가 발생했어요.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-md mx-auto">
      {/* 헤더 */}
      <div className="shrink-0 px-4 md:px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
          <h1 className="text-base md:text-lg font-bold text-gray-900">AI 플래너</h1>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">Gemini 1.5 Flash 기반</p>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col gap-2 max-w-[80%]`}>
              {/* 말풍선 */}
              <div
                className={`p-3 md:p-4 text-sm md:text-base rounded-2xl whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-500 text-white rounded-tr-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>

              {/* 목표 추천 카드 */}
              {msg.role === 'ai' && msg.suggestedGoal && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 md:p-4 space-y-2">
                  <p className="text-xs font-semibold text-indigo-600">추천 목표</p>
                  <p className="text-sm font-bold text-gray-900">{msg.suggestedGoal.title}</p>
                  <p className="text-xs text-gray-500">
                    목표: {msg.suggestedGoal.targetValue.toLocaleString()} {msg.suggestedGoal.unit}
                  </p>
                  {msg.goalAdded ? (
                    <button
                      onClick={() => router.push('/home')}
                      className="w-full min-h-[40px] rounded-xl bg-green-500 text-xs md:text-sm font-medium text-white transition hover:bg-green-600 active:scale-95"
                    >
                      홈에서 확인하기 →
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddGoal(msg.id, msg.suggestedGoal!)}
                      className="w-full min-h-[40px] rounded-xl bg-indigo-500 text-xs md:text-sm font-medium text-white transition hover:bg-indigo-600 active:scale-95"
                    >
                      + 목표에 추가하기
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 전송 중 인디케이터 */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 md:px-6 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="목표나 고민을 말해보세요…"
            rows={1}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={{ overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-500 text-white transition hover:bg-indigo-600 active:scale-95 disabled:opacity-50"
            aria-label="전송"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-xs text-gray-400">Enter로 전송 · Shift+Enter로 줄바꿈</p>
      </div>
    </div>
  )
}
