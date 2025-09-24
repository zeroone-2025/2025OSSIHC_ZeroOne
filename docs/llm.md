# LLM Integration

- 모델: Google Gemini `gemini-pro`
- 환경 변수: `GOOGLE_GEMINI_API_KEY`
- 호출 방식: `callGeminiJSON(prompt, options)` → JSON 응답이 필수이며, 오류 발생 시 즉시 중단.
- 데모 모드 없음: 키가 없으면 `Gemini API key missing` 오류를 반환하고 요청을 차단합니다.
- 엔드포인트: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- 요청 형식: `{ contents: [{ role: "user", parts:[{ text: "..." }] }] }`
- 응답 처리: `result.candidates[0].content.parts[0].text`를 JSON.parse 후 스키마 검증.
- 금지 패턴: “최고, 완벽, 필수, 리뷰” 등의 과장 표현은 제거하거나 fallback 근거로 대체합니다.
