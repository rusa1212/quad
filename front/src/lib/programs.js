// programs 테이블 조회 (work.md 7.1). RLS로 누구나 읽기만 가능합니다.
import { supabase } from './supabase.js'

const PAGE_SIZE = 1000 // Supabase 기본 최대 응답 행 수

// DB에서 비어 있을 수 있는 값을 화면 코드가 기대하는 형태로 맞춤
function normalize(row) {
  return {
    ...row,
    eligibility: row.eligibility ?? {}, // LLM 추출 전에는 null → 제한 없음으로 취급
    attachments: row.attachments ?? [],
    summary_card: row.summary_card ?? null, // LLM 요약 전에는 null
  }
}

export async function fetchPrograms() {
  if (!supabase) throw new Error('front/.env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정하세요.')

  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .order('id')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows.map(normalize)
}
