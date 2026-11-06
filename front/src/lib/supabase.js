// 브라우저용 Supabase 클라이언트. 키는 front/.env 에서 읽습니다 (front/.env.example 참고).
// anon 키는 공개돼도 되는 키라서, 데이터 보호는 Supabase의 RLS 정책이 맡습니다.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn('[supabase] front/.env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정하세요.')
}

// 설정 전에도 앱이 멈추지 않도록, 키가 없으면 null
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
