# LLM Integration

- 모델: OpenAI `gpt-4o-mini`
- 환경 변수: `OPENAI_API_KEY` (필수)
- 호출 방식: `chatJson(messages)` (`src/lib/openai.ts`) → JSON 응답만 허용
- 키 미설정 시: `src/lib/env.ensureOpenAI()`가 `NO_OPENAI_KEY`를 throw 하며, API 라우트는 503을 반환합니다.
- 엔드포인트: `https://api.openai.com/v1/chat/completions`
- 기본 옵션: `temperature=0.2`, `response_format={ type: "json_object" }`, `max_tokens≈400`
- 응답 처리: `choices[0].message.content`를 JSON.parse 후 API 레이어 스키마 검증
- 금지 패턴: “최고, 완벽, 필수, 리뷰” 등은 `src/lib/validators.ts`에서 필터링합니다.
