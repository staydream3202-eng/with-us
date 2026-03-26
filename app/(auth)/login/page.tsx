'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/lib/firebase/auth'

interface EmailFormData {
  email: string
  password: string
  nickname?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<EmailFormData>()

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      router.replace('/home')
    } catch (e: unknown) {
      setError('Google 로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailSubmit(data: EmailFormData) {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(data.email, data.password)
      } else {
        await signUpWithEmail(data.email, data.password, data.nickname ?? '사용자')
      }
      router.replace('/home')
    } catch (e: unknown) {
      setError(
        mode === 'login'
          ? '이메일 또는 비밀번호가 올바르지 않습니다.'
          : '회원가입에 실패했습니다. 다시 시도해주세요.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 md:p-8 shadow-sm">

        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-600">with us</h1>
          <p className="mt-1 text-sm md:text-base text-gray-500">목표를 함께 달성해요</p>
        </div>

        {/* Google 로그인 */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex w-full min-h-[48px] items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm md:text-base font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 계속하기
        </button>

        {/* 구분선 */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">또는</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 이메일 폼 */}
        <form onSubmit={handleSubmit(handleEmailSubmit)} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <input
                {...register('nickname', { required: '닉네임을 입력해주세요' })}
                placeholder="닉네임"
                className="w-full min-h-[44px] rounded-xl border border-gray-200 px-4 text-sm md:text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              {errors.nickname && (
                <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>
              )}
            </div>
          )}

          <div>
            <input
              {...register('email', {
                required: '이메일을 입력해주세요',
                pattern: { value: /^\S+@\S+\.\S+$/, message: '올바른 이메일 형식이 아닙니다' },
              })}
              type="email"
              placeholder="이메일"
              autoComplete="email"
              className="w-full min-h-[44px] rounded-xl border border-gray-200 px-4 text-sm md:text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              {...register('password', {
                required: '비밀번호를 입력해주세요',
                minLength: { value: 6, message: '비밀번호는 6자 이상이어야 합니다' },
              })}
              type="password"
              placeholder="비밀번호"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full min-h-[44px] rounded-xl border border-gray-200 px-4 text-sm md:text-base outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-indigo-500 text-sm md:text-base font-medium text-white transition hover:bg-indigo-600 disabled:opacity-60"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        {/* 모드 전환 */}
        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === 'login' ? '아직 계정이 없나요?' : '이미 계정이 있나요?'}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="ml-1 font-medium text-indigo-500 hover:underline"
          >
            {mode === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  )
}
