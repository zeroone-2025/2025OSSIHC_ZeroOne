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

const SYSTEM_PROMPT = `넌 점심 추천 인터뷰어. intent 목록 중 하나를 골라 한국어 질문 한 개를 생성. 출력은 JSON 한 줄.

intents(고정): meal_feel, time_pressure, spice_tolerance, group_dyn, diet_focus, indoor_outdoor, distance_tradeoff

규칙:
1. remainingIntents 중 첫 번째 선택
2. 질문 1개, 선택지 4개 (간결)
3. 금지: 다문항/장문/메뉴 추천
4. 출력: JSON만

형식: {"qId":"q-타임스탬프","intent":"선택된intent","question":"질문내용?","options":["옵션1","옵션2","옵션3","옵션4"]}`;

function generateFallbackQuestion(): QuestionResponse {
  return {
    qId: `fallback-${Date.now()}`,
    intent: 'meal_feel',
    question: '오늘 점심은 어떤 느낌으로 드시고 싶으세요?',
    options: ['든든하게', '가볍게', '빠르게', '새로운 맛']
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
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3,
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