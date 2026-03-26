import { Timestamp } from 'firebase/firestore'

export type GoalType = 'savings' | 'fitness' | 'study' | 'quit' | 'custom'

export interface User {
  uid: string
  email: string
  nickname: string
  photoURL: string | null
  isPublic: boolean
  createdAt: Timestamp
}

export interface Goal {
  goalId: string
  userId: string
  title: string
  type: GoalType
  targetValue: number
  unit: string
  startDate: Timestamp | null
  endDate: Timestamp | null
  priority: number
  createdAt: Timestamp
}

export interface Record {
  recordId: string
  goalId: string
  userId: string
  value: number
  memo: string
  date: Timestamp
}

export const GOAL_TYPE_LABELS: Record<GoalType, { label: string; unit: string; recordLabel: string }> = {
  savings: { label: '저축', unit: '원', recordLabel: '오늘 저축한 금액' },
  fitness: { label: '운동', unit: '분', recordLabel: '오늘 운동 시간' },
  study:   { label: '공부', unit: '분', recordLabel: '오늘 공부 시간' },
  quit:    { label: '금연', unit: '일', recordLabel: '참은 날' },
  custom:  { label: '기타', unit: '',   recordLabel: '오늘 달성 수치' },
}
