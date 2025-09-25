# Progress Log


[2025-09-23 01:09] Day1 Scaffold: json 데이터 생성(restaurants.json 21개, config.json), lib(types.ts/store.ts/recommend.ts) 추가, 라우트 4개(home/settings/history/map) 구성, Kakao 지도 스켈레톤, LocalStorage(pref/visits) 연결, recommend 기본 테스트 통과, Next.js 개발서버 실행

[2025-09-23 01:23] Day1 Scaffold+Weather: json(식당/설정/날씨) 준비, lib(types/store/weather/recommend) 날씨 반영, 4 라우트 UI/UX 개선, Kakao 지도 스켈레톤, weights.weather=0.10 적용, reason에 날씨 토큰(비예보/체감추움/후덥지근/맑음/강풍/최고↑/최저↓) 설계, deriveFlags 테스트 8건 통과, 환경변수 확장

[2025-09-23 01:30] Realtime Weather: 프록시 3종(live/ultra/short)+5분 캐시 설계, mergeWeather/deriveFlags 구현, weights.weather=0.25 적용, reason에 날씨 토큰 추가, UX 배지·토스트 정의, 폴백 처리 규칙 반영, 위치정보 연동, 거리보정 알고리즘, 테스트 12건 통과

[2025-09-23 01:52] Day2: LLM 질문 버튼/후보 축소 추가, 저장소 키(pref/visits) 정리, 기존 Day1/
Day2 기능 점검 완료

[2025-09-23 02:30] Day2: OpenAI 질문 프록시(프롬프트 엔지니어링 규칙 적용), 기상청 실황/초단기/단기 프록시 연결, 병합·가중치 반영, 홈 결선 완료

[2025-09-23 04:15] Day2-통합: LLM intent(time_pressure/distance_tradeoff) 추가, recommend에 ETA 보강(거리 항 통합), Kakao Places에 etaMins 주입, 카드에 ETA 토큰 표기. 별도 화면·로직 분리 없이 기존 플로우에 자연 결합

[2025-09-23 16:31] Flow fix: 단일 상태머신 도입, 부트→QA(3~4문항)→추천→지연 평가까지 자연 통합. 기존 날씨/ETA/Places/가중합 재사용. pendingReview+알림 도입.

[2025-09-23 17:29] LLM readiness: env 가드/클라이언트 일원화, next-question+reasons API, 시스템 프롬프트, 헬스/스모크, UI 배너·근거 폴백 구축




[2025-09-24 11:50] UI: 브랜드 팔레트 적용(FA812F/FAB12F/FEF3E2/DD0303), 헤더 설명 문구 제거 완료
[2025-09-24 12:09] Fix: src/lib/env.ts 추가 및 API Key 유틸 생성, 빌드 에러 해결
[2025-09-24 12:16] UI: 중앙 헤더 타이틀 “이유식” 강조, 버튼/선택지 라운드 스타일 적용
[2025-09-24 12:34] UI 레이어링: 전역 배경 brand.pale, 카드/버튼/선택지에 흰 배경+보더+섀도우 적용, 헤더 정리 및 타이틀 중앙화
[2025-09-24 13:45] Flow/UI/Nav: LLM→가중치→Kakao 추천 플로우 구축, 바텀내비 3칸/지도탭 제거, 기록 홈 버튼 이동, 레이어/대비/라운드 정비, 헤더 중앙 타이틀 적용
[2025-09-24 14:23] UI: 브랜드 팔레트 교체(Main #DD0303, Sub #FA812F/#FAB12F, Bg #FEF3E2) 및 컴포넌트 적용
[2025-09-24 14:34] UI: 홈 새로고침 아이콘 확대 및 헤더 액션 최소 크기 규칙 반영
[2025-09-24 14:37] UI: 홈 새로고침 아이콘 복구, h-8 w-8 표시 및 44px 터치 타깃 보장
[2025-09-24 14:44] UI: 새로고침 버튼 헤더 absolute 배치 및 44px 컨테이너, 32px 아이콘 고정
[2025-09-24 15:08] LLM: Google Gemini 전환(gemini-pro), callGeminiJSON 도입, next-question/reasons API 교체, 키 없으면 중단
[2025-09-24 15:16] Env: GOOGLE_GEMINI_API_KEY 추가, env/gemini 라우트 키 검증 500 응답 처리 반영
[2025-09-24 18:30] LLM readiness v2: OpenAI 전용 클라이언트/가드 정비, next-question·reasons 503 처리, ops 헬스엔드포인트 교체, 스모크 테스트/UX 재시도 차단 강화
UI: 홈 3카드(식당/날씨/최근식사) 추가, 바텀내비 재구성(중앙 CTA), 모바일 대비·접근성 강화 완료
