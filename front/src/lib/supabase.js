// 브라우저용 Supabase 클라이언트. 키는 front/.env 에서 읽습니다 (front/.env.example 참고).
// anon 키는 공개돼도 되는 키라서, 데이터 보호는 Supabase의 RLS 정책이 맡습니다.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  console.warn('[supabase] front/.env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정하세요.')
}

// 메일 링크(가입 인증·비밀번호 재설정)가 만료됐거나 이미 쓰였으면 Supabase가 주소에
// #error_code=otp_expired&error_description=... 를 붙여 돌려보냄.
// 클라이언트가 주소를 처리하기 전에 읽어두고, 주소창에서는 지움
function takeUrlAuthError() {
  if (typeof window === 'undefined') return null
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const query = new URLSearchParams(window.location.search)
  const inHash = hash.has('error_code') || hash.has('error')
  const params = inHash ? hash : query.has('error_code') ? query : null
  if (!params) return null

  const error = {
    code: params.get('error_code') ?? params.get('error'),
    message: params.get('error_description') ?? '',
  }
  const cleanUrl = window.location.pathname + (inHash ? window.location.search : '')
  window.history.replaceState(window.history.state, '', cleanUrl)
  return error
}

// { code, message } 또는 null
export const urlAuthError = takeUrlAuthError()

// 설정 전에도 앱이 멈추지 않도록, 키가 없으면 null
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
