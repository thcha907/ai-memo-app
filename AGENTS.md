# Memo App - AI Agent 지침서

## 프로젝트 개요

메모 CRUD 기능을 제공하는 Next.js 웹 애플리케이션. Supabase를 사용하여 데이터를 영속화하며, 카테고리 분류, 검색 및 AI 요약 기능을 지원한다.

## Tech Stack

- **Framework:** Next.js 15.4.4 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **UI:** React 19.1.0 + Tailwind CSS 4.x
- **State:** Client-side state (useState, useCallback, useMemo)
- **Database:** Supabase (PostgreSQL)
- **Auth/Storage:** Supabase
- **ORM:** Supabase Client (@supabase/supabase-js)
- **AI:** Google Gemini API (요약 기능)
- **Testing:** Playwright (E2E)
- **Linting:** ESLint + Prettier

## Operational Commands

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format

# E2E 테스트 실행
npm run test

# 테스트 (헤드 모드)
npm run test:headed

# 테스트 UI 모드
npm run test:ui
```

## Golden Rules

### Immutable (절대 위반 금지)

1. `'use client'` 지시문이 필요한 컴포넌트에서 반드시 명시할 것
2. 서버 액션 함수는 반드시 `'use server'` 지시문으로 시작할 것
3. 데이터베이스 작업은 반드시 서버 액션을 통해서만 수행할 것
4. 메모 ID 생성은 uuid v4만 사용 (서버 액션 내에서)
5. TypeScript strict mode 위반 금지
6. Supabase 환경변수는 `NEXT_PUBLIC_` 접두사 사용 (클라이언트 접근 시)

### Do's (권장 사항)

- 컴포넌트는 함수형 컴포넌트로 작성
- 상태 변경 함수는 useCallback으로 메모이제이션
- 파생 상태는 useMemo로 계산
- 파일명은 PascalCase (컴포넌트), camelCase (유틸, 훅, 액션)
- 한국어 UI 텍스트 사용
- Tailwind 유틸리티 클래스 우선 사용
- 데이터 변경 후 `revalidatePath()`로 캐시 갱신
- DB 타입은 `src/types/database.ts`의 자동 생성 타입 활용

### Don'ts (금지 사항)

- Class 컴포넌트 사용 금지
- any 타입 사용 금지 (불가피한 경우 주석으로 사유 명시)
- 인라인 스타일 지양 (Tailwind 사용)
- console.log를 프로덕션 코드에 남기지 않음 (에러 로깅 제외)
- 외부 상태 관리 라이브러리 도입 금지 (현재 규모에서 불필요)

## 프로젝트 구조

```
src/
├── app/
│   ├── actions/   # 서버 액션 (memos.ts)
│   └── page.tsx   # 메인 페이지
├── components/    # React 컴포넌트
├── hooks/         # 커스텀 훅 (useMemos)
├── lib/           # 라이브러리 설정 (supabase.ts)
└── types/         # TypeScript 타입 정의
    ├── memo.ts    # 도메인 타입
    └── database.ts # Supabase 자동 생성 타입
```

## Standards & References

### 코딩 컨벤션

- ESLint: `eslint-config-next` 기반
- Prettier: `.prettierrc` 설정 준수
- Import 순서: React -> 외부 라이브러리 -> 내부 모듈 (`@/` alias 사용)

### Git 전략

- 커밋 메시지: 한국어로 작성
- 브랜치: feature/, fix/, refactor/ 접두사 사용

### Maintenance Policy

규칙과 실제 코드 구현 간 괴리가 발생하면, 코드를 기준으로 이 문서의 업데이트를 제안하라.

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
GEMINI_API_KEY=your_gemini_api_key
```

## Data Flow

1. **UI 컴포넌트** → 이벤트 핸들러 호출
2. **훅 (useMemos)** → 서버 액션 호출 + 로컬 상태 업데이트
3. **서버 액션** → Supabase 클라이언트로 DB 작업
4. **Supabase** → PostgreSQL 데이터베이스

## Context Map (Action-Based Routing)

- **[페이지 및 레이아웃 (App Router)](./src/app/AGENTS.md)** — 라우팅, 페이지 컴포넌트, 메타데이터 작업 시
- **[UI 컴포넌트 (Components)](./src/components/AGENTS.md)** — 재사용 가능한 UI 컴포넌트 작성/수정 시
- **[상태 관리 (Hooks)](./src/hooks/AGENTS.md)** — 커스텀 훅 및 상태 로직 작업 시
- **[타입 정의 (Types)](./src/types/AGENTS.md)** — 인터페이스 및 타입 정의 시
- **[서버 액션 (Actions)](./src/app/actions/AGENTS.md)** — 데이터베이스 CRUD 및 비즈니스 로직 작업 시
- **[라이브러리 설정 (Lib)](./src/lib/AGENTS.md)** — 외부 서비스 클라이언트 설정 작업 시
