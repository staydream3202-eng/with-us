import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import type { Goal, GoalRecord } from '@/types'

// ─── Goals ────────────────────────────────────────────────────────────────────

/** 사용자의 모든 목표 조회 (priority 순) */
export async function getGoals(userId: string): Promise<Goal[]> {
  const q = query(
    collection(db, 'goals'),
    where('userId', '==', userId),
    orderBy('priority', 'asc'),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ ...d.data(), goalId: d.id }) as Goal)
}

/** 목표 단건 조회 */
export async function getGoal(goalId: string): Promise<Goal | null> {
  const snap = await getDoc(doc(db, 'goals', goalId))
  return snap.exists() ? ({ ...snap.data(), goalId: snap.id } as Goal) : null
}

/** 목표 추가 */
export async function addGoal(
  userId: string,
  data: Omit<Goal, 'goalId' | 'userId' | 'createdAt'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'goals'), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/** 목표 수정 */
export async function updateGoal(
  goalId: string,
  data: Partial<Omit<Goal, 'goalId' | 'userId' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'goals', goalId), data)
}

/** 목표 삭제 (records subcollection 포함) */
export async function deleteGoal(goalId: string): Promise<void> {
  const batch = writeBatch(db)

  // records 하위 컬렉션 일괄 삭제
  const recordsSnap = await getDocs(collection(db, 'goals', goalId, 'records'))
  recordsSnap.docs.forEach((d) => batch.delete(d.ref))

  batch.delete(doc(db, 'goals', goalId))
  await batch.commit()
}

// ─── Records ──────────────────────────────────────────────────────────────────

/** 목표의 모든 기록 조회 (날짜 내림차순) */
export async function getRecords(goalId: string): Promise<GoalRecord[]> {
  const q = query(
    collection(db, 'goals', goalId, 'records'),
    orderBy('date', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ ...d.data(), recordId: d.id }) as GoalRecord)
}

/** 기록 추가 */
export async function addRecord(
  goalId: string,
  userId: string,
  data: Omit<GoalRecord, 'recordId' | 'goalId' | 'userId'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'goals', goalId, 'records'), {
    ...data,
    goalId,
    userId,
  })
  return ref.id
}

/** 기록 수정 */
export async function updateRecord(
  goalId: string,
  recordId: string,
  data: Partial<Omit<GoalRecord, 'recordId' | 'goalId' | 'userId'>>,
): Promise<void> {
  await updateDoc(doc(db, 'goals', goalId, 'records', recordId), data)
}

/** 기록 삭제 */
export async function deleteRecord(goalId: string, recordId: string): Promise<void> {
  await deleteDoc(doc(db, 'goals', goalId, 'records', recordId))
}

/** 목표 달성률 계산 (기록 합계 / targetValue * 100) */
export async function calcProgress(goalId: string, targetValue: number): Promise<number> {
  const records = await getRecords(goalId)
  const total = records.reduce((sum, r) => sum + r.value, 0)
  return Math.min(Math.round((total / targetValue) * 100), 100)
}
