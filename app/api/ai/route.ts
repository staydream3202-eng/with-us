import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키 없음' }, { status: 500 });
    }

    const { message } = await request.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `당신은 목표 달성 플래너 AI입니다.
사용자의 목표 달성을 돕는 친근한 코치 역할이에요.
사용자 메시지: ${message}

답변 시 목표 관련 조언을 해주고,
구체적인 목표를 추천할 때는 아래 JSON을 답변 끝에 추가해줘:
[GOAL]{"title":"목표명","type":"savings|fitness|study|custom","targetValue":숫자,"unit":"원|분|회|기타"}[/GOAL]`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    if (!reply) {
      return NextResponse.json({ error: 'AI로부터 빈 응답을 받았어요.' }, { status: 502 });
    }

    // [GOAL]...[/GOAL] 파싱 — 실패 시 null로 안전 처리
    const goalMatch = reply.match(/\[GOAL\]([\s\S]*?)\[\/GOAL\]/);
    let suggestedGoal = null;
    if (goalMatch) {
      try {
        suggestedGoal = JSON.parse(goalMatch[1]);
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }

    const cleanReply = reply.replace(/\[GOAL\][\s\S]*?\[\/GOAL\]/, '').trim();

    return NextResponse.json({ reply: cleanReply, suggestedGoal });
  } catch (err) {
    console.error('[AI Route Error]', err);
    return NextResponse.json(
      { error: 'AI 응답 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 },
    );
  }
}
