# Vocab 파일 검증 가이드

이 문서는 `public/data/vocab/` 디렉토리의 두 JSON 파일이 실제 서비스에서 정상 반영/활용되는지 전방위 점검하는 방법을 제공합니다.

## 🎯 검증 대상
- `public/data/vocab/allergies.ko.json` (8개 알레르기 카테고리, 44개 동의어)
- `public/data/vocab/food_dislikes.ko.json` (8개 기피사항 카테고리, 46개 동의어)

## 📋 로컬 점검 명령어

### 1. 파일 구조 및 스키마 검증
```bash
npm run check:vocab
```

### 2. 단위 테스트 실행
```bash
npm run test:vocab
```

### 3. 개발 서버 시작 및 API 테스트
```bash
# 개발 서버 시작
npm run dev

# 헬스체크 API 테스트 (새 터미널에서)
curl -sSf http://localhost:3000/api/vocab/health | jq .

# 정적 파일 직접 접근 테스트
curl -sSf http://localhost:3000/data/vocab/allergies.ko.json | jq . | head -10
curl -sSf http://localhost:3000/data/vocab/food_dislikes.ko.json | jq . | head -10
```

## 🌐 서버 점검 명령어

### PM2로 실행 중인 서버 테스트
```bash
# 내부 포트 (8080)
curl -sSf http://127.0.0.1:8080/api/vocab/health | jq .

# 외부 포트 (10190)
curl -sSf http://whymeal.site:10190/api/vocab/health | jq .
```

## ✅ 성공 응답 예시

### 검증 스크립트 (npm run check:vocab)
```
🎉 모든 vocab 파일이 검증을 통과했습니다!
```

### 헬스체크 API
```json
{
  "ok": true,
  "timestamp": "2025-09-26T05:41:37.314Z",
  "checks": {
    "allergies": {
      "success": true,
      "keys": ["peanut", "shellfish", "milk", "egg", "wheat", "soy", "fish", "meat"],
      "keyCount": 8
    },
    "food_dislikes": {
      "success": true,
      "keys": ["spicy", "greasy", "sweet", "soup", "noodle", "rice", "fastfood", "exotic"],
      "keyCount": 8
    }
  },
  "summary": {
    "totalKeys": 16,
    "totalSynonyms": 90
  }
}
```

### 단위 테스트
```
✓ src/test/vocab.test.ts (15 tests) 8ms
Test Files  1 passed (1)
Tests  15 passed (15)
```

## 🔧 구현된 구성요소

### 1. 검증 스크립트 (`scripts/verifyVocab.mjs`)
- ✅ 파일 존재 여부 확인
- ✅ JSON 스키마 검사 (`{label: string, synonyms: string[]}`)
- ✅ 빈 문자열/빈 배열/중복 동의어 체크
- ✅ 실패 시 `process.exit(1)`

### 2. 헬스체크 API (`app/api/vocab/health/route.ts`)
- ✅ `fetch('/data/vocab/...')` 기반 검증
- ✅ 성공 시 `{ ok:true, keys: {...} }` 반환
- ✅ 실패 시 `{ ok:false, detail }` 반환

### 3. 공용 로더 유틸 (`src/lib/vocab.ts`)
- ✅ `loadAllergies()`, `loadFoodDislikes()` 함수 제공
- ✅ `fetch('/data/vocab/...', {cache: 'no-store'})` 호출
- ✅ `VocabEntry = {label:string; synonyms:string[]}` 타입 정의

### 4. 단위 테스트 (`src/test/vocab.test.ts`)
- ✅ Vitest 기반 15개 테스트
- ✅ 파싱 가능, 최소 키 존재, 스키마 검증
- ✅ 중복 동의어 없음 확인

### 5. package.json 스크립트
- ✅ `check:vocab`: `node scripts/verifyVocab.mjs`
- ✅ `test:vocab`: `vitest run src/test/vocab.test.ts`

## 🛠️ 추가 수정사항

### middleware.ts 수정
정적 파일 접근을 위해 `/data` 경로를 허용하도록 수정:
```typescript
if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.startsWith('/data')) {
  return NextResponse.next()
}
```

## 🎯 검증 완료 지표

모든 구성요소가 정상 동작할 때:
1. ✅ `npm run check:vocab` → 성공 메시지
2. ✅ `npm run test:vocab` → 15/15 테스트 통과
3. ✅ 헬스체크 API → `"ok": true` 응답
4. ✅ 정적 파일 접근 → JSON 데이터 반환
5. ✅ 총 16개 키, 90개 동의어 확인

이 가이드를 따라 모든 단계가 성공하면 vocab 파일들이 실제 서비스에서 정상 반영/활용되고 있는 것을 보장할 수 있습니다.