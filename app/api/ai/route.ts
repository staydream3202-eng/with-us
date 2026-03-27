import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Goal, GoalType } from '@/types'

interface RequestBody {
  message: string
  goals?: Goal[]
}

interface SuggestedGoal {
  title: string
  type: GoalType
  targetValue: number
  unit: string
}

interface AIResponse {
  reply: string
  suggestedGoal?: SuggestedGoal
}

const SYSTEM_PROMPT = `당신은 "위드어스(with us)" 앱의 AI 플래너입니다.
사용자의 목표 달성을 돕는 따뜻하고 동기부여적인 코치 역할을 합니다.

규칙:
1. 한국어로만 대화합니다.
2. 친근하고 격려하는 톤을 유지합니다.
3. 목표를 추천할 때는 반드시 아래 JSON 블록을 응답 마지막에 포함합니다:
   \`\`\`json
   {"suggestedGoal": {"title": "...", "type": "savings|fitness|study|custom", "targetValue": 숫자, "unit": "원|분|회|기타단위"}}
   \`\`\`
4. 목표 추천이 없을 때는 JSON 블록을 포함하지 않습니다.
5. 응답은 3–5문장 이내로 간결하게 합니다.

지원하는 목표 타입:
- savings: 저축 (단위: 원)
- fitness: 운동 (단위: 분)
- study: 공부 (단위: 분)
- custom: 기타 (단위: 자유롭게)`

export async function POST(req: NextRequest): Promise<NextResponse> {
  // GEMINI_API_KEY 검증 (런타임에 매번 확인)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[AI Route] GEMINI_API_KEY is not set')
    return NextResponse.json(
      { error: 'AI 서비스가 설정되지 않았습니다. 관리자에게 문의해주세요.' },
      { status: 503 },
    )
  }

  try {
    const body: RequestBody = await req.json()
    const { message, goals } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })
    }

    // 핸들러 내부에서 초기화 — 환경변수가 런타임에 올바르게 읽힘
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
    })

    // 현재 목표 현황을 컨텍스트로 추가
    let contextMessage = message
    if (goals && goals.length > 0) {
      const goalsText = goals
        .map((g) => `- ${g.title} (${g.type}, 목표: ${g.targetValue}${g.unit})`)
        .join('\n')
      contextMessage = `[사용자의 현재 목표]\n${goalsText}\n\n[사용자 메시지]\n${message}`
    }

    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${contextMessage}`)
    const text   = result.response.text()

    // JSON 블록 파싱 시도
    const response: AIResponse = { reply: text }

    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed.suggestedGoal) {
          response.suggestedGoal = parsed.suggestedGoal
          // reply에서 JSON 블록 제거
          response.reply = text.replace(/```json[\s\S]*?```/, '').trim()
        }
      } catch {
        // JSON 파싱 실패 시 텍스트 그대로 반환
      }
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[AI Route Error]', err)
    return NextResponse.json(
      { error: 'AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    )
  }
}
