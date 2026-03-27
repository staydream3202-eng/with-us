# with us — 목표 달성 플래너 | CLAUDE.md

---

## Claude에게 — 필독 및 엄수 사항

1. **작업 시작 전 반드시 이 CLAUDE.md 전체를 먼저 읽을 것**
2. **요청된 범위 이외의 파일은 절대 수정하지 말 것** — 명시되지 않은 파일 임의 수정 금지
3. **작업 완료 후 반드시 이 CLAUDE.md 하단 "변경 이력" 섹션을 업데이트할 것**
4. 작업 완료 보고 형식: 수정한 파일 목록 + 함수명 + 변경 요약 출력

---

## 프로젝트 개요
- **앱 이름**: with us (위드어스)
- **목적**: 돈 모으기, 몸 만들기, 공부하기, 금연 등 목표를 정량적으로 기록·달성하는 플래너
- **개발 방식**: 바이브 코딩 (Claude Code + VS Code)
- **개발자**: 솔

## 기술 스택
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS (반응형 필수 적용)
- **백엔드/DB**: Firebase (Firestore, Authentication)
- **AI**: Google Gemini 1.5 Flash API — 반드시 `app/api/ai/route.ts`에서만 서버사이드 호출
- **배포**: Vercel (웹), PWABuilder → Google Play Store (앱)

---

## 반응형 레이아웃 원칙 (전체 프로젝트 공통 — 모든 컴포넌트 필수 적용)

### 기준 해상도 — 아래 4개에서 레이아웃이 깨지지 않아야 함
- 360×640 (소형 Android)
- 390×844 (iPhone 14)
- 768×1024 (태블릿)
- 1280×800 (PC 웹)

### Tailwind 반응형 브레이크포인트
```
sm: 640px   → 스마트폰 가로
md: 768px   → 태블릿
lg: 1024px  → 작은 PC
xl: 1280px  → 일반 PC
```

### 반응형 필수 규칙
1. **레이아웃**: 모바일 우선(mobile-first) — `max-w-md mx-auto` 기본, PC는 중앙 정렬
2. **폰트**: 고정 px 금지 — `text-sm md:text-base` 패턴 사용
3. **여백**: `p-4 md:p-6` 패턴, 화면 비율 기반
4. **버튼/입력창**: `w-full` 기본, 최소 높이 `min-h-[44px]` (터치 영역 확보)
5. **아이콘**: `w-5 h-5 md:w-6 md:h-6` 패턴
6. **극단값 방지**: `min-w-[]`, `max-w-[]`로 범위 제한

### 컴포넌트별 반응형 기준
```typescript
// 목표 카드
className="w-full max-w-md p-4 md:p-5 rounded-xl"

// 하단 탭 네비게이션 (모바일 고정, PC 중앙)
className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2"

// 입력창
className="w-full min-h-[44px] px-4 text-sm md:text-base rounded-lg"

// 버튼
className="w-full min-h-[48px] text-sm md:text-base font-medium"

// AI 채팅 말풍선
className="max-w-[80%] p-3 md:p-4 text-sm md:text-base rounded-2xl"
```

---

## 디렉토리 구조

```
with-us/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx              # 하단 탭 네비게이션
│   │   ├── home/page.tsx           # 홈 — 목표 목록
│   │   ├── planner/page.tsx        # 플래너 — AI 채팅
│   │   ├── calendar/page.tsx       # 캘린더
│   │   ├── vs/page.tsx             # VS — 친구 경쟁
│   │   └── profile/page.tsx        # 정보 — 프로필
│   ├── goals/
│   │   └── [goalId]/page.tsx       # 목표 상세
│   ├── api/
│   │   └── ai/route.ts             # Gemini API 서버사이드 전용
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── goals/
│   │   ├── GoalCard.tsx
│   │   ├── GoalForm.tsx
│   │   └── RecordInput.tsx
│   ├── planner/
│   │   └── ChatMessage.tsx
│   ├── ui/
│   │   ├── BottomNav.tsx
│   │   ├── Button.tsx
│   │   └── Modal.tsx
│   └── auth/
│       └── AuthGuard.tsx
├── lib/
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   └── firestore.ts
│   └── utils.ts
├── types/
│   └── index.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useGoals.ts
│   └── useRecords.ts
├── .env.local                      # 절대 커밋 금지
└── .env.example
```

---

## Firestore 데이터 구조

### users/{userId}
```typescript
{
  uid: string
  email: string
  nickname: string
  photoURL: string | null
  isPublic: boolean
  createdAt: Timestamp
}
```

### goals/{goalId}
```typescript
{
  goalId: string
  userId: string
  title: string
  type: 'savings' | 'fitness' | 'study' | 'quit' | 'custom'
  targetValue: number
  unit: string          // '원', '분', '회', '일'
  startDate: Timestamp | null
  endDate: Timestamp | null
  priority: number
  createdAt: Timestamp
}
```

### goals/{goalId}/records/{recordId}
```typescript
{
  recordId: string
  goalId: string
  userId: string
  value: number
  memo: string
  date: Timestamp
}
```

## 목표 타입별 입력 형식
| 타입 | unit | 기록 라벨 |
|------|------|----------|
| savings | 원 | 오늘 저축한 금액 |
| fitness | 분 | 오늘 운동 시간 |
| study | 분 | 오늘 공부 시간 |
| quit | 일 | 참은 날 |
| custom | 자유 | 오늘 달성 수치 |

---

## 핵심 개발 규칙

- `GEMINI_API_KEY`는 절대 `NEXT_PUBLIC_` 붙이지 말 것 — 서버 전용
- Gemini 호출은 반드시 `app/api/ai/route.ts`에서만
- 브라우저 동작(클릭, useState)이 있는 파일 맨 위에 `'use client'` 명시
- Firebase 보안 규칙: userId로 본인 데이터만 읽기/쓰기
- 목표 삭제 시 subcollection(records)도 함께 삭제
- **모든 컴포넌트는 위의 반응형 원칙을 반드시 준수**

---

## 환경변수 (.env.local)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GEMINI_API_KEY=
```

---

## 개발 단계 체크리스트

### 1단계: 프로젝트 세팅 + 인증 + 홈 UI
- [ ] Next.js 프로젝트 생성 + 패키지 설치
- [ ] CLAUDE.md 세팅 완료
- [ ] Firebase 프로젝트 연결
- [ ] Google 로그인 구현
- [ ] 이메일 로그인 구현
- [ ] 홈 화면 목표 목록 UI (반응형 적용)
- [ ] Firestore CRUD 연동
- [ ] Vercel 첫 배포

### 2단계: 목표 상세 + AI 플래너
- [ ] 목표 타입별 폼 (저축/운동/공부/금연)
- [ ] 일별 기록 입력 + 달성률 계산
- [ ] 달성률 시각화 (진행바 + 그래프)
- [ ] Gemini API Route 구현
- [ ] AI 플래너 채팅 UI
- [ ] AI → 목표 바로 추가 기능

### 3단계: 캘린더 + 응원 시스템 + 앱 출시
- [ ] 캘린더 탭
- [ ] 주간 달성률 애니메이션 + 응원 메시지
- [ ] 카카오 로그인
- [ ] PWA 설정 (manifest + 아이콘)
- [ ] PWABuilder → 플레이스토어 제출

### 4단계: VS 탭 (출시 후 업데이트)
- [ ] 친구 추가 / 검색
- [ ] 경쟁 그룹 생성
- [ ] 실시간 순위
- [ ] 같은 목표 추천

---

## GitHub 커밋 컨벤션
```
feat: 새 기능
fix: 버그 수정
style: UI 변경
chore: 설정 변경
docs: 문서 수정 (CLAUDE.md 포함)
```

---

## 변경 이력
| 날짜 | 작업 내용 | 수정 파일 |
|------|----------|----------|
| 2025-03-26 | 프로젝트 초기 설정, CLAUDE.md 작성 | CLAUDE.md |
| 2026-03-26 | 1단계 구현 — 타입 정의, Firebase 연동, 인증, 홈 UI | types/index.ts, lib/firebase/config.ts, lib/firebase/auth.ts, lib/firebase/firestore.ts, hooks/useAuth.ts, components/auth/AuthGuard.tsx, app/layout.tsx, app/page.tsx, app/(auth)/login/page.tsx, components/ui/BottomNav.tsx, app/(main)/layout.tsx, app/(main)/home/page.tsx, components/goals/GoalCard.tsx |
| 2026-03-27 | 2단계 구현 — 목표 생성/상세, 기록 입력, 달성률 진행바, Gemini AI 플래너 | app/goals/new/page.tsx (NewGoalPage), app/goals/[goalId]/page.tsx (GoalDetailPage), components/goals/RecordInput.tsx (RecordInput), components/goals/ProgressBar.tsx (ProgressBar), app/api/ai/route.ts (POST), app/(main)/planner/page.tsx (PlannerPage), app/(main)/home/page.tsx (홈 버튼 연결) |
| 2026-03-27 | 버그수정 — 홈 실시간 목표 표시(onSnapshot), AI 플래너 API키 검증, quit 카테고리 제거 | types/index.ts, lib/firebase/firestore.ts (subscribeGoals 추가), app/(main)/home/page.tsx (onSnapshot 구독), app/goals/new/page.tsx (quit 제거), app/api/ai/route.ts (genAI 초기화 이동·키 검증), components/goals/GoalCard.tsx (quit 제거), app/goals/[goalId]/page.tsx (quit 제거) |
