# Progress Log

[2025-09-23 01:09] Day1 Scaffold: json 데이터 생성(restaurants.json 21개, config.json), lib(types.ts/store.ts/recommend.ts) 추가, 라우트 4개(home/settings/history/map) 구성, Kakao 지도 스켈레톤, LocalStorage(pref/visits) 연결, recommend 기본 테스트 통과, Next.js 개발서버 실행

[2025-09-23 01:23] Day1 Scaffold+Weather: json(식당/설정/날씨) 준비, lib(types/store/weather/recommend) 날씨 반영, 4 라우트 UI/UX 개선, Kakao 지도 스켈레톤, weights.weather=0.10 적용, reason에 날씨 토큰(비예보/체감추움/후덥지근/맑음/강풍/최고↑/최저↓) 설계, deriveFlags 테스트 8건 통과, 환경변수 확장

[2025-09-23 01:30] Realtime Weather: 프록시 3종(live/ultra/short)+5분 캐시 설계, mergeWeather/deriveFlags 구현, weights.weather=0.25 적용, reason에 날씨 토큰 추가, UX 배지·토스트 정의, 폴백 처리 규칙 반영, 위치정보 연동, 거리보정 알고리즘, 테스트 12건 통과

[2025-09-23 01:52] Day2: LLM 질문 버튼/후보 축소 추가, 저장소 키(pref/visits) 정리, 기존 Day1/
Day2 기능 점검 완료

[2025-09-23 02:30] Day2: OpenAI 질문 프록시(프롬프트 엔지니어링 규칙 적용), 기상청 실황/초단기/단기 프록시 연결, 병합·가중치 반영, 홈 결선 완료

