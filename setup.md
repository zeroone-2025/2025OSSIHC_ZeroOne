# Flow App ������Ʈ ���� ���̵�

�� ���̵�� Flow App�� ������ �������� ���ο� React ������Ʈ�� ����� ����� �ȳ��մϴ�.

## 1. �� ������Ʈ ����

```bash
# Create React App���� TypeScript ������Ʈ ����
npx create-react-app your-project-name --template typescript

# ������Ʈ ���丮�� �̵�
cd your-project-name
```

## 2. ������ ��ġ

### �ʼ� ������
```bash
# UI ������ ���̺귯��
npm install lucide-react@^0.536.0

# �׽��� ���̺귯�� (������Ʈ)
npm install @testing-library/react@^16.3.0 @testing-library/dom@^10.4.1 @testing-library/jest-dom@^6.6.4

# Ÿ�� ���� (�ֽ� �������� ������Ʈ)
npm install @types/react@^19.1.9 @types/react-dom@^19.1.7 @types/node@^16.18.126

# Web Vitals
npm install web-vitals@^2.1.4
```

### Tailwind CSS ����
```bash
# Tailwind CSS ��ġ
npm install -D tailwindcss@^3.4.3 postcss@^8.5.6 autoprefixer@^10.4.21

# Tailwind �ʱ�ȭ
npx tailwindcss init -p
```

## 3. ���� ���� ����

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

### src/index.css (Tailwind ����)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### package.json ��ũ��Ʈ Ȯ��
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

## 4. TypeScript ����

tsconfig.json�� ������ ���� �����Ǿ� �ִ��� Ȯ��:

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

## 5. �⺻ ������Ʈ ���� ����

```
src/
������ components/
��   ������ (���⿡ �ֿ� ������Ʈ ��ġ)
������ types/
��   ������ (TypeScript Ÿ�� ����)
������ utils/
��   ������ (��ƿ��Ƽ �Լ�)
������ App.tsx
������ index.tsx
������ index.css
```

## 6. ���� ����

```bash
# ���� ���� ���� (http://localhost:3000)
npm start

# ���δ��� ����
npm run build

# �׽�Ʈ ����
npm test
```

## 7. �߰� �������

### ESLint ����
�⺻������ Create React App�� ESLint ������ ����˴ϴ�:
```json
{
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest"]
  }
}
```

### Git �ʱ�ȭ
```bash
git init
git add .
git commit -m "Initial commit with Flow App configuration"
```

## ��� ���� ���

- **React**: 19.1.1
- **TypeScript**: 4.9.5
- **Tailwind CSS**: 3.4.3
- **Lucide React**: 0.536.0 (������)
- **Testing Library**: React 16.3.0
- **Build Tool**: Create React App (react-scripts 5.0.1)

�� ������ ������ Flow App�� ������ ���� ȯ���� ������ �� �ֽ��ϴ�.
