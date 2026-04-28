# 서버 액션 (Actions) - AGENTS.md

## 개요

Next.js 서버 액션을 통해 데이터베이스 작업과 서버 전용 비즈니스 로직을 처리한다. 모든 Supabase 작업은 이 레이어를 통해서만 이루어진다.

## 파일 구조

```
src/app/actions/
└── memos.ts      # 메모 CRUD 및 AI 요약 서버 액션
```

## 주요 서버 액션

### `memos.ts`

메모 관련 모든 서버 액션을 포함한다.

#### CRUD 작업

- **`listMemos()`** - 전체 메모 목록 조회 (최신순)
- **`createMemo(formData: MemoFormData)`** - 새 메모 생성
- **`updateMemo(id: string, formData: MemoFormData)`** - 메모 수정
- **`deleteMemo(id: string)`** - 메모 삭제
- **`clearMemos()`** - 전체 메모 삭제

#### AI 기능

- **`summarizeMemo(memoId: string)`** - 메모 내용 AI 요약
  - DB에서 메모 조회
  - Gemini API로 요약 생성
  - 요약 결과 반환 (DB 저장 안함)

## 작성 규칙

### 1. 서버 액션 선언

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase'
```

- 파일 최상단에 `'use server'` 지시문 필수
- Supabase 클라이언트는 `createClient()` 함수로 생성

### 2. 타입 변환

```typescript
type DbMemo = Database['public']['Tables']['memos']['Row']

function dbMemoToMemo(dbMemo: DbMemo): Memo {
  return {
    id: dbMemo.id,
    title: dbMemo.title,
    content: dbMemo.content,
    category: dbMemo.category,
    tags: dbMemo.tags,
    createdAt: dbMemo.created_at,
    updatedAt: dbMemo.updated_at,
  }
}
```

- DB 스키마(`snake_case`)와 도메인 모델(`camelCase`) 간 변환 함수 사용
- 타입 안전성 유지

### 3. 에러 처리

```typescript
const { data, error } = await supabase
  .from('memos')
  .select('*')

if (error) {
  throw new Error(`Failed to fetch memos: ${error.message}`)
}
```

- Supabase 에러는 즉시 throw
- 명확한 에러 메시지 제공

### 4. 캐시 재검증

```typescript
export async function createMemo(formData: MemoFormData): Promise<Memo> {
  // ... DB 작업 ...
  
  revalidatePath('/')
  return dbMemoToMemo(data)
}
```

- 데이터 변경 후 `revalidatePath()` 호출 필수
- Next.js 캐시를 무효화하여 최신 데이터 표시

## 환경변수 접근

```typescript
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Gemini API 키가 설정되지 않았습니다.')
}
```

- 서버 액션에서는 `process.env`로 직접 접근
- `NEXT_PUBLIC_` 접두사 불필요
- 민감한 키는 서버에만 존재

## 클라이언트에서 호출

```typescript
import { createMemo } from '@/app/actions/memos'

const newMemo = await createMemo(formData)
```

- 클라이언트 컴포넌트나 훅에서 직접 import하여 사용
- 타입 안전성 보장

## Best Practices

1. **단일 책임**: 각 액션은 하나의 작업만 수행
2. **원자성**: DB 트랜잭션이 필요한 경우 Supabase 트랜잭션 사용
3. **검증**: 입력 데이터는 서버에서 재검증
4. **로깅**: 에러는 console.error로 로깅
5. **타입**: 모든 함수에 명시적 반환 타입 지정

## 주의사항

- ❌ 클라이언트 컴포넌트에서 직접 Supabase 접근 금지
- ❌ 서버 액션에서 useState, useEffect 등 React 훅 사용 금지
- ✅ 모든 DB 작업은 서버 액션을 통해서만
- ✅ 민감한 작업은 서버 액션에서만 수행
