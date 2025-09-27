# Category Mapping & Recommendation Rules

## Map Structure
- Source: `public/data/category_map.ko.json`
- Buckets
  - `leaf`: 가장 세부 업종명 → 메뉴 태그 (확신 태그, `?` 표기는 약한 연결)
  - `mid`: 중분류 업종명 → 메뉴 태그 (leaf 미존재 시 fallback)
  - `allergenHints`: 알레르기 키워드 → 위험 태그
- 경로 파싱: `음식점 > 한식 > 국밥` → `['음식점', '한식', '국밥']`
- 태그 우선순위: leaf > mid > 기존 `restaurant.tags`

## Scoring Weights
- 가중치 합계 1.0 유지
  - distance 0.20 / novelty 0.10 / preference 0.12 / nutrition 0.13 / weather 0.25 / situation 0.10 / group 0.05 / category 0.05
- `categoryFit`
  - leaf 기반: 기본 0.65, mid: 0.55, none: 0.50
  - 태그 다양성 보강(+0.05), 약한 태그(`?`)는 0.5 가중
  - 날씨 연동: `wet|cold_min` → `warm|soup|hotpot` +0.08, `hot_peak|muggy` → `cold|salad|refresh|ice` +0.08, `clear` → `picnic|outdoor|share` +0.03
  - 비선호 태그 충돌 시 즉시 0.05로 강등
- Leaf 매칭 & 적합도 ≥ 0.55 → UI 배지 “업종 기반” 노출

## Filtering Policy
- `forbidFromAllergy`
  - 프로필 알레르기: 직접 일치 + `allergenHints` 확장 태그 포함 시 제외
- 비선호 태그도 동일 로직으로 제외 (category 또는 menuTags 기반)
- 적용 위치
  1. 초기 풀 필터 (`applyHardFilters`)
  2. 실시간 추천 (`getRecommendations`)
- 거리/최근 방문/알레르기 순서 유지로 조기 탈락 처리

## LLM Prompt & Validation
- 시스템 프롬프트 고정: 업종 태그 포함, 외부 지식·과장 표현 금지, 허용 source 한정
- 요청 payload
  - `restaurant`: id/name/category/tags/menuTags/categoryName/categoryStrength/price_tier/macros
  - `context`: weatherFlags/answers/etaMins/freeTimeMins/menuTags
  - `highlights`: 추천 엔진 토큰 배열 (없으면 빈 배열 허용)
- 검증: `src/lib/validators.ts` `isValidReasons`
  - badge/detail/source 필수, badge ≤ 18자, 허용 source 세트 준수
  - 금지 패턴: 리뷰/평점/혼잡/과장어 포함 시 즉시 실패

## Update Checklist
1. 신규 업종 확인 → leaf 매핑 추가 (가능하면 원문 그대로)
2. leaf 부재 시 mid에 공통 태그 등록
3. 알레르기 위험성 확인 → `allergenHints` 갱신
4. `npm test` 및 핵심 시나리오(비/폭염/한파) 수동 스모크
5. `progress.md` 및 본 문서 수정 내역 기록
