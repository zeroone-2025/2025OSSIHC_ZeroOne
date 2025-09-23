# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, layouts, and API routes (e.g., `src/app/api/weather/.../route.ts`).
- `lib`: Domain logic and utilities (`weather.ts`, `recommend.ts`, `store.ts`, `types.ts`).
- `src/test`: Vitest + Testing Library setup and specs.
- `public`: Static assets.
- Root configs: `next.config.js`, `tailwind.config.js`, `vitest.config.ts`, `tsconfig.json`.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start Next.js dev server at `http://localhost:3000`.
- `npm run build`: Production build.
- `npm start`: Run the production server.
- `npm test`: Run Vitest test suite (jsdom, global).
- `npm run lint`: Lint code using `eslint-config-next`.

## Coding Style & Naming Conventions
- TypeScript throughout; prefer explicit types for public APIs in `lib`.
- Indentation: 2 spaces; avoid mixed tabs/spaces.
- React components: PascalCase (files and exports) inside `src/app/components` or route files.
- Utilities in `lib`: lowercase filenames (e.g., `weather.ts`, `recommend.ts`); camelCase exports.
- Next.js App Router: keep framework filenames (`page.tsx`, `layout.tsx`, `route.ts`).
- Run `npm run lint` before pushing; fix warnings that affect DX or build.

## Testing Guidelines
- Framework: Vitest + Testing Library (`vitest.config.ts` uses `jsdom`).
- Location: `src/test`.
- Naming: `*.test.ts` or `*.test.tsx`.
- Run: `npm test`. Aim to cover core `lib` logic (e.g., scoring, weather merge).

## Commit & Pull Request Guidelines
- History shows short one-line commits (e.g., `ver0.14`, `초기세팅`). Use clear, imperative messages; Korean or English acceptable.
- Prefer: summary line ≤ 72 chars; optional details in body.
- PRs should include: purpose, linked issues, screenshots of UI changes, and test notes (`npm test` output). Keep changes scoped and explain any config edits.

## Security & Configuration Tips
- Secrets: use `.env.local` (gitignored). Do not commit keys or tokens.
- Ignore build artifacts (`.next/`) and dependencies (`node_modules/`).
- When adding APIs under `src/app/api`, validate inputs and never log secrets.
