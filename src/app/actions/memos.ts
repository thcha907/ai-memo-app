'use server'

import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase'
import type { Memo, MemoFormData } from '@/types/memo'
import type { Database } from '@/types/database'
import { GoogleGenAI } from '@google/genai'

type DbMemo = Database['public']['Tables']['memos']['Row']
type DbMemoInsert = Database['public']['Tables']['memos']['Insert']
type DbMemoUpdate = Database['public']['Tables']['memos']['Update']

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

export async function listMemos(): Promise<Memo[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch memos: ${error.message}`)
  }

  return data.map(dbMemoToMemo)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const supabase = createClient()

  const now = new Date().toISOString()
  const insert: DbMemoInsert = {
    id: uuidv4(),
    title: formData.title,
    content: formData.content,
    category: formData.category,
    tags: formData.tags,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('memos')
    .insert(insert)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create memo: ${error.message}`)
  }

  revalidatePath('/')
  return dbMemoToMemo(data)
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const supabase = createClient()

  const update: DbMemoUpdate = {
    title: formData.title,
    content: formData.content,
    category: formData.category,
    tags: formData.tags,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('memos')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update memo: ${error.message}`)
  }

  revalidatePath('/')
  return dbMemoToMemo(data)
}

export async function deleteMemo(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('memos').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete memo: ${error.message}`)
  }

  revalidatePath('/')
}

export async function clearMemos(): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('memos').delete().neq('id', '')

  if (error) {
    throw new Error(`Failed to clear memos: ${error.message}`)
  }

  revalidatePath('/')
}

export async function summarizeMemo(
  memoId: string
): Promise<{ summary: string }> {
  const supabase = createClient()

  const { data: memo, error } = await supabase
    .from('memos')
    .select('title, content')
    .eq('id', memoId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch memo: ${error.message}`)
  }

  if (!memo) {
    throw new Error('Memo not found')
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.')
  }

  const ai = new GoogleGenAI({ apiKey })

  const prompt = `다음은 사용자가 작성한 메모입니다. 이 메모의 핵심 내용을 한국어로 3-5줄 정도로 간결하게 요약해주세요. 마크다운 형식의 입력이 포함될 수 있으니 텍스트 내용만 파악하여 요약하세요. 불필요한 장식이나 인사말 없이 요약 내용만 제공해주세요.

제목: ${memo.title}

내용:
${memo.content}`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  })

  const summary = response.text

  if (!summary) {
    throw new Error('요약을 생성하지 못했습니다.')
  }

  return { summary }
}
