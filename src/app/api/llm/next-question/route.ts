import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface QuestionRequest {
  session: {
    upperTags: string[];
    weatherFlags: string[];
    previousAnswers: string[];
  };
  remainingIntents: string[];
}

const SYSTEM_PROMPT = `역할: 점심 추천을 위한 인터뷰어.

반드시 지킬 것:
1. remainingIntents 배열의 첫 요소 intent로 질문.
2. 한국어 질문 1개와 4~5개의 짧은 선택지를 생성.
3. 메뉴 추천, 다중 질문, 영어 혼용 금지.
4. 출력은 JSON 한 줄: {"qId":"q-타임스탬프","intent":"intent","question":"질문","options":["옵션1",...]}
5. options는 사용자 답변 수집용으로, 중복/공백 금지.`;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'NO_OPENAI_KEY' },
      { status: 503 }
    );
  }

  try {
    const body: QuestionRequest = await request.json();

    const userPrompt = `remainingIntents: ${body.remainingIntents.join(',')}
topTags: ${body.session.upperTags.join(',')}
weatherFlags: ${body.session.weatherFlags.join(',')}
answerHistory: ${body.session.previousAnswers.join(',')}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Try to parse JSON response
    try {
      const questionData = JSON.parse(content);

      // Validate required fields
      if (!questionData.qId || !questionData.intent || !questionData.question || !Array.isArray(questionData.options)) {
        throw new Error('Invalid question format');
      }

      // Sanitize to only required fields
      const sanitized = {
        qId: String(questionData.qId),
        intent: String(questionData.intent),
        question: String(questionData.question),
        options: Array.isArray(questionData.options) ? questionData.options.slice(0, 6).map((o: any) => String(o)) : [],
      };
      return NextResponse.json(sanitized, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid JSON from OpenAI');
    }

  } catch (error) {
    console.error('LLM question generation failed:', error);
    const message = error instanceof Error ? error.message : 'LLM 질문 생성 실패';
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}
