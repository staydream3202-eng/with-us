import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type UserCredential,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

const googleProvider = new GoogleAuthProvider()

/** Firestore에 유저 문서 없을 경우 생성 */
async function ensureUserDoc(uid: string, email: string, nickname: string, photoURL: string | null) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      email,
      nickname,
      photoURL,
      isPublic: false,
      createdAt: serverTimestamp(),
    })
  }
}

/** Google 팝업 로그인 */
export async function signInWithGoogle(): Promise<UserCredential> {
  const result = await signInWithPopup(auth, googleProvider)
  const { uid, email, displayName, photoURL } = result.user
  await ensureUserDoc(uid, email ?? '', displayName ?? '사용자', photoURL)
  return result
}

/** 이메일 로그인 */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

/** 이메일 회원가입 */
export async function signUpWithEmail(
  email: string,
  password: string,
  nickname: string,
): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName: nickname })
  await ensureUserDoc(result.user.uid, email, nickname, null)
  return result
}

/** 로그아웃 */
export async function logout(): Promise<void> {
  return signOut(auth)
}
