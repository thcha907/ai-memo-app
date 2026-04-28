# Lib - AI Agent 지침서

## 모듈 역할

외부 라이브러리 및 서비스 클라이언트 초기화 및 설정을 담당한다. 애플리케이션 전반에서 사용되는 공통 인프라 코드를 포함한다.

## 파일 구조

```
src/lib/
└── supabase.ts   # Supabase 클라이언트 팩토리
```

## supabase.ts

Supabase 클라이언트 인스턴스를 생성하는 팩토리 함수를 제공한다.

### 구조

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}
```

### 특징

- **타입 안전성**: `Database` 타입을 제네릭으로 전달하여 테이블 스키마 자동 완성
- **환경변수 검증**: 필수 환경변수 누락 시 즉시 에러 발생
- **싱글톤 없음**: 매번 새 인스턴스 생성 (서버 환경에서 안전)

### 사용 예시

```typescript
// 서버 액션에서
'use server'
import { createClient } from '@/lib/supabase'

export async function listMemos() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('memos')
    .select('*')
  
  // ...
}
```

## 새 라이브러리 통합 가이드

### 1. 클라이언트 팩토리 패턴

```typescript
// src/lib/someService.ts
import { SomeClient } from 'some-library'

export function createSomeClient() {
  const apiKey = process.env.SOME_API_KEY
  
  if (!apiKey) {
    throw new Error('Missing API key')
  }
  
  return new SomeClient({ apiKey })
}
```

### 2. 설정 분리

복잡한 설정이 필요한 경우:

```typescript
// src/lib/someService.config.ts
export const someServiceConfig = {
  timeout: 5000,
  retries: 3,
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
}

// src/lib/someService.ts
import { someServiceConfig } from './someService.config'

export function createClient() {
  return new Client(someServiceConfig)
}
```

## Local Golden Rules

### Do's

- 환경변수 검증을 팩토리 함수 내부에서 수행
- 타입을 명시하여 IDE 자동완성 지원
- 설정이 복잡하면 별도 config 파일로 분리
- 민감한 정보는 서버 환경변수로만 접근

### Don'ts

- 전역 클라이언트 인스턴스 생성 금지 (서버 환경에서 위험)
- 클라이언트 컴포넌트에서 직접 접근 금지
- 하드코딩된 설정값 금지 (환경변수 사용)

## 환경변수 네이밍 컨벤션

| 접두사 | 용도 | 접근 가능 위치 |
|--------|------|----------------|
| `NEXT_PUBLIC_` | 클라이언트 노출 가능 | 브라우저 + 서버 |
| (없음) | 서버 전용 | 서버만 |

예시:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - 클라이언트에서도 접근
- ✅ `GEMINI_API_KEY` - 서버에서만 접근
- ❌ `NEXT_PUBLIC_SECRET_KEY` - 민감 정보를 PUBLIC으로 노출 금지

## 타입 정의

Supabase의 경우 `src/types/database.ts`에서 자동 생성된 타입을 가져온다:

```typescript
import type { Database } from '@/types/database'

// 테이블 Row 타입
type Memo = Database['public']['Tables']['memos']['Row']

// Insert 타입
type MemoInsert = Database['public']['Tables']['memos']['Insert']

// Update 타입
type MemoUpdate = Database['public']['Tables']['memos']['Update']
```

## 의존성 관계

```
lib/ (설정 계층)
  ↓
actions/ (비즈니스 로직 계층)
  ↓
hooks/ (상태 관리 계층)
  ↓
components/ (UI 계층)
```

라이브러리 설정은 가장 하위 계층에 위치하며, 상위 계층에서만 사용한다.
