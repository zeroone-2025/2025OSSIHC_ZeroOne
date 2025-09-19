# Flow App 프로젝트 설정 가이드

이 가이드는 Flow App과 동일한 설정으로 새로운 React 프로젝트를 만드는 방법을 안내합니다.

## 1. 새 프로젝트 생성

```bash
# Create React App으로 TypeScript 프로젝트 생성
npx create-react-app your-project-name --template typescript

# 프로젝트 디렉토리로 이동
cd your-project-name
```

## 2. 의존성 설치

### 필수 의존성
```bash
# UI 아이콘 라이브러리
npm install lucide-react@^0.536.0

# 테스팅 라이브러리 (업데이트)
npm install @testing-library/react@^16.3.0 @testing-library/dom@^10.4.1 @testing-library/jest-dom@^6.6.4

# 타입 정의 (최신 버전으로 업데이트)
npm install @types/react@^19.1.9 @types/react-dom@^19.1.7 @types/node@^16.18.126

# Web Vitals
npm install web-vitals@^2.1.4
```

### Tailwind CSS 설정
```bash
# Tailwind CSS 설치
npm install -D tailwindcss@^3.4.3 postcss@^8.5.6 autoprefixer@^10.4.21

# Tailwind 초기화
npx tailwindcss init -p
```

## 3. 설정 파일 구성

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### src/index.css (Tailwind 설정)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### package.json 스크립트 확인
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

## 4. TypeScript 설정

tsconfig.json이 다음과 같이 설정되어 있는지 확인:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

## 5. 기본 프로젝트 구조 생성

```
src/
├── components/
│   └── (여기에 주요 컴포넌트 배치)
├── types/
│   └── (TypeScript 타입 정의)
├── utils/
│   └── (유틸리티 함수)
├── App.tsx
├── index.tsx
└── index.css
```

## 6. 개발 시작

```bash
# 개발 서버 시작 (http://localhost:3000)
npm start

# 프로덕션 빌드
npm run build

# 테스트 실행
npm test
```

## 7. 추가 권장사항

### ESLint 설정
기본적으로 Create React App의 ESLint 설정이 적용됩니다:
```json
{
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest"]
  }
}
```

### Git 초기화
```bash
git init
git add .
git commit -m "Initial commit with Flow App configuration"
```

## 기술 스택 요약

- **React**: 19.1.1
- **TypeScript**: 4.9.5
- **Tailwind CSS**: 3.4.3
- **Lucide React**: 0.536.0 (아이콘)
- **Testing Library**: React 16.3.0
- **Build Tool**: Create React App (react-scripts 5.0.1)

이 설정을 따르면 Flow App과 동일한 개발 환경을 구축할 수 있습니다.
