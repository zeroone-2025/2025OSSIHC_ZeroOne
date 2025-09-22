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

interface QuestionResponse {
  qId: string;
  intent: string;
  question: string;
  options: string[];
}

const SYSTEM_PROMPT = `당신은 점심 메뉴 추천을 위한 적응형 질문 생성 AI입니다.

사용자 세션과 남은 의도 목록을 받아 "단 한 문항"의 질문을 생성하세요.

규칙:
1. 남은 의도(remainingIntents) 중 가장 우선순위가 높은 하나를 선택
2. 사용자의 이전 답변과 현재 날씨를 고려해 개인화된 질문 작성
3. 4개의 선택지 제공 (명확하고 구체적으로)
4. JSON 형식으로만 응답: {"qId":"unique-id","intent":"selected-intent","question":"질문 내용","options":["선택지1","선택지2","선택지3","선택지4"]}

의도 우선순위:
- mood: 기분/상황에 따른 선호
- craving: 특정 맛/음식 욕구
- health: 건강/영양 고려사항
- social: 혼밥/단체식사 상황
- budget: 가격대 선호
- time: 식사 시간 여유도
- adventure: 새로운 시도 의향

응답은 반드시 JSON만 출력하세요.`;

function generateFallbackQuestion(): QuestionResponse {
  return {
    qId: `fallback-${Date.now()}`,
    intent: 'mood',
    question: '오늘 점심 기분은 어떠신가요?',
    options: ['든든하게 먹고 싶어요', '가볍게 먹고 싶어요', '특별한 걸 먹고 싶어요', '빠르게 해결하고 싶어요']
  };
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      generateFallbackQuestion(),
      { status: 200 }
    );
  }

  try {
    const body: QuestionRequest = await request.json();

    const userPrompt = `세션 정보:
- 상위 태그: ${body.session.upperTags.join(', ')}
- 날씨 플래그: ${body.session.weatherFlags.join(', ')}
- 이전 답변: ${body.session.previousAnswers.join(', ')}

남은 의도: ${body.remainingIntents.join(', ')}

위 정보를 바탕으로 적절한 질문을 생성하세요.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
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

      return NextResponse.json(questionData, {
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

    return NextResponse.json(
      generateFallbackQuestion(),
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}