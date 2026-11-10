import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth.js'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

// Supabase Auth 오류 → 화면에 보여줄 문장
const ERROR_MESSAGES = {
  invalid_credentials: '이메일 또는 비밀번호가 맞지 않아요.',
  email_not_confirmed: '이메일 인증을 아직 안 했어요. 메일함의 인증 링크를 눌러주세요.',
  user_already_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  weak_password: '비밀번호가 너무 약해요. 6자 이상으로 정해주세요.',
  email_address_invalid: '이메일 주소 형식이 올바르지 않아요.',
  over_email_send_rate_limit: '인증 메일을 너무 자주 보냈어요. 잠시 후 다시 시도해 주세요.',
  over_request_rate_limit: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
}

function toKoreanError(error) {
  return new Error(ERROR_MESSAGES[error.code] ?? error.message)
}

function requireSupabase() {
  if (!supabase) throw new Error('front/.env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정하세요.')
  return supabase
}

// 로그인 상태 (Supabase Auth의 auth.users). 세션은 supabase-js가 localStorage에 보관하고 자동 갱신합니다.
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    // 첫 호출(INITIAL_SESSION)에 저장된 세션이 들어오고, 이후 로그인/로그아웃마다 다시 호출됨
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
        if (error) throw toKoreanError(error)
      },
      // 반환값 needsConfirm: 이메일 인증이 켜져 있으면 true (메일 링크를 눌러야 로그인됨)
      async signUp(email, password) {
        const { data, error } = await requireSupabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw toKoreanError(error)
        // 이메일 인증이 켜진 상태에서 이미 가입된 이메일이면 오류 대신 identities가 빈 user가 옴
        if (data.user && data.user.identities?.length === 0) throw new Error(ERROR_MESSAGES.user_already_exists)
        return { needsConfirm: !data.session }
      },
      async signOut() {
        const { error } = await requireSupabase().auth.signOut()
        if (error) throw toKoreanError(error)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
